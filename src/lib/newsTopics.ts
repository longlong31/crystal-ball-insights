/**
 * Shared news topic classification.
 * Combines the authoritative server-side source tag (e.g. "CafeF · Chứng khoán")
 * with a weighted keyword score over title/description/content so articles land
 * in the right category even when the feed itself is generic.
 */

export type NewsTopic = "stocks" | "crypto" | "banking" | "realestate" | "tech" | "events" | "general";

export const TOPIC_META: Record<NewsTopic, { label: string; labelEn: string; tag: string; className: string }> = {
  stocks: { label: "Cổ phiếu", labelEn: "Stocks", tag: "· Chứng khoán", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  crypto: { label: "Crypto", labelEn: "Crypto", tag: "· Crypto", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  banking: { label: "Ngân hàng", labelEn: "Banking", tag: "· Ngân hàng", className: "bg-sky-500/10 text-sky-500 border-sky-500/30" },
  realestate: { label: "Bất động sản", labelEn: "Real Estate", tag: "· BĐS", className: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
  tech: { label: "Công nghệ", labelEn: "Technology", tag: "· Công nghệ", className: "bg-violet-500/10 text-violet-500 border-violet-500/30" },
  events: { label: "Sự kiện", labelEn: "Events", tag: "· Sự kiện", className: "bg-pink-500/10 text-pink-500 border-pink-500/30" },
  general: { label: "Tổng hợp", labelEn: "General", tag: "", className: "bg-muted text-muted-foreground border-border" },
};

/** Weighted keywords — higher weight = stronger signal. */
const KEYWORDS: Record<Exclude<NewsTopic, "general">, Array<[string, number]>> = {
  stocks: [
    ["vn-index", 4], ["vnindex", 4], ["chứng khoán", 3], ["cổ phiếu", 3], ["hose", 3], ["hnx", 3], ["upcom", 3],
    ["cổ tức", 2], ["ipo", 2], ["thị giá", 2], ["khối ngoại", 3], ["tự doanh", 2], ["earnings", 2],
    ["s&p 500", 3], ["nasdaq", 3], ["dow jones", 3], ["stock market", 3], ["shares", 1], ["equity", 2], ["ftse", 2],
  ],
  crypto: [
    ["bitcoin", 4], ["btc", 3], ["ethereum", 4], ["eth", 2], ["crypto", 4], ["blockchain", 3], ["altcoin", 3],
    ["tiền số", 3], ["tiền mã hóa", 3], ["tiền điện tử", 3], ["defi", 3], ["nft", 3], ["binance", 3],
    ["solana", 3], ["stablecoin", 3], ["airdrop", 2], ["on-chain", 2], ["etf bitcoin", 4],
  ],
  banking: [
    ["ngân hàng", 3], ["sbv", 3], ["ngân hàng nhà nước", 4], ["tín dụng", 3], ["lãi suất", 3], ["nợ xấu", 3],
    ["tỷ giá", 3], ["fed", 3], ["central bank", 3], ["interest rate", 3], ["vietcombank", 3], ["bidv", 3],
    ["vietinbank", 3], ["techcombank", 3], ["vpbank", 3], ["sacombank", 3], ["acb", 2], ["room tín dụng", 4],
  ],
  realestate: [
    ["bất động sản", 4], ["bđs", 4], ["nhà đất", 3], ["chung cư", 3], ["căn hộ", 3], ["đất nền", 3],
    ["real estate", 4], ["property market", 3], ["vinhomes", 3], ["novaland", 3], ["nhà ở xã hội", 4],
    ["giá thuê", 2], ["khu công nghiệp", 2], ["dự án nhà", 2],
  ],
  tech: [
    ["công nghệ", 3], ["artificial intelligence", 4], ["trí tuệ nhân tạo", 4], ["fintech", 3], ["startup", 3],
    ["khởi nghiệp", 3], ["chuyển đổi số", 3], ["phần mềm", 2], ["chatgpt", 4], ["openai", 4], ["nvidia", 3],
    ["semiconductor", 3], ["chất bán dẫn", 3], ["cloud", 2], ["data center", 3], ["smartphone", 2], ["robot", 2],
  ],
  events: [
    ["hội thảo", 4], ["hội nghị", 4], ["diễn đàn", 3], ["triển lãm", 3], ["workshop", 3], ["webinar", 4],
    ["conference", 3], ["summit", 3], ["sự kiện", 2], ["toạ đàm", 3], ["tọa đàm", 3],
  ],
};

export interface ClassifiableArticle {
  source?: string | null;
  title?: string | null;
  description?: string | null;
  content?: string | null;
}

export function scoreTopic(article: ClassifiableArticle, topic: Exclude<NewsTopic, "general">): number {
  const tag = TOPIC_META[topic].tag;
  let score = 0;
  if (tag && article.source?.includes(tag)) score += 10;

  const title = (article.title ?? "").toLowerCase();
  const body = `${article.description ?? ""} ${(article.content ?? "").slice(0, 2500)}`.toLowerCase();

  for (const [kw, weight] of KEYWORDS[topic]) {
    if (title.includes(kw)) score += weight * 2;
    else if (body.includes(kw)) score += weight;
  }
  return score;
}

/** Returns true when an article belongs to the requested topic. */
export function matchesTopic(article: ClassifiableArticle, topic: Exclude<NewsTopic, "general">): boolean {
  return scoreTopic(article, topic) >= 4;
}

/** Best-fit topic for an article (used for badges on cards / detail page). */
export function classifyTopic(article: ClassifiableArticle): NewsTopic {
  let best: NewsTopic = "general";
  let bestScore = 4;
  (Object.keys(KEYWORDS) as Array<Exclude<NewsTopic, "general">>).forEach((topic) => {
    const s = scoreTopic(article, topic);
    if (s > bestScore) {
      bestScore = s;
      best = topic;
    }
  });
  return best;
}
