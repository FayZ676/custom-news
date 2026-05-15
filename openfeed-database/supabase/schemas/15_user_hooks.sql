-- Runs after user_settings (11) and user_categories (13) are both created.
create or replace function create_user_settings()
returns trigger as $$
begin
    insert into public.user_settings (user_id)
    values (new.id);

    insert into public.user_categories (user_id, category_name, position)
    values (new.id, 'Technology', 1);

    insert into public.user_sub_categories (user_id, sub_category_name)
    select new.id, gsc.name
    from public.global_sub_categories gsc
    where gsc.category_name = 'Technology'
    on conflict do nothing;

    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function create_user_settings();
