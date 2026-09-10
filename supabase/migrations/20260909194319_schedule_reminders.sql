-- pg_cron is included in Supabase Postgres. Embedded SQL tests omit this extension.
create extension if not exists pg_cron;
select cron.schedule('friend-debt-reminders','*/15 * * * *','select private.send_reminders();');
