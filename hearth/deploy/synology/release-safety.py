#!/usr/bin/python3
"""Fixed root-side release policy and descriptor-pinned SQLite recovery operations."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import stat
import sys
import tempfile
import select
import time
import urllib.request
import urllib.error

CONFIG = Path('/usr/local/etc/hearth-v2')
STATE = Path('/volume1/.hearth-v2-state')
COMMIT = re.compile(r'^[0-9a-f]{40}$')
REPOSITORY = 'davidjpramsay/Hearth'
LEGACY_REPOSITORY = 'davidjpramsay/hearth-v2'
REPOSITORY_ID = 1327675743


def open_directory(path, trusted=False):
    path = Path(path)
    if not path.is_absolute() or '..' in path.parts or str(path) == '/':
        raise ValueError('Unsafe directory path.')
    descriptor = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in path.parts[1:]:
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                            dir_fd=descriptor)
            os.close(descriptor)
            descriptor = child
            details = os.fstat(descriptor)
            if trusted and (details.st_uid != 0 or details.st_mode & 0o022):
                raise ValueError('Privileged state has an untrusted ancestor.')
        return descriptor
    except BaseException:
        os.close(descriptor)
        raise


def state_directory():
    parent = open_directory(STATE.parent, trusted=True)
    try:
        try:
            os.mkdir(STATE.name, 0o700, dir_fd=parent)
        except FileExistsError:
            pass
    finally:
        os.close(parent)
    descriptor = open_directory(STATE, trusted=True)
    os.close(descriptor)
    return STATE


def config():
    parent = open_directory(CONFIG, trusted=True)
    descriptor = os.open('.env', os.O_RDONLY | os.O_NOFOLLOW, dir_fd=parent)
    os.close(parent)
    with os.fdopen(descriptor) as stream:
        details = os.fstat(stream.fileno())
        if details.st_uid != 0 or details.st_mode & 0o077:
            raise ValueError('Release configuration must be private and root-owned.')
        result = {}
        for line in stream:
            if line.strip() and not line.lstrip().startswith('#'):
                key, value = line.strip().split('=', 1)
                if key in result:
                    raise ValueError('Duplicate release configuration key.')
                result[key] = value.strip('"\'')
        for key in ('HEARTH_UID', 'HEARTH_GID'):
            if not re.fullmatch(r'[0-9]+', result.get(key, '')) or not 0 <= int(result[key]) < 2 ** 31:
                raise ValueError('Service identities must be valid numeric IDs.')
        if int(result['HEARTH_UID']) == 0:
            raise ValueError('The Hearth application must not run as root.')
        if not COMMIT.fullmatch(result.get('HEARTH_VERSION', '')):
            raise ValueError('The installed release must be a full commit.')
        return result


def regular_file(parent, name, owner, maximum=2 * 1024 ** 3):
    descriptor = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
    details = os.fstat(descriptor)
    if not stat.S_ISREG(details.st_mode) or details.st_nlink != 1 or details.st_uid != owner or details.st_size > maximum:
        os.close(descriptor)
        raise ValueError('Unexpected database/control file type, owner, links or size.')
    return descriptor


def copy_descriptor(source, target):
    before = os.fstat(source)
    remaining = before.st_size
    while remaining:
        chunk = os.read(source, min(remaining, 64 * 1024))
        if not chunk:
            raise ValueError('Database changed during copying.')
        remaining -= len(chunk)
        view = memoryview(chunk)
        while view:
            view = view[os.write(target, view):]
    after = os.fstat(source)
    if (before.st_size, before.st_mtime_ns, before.st_ctime_ns) != (after.st_size, after.st_mtime_ns, after.st_ctime_ns):
        raise ValueError('Database changed during copying.')
    os.fsync(target)


def verify_database(path):
    with sqlite3.connect(path) as database:
        if database.execute('PRAGMA quick_check').fetchone() != ('ok',):
            raise ValueError('Database integrity check failed.')
        if database.execute('PRAGMA foreign_key_check').fetchone() is not None:
            raise ValueError('Database foreign-key check failed.')
        database.execute('SELECT id FROM households LIMIT 1').fetchall()
        if database.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] is None:
            raise ValueError('This is not a migrated Hearth database.')
        checkpoint = database.execute('PRAGMA wal_checkpoint(TRUNCATE)').fetchone()
        if checkpoint[0] != 0:
            raise ValueError('Database checkpoint did not complete.')


def protected_write(name, value):
    if name not in {'active-source-version', 'previous-source-version', 'staged-source-version'}:
        raise ValueError('Unknown release marker.')
    if not COMMIT.fullmatch(value):
        raise ValueError('Expected a full release commit.')
    root = state_directory()
    descriptor, temporary = tempfile.mkstemp(prefix=f'.{name}.', dir=root)
    try:
        with os.fdopen(descriptor, 'w') as stream:
            stream.write(value + '\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, root / name)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


class ReleaseRedirectRefused(ValueError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise ReleaseRedirectRefused('Release verification cannot follow a redirect.')


def verify_release(commit):
    if not COMMIT.fullmatch(commit):
        raise ValueError('Expected a full release commit.')
    # Both names are explicit, fixed GitHub endpoints. Never follow a redirect;
    # immutable identity prevents the original legacy Hearth repository (or a
    # future reuse of either name) from becoming an installation authority.
    for repository in (REPOSITORY, LEGACY_REPOSITORY):
        url = f'https://api.github.com/repos/{repository}/actions/workflows/verify.yml/runs?branch=main&event=push&status=success&per_page=1'
        request = urllib.request.Request(url, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'Hearth-root-release-verifier'})
        try:
            with urllib.request.build_opener(NoRedirect).open(request, timeout=15) as response:
                raw = response.read(1024 * 1024 + 1)
                if len(raw) > 1024 * 1024:
                    raise ValueError('Release verification response is too large.')
                runs = json.loads(raw)['workflow_runs']
        except ReleaseRedirectRefused:
            continue
        except urllib.error.HTTPError as error:
            if error.code == 404:
                continue
            raise
        if not runs:
            continue
        run = runs[0]
        identity = run.get('repository', {})
        if identity.get('id') != REPOSITORY_ID:
            continue
        if (run.get('head_sha') != commit or run.get('head_branch') != 'main' or
                run.get('event') != 'push' or run.get('status') != 'completed' or
                run.get('conclusion') != 'success' or
                identity.get('full_name', '').lower() != repository.lower()):
            raise ValueError('Only the newest successful approved workflow release can be installed.')
        return
    raise ValueError('No verified release from the approved Hearth repository is available.')


def snapshot():
    settings = config()
    data = open_directory(settings['HEARTH_DATA_DIR'])
    backup = Path(tempfile.mkdtemp(prefix='rollback.', dir=state_directory()))
    try:
        for name in ('hearth.sqlite', 'hearth.sqlite-wal'):
            try:
                source = regular_file(data, name, int(settings['HEARTH_UID']))
            except FileNotFoundError:
                if name.endswith('-wal'):
                    continue
                raise
            target = os.open(backup / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
            try:
                space = os.statvfs(backup)
                if space.f_bavail * space.f_frsize < os.fstat(source).st_size + 256 * 1024 ** 2:
                    raise ValueError('Protected rollback storage needs more free space.')
                copy_descriptor(source, target)
            finally:
                os.close(source)
                os.close(target)
        verify_database(backup / 'hearth.sqlite')
        identity = os.fstat(data)
        digest = hashlib.sha256()
        with (backup / 'hearth.sqlite').open('rb') as stream:
            while chunk := stream.read(64 * 1024):
                digest.update(chunk)
        (backup / 'identity.json').write_text(json.dumps({'device': identity.st_dev, 'inode': identity.st_ino, 'sha256': digest.hexdigest()}))
        return str(backup)
    except BaseException:
        shutil.rmtree(backup)
        raise
    finally:
        os.close(data)


def restore(backup_path):
    backup = Path(backup_path)
    if backup.parent != state_directory() or not re.fullmatch(r'rollback\.[A-Za-z0-9_-]+', backup.name):
        raise ValueError('Rollback is outside protected state.')
    protected = open_directory(backup, trusted=True)
    settings = config()
    data = open_directory(settings['HEARTH_DATA_DIR'])
    temporary = '.hearth-restore-' + os.urandom(16).hex()
    try:
        identity = json.loads((backup / 'identity.json').read_text())
        current = os.fstat(data)
        if (current.st_dev, current.st_ino) != (identity['device'], identity['inode']):
            raise ValueError('The live data directory was replaced; recovery stopped safely.')
        source = regular_file(protected, 'hearth.sqlite', 0)
        target = os.open(temporary, os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=data)
        try:
            copy_descriptor(source, target)
            os.lseek(target, 0, os.SEEK_SET)
            digest = hashlib.sha256()
            while chunk := os.read(target, 64 * 1024):
                digest.update(chunk)
            if digest.hexdigest() != identity['sha256']:
                raise ValueError('Rollback database digest changed.')
            os.fchmod(target, 0o600)
            os.fchown(target, int(settings['HEARTH_UID']), int(settings['HEARTH_GID']))
            pinned = os.fstat(target)
            named = os.stat(temporary, dir_fd=data, follow_symlinks=False)
            if (pinned.st_dev, pinned.st_ino) != (named.st_dev, named.st_ino):
                raise ValueError('Restore work file was replaced.')
            for suffix in ('-wal', '-shm'):
                try:
                    os.unlink('hearth.sqlite' + suffix, dir_fd=data)
                except FileNotFoundError:
                    pass
            os.replace(temporary, 'hearth.sqlite', src_dir_fd=data, dst_dir_fd=data)
            os.fsync(data)
        finally:
            os.close(source)
            os.close(target)
    finally:
        try:
            os.unlink(temporary, dir_fd=data)
        except FileNotFoundError:
            pass
        os.close(data)
        os.close(protected)


def main():
    if os.geteuid() != 0:
        raise ValueError('Release safety operations require root.')
    os.umask(0o077)
    action = sys.argv[1]
    if action == 'check':
        state_directory()
        config()
    elif action == 'verify':
        verify_release(sys.argv[2])
    elif action == 'candidate':
        root = state_directory()
        path = root / 'staged-source-version'
        if not path.exists():
            path = Path('/volume1/docker/hearth-v2/staged-source-version')
        parent = open_directory(path.parent)
        descriptor = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
        os.close(parent)
        with os.fdopen(descriptor) as stream:
            details = os.fstat(stream.fileno())
            if not stat.S_ISREG(details.st_mode) or details.st_nlink != 1 or details.st_size > 96:
                raise ValueError('Staged input must be a regular file.')
            candidate = stream.read(96).strip()
            if not COMMIT.fullmatch(candidate):
                raise ValueError('Staged input must be a full commit.')
            print(candidate)
    elif action == 'stage':
        verify_release(sys.argv[2])
        protected_write('staged-source-version', sys.argv[2])
    elif action == 'marker':
        protected_write(sys.argv[2], sys.argv[3])
    elif action == 'snapshot':
        print(snapshot())
    elif action == 'restore':
        restore(sys.argv[2])
    elif action == 'cleanup':
        path = Path(sys.argv[2])
        if path.parent != state_directory() or not re.fullmatch(r'rollback\.[A-Za-z0-9_-]+', path.name):
            raise ValueError('Cleanup is outside protected state.')
        descriptor = open_directory(path, trusted=True)
        os.close(descriptor)
        shutil.rmtree(path)
    elif action == 'read-command':
        settings = config()
        parent = open_directory(CONFIG / 'control', trusted=True)
        descriptor = os.open('commands', os.O_RDONLY | os.O_NOFOLLOW, dir_fd=parent)
        os.close(parent)
        try:
            details = os.fstat(descriptor)
            if not stat.S_ISFIFO(details.st_mode) or details.st_uid != int(settings['HEARTH_UID']):
                raise ValueError('Unexpected update command channel.')
            os.set_blocking(descriptor, False)
            deadline = time.monotonic() + 2
            frame = bytearray()
            while len(frame) < 160:
                remaining = deadline - time.monotonic()
                if remaining <= 0 or not select.select([descriptor], [], [], remaining)[0]:
                    return
                chunk = os.read(descriptor, 160 - len(frame))
                if not chunk:
                    return
                frame.extend(chunk)
                if b'\n' in frame:
                    line = bytes(frame).split(b'\n', 1)[0]
                    try:
                        fields = line.decode('ascii').split()
                    except UnicodeDecodeError:
                        return
                    if len(fields) == 2 and re.fullmatch(r'[a-z][a-z0-9_-]{2,95}', fields[0]) and COMMIT.fullmatch(fields[1]):
                        print(' '.join(fields))
                    return
        finally:
            os.close(descriptor)
    else:
        raise ValueError('Unknown release safety operation.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'Hearth release safety check failed: {error}', file=sys.stderr)
        sys.exit(1)
