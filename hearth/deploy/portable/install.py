#!/usr/bin/env python3
"""Guided, private, fresh Docker installation. No shell, HA or host-network changes."""
import argparse
import base64
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import sqlite3
import stat
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
import urllib.error

REPOSITORY = 'davidjpramsay/Hearth'
REQUIRED_JOBS = {'Web and server', 'Android TV shell', 'Synology container images', 'Browser (1/4)', 'Browser (2/4)', 'Browser (3/4)', 'Browser (4/4)', 'Publish verified Synology images'}
CAPABILITY_PATH = 'hearth/deploy/portable/setup-format.json'


class SetupError(ValueError):
    pass


@contextmanager
def locked(destination):
    lock = no_links(destination / '.setup-operation')
    lock.mkdir(mode=0o700)
    try:
        yield
    finally:
        lock.rmdir()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def read_json(url):
    request = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent': 'Hearth-setup', 'Cache-Control': 'no-cache'})
    with urllib.request.build_opener(NoRedirect).open(request, timeout=15) as response:
        content = response.read(1024 * 1024 + 1)
        if len(content) > 1024 * 1024:
            raise SetupError('Response is too large.')
        return json.loads(content)


def latest_verified_release(fetch=read_json):
    base = 'https://api.github.com/repos/' + REPOSITORY
    runs = fetch(base + '/actions/workflows/verify.yml/runs?branch=main&event=push&status=success&per_page=10')['workflow_runs']
    for run in runs:
        sha = run.get('head_sha', '')
        if run.get('conclusion') != 'success' or run.get('head_branch') != 'main' or not re.fullmatch('[a-f0-9]{40}', sha):
            continue
        jobs = fetch(base + '/actions/runs/' + str(int(run['id'])) + '/jobs?per_page=100')['jobs']
        if {job['name'] for job in jobs if job.get('conclusion') == 'success'} >= REQUIRED_JOBS:
            try:
                marker = fetch(base + '/contents/' + CAPABILITY_PATH + '?ref=' + sha)
                if marker.get('type') == 'file' and marker.get('path') == CAPABILITY_PATH and marker.get('encoding') == 'base64' and marker.get('size', 10000) < 512:
                    content = json.loads(base64.b64decode(''.join(marker['content'].split()), validate=True))
                    if content == {'format': 1}:
                        return sha
            except urllib.error.HTTPError as error:
                if error.code != 404:
                    raise
            except (ValueError, KeyError):
                continue
    raise SetupError('No fully verified published release is available yet.')


def private_origin(value):
    value = value.strip()
    if any(ord(char) <= 32 for char in value):
        raise SetupError('Use a trusted private HTTPS address without spaces.')
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ('', '/') or not re.fullmatch('[A-Za-z0-9.-]+', parsed.hostname):
        raise SetupError('Use the trusted HTTPS root address, without a path, password or code.')
    if parsed.port is not None and not 1 <= parsed.port <= 65535:
        raise SetupError('Invalid HTTPS port.')
    return urllib.parse.urlunsplit(('https', parsed.netloc.lower(), '', '', ''))


def no_links(path):
    path = Path(os.path.abspath(path))
    for entry in (path, *path.parents):
        if entry.is_symlink():
            raise SetupError('Choose a directory without symlinks.')
    return path


def command(args, cwd=None):
    result = subprocess.run(args, cwd=cwd, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=600, check=False)
    if result.returncode:
        raise SetupError('A Docker operation failed. Check Docker access, disk space and this installation’s state before retrying. No host-network settings were changed.')
    return result.stdout.strip()


