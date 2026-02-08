import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extended news sources including international outlets
const NEWS_SOURCES = [
  // Vietnamese sources
  {
    name: "VnExpress",
    url: "https://vnexpress.net/rss/tin-moi-nhat.rss",
    category: "news",
    language: "vi"
  },
  {
    name: "Tuổi Trẻ",
    url: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    category: "news",
    language: "vi"
  },
  {
    name: "Dân Trí",
    url: "https://dantri.com.vn/rss/home.rss",
    category: "news",
    language: "vi"
  },
  {
    name: "Thanh Niên",
    url: "https://thanhnien.vn/rss/home.rss",
    category: "news",
    language: "vi"
  },
  {
    name: "VietnamNet",
    url: "https://vietnamnet.vn/rss/tin-moi-nhat.rss",
    category: "news",
    language: "vi"
  },
  // International sources
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "news",
    language: "en"
  },
  {
    name: "Reuters",
    url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best",
    category: "news",
    language: "en"
  },
  {
    name: "CNN",
    url: "http://rss.cnn.com/rss/edition_world.rss",
    category: "news",
    language: "en"
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    category: "news",
    language: "en"
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "news",
    language: "en"
  },
  // Tech news
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "blog",
    language: "en"
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    category: "blog",
    language: "en"
  },
  // Business/Finance
  {
    name: "Bloomberg",
    url: "https://feeds.bloomberg.com/markets/news.rss",
    category: "news",
    language: "en"
  },
  {
    name: "CafeF",
    url: "https://cafef.vn/rss/home.rss",
    category: "news",
    language: "vi"
  }
];

interface NewsItem {
  source: string;
  source_url: string;
  title: string;
  description: string;
  content: string;
  image_url: string | null;
  published_at: string;
  category: string;
  language: string;
}

function extractImageUrl(item: string): string | null {
  // Try multiple patterns to extract image URLs
  const patterns = [
    /<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"/i,
    /<media:content[^>]*url="([^"]*)"[^>]*/i,
    /<media:thumbnail[^>]*url="([^"]*)"[^>]*/i,
    /<img[^>]*src="([^"]*)"[^>]*/i,
    /src="(https?:\/\/[^"]*\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i,
    /<image>[^<]*<url>([^<]*)<\/url>/i,
    /\[CDATA\[.*?<img[^>]*src="([^"]*)".*?\]\]/is,
    /url="(https?:\/\/[^"]*\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i,
  ];

  for (const pattern of patterns) {
    const match = item.match(pattern);
    if (match && match[1]) {
      const url = match[1].trim();
      // Validate URL
      if (url.startsWith('http') && !url.includes('undefined')) {
        return url;
      }
    }
  }

  return null;
}

function parseRSSItem(item: string, source: string, category: string, language: string): NewsItem | null {
  try {
    // Extract title - handle both CDATA and plain text
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s);
    const linkMatch = item.match(/<link>(.*?)<\/link>|<link[^>]*href="([^"]*)"[^>]*\/?>|<guid[^>]*>(https?:\/\/[^<]*)<\/guid>/);
    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);
    const contentMatch = item.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>|<content>(.*?)<\/content>/s);
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>|<published>(.*?)<\/published>|<dc:date>(.*?)<\/dc:date>/);

    const title = titleMatch ? (titleMatch[1] || titleMatch[2])?.trim() : null;
    let link = linkMatch ? (linkMatch[1] || linkMatch[2] || linkMatch[3])?.trim() : null;
    
    // Clean up link
    if (link) {
      link = link.replace(/\s+/g, '');
    }

    if (!title || !link) return null;

    // Extract and clean description
    let description = descMatch ? (descMatch[1] || descMatch[2])?.replace(/<[^>]*>/g, "").trim() : "";
    
    // Extract full content if available
    let content = contentMatch ? (contentMatch[1] || contentMatch[2])?.replace(/<[^>]*>/g, "").trim() : description;
    
    // Try to extract image from various sources
    let imageUrl = extractImageUrl(item);
    
    // If no image found in item, try to extract from description/content HTML
    if (!imageUrl && descMatch) {
      const descHtml = descMatch[1] || descMatch[2] || "";
      imageUrl = extractImageUrl(descHtml);
    }
    
    if (!imageUrl && contentMatch) {
      const contentHtml = contentMatch[1] || contentMatch[2] || "";
      imageUrl = extractImageUrl(contentHtml);
    }

    // Parse date
    let publishedAt: string;
    try {
      const dateStr = pubDateMatch ? (pubDateMatch[1] || pubDateMatch[2] || pubDateMatch[3]) : null;
      publishedAt = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    } catch {
      publishedAt = new Date().toISOString();
    }

    return {
      source,
      source_url: link,
      title: title.substring(0, 500),
      description: description.substring(0, 1000),
      content: content.substring(0, 5000),
      image_url: imageUrl,
      published_at: publishedAt,
      category,
      language
    };
  } catch (error) {
    console.error(`Error parsing item from ${source}:`, error);
    return null;
  }
}

async function fetchRSSFeed(source: typeof NEWS_SOURCES[0]): Promise<NewsItem[]> {
  try {
    console.log(`Fetching from ${source.name}...`);
    
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml, */*"
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${source.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    
    // Match both <item> (RSS) and <entry> (Atom) elements
    const items = xml.match(/<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/g) || [];

    const parsedItems = items
      .slice(0, 10) // Get 10 items per source
      .map(item => parseRSSItem(item, source.name, source.category, source.language))
      .filter((item): item is NewsItem => item !== null);
    
    console.log(`Fetched ${parsedItems.length} items from ${source.name}`);
    return parsedItems;
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch news from all sources in parallel
    const allNewsPromises = NEWS_SOURCES.map(fetchRSSFeed);
    const allNewsArrays = await Promise.all(allNewsPromises);
    const allNews = allNewsArrays.flat();

    console.log(`Total articles fetched: ${allNews.length}`);

    if (allNews.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No news fetched" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check for duplicates by source_url
    const existingUrls = new Set<string>();
    const { data: existing } = await supabase
      .from("news_articles")
      .select("source_url")
      .in("source_url", allNews.map(n => n.source_url));

    if (existing) {
      existing.forEach(e => existingUrls.add(e.source_url));
    }

    // Filter out duplicates
    const newArticles = allNews.filter(n => !existingUrls.has(n.source_url));

    console.log(`New articles to insert: ${newArticles.length}`);

    if (newArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No new articles", inserted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new articles
    const { data, error } = await supabase
      .from("news_articles")
      .insert(newArticles)
      .select();

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Inserted ${data?.length || 0} new articles`,
        inserted: data?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
