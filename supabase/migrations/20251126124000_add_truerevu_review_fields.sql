-- Add reviewer VAI metadata and mutual verification helpers for TrueRevu

alter table public.reviews
  add column if not exists reviewer_vai_number varchar(20),
  add column if not exists reviewee_vai_number varchar(20),
  add column if not exists is_verified boolean default true,
  add column if not exists mutual_completion_verified boolean default false;

update public.reviews
set is_verified = true
where is_verified is null;

update public.reviews
set mutual_completion_verified = coalesce(mutual_completion_verified, false)
where mutual_completion_verified is null;

alter table public.reviews
  alter column is_verified set not null,
  alter column mutual_completion_verified set not null;

create index if not exists idx_reviews_reviewer_vai on public.reviews(reviewer_vai_number);
create index if not exists idx_reviews_reviewee_vai on public.reviews(reviewee_vai_number);
create index if not exists idx_reviews_is_verified on public.reviews(is_verified);
create index if not exists idx_reviews_mutual_completion on public.reviews(mutual_completion_verified);

create or replace function public.can_submit_review(
  p_encounter_id uuid,
  p_reviewer_id uuid
) returns boolean
language plpgsql
security definer
as $$
declare
  v_encounter record;
  v_reviewer_is_provider boolean;
  v_other_party_completed boolean;
begin
  select * into v_encounter
  from public.encounters
  where id = p_encounter_id;

  if not found then
    return false;
  end if;

  v_reviewer_is_provider := (v_encounter.provider_id = p_reviewer_id);

  if v_reviewer_is_provider then
    select exists(
      select 1 from public.reviews
      where encounter_id = p_encounter_id
        and reviewer_id = v_encounter.client_id
        and submitted = true
    ) into v_other_party_completed;
  else
    select exists(
      select 1 from public.reviews
      where encounter_id = p_encounter_id
        and reviewer_id = v_encounter.provider_id
        and submitted = true
    ) into v_other_party_completed;
  end if;

  return v_encounter.status = 'completed' or v_other_party_completed;
end;
$$;

comment on column public.reviews.reviewer_vai_number is 'VAI number of the reviewer at time of submission';
comment on column public.reviews.reviewee_vai_number is 'VAI number of the user being reviewed';
comment on column public.reviews.is_verified is 'True when review stems from VAI-CHECK encounter';
comment on column public.reviews.mutual_completion_verified is 'True once both sides submit post-encounter reviews';


