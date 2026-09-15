-- Run as the table owner in Supabase SQL Editor. No game records are changed.
DO $security$
    DECLARE columns_sql text;
    BEGIN
    CREATE TABLE IF NOT EXISTS public.game_challenges(
      id varchar(6) PRIMARY KEY,
      inviter_player_id uuid NOT NULL,
      inviter_name text NOT NULL,
      inviter_duration_seconds integer NOT NULL CHECK(inviter_duration_seconds>0),
      language text NOT NULL DEFAULT 'ru' CHECK(language IN('ru','en')),
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT(now()+interval '30 days')
    );
    CREATE INDEX IF NOT EXISTS game_challenges_expires_idx ON public.game_challenges(expires_at);
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.game_challenges'::regclass) THEN
      ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;
    END IF;
    IF has_table_privilege('anon', 'public.game_challenges', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       OR has_table_privilege('authenticated', 'public.game_challenges', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       OR has_any_column_privilege('anon', 'public.game_challenges', 'SELECT,INSERT,UPDATE,REFERENCES')
       OR has_any_column_privilege('authenticated', 'public.game_challenges', 'SELECT,INSERT,UPDATE,REFERENCES') THEN
      REVOKE ALL PRIVILEGES ON TABLE public.game_challenges FROM PUBLIC, anon, authenticated;
      SELECT string_agg(quote_ident(attname), ', ') INTO columns_sql
        FROM pg_attribute WHERE attrelid='public.game_challenges'::regclass AND attnum>0 AND NOT attisdropped;
      EXECUTE 'REVOKE SELECT (' || columns_sql || '), INSERT (' || columns_sql || '), UPDATE (' || columns_sql || '), REFERENCES (' || columns_sql || ') ON public.game_challenges FROM PUBLIC, anon, authenticated';
    END IF;
    END $security$;
