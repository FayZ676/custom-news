-- Seed data for catalog_categories table

INSERT INTO catalog_categories (name) VALUES
    ('Technology')
ON CONFLICT (name) DO NOTHING;