def compose_text(state):
    # JSON scalar strings are also valid YAML. No user input becomes shell/Compose code.
    origin = json.dumps(state['origin'])
    host = json.dumps(urllib.parse.urlsplit(state['origin']).hostname)
    user = json.dumps(str(state['uid']) + ':' + str(state['gid']))
    sha = state['version']
    return '''name: {project}
services:
  server:
    image: ghcr.io/davidjpramsay/hearth-v2-server:{sha}
    user: {user}
    init: true
    read_only: true
    restart: unless-stopped
    stop_grace_period: 30s
    cap_drop: [ALL]
    security_opt: [no-new-privileges:true]
    tmpfs: ['/tmp:rw,noexec,nosuid,size=32m']
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:4310/api/v1/readiness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    volumes: ['./data:/data', './secrets:/run/hearth-secrets']
    environment:
      HEARTH_MODE: private
      HEARTH_HOST: 0.0.0.0
      HEARTH_PORT: '4310'
      HEARTH_VERSION: {sha}
      HEARTH_DATABASE_PATH: /data/hearth.sqlite
      HEARTH_AUTH_RP_ID: {host}
      HEARTH_AUTH_ORIGIN: {origin}
      HEARTH_FIRST_USE_CODE_PATH: /run/hearth-secrets/first-use-code
      HEARTH_CALENDAR_CONFIG_PATH: /run/hearth-secrets/calendar.json
      HEARTH_HOME_ASSISTANT_CONFIG_PATH: /run/hearth-secrets/home-assistant.json
      HEARTH_ESV_API_KEY_PATH: /run/hearth-secrets/esv-api-key
      HEARTH_PHOTO_DERIVATIVE_DIR: /data/photo-derivatives
      HEARTH_PHOTO_UPLOAD_DIR: /data/photo-uploads
      HEARTH_BACKUP_DIR: /data/backups
      HEARTH_BACKUP_RETENTION: '14'
      HEARTH_BACKUP_INTERVAL_HOURS: '24'
    logging:
      driver: json-file
      options: {{max-size: 10m, max-file: '3'}}
  web:
    image: ghcr.io/davidjpramsay/hearth-v2-web:{sha}
    user: '101:101'
    read_only: true
    restart: unless-stopped
    cap_drop: [ALL]
    security_opt: [no-new-privileges:true]
    tmpfs: ['/tmp:rw,noexec,nosuid,size=16m']
    depends_on:
      server:
        condition: service_healthy
    ports: ['127.0.0.1:{port}:8080']
    logging:
      driver: json-file
      options: {{max-size: 10m, max-file: '3'}}
'''.format(project=state['project'], sha=sha, user=user, host=host, origin=origin, port=state['port'])


def write_private(path, content, uid, gid):
    descriptor = os.open(str(path), os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, 'w') as file:
        file.write(content)
        if os.geteuid() == 0:
            os.fchown(file.fileno(), uid, gid)


def prepare(destination, origin, version, port, uid, gid):
    destination = no_links(destination)
    if destination.exists() or not destination.parent.is_dir():
        raise SetupError('Choose a new folder inside an existing directory. Existing installations are never overwritten.')
    if destination.parent.stat().st_mode & 0o022:
        raise SetupError('Choose an owner-controlled parent folder that is not group/world writable.')
    if any((entry / '.git').exists() for entry in (destination.parent, *destination.parent.parents)):
        raise SetupError('Keep private installation files outside source control.')
    if not re.fullmatch('[a-f0-9]{40}', version) or not 1024 <= port <= 65535 or uid <= 0 or gid < 0:
        raise SetupError('Invalid installation settings. The app must run as a non-root user.')
    state = {'format': 1, 'origin': private_origin(origin), 'version': version, 'port': port, 'uid': uid, 'gid': gid, 'project': 'hearth-' + secrets.token_hex(5)}
    staging = Path(tempfile.mkdtemp(prefix='.hearth-setup-', dir=destination.parent))
    try:
        for name in ['data', 'secrets']:
            path = staging / name
            path.mkdir(mode=0o700)
            if os.geteuid() == 0:
                os.chown(path, uid, gid)
        write_private(staging / 'secrets/first-use-code', secrets.token_hex(32) + '\n', uid, gid)
        config = compose_text(state)
        state['composeSha256'] = hashlib.sha256(config.encode()).hexdigest()
        write_private(staging / 'compose.yaml', config, os.geteuid(), os.getegid())
        write_private(staging / 'installation.json', json.dumps(state), os.geteuid(), os.getegid())
        # Reserve the destination exclusively: rename alone can replace a concurrently created empty directory.
        destination.mkdir(mode=0o700)
        for name in ['data', 'secrets', 'compose.yaml', 'installation.json']:
            os.rename(staging / name, destination / name)
        staging.rmdir()
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise
    return state


