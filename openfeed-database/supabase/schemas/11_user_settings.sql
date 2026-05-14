create table "user_settings" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "email_notification" boolean not null default true,
    "timezone" text not null default 'UTC',
    "color_theme" text not null default 'cupcake',
    primary key (user_id)
);

create index on "user_settings" (user_id);

alter table "user_settings" enable row level security;

create policy "Users can manage their own article scores"
  on "user_settings" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function validate_user_settings_timezone()
returns trigger as $$
begin
    if not exists (select 1 from pg_timezone_names where name = new.timezone) then
        raise exception 'Invalid timezone: %', new.timezone;
    end if;
    return new;
end;
$$ language plpgsql stable;

create trigger check_user_settings_timezone
    before insert or update of timezone on "user_settings"
    for each row execute function validate_user_settings_timezone();