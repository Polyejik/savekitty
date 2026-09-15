"""Read-only post-deploy checks. Never submit synthetic game results to production."""
import json
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
API = 'https://spasipushka-api.kutuzovap.workers.dev'


def get(url, headers=None):
    try:
        with urlopen(Request(url, headers=headers or {}), timeout=25) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        try:
            data = json.load(error)
        except (ValueError, OSError):
            data = None
        return error.code, data


def main():
    # Worker and Pages deploy independently. Wait for the intended backend build.
    for attempt in range(36):
        try:
            status, health = get(API + '/health')
            if status == 200 and health.get('version') == 'challenge-v4-rls':
                break
        except (URLError, TimeoutError):
            pass
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