def resume(destination):
    destination = no_links(destination)
    paths = ['', 'data', 'secrets', 'installation.json', 'compose.yaml']
    # The server deliberately consumes/removes this proof when the owner claims the household.
    if (destination / 'secrets/first-use-code').exists() or (destination / 'secrets/first-use-code').is_symlink():
        paths.append('secrets/first-use-code')
    for name in paths:
        path = no_links(destination / name)
        info = path.stat()
        if (info.st_mode & 0o077) != 0 or (path.is_file() and info.st_nlink != 1):
            raise SetupError('Installation files must remain private.')
    state = json.loads((destination / 'installation.json').read_text())
    if state.get('format') != 1 or not re.fullmatch('hearth-[a-f0-9]{10}', state['project']) or not re.fullmatch('[a-f0-9]{40}', state['version']):
        raise SetupError('Invalid installation record.')
    private_origin(state['origin'])
    if not 1024 <= state['port'] <= 65535 or state['uid'] <= 0 or state['gid'] < 0:
        raise SetupError('Invalid installation record.')
    actual = (destination / 'compose.yaml').read_bytes()
    if hashlib.sha256(actual).hexdigest() != state['composeSha256'] or actual != compose_text(state).encode():
        raise SetupError('Compose configuration changed. Review it with your server administrator instead of automatic resume.')
    return state


def start(destination, state, run=command):
    with locked(destination):
        if resume(destination) != state:
            raise SetupError('Installation changed; review before resuming.')
        return _start(destination, state, run)


def _start(destination, state, run=command):
    docker = ['docker', 'compose', '--file', 'compose.yaml']
    run(docker + ['config', '--quiet'], destination)
    print('Downloading the verified Hearth images…')
    run(docker + ['pull'], destination)
    for kind in ['server', 'web']:
        image = 'ghcr.io/davidjpramsay/hearth-v2-' + kind + ':' + state['version']
        metadata = json.loads(run(['docker', 'image', 'inspect', '--format', '{{json .}}', image], destination))
        if metadata.get('Architecture') != 'amd64' or metadata.get('Os') != 'linux' or metadata.get('Config', {}).get('Labels', {}).get('org.opencontainers.image.revision') != state['version']:
            raise SetupError('The downloaded image does not match the verified release.')
    print('Starting this new Hearth installation…')
    run(docker + ['up', '-d'], destination)
    card = destination / 'data/first-phone.png'
    if not card.exists() and (destination / 'secrets/first-use-code').is_file():
        run(docker + ['run', '--rm', '--no-deps', 'server', 'node', 'dist/installation-card-cli.js'], destination)
    if card.is_symlink() or (card.exists() and (not card.is_file() or card.stat().st_mode & 0o077)):
        raise SetupError('The private setup card could not be verified.')


def upgrade(destination, old, version, run=command, check=None):
    with locked(destination):
        if resume(destination) != old:
            raise SetupError('Installation changed; review before updating.')
        return _upgrade(destination, old, version, run, check)


