-- Update referral commission defaults to 10%
alter table public.referral_codes
  alter column commission_rate set default 0.10;

update public.referral_codes
set commission_rate = 0.10
where commission_rate = 0.05;


