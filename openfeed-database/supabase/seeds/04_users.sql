CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
    user_data RECORD;
BEGIN
    FOR user_data IN
        SELECT *
        FROM (
            VALUES
                ('faizififita@gmail.com', 'abc123'),
                ('aminfifita1@gmail.com', 'abc123'),
                ('khadem.badiyan@gmail.com', 'abc123'),
                ('ppendergrass9@gmail.com', 'abc123'),
                ('darius.miaji@gmail.com', 'abc123')
        ) AS t(email, password)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_data.email) THEN
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
                aud
            )
            VALUES (
                gen_random_uuid(),
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
                'authenticated'
            );
        END IF;
    END LOOP;
END $$;