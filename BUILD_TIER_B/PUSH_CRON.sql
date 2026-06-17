-- COMPOUND — Phase 6 scheduler.
-- Runs the push sender once a minute. Paste into Supabase → SQL Editor → Run.
-- DO THIS AFTER you've added the Vercel env vars and the new deploy is live,
-- otherwise the minute pings will just 401/500 until then (harmless).

-- 1) Enable the scheduler + outbound-HTTP extensions (safe if already on).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) (Re)create the every-minute job. Unschedule first so re-running is clean.
select cron.unschedule('compound-push') where exists (select 1 from cron.job where jobname = 'compound-push');

select cron.schedule(
  'compound-push',
  '* * * * *',                         -- every minute
  $$
  select net.http_post(
    url     := 'https://compound-mocha-delta.vercel.app/api/push-cron',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', '0752cdc7d6825b9fff260afdfce0280b4e9ae3cabe81b613'
               ),
    body    := '{}'::jsonb
  );
  $$
);

-- To check it's scheduled:   select * from cron.job;
-- To stop it later:          select cron.unschedule('compound-push');
