INSERT INTO sources (key, label, feed_url)
VALUES ('towards-data-science', 'Towards Data Science', 'https://towardsdatascience.com/feed')
ON CONFLICT (key) DO NOTHING;
