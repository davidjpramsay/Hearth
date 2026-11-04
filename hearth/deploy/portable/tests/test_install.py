import importlib.util
import base64
import json
import os
import sqlite3
import shutil
import subprocess
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('hearth_install', Path(__file__).resolve().parents[1] / 'install.py')
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)
SHA = 'a' * 40


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()

    def create(self):
        return installer.prepare(self.root / 'new-home', 'https://hearth.example.test', SHA, 8432, os.getuid() or 1000, os.getgid())

    def test_fresh_private_files_without_ha_or_existing_configuration(self):
        state = self.create()
        directory = self.root / 'new-home'
        self.assertEqual(installer.resume(directory), state)
        self.assertEqual(len((directory / 'secrets/first-use-code').read_text().strip()), 64)
        self.assertEqual((directory / 'secrets/first-use-code').stat().st_mode & 0o777, 0o600)
        self.assertEqual((directory / 'data').stat().st_mode & 0o777, 0o700)
        config = (directory / 'compose.yaml').read_text()
        self.assertIn('127.0.0.1:8432:8080', config)
        self.assertNotIn('docker.sock', config)
        self.assertNotIn('network_mode: host', config)
        self.assertNotIn('privileged:', config)
        self.assertFalse((directory / 'secrets/home-assistant.json').exists())
        with self.assertRaises(ValueError):
            self.create()

    @unittest.skipUnless(shutil.which('docker'), 'Docker Compose is not installed')
    def test_real_compose_parser_retains_private_mounts_and_health_dependency(self):
        self.create()
        result = subprocess.run(['docker', 'compose', '--file', str(self.root / 'new-home/compose.yaml'), 'config', '--format', 'json'], capture_output=True, text=True, check=True)
        services = json.loads(result.stdout)['services']
        self.assertEqual(services['server']['tmpfs'], ['/tmp:rw,noexec,nosuid,size=32m'])
        self.assertEqual(services['web']['tmpfs'], ['/tmp:rw,noexec,nosuid,size=16m'])
        self.assertEqual(services['web']['ports'][0]['host_ip'], '127.0.0.1')
        self.assertEqual(services['web']['depends_on']['server']['condition'], 'service_healthy')
        self.assertTrue(all(service['read_only'] for service in services.values()))

    def test_rejects_symlinks_source_checkouts_and_root_user(self):
        (self.root / 'alias').symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(ValueError):
            installer.prepare(self.root / 'alias/new', 'https://hearth.example.test', SHA, 8432, 1000, 1000)
        (self.root / '.git').mkdir()
        with self.assertRaises(ValueError):
            self.create()
        (self.root / '.git').rmdir()
        with self.assertRaises(ValueError):
            installer.prepare(self.root / 'new', 'https://hearth.example.test', SHA, 8432, 0, 0)

    def test_existing_or_concurrent_destination_and_writable_parent_are_preserved(self):
        target = self.root / 'new-home'
        original = Path.mkdir
        def race(path, *args, **kwargs):
            if path == target and not target.exists():
                original(path, mode=0o700)
                (target / 'other-installation').write_text('preserve')
            return original(path, *args, **kwargs)
        with patch.object(Path, 'mkdir', race), self.assertRaises(FileExistsError):
            self.create()
        self.assertEqual((target / 'other-installation').read_text(), 'preserve')
        self.assertFalse((target / 'installation.json').exists())
        parent = self.root / 'shared'
        parent.mkdir(mode=0o777)
        parent.chmod(0o777)
        with self.assertRaises(ValueError):
            installer.prepare(parent / 'new', 'https://hearth.example.test', SHA, 8432, os.getuid() or 1000, os.getgid())

    def test_never_resumes_modified_or_nonprivate_configuration(self):
        self.create()
        config = self.root / 'new-home/compose.yaml'
        config.write_text(config.read_text() + '\n# unexpected change\n')
        with self.assertRaises(ValueError):
            installer.resume(self.root / 'new-home')

    def test_consumed_first_use_proof_does_not_block_existing_household_resume(self):
        state = self.create()
        (self.root / 'new-home/secrets/first-use-code').unlink()
        self.assertEqual(installer.resume(self.root / 'new-home'), state)

    def test_rejects_credential_or_insecure_origins(self):
        for origin in ['http://hearth.local', 'https://user:secret@hearth.local', 'https://hearth.local/#secret', 'https://hearth.local/admin', 'https://hearth.local\n']:
            # Trailing whitespace is intentionally normalized, embedded whitespace is not.
            if origin.endswith('\n'):
                origin = 'https://hearth.\nlocal'
            with self.assertRaises(ValueError):
                installer.private_origin(origin)

    def test_only_successful_main_with_all_publication_jobs_can_be_selected(self):
        calls = []
        def fetch(url):
            calls.append(url)
            if '/contents/' in url:
                return {'type': 'file', 'path': installer.CAPABILITY_PATH, 'encoding': 'base64', 'content': base64.b64encode(b'{"format":1}').decode(), 'size': 12}
            if '/jobs?' in url:
                return {'jobs': [{'name': name, 'conclusion': 'success'} for name in installer.REQUIRED_JOBS]}
            return {'workflow_runs': [{'id': 12, 'head_sha': SHA, 'head_branch': 'main', 'conclusion': 'success'}]}
        self.assertEqual(installer.latest_verified_release(fetch), SHA)
        self.assertTrue(all(url.startswith('https://api.github.com/repos/davidjpramsay/Hearth/') for url in calls))
        def incomplete(url):
            if '/jobs?' in url:
                return {'jobs': []}
            return fetch(url)
        with self.assertRaises(ValueError):
            installer.latest_verified_release(incomplete)
        def missing_setup(url):
            if '/contents/' in url:
                return {'type': 'file', 'path': installer.CAPABILITY_PATH, 'encoding': 'base64', 'content': base64.b64encode(b'{"format":0}').decode(), 'size': 12}
            return fetch(url)
        with self.assertRaises(ValueError):
            installer.latest_verified_release(missing_setup)

    def test_pulls_and_checks_both_images_before_start_no_shell_or_secret(self):
        state = self.create()
        destination = self.root / 'new-home'
        calls = []
        def run(args, cwd):
            calls.append(args)
            if args[1:3] == ['image', 'inspect']:
                return json.dumps({'Architecture': 'amd64', 'Os': 'linux', 'Config': {'Labels': {'org.opencontainers.image.revision': SHA}}})
            if 'installation-card-cli.js' in ' '.join(args):
                path = destination / 'data/first-phone.png'
                path.write_bytes(b'fictional-card')
                path.chmod(0o600)
            return ''
        installer.start(destination, state, run)
        start = next(index for index, call in enumerate(calls) if 'up' in call)
        self.assertEqual(sum('inspect' in call for call in calls[:start]), 2)
        self.assertFalse(any('secret' in str(call) or 'sh' in call for call in calls))
        state['version'] = 'b' * 40
        with self.assertRaises(ValueError):
            installer.start(destination, state, run)

    def test_https_failure_and_wrong_release_are_not_success(self):
        def fetch(url):
            if url.endswith('/health'):
                return {'status': 'ok', 'mode': 'private', 'version': 'b' * 40}
            if url.endswith('/runtime'):
                return {'mode': 'private', 'household': None, 'requiresSetup': True}
            return {'status': 'ready', 'database': 'ready', 'mode': 'private'}
        with self.assertRaises(ValueError):
            installer.ready('https://hearth.example.test', SHA, fetch)

    def update_fixture(self):
        old = self.create()
        folder = self.root / 'new-home'
        db = sqlite3.connect(folder / 'data/hearth.sqlite')
        db.execute('create table proof (value text)')
        db.execute("insert into proof values ('old')")
        db.commit()
        db.close()
        (folder / 'data/photo.bin').write_bytes(b'fictional photo')
        (folder / 'secrets/calendar.json').write_text('fictional provider credential')
        (folder / 'secrets/calendar.json').chmod(0o600)
        calls = []
        def run(args, cwd):
            calls.append(args)
            if args[1:3] == ['image', 'inspect']:
                return json.dumps({'Architecture': 'amd64', 'Os': 'linux', 'Config': {'Labels': {'org.opencontainers.image.revision': 'b' * 40}}})
            return ''
        return old, folder, calls, run

    def test_update_retains_complete_stopped_checkpoint(self):
        old, folder, calls, run = self.update_fixture()
        result = installer.upgrade(folder, old, 'b' * 40, run, lambda origin, sha: True)
        self.assertEqual(result['version'], 'b' * 40)
        self.assertEqual(installer.resume(folder), result)
        checkpoint = next((folder / 'update-checkpoints').iterdir())
        self.assertEqual((checkpoint / 'data/photo.bin').read_bytes(), b'fictional photo')
        self.assertEqual((checkpoint / 'secrets/calendar.json').read_text(), 'fictional provider credential')
        self.assertEqual(json.loads((checkpoint / 'installation.json').read_text())['version'], old['version'])
        stop = next(index for index, call in enumerate(calls) if 'stop' in call)
        self.assertEqual(sum('inspect' in call for call in calls[:stop]), 2)

    def test_failed_update_restores_matching_data_secrets_and_release(self):
        old, folder, calls, run = self.update_fixture()
        def check(origin, sha):
            if sha == 'b' * 40:
                (folder / 'data/photo.bin').write_bytes(b'changed during unsuccessful update')
                raise ValueError('fixture failed readiness')
            return True
        with patch.object(installer.time, 'sleep'), self.assertRaises(ValueError):
            installer.upgrade(folder, old, 'b' * 40, run, check)
        self.assertEqual(installer.resume(folder), old)
        self.assertEqual((folder / 'data/photo.bin').read_bytes(), b'fictional photo')
        failed = next((folder / 'failed-updates').iterdir())
        self.assertEqual((failed / 'data/photo.bin').read_bytes(), b'changed during unsuccessful update')
        self.assertFalse((folder / '.setup-operation').exists())

    def test_update_refuses_symlinks_and_concurrent_operation(self):
        old, folder, calls, run = self.update_fixture()
        (folder / 'data/link').symlink_to(folder / 'secrets/calendar.json')
        with self.assertRaises(ValueError):
            installer.upgrade(folder, old, 'b' * 40, run, lambda origin, sha: True)
        self.assertFalse(any('stop' in call for call in calls))
        (folder / 'data/link').unlink()
        (folder / '.setup-operation').mkdir()
        with self.assertRaises(FileExistsError):
            installer.upgrade(folder, old, 'b' * 40, run, lambda origin, sha: True)

    def test_insufficient_checkpoint_space_does_not_stop_working_hearth(self):
        old, folder, calls, run = self.update_fixture()
        with patch.object(installer.shutil, 'disk_usage', return_value=type('Disk', (), {'free': 0})()), self.assertRaises(ValueError):
            installer.upgrade(folder, old, 'b' * 40, run, lambda origin, sha: True)
        self.assertFalse(any('stop' in call for call in calls))
        self.assertEqual(installer.resume(folder), old)


if __name__ == '__main__':
    unittest.main()
