# Supabase setup — Save Pushok

## 1. Create a free Supabase project
Create one project and open **SQL Editor**.

## 2. Run the schema
Copy and run `supabase/schema.sql`.

This creates:
- `campaigns`
- `game_runs`
- anti-fraud validation trigger
- sponsor-safe aggregate views
- RLS policy allowing the public game to **insert only**

## 3. Copy API settings
In Supabase project settings copy:
- Project URL
- anon/public key

Put them into `/dashboard/config.js`:

```js
window.SAVEKITTY_SUPABASE = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_ANON_KEY",
  campaignId: "save-pushok-pilot"
};
```

The sponsor dashboard automatically switches from DEMO MODE to LIVE SUPABASE.

## 4. Next integration step
The game should POST one record to `game_runs` only when all 9 locks are opened.
Do not stream every key press or intermediate answer into Supabase.

Recommended payload:

```json
{
  "completion_id": "uuid",
  "campaign_id": "save-pushok-pilot",
  "player_id": "persistent anonymous uuid",
  "player_name": "Герман",
  "language": "ru",
  "started_at": "2026-09-11T10:00:00Z",
  "completed_at": "2026-09-11T10:04:42Z",
  "duration_seconds": 282,
  "locks_opened": 9,
  "examples_solved": 9,
  "game_version": "1.5"
}
```

The database trigger marks the run `confirmed`, `too_fast`, `duplicate`, or `rejected`.

## 5. Sponsor access
For the pilot, dashboard data is aggregate/public-safe and raw `game_runs` cannot be selected by anon users.
For a real sponsor launch, enable Supabase Auth and restrict the dashboard views to `authenticated` users only.