def _upgrade(destination, old, version, run=command, check=None):
    """Explicit CLI update; preserve a complete stopped data/secrets checkpoint and old images."""
    if not re.fullmatch('[a-f0-9]{40}', version) or version == old['version']:
        raise SetupError('Choose a new verified release.')
    check = check or ready
    check(old['origin'], old['version'])
    candidate = dict(old, version=version)
    config = compose_text(candidate)
    candidate['composeSha256'] = hashlib.sha256(config.encode()).hexdigest()
    operation = secrets.token_hex(8)
    proposed = destination / ('compose-update-' + operation + '.yaml')
    write_private(proposed, config, os.geteuid(), os.getegid())
    docker = ['docker', 'compose', '--file', 'compose.yaml']
    candidate_docker = ['docker', 'compose', '--file', proposed.name]
    checkpoint = destination / 'update-checkpoints' / operation
    stopped = False
    changed = False
    try:
        run(candidate_docker + ['config', '--quiet'], destination)
        run(candidate_docker + ['pull'], destination)
        for kind in ['server', 'web']:
            image = 'ghcr.io/davidjpramsay/hearth-v2-' + kind + ':' + version
            metadata = json.loads(run(['docker', 'image', 'inspect', '--format', '{{json .}}', image], destination))
            if metadata.get('Architecture') != 'amd64' or metadata.get('Os') != 'linux' or metadata.get('Config', {}).get('Labels', {}).get('org.opencontainers.image.revision') != version:
                raise SetupError('New image revision mismatch.')
        # Inspect every path before making a stopped, full filesystem checkpoint. No SQLite/WAL copy while running.
        data_bytes = 0
        for name in ['data', 'secrets']:
            for item in (destination / name).rglob('*'):
                no_links(item)
                if not item.is_dir() and not stat.S_ISREG(item.stat().st_mode):
                    raise SetupError('Unsupported private data file.')
                if item.is_file():
                    data_bytes += item.stat().st_size
        if shutil.disk_usage(destination).free < 2 * data_bytes + 64 * 1024 * 1024:
            raise SetupError('Not enough free space for the complete checkpoint and a possible restored copy. Free space before updating; Hearth was not stopped.')
        no_links(checkpoint.parent).mkdir(mode=0o700, exist_ok=True)
        checkpoint.parent.chmod(0o700)
        checkpoint.mkdir(mode=0o700)
        run(docker + ['stop'], destination)
        stopped = True
        for name in ['data', 'secrets']:
            shutil.copytree(destination / name, checkpoint / name, copy_function=shutil.copy2)
        for name in ['compose.yaml', 'installation.json']:
            shutil.copy2(destination / name, checkpoint / name)
        # A stopped checkpoint must contain the existing database, not merely an empty folder.
        if not (checkpoint / 'data/hearth.sqlite').is_file():
            raise SetupError('No database was found in the update checkpoint.')
        database = sqlite3.connect((checkpoint / 'data/hearth.sqlite').as_uri() + '?mode=ro', uri=True)
        try:
            if database.execute('PRAGMA quick_check').fetchall() != [('ok',)]:
                raise SetupError('The database checkpoint failed its integrity check.')
        finally:
            database.close()
        state_path = destination / ('installation-update-' + operation + '.json')
        write_private(state_path, json.dumps(candidate), os.geteuid(), os.getegid())
        changed = True
        os.replace(proposed, destination / 'compose.yaml')
        os.replace(state_path, destination / 'installation.json')
        run(docker + ['up', '-d'], destination)
        for attempt in range(6):
            try:
                check(candidate['origin'], version)
                return candidate
            except (OSError, ValueError):
                if attempt == 5:
                    raise SetupError('Updated release did not become ready.')
                time.sleep(2)
    except BaseException:
        if changed:
            # Never downgrade migrated data. Keep the failed state privately, restore its matching complete checkpoint.
            run(docker + ['stop'], destination)
            failed = no_links(destination / 'failed-updates')
            failed.mkdir(mode=0o700, exist_ok=True)
            failed.chmod(0o700)
            failed = failed / operation
            failed.mkdir(mode=0o700)
            for name in ['data', 'secrets']:
                os.rename(destination / name, failed / name)
                shutil.copytree(checkpoint / name, destination / name, copy_function=shutil.copy2)
                if os.geteuid() == 0:
                    for restored in (destination / name, *(destination / name).rglob('*')):
                        os.chown(restored, old['uid'], old['gid'])
            for name in ['compose.yaml', 'installation.json']:
                shutil.copy2(checkpoint / name, destination / name)
        if stopped:
            run(docker + ['up', '-d'], destination)
            check(old['origin'], old['version'])
        raise
    finally:
        if proposed.exists():
            proposed.unlink()


def ready(origin, version, fetch=read_json):
    health = fetch(origin + '/api/v1/health')
    readiness = fetch(origin + '/api/v1/readiness')
    runtime = fetch(origin + '/api/v1/runtime')
    if health.get('version') != version or health.get('status') != 'ok' or health.get('mode') != 'private' or readiness != {'status': 'ready', 'database': 'ready', 'mode': 'private'} or runtime.get('mode') != 'private' or runtime.get('household') is not None:
        raise SetupError('The private HTTPS address is not serving this healthy Hearth installation.')
    return runtime.get('requiresSetup') is True


