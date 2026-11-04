"""Run in an isolated Linux root fixture, never against the NAS configuration."""
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import sqlite3
import tempfile
import threading
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('release_safety', Path(__file__).with_name('release-safety.py'))
safety = importlib.util.module_from_spec(spec)
spec.loader.exec_module(safety)


@unittest.skipUnless(os.geteuid() == 0 and os.environ.get('HEARTH_SAFETY_TEST_ROOT'), 'Requires an isolated Linux root fixture')
class ReleaseSafetyTests(unittest.TestCase):
    def setUp(self):
        self.old_mask = os.umask(0o077)
        self.root = Path(tempfile.mkdtemp(dir=os.environ['HEARTH_SAFETY_TEST_ROOT']))
        self.config = self.root / 'config'
        self.config.mkdir(mode=0o700)
        self.data = self.root / 'data'
        self.data.mkdir(mode=0o700)
        os.chown(self.data, 2000, 2000)
        self.old_config, self.old_state = safety.CONFIG, safety.STATE
        safety.CONFIG, safety.STATE = self.config, self.config / 'state'
        (self.config / '.env').write_text(f'HEARTH_DATA_DIR={self.data}\nHEARTH_UID=2000\nHEARTH_GID=2000\nHEARTH_VERSION={"b" * 40}\n')
        self.database(self.data / 'hearth.sqlite')
        os.chown(self.data / 'hearth.sqlite', 2000, 2000)

    def tearDown(self):
        safety.CONFIG, safety.STATE = self.old_config, self.old_state
        shutil.rmtree(self.root)
        os.umask(self.old_mask)

    def database(self, path):
        with sqlite3.connect(path) as database:
            database.execute('CREATE TABLE households(id TEXT PRIMARY KEY)')
            database.execute("INSERT INTO households VALUES ('household_fixture')")
            database.execute('CREATE TABLE schema_migrations(version INTEGER)')
            database.execute('INSERT INTO schema_migrations VALUES (27)')

    def test_snapshot_and_atomic_restore_do_not_follow_destination_symlink(self):
        backup = safety.snapshot()
        outside = self.root / 'outside'
        outside.write_text('root-owned sentinel')
        live = self.data / 'hearth.sqlite'
        live.unlink()
        live.symlink_to(outside)
        safety.restore(backup)
        self.assertEqual(outside.read_text(), 'root-owned sentinel')
        self.assertFalse(live.is_symlink())
        self.assertEqual(live.stat().st_uid, 2000)
        self.assertEqual(live.stat().st_mode & 0o777, 0o600)
        with sqlite3.connect(live) as database:
            self.assertEqual(database.execute('SELECT id FROM households').fetchone(), ('household_fixture',))

    def test_symlinked_source_and_hardlink_are_rejected(self):
        live = self.data / 'hearth.sqlite'
        outside = self.root / 'other.sqlite'
        live.rename(outside)
        live.symlink_to(outside)
        with self.assertRaises((ValueError, OSError)):
            safety.snapshot()
        live.unlink()
        os.link(outside, live)
        with self.assertRaisesRegex(ValueError, 'links'):
            safety.snapshot()

    def test_replaced_data_directory_stops_recovery(self):
        backup = safety.snapshot()
        self.data.rename(self.root / 'old-data')
        self.data.mkdir(mode=0o700)
        sentinel = self.data / 'hearth.sqlite'
        sentinel.write_text('new directory must remain untouched')
        with self.assertRaisesRegex(ValueError, 'directory was replaced'):
            safety.restore(backup)
        self.assertEqual(sentinel.read_text(), 'new directory must remain untouched')

    def test_marker_replaces_symlink_without_writing_its_target(self):
        root = safety.state_directory()
        outside = self.root / 'outside'
        outside.write_text('root-owned sentinel')
        (root / 'active-source-version').symlink_to(outside)
        safety.protected_write('active-source-version', 'a' * 40)
        self.assertEqual(outside.read_text(), 'root-owned sentinel')
        self.assertEqual((root / 'active-source-version').read_text(), 'a' * 40 + '\n')

    def test_restore_temp_substitution_never_changes_an_outside_host_file(self):
        backup = safety.snapshot()
        outside = self.root / 'host-file'
        outside.write_text('root-owned sentinel')
        original = os.fchown
        def substitute(descriptor, uid, gid):
            original(descriptor, uid, gid)
            for path in self.data.glob('.hearth-restore-*'):
                path.unlink()
                path.symlink_to(outside)
        with patch.object(safety.os, 'fchown', side_effect=substitute):
            with self.assertRaisesRegex(ValueError, 'work file was replaced'):
                safety.restore(backup)
        self.assertEqual(outside.read_text(), 'root-owned sentinel')

    def test_untrusted_ancestor_and_changed_snapshot_are_rejected(self):
        os.chmod(self.config, 0o777)
        with self.assertRaisesRegex(ValueError, 'ancestor'):
            safety.protected_write('active-source-version', 'a' * 40)
        os.chmod(self.config, 0o700)
        backup = safety.snapshot()
        with (Path(backup) / 'hearth.sqlite').open('ab') as stream:
            stream.write(b'tampered')
        before = (self.data / 'hearth.sqlite').read_bytes()
        with self.assertRaisesRegex(ValueError, 'digest'):
            safety.restore(backup)
        self.assertEqual((self.data / 'hearth.sqlite').read_bytes(), before)

    def test_root_policy_accepts_only_the_latest_successful_fixed_workflow(self):
        run = {'head_sha': 'a' * 40, 'head_branch': 'main', 'event': 'push', 'status': 'completed',
               'conclusion': 'success', 'repository': {'id': safety.REPOSITORY_ID, 'full_name': safety.REPOSITORY}}
        def response():
            return io.BytesIO(json.dumps({'workflow_runs': [run]}).encode())
        with patch.object(safety.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = lambda *args, **kwargs: response()
            safety.verify_release('a' * 40)
            with self.assertRaises(ValueError):
                safety.verify_release('b' * 40)
            run['conclusion'] = 'failure'
            with self.assertRaises(ValueError):
                safety.verify_release('a' * 40)
        with self.assertRaisesRegex(ValueError, 'redirect'):
            safety.NoRedirect().redirect_request(None)

    def test_update_channel_accepts_bounded_frames_and_rejects_oversized_inputs(self):
        control = self.config / 'control'
        control.mkdir(mode=0o755)
        fifo = control / 'commands'
        os.mkfifo(fifo, 0o600)
        os.chown(fifo, 2000, 2000)
        def submit(payload):
            def writer():
                with fifo.open('wb', buffering=0) as stream:
                    stream.write(payload)
            worker = threading.Thread(target=writer, daemon=True)
            worker.start()
            output = io.StringIO()
            with patch.object(safety.sys, 'argv', ['release-safety.py', 'read-command']), redirect_stdout(output):
                safety.main()
            worker.join(timeout=3)
            self.assertFalse(worker.is_alive())
            return output.getvalue()
        self.assertEqual(submit(b'request_fixture ' + b'a' * 40 + b'\n'), 'request_fixture ' + 'a' * 40 + '\n')
        self.assertEqual(submit(b'x' * 159 + b'\n'), '')
        self.assertEqual(submit(b'request_fixture ' + b'a' * 39 + b'g\n'), '')
        self.assertEqual(submit(b'\xff ' + b'a' * 40 + b'\n'), '')

    def test_repository_rename_accepts_only_the_same_immutable_repository(self):
        def run(repository, identity=safety.REPOSITORY_ID):
            return {'head_sha': 'a' * 40, 'head_branch': 'main', 'event': 'push',
                    'status': 'completed', 'conclusion': 'success',
                    'repository': {'id': identity, 'full_name': repository}}
        for renamed in (False, True):
            calls = []
            def response(request, timeout):
                calls.append(request.full_url)
                if safety.LEGACY_REPOSITORY in request.full_url:
                    return io.BytesIO(json.dumps({'workflow_runs': [run(safety.LEGACY_REPOSITORY)]}).encode())
                # Before rename, the requested canonical name belongs to the legacy app.
                identity = safety.REPOSITORY_ID if renamed else 1174989270
                return io.BytesIO(json.dumps({'workflow_runs': [run(safety.REPOSITORY, identity)]}).encode())
            with patch.object(safety.urllib.request, 'build_opener') as opener:
                opener.return_value.open.side_effect = response
                safety.verify_release('a' * 40)
            self.assertEqual(len(calls), 1 if renamed else 2)
            self.assertTrue(all(url.startswith('https://api.github.com/repos/') for url in calls))
        with patch.object(safety.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = lambda *args, **kwargs: io.BytesIO(json.dumps({'workflow_runs': [run(safety.REPOSITORY, 1174989270)]}).encode())
            with self.assertRaisesRegex(ValueError, 'approved Hearth repository'):
                safety.verify_release('a' * 40)

    def test_repository_aliases_do_not_follow_redirects_or_hide_rate_limits(self):
        valid = {'head_sha': 'a' * 40, 'head_branch': 'main', 'event': 'push',
                 'status': 'completed', 'conclusion': 'success',
                 'repository': {'id': safety.REPOSITORY_ID, 'full_name': safety.LEGACY_REPOSITORY}}
        def response(request, timeout):
            if safety.LEGACY_REPOSITORY not in request.full_url:
                raise safety.ReleaseRedirectRefused('redirect refused')
            return io.BytesIO(json.dumps({'workflow_runs': [valid]}).encode())
        with patch.object(safety.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = response
            safety.verify_release('a' * 40)
            error = safety.urllib.error.HTTPError('https://api.github.com/', 403, 'limited', {}, None)
            opener.return_value.open.side_effect = error
            with self.assertRaises(safety.urllib.error.HTTPError):
                safety.verify_release('a' * 40)
        with self.assertRaises(safety.ReleaseRedirectRefused):
            safety.NoRedirect().redirect_request(None)


if __name__ == '__main__':
    unittest.main()
