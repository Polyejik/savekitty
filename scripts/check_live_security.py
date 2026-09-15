"""Read-only post-deploy checks. Never submit synthetic game results to production."""
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = 'https://spasipushka-api.kutuzovap.workers.dev'


def get(url, headers=None):
    # Match the transport used by the existing, working API smoke workflow.
    command = ['curl', '--silent', '--show-error', '--max-time', '25', '--write-out', '\n%{http_code}']
    for name, value in (headers or {}).items():
        command.extend(['--header', name + ': ' + value])
    result = subprocess.run(command + [url], capture_output=True, text=True, check=True)
    body, status = result.stdout.rsplit('\n', 1)
    try:
        data = json.loads(body)
    except ValueError:
        data = None
    return int(status), data


def main():
    # Worker and Pages deploy independently. Wait for the intended backend build.
    previous = None
    for attempt in range(36):
        try:
            status, health = get(API + '/health')
            version = health.get('version') if isinstance(health, dict) else None
            if (status, version) != previous:
                print('Worker health:', status, version, flush=True)
                previous = (status, version)
            if status == 200 and version == 'challenge-v4-rls':
                break
        except subprocess.CalledProcessError:
            print('Worker health request did not complete; retrying', flush=True)
        time.sleep(10)
    else:
        raise RuntimeError('The security Worker build has not reached production')

    # The existing dashboard path runs the atomic table bootstrap/migration.
    status, dashboard = get(API + '/dashboard?campaign=save-pushok-pilot')
    assert status == 200 and dashboard.get('ok') is True, 'Dashboard or database migration failed'
    assert len(dashboard.get('daily', [])) == 14, 'Dashboard response is incomplete'
    print('PASS: new Worker deployed; database migration and dashboard queries succeeded')

    config = (ROOT / 'supabase-config.js').read_text()
    base = re.search(r'url:\s*"([^"]+)"', config)[1]
    key = re.search(r'anonKey:\s*"([^"]+)"', config)[1]
    for table in ['game_challenges', 'game_runs', 'campaigns']:
        status, rows = get(base + '/rest/v1/' + table + '?select=id&limit=1', {'apikey': key})
        denied = status in (401, 403) and isinstance(rows, dict) and rows.get('code') == '42501'
        if table == 'game_challenges':
            assert denied, 'Expected PostgreSQL permission denial, not an invalid API key or network error'
        else:
            assert denied or (status == 200 and rows == []), 'Raw table is publicly readable or could not be verified: ' + table
        print('PASS: anonymous read blocked for ' + table + ' (HTTP ' + str(status) + ')')


if __name__ == '__main__':
    main()
