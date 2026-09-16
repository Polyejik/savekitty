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
            if status == 200 and version == 'dashboard-v5-partners':
                break
        except subprocess.CalledProcessError:
            print('Worker health request did not complete; retrying', flush=True)
        time.sleep(10)
    else:
        raise RuntimeError('The security Worker build has not reached production')

    status, leaderboard = get(API + '/leaderboard')
    assert status == 200 and leaderboard.get('ok') is True
    assert len(leaderboard['rows']) <= 10
    assert all(row['duration_seconds'] >= 45 for row in leaderboard['rows'])
    assert [row['duration_seconds'] for row in leaderboard['rows']] == sorted(row['duration_seconds'] for row in leaderboard['rows'])
    print('PASS: global leaderboard returns ordered top 10')

    # The existing dashboard path runs the atomic table bootstrap/migration.
    status, dashboard = get(API + '/dashboard?campaign=save-pushok-pilot')
    assert status == 200 and dashboard.get('ok') is True, 'Dashboard or database migration failed'
    assert len(dashboard.get('daily', [])) == 14, 'Dashboard response is incomplete'
    print('PASS: new Worker deployed; database migration and dashboard queries succeeded')

    status, security = get(API + '/database-security')
    assert status == 200 and security.get('ok') is True, 'Live database catalog reports insecure tables: ' + str(security)
    assert {row['table_name'] for row in security['checks']} == {'game_challenges', 'game_runs', 'campaigns', 'partner_rooms', 'partner_events'}
    for row in security['checks']:
        assert row['rls_enabled'] and row['public_tables_without_rls'] == 0
        print('PASS: live PostgreSQL catalog confirms RLS on ' + row['table_name'])
    for private in [row for row in security['checks'] if row['table_name'] in ('partner_rooms', 'partner_events')]:
        assert not any(private[name] for name in ['anon_table_access', 'authenticated_table_access', 'anon_column_access', 'authenticated_column_access'])
    assert dashboard['summary']['total_runs'] >= dashboard['summary']['confirmed_rescues']
    assert 'limited_runs' in dashboard['summary'] and 'retry_duplicates' in dashboard['summary']
    status, denied_room = get(API + '/partner-rooms/08fae845-8817-479f-8b49-1987b9035d7f')
    assert status == 401, 'Private room must require an invitation'
    print('PASS: all-game totals and room access guard respond correctly')
    challenge = next(row for row in security['checks'] if row['table_name'] == 'game_challenges')
    assert not any(challenge[name] for name in ['anon_table_access', 'authenticated_table_access', 'anon_column_access', 'authenticated_column_access'])
    print('PASS: live PostgreSQL confirms no public table or column privileges on invitations')

    config = (ROOT / 'supabase-config.js').read_text()
    base = re.search(r'url:\s*"([^"]+)"', config)[1]
    key = re.search(r'anonKey:\s*"([^"]+)"', config)[1]
    for table in ['game_challenges', 'game_runs', 'campaigns']:
        try:
            status, rows = get(base + '/rest/v1/' + table + '?select=id&limit=1', {'apikey': key})
        except subprocess.CalledProcessError as error:
            if error.returncode != 6:
                raise RuntimeError('Supabase REST verification failed') from None
            print('::warning::Legacy Supabase REST hostname does not resolve; external REST check unavailable. Live database RLS and privilege checks above passed.')
            break
        denied = status in (401, 403) and isinstance(rows, dict) and rows.get('code') == '42501'
        if table == 'game_challenges':
            assert denied, 'Expected PostgreSQL permission denial, not an invalid API key or network error'
        else:
            assert denied or (status == 200 and rows == []), 'Raw table is publicly readable or could not be verified: ' + table
        print('PASS: anonymous read blocked for ' + table + ' (HTTP ' + str(status) + ')')


if __name__ == '__main__':
    main()
