UPDATE public.news_articles
SET source_url = btrim(replace(replace(source_url, '<![CDATA[', ''), ']]>', ''))
WHERE source_url LIKE '%CDATA%' OR source_url LIKE '%]]>%';