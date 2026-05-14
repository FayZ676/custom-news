-- Seed data for global_sub_categories table

INSERT INTO global_sub_categories (name, category_name) VALUES
    -- Technology
    ('Artificial Intelligence', 'Technology'),
    ('Cybersecurity', 'Technology'),
    ('Software Engineering', 'Technology'),
    ('Startups & Venture Capital', 'Technology'),
    ('Semiconductors & Hardware', 'Technology'),
    ('Cloud & Infrastructure', 'Technology'),
    ('Developer Tools & Open Source', 'Technology'),
    ('Tech Policy & Regulation', 'Technology'),
    ('Consumer Electronics', 'Technology'),
    ('Social Media & Platforms', 'Technology'),

    -- Finance
    ('Stock Markets', 'Finance'),
    ('Personal Finance', 'Finance'),
    ('Macroeconomics', 'Finance'),
    ('Cryptocurrency & Web3', 'Finance'),
    ('Banking & Financial Institutions', 'Finance'),
    ('Venture Capital & Private Equity', 'Finance'),
    ('Mergers & Acquisitions', 'Finance'),
    ('Federal Reserve & Monetary Policy', 'Finance'),
    ('Earnings & Corporate Finance', 'Finance'),
    ('Real Estate & REITs', 'Finance')
ON CONFLICT (name) DO NOTHING;
