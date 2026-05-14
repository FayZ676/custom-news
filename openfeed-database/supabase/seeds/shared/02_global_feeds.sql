INSERT INTO global_feeds (title, url, description, category_name)
SELECT title, url, description, 'Technology'
FROM (VALUES

    -- =============================================
    -- General Technology
    -- =============================================
    ('TechCrunch', 'https://techcrunch.com/feed', 'Startup news, technology trends, product launches, and venture capital coverage.'),
    ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'In-depth reporting on technology, science, policy, and gaming.'),
    ('Wired', 'https://www.wired.com/feed/rss', 'In-depth reporting on technology, science, security, and innovation.'),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'Technology news, product reviews, and culture coverage.'),
    ('Hacker News', 'https://news.ycombinator.com/rss', 'Community-curated technology, startup, and programming news.'),
    ('MIT Technology Review', 'https://www.technologyreview.com/feed', 'Authoritative coverage of emerging technologies and their impact on society.'),
    ('The Register', 'https://www.theregister.com/headlines.atom', 'Irreverent but well-sourced enterprise tech and open-source news.'),
    ('IEEE Spectrum', 'https://spectrum.ieee.org/feeds/feed.rss', 'Authoritative technology and engineering news from the IEEE.'),
    ('Stratechery', 'https://stratechery.com/feed/', 'Analysis of technology and media strategy and their impact on society.'),
    ('The New York Times – Technology', 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', 'Technology news and analysis from The New York Times.'),
    ('Bloomberg Technology', 'https://feeds.bloomberg.com/technology/news.rss', 'Technology business news, market analysis, and industry coverage from Bloomberg.'),

    -- =============================================
    -- AI / Machine Learning
    -- =============================================
    ('OpenAI Blog', 'https://openai.com/news/rss.xml', 'Research updates, product announcements, and insights from OpenAI.'),
    ('Google DeepMind Blog', 'https://deepmind.google/blog/rss.xml', 'Research and updates from Google DeepMind.'),
    ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'Open-source ML models, datasets, and community research.'),
    ('Last Week in AI', 'https://lastweekin.ai/feed', 'Curated weekly digest of the most important AI news and papers.'),
    ('Microsoft Research Blog', 'https://www.microsoft.com/en-us/research/feed/', 'Research updates, papers, and breakthroughs from Microsoft Research across AI, systems, and more.'),
    ('MIT News – Machine Learning', 'https://news.mit.edu/topic/mitmachine-learning-rss.xml', 'MIT research news focused specifically on machine learning and AI breakthroughs.'),

    -- =============================================
    -- AI Research Digests & Accessible ML Coverage
    -- =============================================
    ('MarkTechPost', 'https://www.marktechpost.com/feed', 'Byte-sized summaries of machine learning, deep learning, and AI research papers and trends.'),
    ('Ahead of AI', 'https://magazine.sebastianraschka.com/feed', 'In-depth ML research breakdowns and commentary by Sebastian Raschka.'),
    ('Towards Data Science', 'https://towardsdatascience.com/feed', 'Practical data science, machine learning, and AI tutorials and articles from practitioners.'),

    -- =============================================
    -- Security
    -- =============================================
    ('Krebs on Security', 'https://krebsonsecurity.com/feed/', 'In-depth cybersecurity news and investigative reporting.'),
    ('Schneier on Security', 'https://www.schneier.com/feed/atom', 'Security news, analysis, and commentary from Bruce Schneier.'),

    -- =============================================
    -- Engineering Blogs (Big Tech & Infrastructure)
    -- =============================================
    ('GitHub Engineering Blog', 'https://github.blog/engineering/feed/', 'Engineering insights and technical deep dives from the GitHub team.'),
    ('Netflix Tech Blog', 'http://techblog.netflix.com/feeds/posts/default', 'Engineering challenges and solutions at Netflix scale.'),
    ('Cloudflare Blog', 'https://blog.cloudflare.com/rss/', 'Network infrastructure, security, and performance engineering insights.'),
    ('AWS Architecture Blog', 'https://aws.amazon.com/blogs/architecture/feed/', 'Cloud architecture patterns and best practices from AWS.'),
    ('Spotify Engineering', 'https://engineering.atspotify.com/feed/', 'Backend systems, ML infrastructure, and engineering culture at Spotify.'),
    ('Meta Engineering Blog', 'https://engineering.fb.com/feed/', 'Infrastructure, AI, and open-source engineering from Meta.'),
    ('Stripe Engineering Blog', 'https://stripe.com/blog/feed.rss', 'Payments infrastructure, API design, and distributed systems from Stripe.'),

    -- =============================================
    -- Developer / Programming
    -- =============================================
    ('The Pragmatic Engineer', 'https://blog.pragmaticengineer.com/rss/', 'Deep dives on software engineering, engineering culture, and the tech industry.'),
    ('Stack Overflow Blog', 'https://stackoverflow.blog/feed/', 'Developer surveys, industry insights, and engineering posts from Stack Overflow.'),

    -- =============================================
    -- Science & Emerging Tech
    -- =============================================
    ('Quanta Magazine', 'https://api.quantamagazine.org/feed/', 'Rigorous coverage of mathematics, physics, and computer science breakthroughs.'),
    ('New Scientist (Tech)', 'https://www.newscientist.com/subject/technology/feed/', 'Technology and science news aimed at a curious general audience.'),

    -- =============================================
    -- Business of Tech / VC / Startups
    -- =============================================
    ('Benedict Evans', 'https://www.ben-evans.com/benedictevans/rss.xml', 'Strategic analysis of tech industry trends and market shifts.'),
    ('VentureBeat', 'https://venturebeat.com/feed/', 'Enterprise AI, machine learning, and emerging technology news for business and technical leaders.'),

    -- =============================================
    -- Consumer Tech
    -- =============================================
    ('Daring Fireball', 'https://daringfireball.net/feeds/main', 'Apple-focused technology commentary and analysis by John Gruber.'),
    ('Tom''s Hardware', 'https://www.tomshardware.com/feeds/all', 'PC hardware reviews, benchmarks, and component news.'),

    -- =============================================
    -- Independent / Investigative Tech Journalism
    -- =============================================
    ('404 Media', 'https://www.404media.co/rss', 'Independent tech journalism covering AI, surveillance, online culture, and the internet''s impact on society.'),
    ('Rest of World', 'https://restofworld.org/feed/latest', 'Reporting on how technology is shaping economies and societies outside of Silicon Valley.')


) AS feeds(title, url, description)
ON CONFLICT (url) DO NOTHING;


INSERT INTO global_feeds (title, url, description, category_name)
SELECT title, url, description, 'Finance'
FROM (VALUES

    -- =============================================
    -- General Finance / News Wires
    -- =============================================
    ('Reuters – Business & Finance', 'https://ir.thomsonreuters.com/rss/news-releases.xml?items=15', 'Business and financial news releases from Thomson Reuters.')

) AS feeds(title, url, description)
ON CONFLICT (url) DO NOTHING;