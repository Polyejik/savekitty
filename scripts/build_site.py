"""Build the same readable entrypoint used locally; fingerprint active assets."""
from pathlib import Path
import base64
import hashlib
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
SCRIPTS = ['game-ui-v5.js', 'onboarding-v5.js', 'onboarding-skip-v1.js',
           'hint-ui-v1.js', 'locks-ui-v1.js', 'leaderboard-restore-v2.js',
           'finish-ui-v1.js', 'finish-extra-v1.js', 'finish-media-fix-v1.js',
           'share-ui-v6.js', 'name-memory-v2.js', 'supabase-config.js', 'supabase-sync-v2.js']

def build():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir()
    for name in SCRIPTS + ['progress.csv', 'Kotik.mp4', 'CNAME', 'pushok_hq.jpg', 'family-end.png']:
        shutil.copy2(ROOT / name, OUT / name)
    (OUT / 'dashboard').mkdir()
    for name in ['app.js', 'dashboard.css', 'partners.js', 'local-results.js']:
        shutil.copy2(ROOT / 'dashboard' / name, OUT / 'dashboard' / name)
    for page in ['index.html', 'partners.html']:
        dash_html = (ROOT / 'dashboard' / page).read_text()
        for asset in ['app.js', 'dashboard.css', 'partners.js', 'local-results.js', '../supabase-config.js', '../supabase-sync-v2.js']:
            version = hashlib.sha256((OUT / 'dashboard' / asset).read_bytes()).hexdigest()[:12]
            dash_html = dash_html.replace(f'="{asset}"', f'="{asset}?v={version}"')
        (OUT / 'dashboard' / page).write_text(dash_html)
    png = (OUT / 'family-end.png').read_bytes()
    assert png[:8] == b'\x89PNG\r\n\x1a\n' and len(png) > 1000, 'Invalid family PNG'
    for name, encoded in [('family-end.jpg', 'family-end.b64'), ('invite-card-v2.jpg', 'invite-card-v2.b64')]:
        direct = ROOT / name
        (OUT / name).write_bytes(direct.read_bytes() if direct.exists() else base64.b64decode((ROOT / encoded).read_text()))
    for name in ['family-end.jpg', 'invite-card-v2.jpg', 'pushok_hq.jpg']:
        data = (OUT / name).read_bytes()
        assert len(data) > 1000 and data[:2] == b'\xff\xd8', f'Invalid JPEG: {name}'
    html = (ROOT / 'index.html').read_text()
    assert 'document.write' not in html and 'dropbox.com' not in html
    marker = '<div class="locks" id="locks"></div>'
    replacement = '<div class="locksMeta"><div class="locks" id="locks"></div><button id="honorBtn" class="honorBtn sk-restored" type="button" title="Доска почёта / Hall of Fame" aria-label="Доска почёта">🏆</button></div>'
    if marker in html:
        html = html.replace(marker, replacement, 1)
    assert html.count('id="honorBtn"') == 1, 'Leaderboard button missing or duplicated'
    for name in SCRIPTS:
        version = hashlib.sha256((OUT / name).read_bytes()).hexdigest()[:12]
        html = html.replace(f'src="{name}"', f'src="{name}?v={version}"')
    (OUT / 'index.html').write_text(html)
    print(f'Built {OUT}: {len(SCRIPTS)} scripts, one entrypoint')

if __name__ == '__main__': build()
