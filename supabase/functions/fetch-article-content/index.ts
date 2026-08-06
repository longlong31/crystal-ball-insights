import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&mdash;|&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

/** Strip scripts/styles/nav/aside/footer/forms and comment blocks. */
function stripChrome(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|svg|iframe|form|nav|aside|footer|header)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|link|meta)[^>]*\/?>/gi, "");
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
      "i",
    );
    const m = html.match(re) || html.match(alt);
    if (m?.[1]) return decodeEntities(m[1].trim());
  }
  return null;
}

/** Pick the densest article-like container, then flatten to paragraphs. */
function extractParagraphs(html: string): string[] {
  const cleaned = stripChrome(html);

  const containerRes = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]+(?:class|id)=["'][^"']*(?:detail-content|article-content|article__body|entry-content|post-content|contentdetail|fck_detail|singular-content|__MB_CONTENT|maincontent|content-detail|news-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    /<body[^>]*>([\s\S]*?)<\/body>/gi,
  ];

  let best = "";
  for (const re of containerRes) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(cleaned))) {
      const candidate = m[1] || "";
      const textLen = candidate.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length;
      const bestLen = best.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length;
      if (textLen > bestLen) best = candidate;
    }
    if (best.replace(/<[^>]*>/g, "").trim().length > 800) break;
  }
  if (!best) best = cleaned;

  const blocks = best.match(/<(p|h2|h3|li|blockquote)[^>]*>[\s\S]*?<\/\1>/gi) || [];
  const seen = new Set<string>();
  const paragraphs: string[] = [];

  for (const block of blocks) {
    const tag = (block.match(/^<(\w+)/) || [])[1]?.toLowerCase() ?? "p";
    let text = decodeEntities(block.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, " "))
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();
    if (!text || text.length < 25) continue;
    if (/^(chia sẻ|tags?|xem thêm|đọc thêm|advertisement|share this|related)/i.test(text)) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    if (tag === "h2" || tag === "h3") text = `## ${text}`;
    else if (tag === "li") text = `- ${text}`;
    else if (tag === "blockquote") text = `> ${text}`;
    paragraphs.push(text);
  }

  if (paragraphs.length === 0) {
    const plain = decodeEntities(best.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    if (plain.length > 200) return plain.split(/(?<=\.)\s+(?=[A-ZÀ-Ỹ])/).filter((p) => p.length > 40);
  }
  return paragraphs;
}

function extractImages(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 8) {
    let url = m[1].trim();
    if (url.startsWith("//")) url = "https:" + url;
    if (url.startsWith("/")) {
      try {
        url = new URL(url, base).toString();
      } catch { /* ignore */ }
    }
    if (!/^https?:\/\//.test(url)) continue;
    if (/\.svg(\?|$)/i.test(url)) continue;
    if (/(logo|icon|sprite|pixel|1x1|blank|placeholder)/i.test(url)) continue;
    if (!out.includes(url)) out.push(url);
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const articleId: string | undefined = body.articleId;
    let url: string | undefined = body.url;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let existing: { content: string | null; source_url: string | null } | null = null;
    if (articleId) {
      const { data } = await supabase
        .from("news_articles")
        .select("content, source_url")
        .eq("id", articleId)
        .maybeSingle();
      existing = data as typeof existing;
      url = url || existing?.source_url || undefined;
    }

    if (!url || !/^https?:\/\//.test(url)) {
      return new Response(JSON.stringify({ success: false, error: "Missing or invalid url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let html = "";
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      html = await res.text();
    } catch (e) {
      clearTimeout(timer);
      // Graceful degradation — keep whatever content we already stored.
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: e instanceof Error ? e.message : "fetch failed",
          content: existing?.content ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    clearTimeout(timer);

    const paragraphs = extractParagraphs(html);
    const content = paragraphs.join("\n\n");
    const images = extractImages(stripChrome(html), url);
    const author = metaContent(html, ["author", "article:author", "og:article:author"]);
    const heroImage = metaContent(html, ["og:image", "twitter:image"]);
    const siteName = metaContent(html, ["og:site_name"]);

    // Cache only when materially richer than what we already have.
    if (articleId && content.length > (existing?.content?.length ?? 0) + 200) {
      await supabase.from("news_articles").update({ content }).eq("id", articleId);
    }

    return new Response(
      JSON.stringify({
        success: content.length > 200,
        content: content.length > 200 ? content : existing?.content ?? content,
        paragraphs: paragraphs.length,
        words: content.split(/\s+/).filter(Boolean).length,
        images: heroImage ? [heroImage, ...images.filter((i) => i !== heroImage)] : images,
        author,
        siteName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
