CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
    user_data RECORD;
    new_user_id UUID;
BEGIN
    FOR user_data IN
        SELECT *
        FROM (
            VALUES
                ('00000000-0000-0000-0000-000000000001'::uuid, 'faizififita1@gmail.com',    'abc123'),
                ('00000000-0000-0000-0000-000000000002'::uuid, 'aminfifita1@gmail.com',     'abc123'),
                ('00000000-0000-0000-0000-000000000003'::uuid, 'khadem.badiyan@gmail.com',  'abc123'),
                ('00000000-0000-0000-0000-000000000004'::uuid, 'ppendergrass9@gmail.com',   'abc123'),
                ('00000000-0000-0000-0000-000000000005'::uuid, 'darius.miaji@gmail.com',    'abc123'),
                ('00000000-0000-0000-0000-000000000006'::uuid, 'mitra@mmengan.com',         'abc123'),
                ('00000000-0000-0000-0000-000000000007'::uuid, 'alexlhanson@gmail.com',     'abc123')
        ) AS t(id, email, password)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_data.email) THEN
            new_user_id := user_data.id;

        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change_token_current,
            reauthentication_token,
            phone_change_token,
            email_change,
            phone_change
        )
        VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            user_data.email,
            extensions.crypt(user_data.password, extensions.gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            'authenticated',
            'authenticated',
            '', '', '', '', '', '',
            '', ''
        );

            INSERT INTO auth.identities (
                id,
                user_id,
                provider_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                new_user_id,
                user_data.email,
                jsonb_build_object('sub', new_user_id::text, 'email', user_data.email),
                'email',
                now(),
                now(),
                now()
            );
        END IF;
    END LOOP;
END $$;