-- Seed data for global_categories table

INSERT INTO global_categories (name, interest_suggestions) VALUES
    ('Technology', '["artificial intelligence", "machine learning", "cybersecurity", "open source software", "cloud computing", "software engineering", "startups and venture capital", "developer tools", "semiconductor industry", "tech policy and regulation"]')
ON CONFLICT (name) DO UPDATE SET
    interest_suggestions = EXCLUDED.interest_suggestions;