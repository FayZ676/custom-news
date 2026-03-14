-- Seed data for catalog_feeds table
-- Note: This assumes catalog_categories has already been seeded

INSERT INTO catalog_feeds (title, url, description, category_id)
SELECT title, url, description, (SELECT id FROM catalog_categories WHERE name = 'Technology')
FROM (VALUES
    ('TechCrunch', 'https://techcrunch.com/feed', 'Startup news, technology trends, product launches, and venture capital coverage.'),
    ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'In-depth reporting on technology, science, policy, and gaming.'),
    ('Wired', 'https://www.wired.com/feed/rss', 'In-depth reporting on technology, science, security, and innovation.'),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'Technology news, product reviews, and culture coverage.'),
    ('Hacker News', 'https://news.ycombinator.com/rss', 'Community-curated technology, startup, and programming news.'),
    ('MIT Technology Review', 'https://www.technologyreview.com/feed', 'Authoritative coverage of emerging technologies and their impact on society.'),
    ('TechRepublic', 'https://www.techrepublic.com/rssfeeds/articles/', 'IT news, analysis, and advice for technology professionals.'),
    ('Engadget', 'https://www.engadget.com/rss.xml', 'Consumer electronics, gadgets, and technology news.'),
    ('ZDNet', 'https://www.zdnet.com/news/rss.xml', 'Technology news for IT professionals and business decision-makers.'),
    ('The Pragmatic Engineer', 'https://blog.pragmaticengineer.com/rss/', 'Deep dives on software engineering, engineering culture, and the tech industry.'),
    ('GitHub Engineering Blog', 'https://github.blog/engineering/feed/', 'Engineering insights and technical deep dives from the GitHub team.'),
    ('Product Hunt', 'https://www.producthunt.com/feed', 'The best new products, apps, and tools launched every day.'),
    ('Krebs on Security', 'https://krebsonsecurity.com/feed/', 'In-depth cybersecurity news and investigative reporting.'),
    ('Schneier on Security', 'https://www.schneier.com/feed/atom', 'Security news, analysis, and commentary from Bruce Schneier.'),
    ('OpenAI Blog', 'https://openai.com/news/rss.xml', 'Research updates, product announcements, and insights from OpenAI.'),
    ('Google DeepMind Blog', 'https://deepmind.google/blog/rss.xml', 'Research and updates from Google DeepMind.'),
    ('Stratechery', 'https://stratechery.com/feed/', 'Analysis of technology and media strategy and their impact on society.'),
    ('Daring Fireball', 'https://daringfireball.net/feeds/main', 'Apple-focused technology commentary and analysis by John Gruber.')
) AS feeds(title, url, description)
ON CONFLICT (url) DO NOTHING;