def main():
    if os.name != 'posix':
        raise SystemExit('Run the server installer on a Linux/POSIX host. Windows users can manage that server from their browser.')
    parser = argparse.ArgumentParser(description='Set up a fresh, private Hearth. Home Assistant is optional.')
    parser.add_argument('--directory', type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--resume', action='store_true')
    mode.add_argument('--update', action='store_true')
    args = parser.parse_args()
    if shutil.which('docker') is None:
        raise SystemExit('Install Docker with Compose first, then run this installer again.')
    try:
        command(['docker', 'compose', 'version'])
        architecture = command(['docker', 'info', '--format', '{{.Architecture}}'])
        if architecture not in ('x86_64', 'amd64'):
            raise SetupError('Published images currently support x86-64. ARM/Raspberry Pi server installation is not supported by this installer yet.')
        destination = args.directory or Path(input('New private Hearth folder: ').strip()).expanduser()
        destination = no_links(destination)
        if args.update:
            state = resume(destination)
            version = latest_verified_release()
            if version == state['version']:
                print('Hearth is already on the newest verified release.')
                return
            comparison = read_json('https://api.github.com/repos/' + REPOSITORY + '/compare/' + state['version'] + '...' + version)
            if comparison.get('status') != 'ahead':
                raise SetupError('The selected release is not a verified forward update.')
            print('Update ' + state['version'][:7] + ' → ' + version[:7] + '. This briefly stops Hearth and checkpoints ALL data, photos and secrets. Avoid editing during the update. Keep enough free disk space for the full copy.')
            if input('Back up and install this verified update? [y/N] ').strip().lower() != 'y':
                print('Cancelled. Nothing changed.')
                return
            upgrade(destination, state, version)
            print('Update verified. The complete previous checkpoint is retained privately in update-checkpoints. HA integration updates remain separate downloads.')
            return
        if args.resume:
            state = resume(destination)
        else:
            origin = private_origin(input('Your already trusted private Hearth HTTPS address: '))
            port = int(input('Local reverse-proxy port [8432]: ').strip() or '8432')
            uid = os.geteuid() or int(input('Non-root service user UID: '))
            gid = os.getegid() if os.geteuid() else int(input('Service group GID: '))
            print('Checking GitHub for a fully verified published release…')
            version = latest_verified_release()
            print('Release ' + version[:7] + '. HA is optional. Existing Hearth folders will not be changed.')
            print('The web service will listen only on 127.0.0.1:' + str(port) + '. Your private HTTPS proxy must forward to that port.')
            if input('Create and start this new installation? [y/N] ').strip().lower() != 'y':
                print('Cancelled. No installation files changed.')
                return
            state = prepare(destination, origin, version, port, uid, gid)
        start(destination, state)
        for attempt in range(6):
            try:
                needs_setup = ready(state['origin'], state['version'])
                break
            except (OSError, ValueError):
                if attempt == 5:
                    raise SetupError('Private HTTPS readiness is not confirmed. Check the proxy/certificate, then rerun with --resume and this directory. Data and the setup proof are preserved.')
                time.sleep(2)
        if needs_setup:
            if not (destination / 'data/first-phone.png').is_file():
                raise SetupError('This unclaimed installation has no setup card. Ask its operator to recover the protected first-use proof; anonymous setup is not available.')
            print('Ready. Open the private data/first-phone.png from this installation on your own computer. Scan it with your phone camera, name your household, then follow Get started. Keep the card private and remove the PNG after setup.')
        else:
            if not args.resume:
                raise SetupError('The HTTPS address is already claimed. Check that its proxy points to this new installation; no other household was changed.')
            print('This Hearth is already claimed. Use your connected adult phone; first-owner setup will not reopen.')
    except SetupError as issue:
        raise SystemExit(str(issue)) from None
    except (OSError, ValueError, KeyError, sqlite3.Error, subprocess.SubprocessError):
        # Do not print provider bodies, subprocess output, key/card contents or credential URLs.
        raise SystemExit('Setup stopped. Check prerequisites, Docker access, private folder permissions, the trusted HTTPS proxy and this installation’s retained checkpoint. No host networking or other Compose project was changed. Use --resume only for this installer’s directory.')


if __name__ == '__main__':
    main()
