import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Topic-tagged RSS sources. `topic` is embedded into the `source` label
// (e.g. "CafeF · Chứng khoán") so the client-side classifier reliably groups
// articles even when the RSS content doesn't contain obvious keywords.
type Topic = "general" | "stocks" | "crypto" | "banking" | "realestate" | "tech" | "events";

const NEWS_SOURCES: {
  name: string; url: string; category: string; language: string; topic: Topic;
}[] = [
  // ------------------- General VN -------------------
  { name: "VnExpress",   url: "https://vnexpress.net/rss/tin-moi-nhat.rss",    category: "news", language: "vi", topic: "general" },
  { name: "Tuổi Trẻ",    url: "https://tuoitre.vn/rss/tin-moi-nhat.rss",       category: "news", language: "vi", topic: "general" },
  { name: "Dân Trí",     url: "https://dantri.com.vn/rss/home.rss",            category: "news", language: "vi", topic: "general" },
  { name: "Thanh Niên",  url: "https://thanhnien.vn/rss/home.rss",             category: "news", language: "vi", topic: "general" },
  { name: "VietnamNet",  url: "https://vietnamnet.vn/rss/tin-moi-nhat.rss",    category: "news", language: "vi", topic: "general" },

  // ------------------- International General -------------------
  { name: "BBC News",    url: "https://feeds.bbci.co.uk/news/world/rss.xml",           category: "news", language: "en", topic: "general" },
  { name: "CNN",         url: "http://rss.cnn.com/rss/edition_world.rss",              category: "news", language: "en", topic: "general" },
  { name: "The Guardian",url: "https://www.theguardian.com/world/rss",                 category: "news", language: "en", topic: "general" },
  { name: "Al Jazeera",  url: "https://www.aljazeera.com/xml/rss/all.xml",             category: "news", language: "en", topic: "general" },

  // ------------------- Stocks / Finance VN -------------------
  { name: "CafeF",       url: "https://cafef.vn/thi-truong-chung-khoan.rss",   category: "news", language: "vi", topic: "stocks" },
  { name: "CafeF",       url: "https://cafef.vn/doanh-nghiep.rss",             category: "news", language: "vi", topic: "stocks" },
  { name: "VnEconomy",   url: "https://vneconomy.vn/chung-khoan.rss",          category: "news", language: "vi", topic: "stocks" },
  { name: "VietStock",   url: "https://vietstock.vn/rss/chung-khoan.rss",      category: "news", language: "vi", topic: "stocks" },
  { name: "Đầu Tư",      url: "https://baodautu.vn/rss/chung-khoan.rss",       category: "news", language: "vi", topic: "stocks" },
  { name: "NDH",         url: "https://ndh.vn/rss/chung-khoan.rss",            category: "news", language: "vi", topic: "stocks" },

  // ------------------- Stocks / Finance International -------------------
  { name: "Bloomberg",   url: "https://feeds.bloomberg.com/markets/news.rss",           category: "news", language: "en", topic: "stocks" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "news", language: "en", topic: "stocks" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex",              category: "news", language: "en", topic: "stocks" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml",         category: "news", language: "en", topic: "stocks" },
  { name: "Reuters",     url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best", category: "news", language: "en", topic: "stocks" },

  // ------------------- Crypto -------------------
  { name: "CoinDesk",    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",        category: "news", language: "en", topic: "crypto" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss",                        category: "news", language: "en", topic: "crypto" },
  { name: "Decrypt",     url: "https://decrypt.co/feed",                                category: "news", language: "en", topic: "crypto" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/.rss/full/",            category: "news", language: "en", topic: "crypto" },
  { name: "Coin68",      url: "https://coin68.com/feed/",                               category: "news", language: "vi", topic: "crypto" },
  { name: "TapChiBitcoin", url: "https://tapchibitcoin.io/feed",                        category: "news", language: "vi", topic: "crypto" },

  // ------------------- Banking / Macro -------------------
  { name: "CafeF",       url: "https://cafef.vn/tai-chinh-ngan-hang.rss",      category: "news", language: "vi", topic: "banking" },
  { name: "VnEconomy",   url: "https://vneconomy.vn/tai-chinh.rss",            category: "news", language: "vi", topic: "banking" },
  { name: "Đầu Tư",      url: "https://baodautu.vn/rss/tai-chinh-ngan-hang.rss", category: "news", language: "vi", topic: "banking" },
  { name: "Reuters",     url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", category: "news", language: "en", topic: "banking" },
  { name: "Financial Times", url: "https://www.ft.com/companies/banks?format=rss",     category: "news", language: "en", topic: "banking" },

  // ------------------- Real Estate -------------------
  { name: "CafeLand",    url: "https://cafeland.vn/feed/",                     category: "news", language: "vi", topic: "realestate" },
  { name: "CafeF",       url: "https://cafef.vn/bat-dong-san.rss",             category: "news", language: "vi", topic: "realestate" },
  { name: "Đầu Tư",      url: "https://baodautu.vn/rss/bat-dong-san.rss",      category: "news", language: "vi", topic: "realestate" },
  { name: "VnEconomy",   url: "https://vneconomy.vn/bat-dong-san.rss",         category: "news", language: "vi", topic: "realestate" },

  // ------------------- Tech -------------------
  { name: "TechCrunch",  url: "https://techcrunch.com/feed/",                  category: "blog", language: "en", topic: "tech" },
  { name: "The Verge",   url: "https://www.theverge.com/rss/index.xml",        category: "blog", language: "en", topic: "tech" },
  { name: "Ars Technica",url: "https://feeds.arstechnica.com/arstechnica/index", category: "blog", language: "en", topic: "tech" },
  { name: "Wired",       url: "https://www.wired.com/feed/rss",                category: "blog", language: "en", topic: "tech" },
  { name: "GenK",        url: "https://genk.vn/rss/home.rss",                  category: "blog", language: "vi", topic: "tech" },
  { name: "ICTNews",     url: "https://ictnews.vietnamnet.vn/rss/home.rss",    category: "blog", language: "vi", topic: "tech" },
];

// Human-readable topic suffix appended to source labels — enables the client
// classifier to group articles by topic regardless of body language.
const TOPIC_SUFFIX: Record<Topic, string> = {
  general:    "",
  stocks:     " · Chứng khoán",
  crypto:     " · Crypto",
  banking:    " · Ngân hàng",
  realestate: " · BĐS",
  tech:       " · Công nghệ",
  events:     " · Sự kiện",
};

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
      link = link
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/\s+/g, '');
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

    // Compose display label with topic suffix so client can group by topic.
    const label = source.name + (TOPIC_SUFFIX[source.topic] || "");
    const parsedItems = items
      .slice(0, 12) // Get up to 12 items per source
      .map(item => parseRSSItem(item, label, source.category, source.language))
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
