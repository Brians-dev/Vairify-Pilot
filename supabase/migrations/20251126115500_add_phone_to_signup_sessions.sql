-- Track phone numbers captured during registration
alter table public.signup_sessions
  add column if not exists phone text;


