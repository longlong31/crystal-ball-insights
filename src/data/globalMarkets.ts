// Global stock universe with classification metadata for the Quant Equity Intelligence module.
// Each entry: symbol, name, exchange, region (Vietnam/US/Europe/Asia), sector, cap (Large/Mid/Small).

export type Region = "Vietnam" | "US" | "Europe" | "Asia";
export type CapSize = "Large" | "Mid" | "Small";
export type Sector =
  | "Technology"
  | "Finance"
  | "Banking"
  | "Retail"
  | "Healthcare"
  | "Energy"
  | "Industrial"
  | "Consumer"
  | "Real Estate"
  | "Materials"
  | "Telecom"
  | "Utilities"
  | "Other";

export interface GlobalStock {
  symbol: string;
  name: string;
  exchange: string;
  region: Region;
  sector: Sector;
  cap: CapSize;
}

export const GLOBAL_STOCKS: GlobalStock[] = [
  // Vietnam — HOSE blue chips
  { symbol: "VNM.VN", name: "Vinamilk", exchange: "HOSE", region: "Vietnam", sector: "Consumer", cap: "Large" },
  { symbol: "VIC.VN", name: "Vingroup", exchange: "HOSE", region: "Vietnam", sector: "Real Estate", cap: "Large" },
  { symbol: "VHM.VN", name: "Vinhomes", exchange: "HOSE", region: "Vietnam", sector: "Real Estate", cap: "Large" },
  { symbol: "FPT.VN", name: "FPT Corporation", exchange: "HOSE", region: "Vietnam", sector: "Technology", cap: "Large" },
  { symbol: "HPG.VN", name: "Hòa Phát Group", exchange: "HOSE", region: "Vietnam", sector: "Materials", cap: "Large" },
  { symbol: "MWG.VN", name: "Thế Giới Di Động", exchange: "HOSE", region: "Vietnam", sector: "Retail", cap: "Large" },
  { symbol: "VCB.VN", name: "Vietcombank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "BID.VN", name: "BIDV", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "CTG.VN", name: "VietinBank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "TCB.VN", name: "Techcombank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "MBB.VN", name: "MB Bank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "ACB.VN", name: "ACB", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "VPB.VN", name: "VPBank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "SSI.VN", name: "SSI Securities", exchange: "HOSE", region: "Vietnam", sector: "Finance", cap: "Large" },
  { symbol: "VRE.VN", name: "Vincom Retail", exchange: "HOSE", region: "Vietnam", sector: "Retail", cap: "Large" },
  { symbol: "MSN.VN", name: "Masan Group", exchange: "HOSE", region: "Vietnam", sector: "Consumer", cap: "Large" },
  { symbol: "GAS.VN", name: "PV Gas", exchange: "HOSE", region: "Vietnam", sector: "Energy", cap: "Large" },
  { symbol: "PLX.VN", name: "Petrolimex", exchange: "HOSE", region: "Vietnam", sector: "Energy", cap: "Large" },
  { symbol: "SAB.VN", name: "Sabeco", exchange: "HOSE", region: "Vietnam", sector: "Consumer", cap: "Large" },
  { symbol: "POW.VN", name: "PV Power", exchange: "HOSE", region: "Vietnam", sector: "Utilities", cap: "Large" },
  { symbol: "VJC.VN", name: "Vietjet Air", exchange: "HOSE", region: "Vietnam", sector: "Industrial", cap: "Large" },
  { symbol: "GVR.VN", name: "VN Rubber Group", exchange: "HOSE", region: "Vietnam", sector: "Materials", cap: "Large" },
  { symbol: "BCM.VN", name: "Becamex IDC", exchange: "HOSE", region: "Vietnam", sector: "Real Estate", cap: "Large" },
  { symbol: "STB.VN", name: "Sacombank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Large" },
  { symbol: "TPB.VN", name: "TPBank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Mid" },
  { symbol: "HDB.VN", name: "HDBank", exchange: "HOSE", region: "Vietnam", sector: "Banking", cap: "Mid" },
  { symbol: "NVL.VN", name: "Novaland", exchange: "HOSE", region: "Vietnam", sector: "Real Estate", cap: "Mid" },
  { symbol: "KDH.VN", name: "Khang Điền", exchange: "HOSE", region: "Vietnam", sector: "Real Estate", cap: "Mid" },
  { symbol: "PDR.VN", name: "Phát Đạt", exchange: "HOSE", region: "Vietnam", sector: "Real Estate", cap: "Mid" },
  { symbol: "KBC.VN", name: "KBC", exchange: "HOSE", region: "Vietnam", sector: "Real Estate", cap: "Mid" },
  { symbol: "DGC.VN", name: "Đức Giang Chemical", exchange: "HOSE", region: "Vietnam", sector: "Materials", cap: "Mid" },
  { symbol: "DPM.VN", name: "Đạm Phú Mỹ", exchange: "HOSE", region: "Vietnam", sector: "Materials", cap: "Mid" },
  { symbol: "DCM.VN", name: "Đạm Cà Mau", exchange: "HOSE", region: "Vietnam", sector: "Materials", cap: "Mid" },
  { symbol: "HSG.VN", name: "Hoa Sen Group", exchange: "HOSE", region: "Vietnam", sector: "Materials", cap: "Mid" },
  { symbol: "NKG.VN", name: "Nam Kim Steel", exchange: "HOSE", region: "Vietnam", sector: "Materials", cap: "Mid" },
  { symbol: "PVD.VN", name: "PV Drilling", exchange: "HOSE", region: "Vietnam", sector: "Energy", cap: "Mid" },
  { symbol: "PVS.VN", name: "PV Technical", exchange: "HNX", region: "Vietnam", sector: "Energy", cap: "Mid" },
  { symbol: "REE.VN", name: "REE Corp", exchange: "HOSE", region: "Vietnam", sector: "Utilities", cap: "Mid" },
  { symbol: "PNJ.VN", name: "PNJ Jewelry", exchange: "HOSE", region: "Vietnam", sector: "Retail", cap: "Mid" },
  { symbol: "DBC.VN", name: "Dabaco Group", exchange: "HOSE", region: "Vietnam", sector: "Consumer", cap: "Mid" },
  { symbol: "VHC.VN", name: "Vĩnh Hoàn", exchange: "HOSE", region: "Vietnam", sector: "Consumer", cap: "Mid" },
  { symbol: "VCI.VN", name: "Bản Việt SC", exchange: "HOSE", region: "Vietnam", sector: "Finance", cap: "Mid" },
  { symbol: "VND.VN", name: "VNDirect", exchange: "HOSE", region: "Vietnam", sector: "Finance", cap: "Mid" },
  { symbol: "HCM.VN", name: "HSC Securities", exchange: "HOSE", region: "Vietnam", sector: "Finance", cap: "Mid" },
  { symbol: "CMG.VN", name: "CMC Group", exchange: "HOSE", region: "Vietnam", sector: "Technology", cap: "Mid" },
  { symbol: "VGI.VN", name: "Viettel Global", exchange: "UPCOM", region: "Vietnam", sector: "Telecom", cap: "Large" },
  { symbol: "CTR.VN", name: "Viettel Construction", exchange: "HOSE", region: "Vietnam", sector: "Industrial", cap: "Mid" },
  { symbol: "VTP.VN", name: "Viettel Post", exchange: "HOSE", region: "Vietnam", sector: "Industrial", cap: "Mid" },
  { symbol: "BSR.VN", name: "Bình Sơn Refining", exchange: "UPCOM", region: "Vietnam", sector: "Energy", cap: "Large" },

  // US — NASDAQ / NYSE Large Caps
  { symbol: "AAPL", name: "Apple", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "GOOGL", name: "Alphabet", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "AMZN", name: "Amazon", exchange: "NASDAQ", region: "US", sector: "Retail", cap: "Large" },
  { symbol: "NVDA", name: "NVIDIA", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "TSLA", name: "Tesla", exchange: "NASDAQ", region: "US", sector: "Consumer", cap: "Large" },
  { symbol: "BRK-B", name: "Berkshire Hathaway", exchange: "NYSE", region: "US", sector: "Finance", cap: "Large" },
  { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE", region: "US", sector: "Banking", cap: "Large" },
  { symbol: "BAC", name: "Bank of America", exchange: "NYSE", region: "US", sector: "Banking", cap: "Large" },
  { symbol: "WFC", name: "Wells Fargo", exchange: "NYSE", region: "US", sector: "Banking", cap: "Large" },
  { symbol: "GS", name: "Goldman Sachs", exchange: "NYSE", region: "US", sector: "Finance", cap: "Large" },
  { symbol: "MS", name: "Morgan Stanley", exchange: "NYSE", region: "US", sector: "Finance", cap: "Large" },
  { symbol: "V", name: "Visa", exchange: "NYSE", region: "US", sector: "Finance", cap: "Large" },
  { symbol: "MA", name: "Mastercard", exchange: "NYSE", region: "US", sector: "Finance", cap: "Large" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", region: "US", sector: "Healthcare", cap: "Large" },
  { symbol: "PFE", name: "Pfizer", exchange: "NYSE", region: "US", sector: "Healthcare", cap: "Large" },
  { symbol: "UNH", name: "UnitedHealth", exchange: "NYSE", region: "US", sector: "Healthcare", cap: "Large" },
  { symbol: "LLY", name: "Eli Lilly", exchange: "NYSE", region: "US", sector: "Healthcare", cap: "Large" },
  { symbol: "ABBV", name: "AbbVie", exchange: "NYSE", region: "US", sector: "Healthcare", cap: "Large" },
  { symbol: "MRK", name: "Merck", exchange: "NYSE", region: "US", sector: "Healthcare", cap: "Large" },
  { symbol: "TMO", name: "Thermo Fisher", exchange: "NYSE", region: "US", sector: "Healthcare", cap: "Large" },
  { symbol: "XOM", name: "ExxonMobil", exchange: "NYSE", region: "US", sector: "Energy", cap: "Large" },
  { symbol: "CVX", name: "Chevron", exchange: "NYSE", region: "US", sector: "Energy", cap: "Large" },
  { symbol: "COP", name: "ConocoPhillips", exchange: "NYSE", region: "US", sector: "Energy", cap: "Large" },
  { symbol: "WMT", name: "Walmart", exchange: "NYSE", region: "US", sector: "Retail", cap: "Large" },
  { symbol: "HD", name: "Home Depot", exchange: "NYSE", region: "US", sector: "Retail", cap: "Large" },
  { symbol: "COST", name: "Costco", exchange: "NASDAQ", region: "US", sector: "Retail", cap: "Large" },
  { symbol: "KO", name: "Coca-Cola", exchange: "NYSE", region: "US", sector: "Consumer", cap: "Large" },
  { symbol: "PEP", name: "PepsiCo", exchange: "NASDAQ", region: "US", sector: "Consumer", cap: "Large" },
  { symbol: "PG", name: "Procter & Gamble", exchange: "NYSE", region: "US", sector: "Consumer", cap: "Large" },
  { symbol: "MCD", name: "McDonald's", exchange: "NYSE", region: "US", sector: "Consumer", cap: "Large" },
  { symbol: "NKE", name: "Nike", exchange: "NYSE", region: "US", sector: "Consumer", cap: "Large" },
  { symbol: "DIS", name: "Disney", exchange: "NYSE", region: "US", sector: "Consumer", cap: "Large" },
  { symbol: "BA", name: "Boeing", exchange: "NYSE", region: "US", sector: "Industrial", cap: "Large" },
  { symbol: "CAT", name: "Caterpillar", exchange: "NYSE", region: "US", sector: "Industrial", cap: "Large" },
  { symbol: "GE", name: "General Electric", exchange: "NYSE", region: "US", sector: "Industrial", cap: "Large" },
  { symbol: "AMD", name: "AMD", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "INTC", name: "Intel", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "CRM", name: "Salesforce", exchange: "NYSE", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "ORCL", name: "Oracle", exchange: "NYSE", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "AVGO", name: "Broadcom", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "ADBE", name: "Adobe", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "NFLX", name: "Netflix", exchange: "NASDAQ", region: "US", sector: "Technology", cap: "Large" },
  { symbol: "T", name: "AT&T", exchange: "NYSE", region: "US", sector: "Telecom", cap: "Large" },
  { symbol: "VZ", name: "Verizon", exchange: "NYSE", region: "US", sector: "Telecom", cap: "Large" },
  { symbol: "NEE", name: "NextEra Energy", exchange: "NYSE", region: "US", sector: "Utilities", cap: "Large" },

  // Europe — LSE / Euronext / Deutsche Börse
  { symbol: "ASML", name: "ASML Holding", exchange: "Euronext", region: "Europe", sector: "Technology", cap: "Large" },
  { symbol: "SAP", name: "SAP", exchange: "Deutsche Börse", region: "Europe", sector: "Technology", cap: "Large" },
  { symbol: "NESN.SW", name: "Nestlé", exchange: "SIX", region: "Europe", sector: "Consumer", cap: "Large" },
  { symbol: "ROG.SW", name: "Roche", exchange: "SIX", region: "Europe", sector: "Healthcare", cap: "Large" },
  { symbol: "NOVN.SW", name: "Novartis", exchange: "SIX", region: "Europe", sector: "Healthcare", cap: "Large" },
  { symbol: "MC.PA", name: "LVMH", exchange: "Euronext", region: "Europe", sector: "Consumer", cap: "Large" },
  { symbol: "OR.PA", name: "L'Oréal", exchange: "Euronext", region: "Europe", sector: "Consumer", cap: "Large" },
  { symbol: "TTE.PA", name: "TotalEnergies", exchange: "Euronext", region: "Europe", sector: "Energy", cap: "Large" },
  { symbol: "SHEL.L", name: "Shell", exchange: "LSE", region: "Europe", sector: "Energy", cap: "Large" },
  { symbol: "BP.L", name: "BP", exchange: "LSE", region: "Europe", sector: "Energy", cap: "Large" },
  { symbol: "AZN.L", name: "AstraZeneca", exchange: "LSE", region: "Europe", sector: "Healthcare", cap: "Large" },
  { symbol: "GSK.L", name: "GSK", exchange: "LSE", region: "Europe", sector: "Healthcare", cap: "Large" },
  { symbol: "HSBA.L", name: "HSBC Holdings", exchange: "LSE", region: "Europe", sector: "Banking", cap: "Large" },
  { symbol: "BARC.L", name: "Barclays", exchange: "LSE", region: "Europe", sector: "Banking", cap: "Large" },
  { symbol: "ULVR.L", name: "Unilever", exchange: "LSE", region: "Europe", sector: "Consumer", cap: "Large" },
  { symbol: "SIE.DE", name: "Siemens", exchange: "Deutsche Börse", region: "Europe", sector: "Industrial", cap: "Large" },
  { symbol: "BMW.DE", name: "BMW", exchange: "Deutsche Börse", region: "Europe", sector: "Consumer", cap: "Large" },
  { symbol: "VOW3.DE", name: "Volkswagen", exchange: "Deutsche Börse", region: "Europe", sector: "Consumer", cap: "Large" },
  { symbol: "ALV.DE", name: "Allianz", exchange: "Deutsche Börse", region: "Europe", sector: "Finance", cap: "Large" },
  { symbol: "DBK.DE", name: "Deutsche Bank", exchange: "Deutsche Börse", region: "Europe", sector: "Banking", cap: "Large" },
  { symbol: "AIR.PA", name: "Airbus", exchange: "Euronext", region: "Europe", sector: "Industrial", cap: "Large" },
  { symbol: "SAN.PA", name: "Sanofi", exchange: "Euronext", region: "Europe", sector: "Healthcare", cap: "Large" },
  { symbol: "BNP.PA", name: "BNP Paribas", exchange: "Euronext", region: "Europe", sector: "Banking", cap: "Large" },
  { symbol: "INGA.AS", name: "ING Group", exchange: "Euronext", region: "Europe", sector: "Banking", cap: "Large" },

  // Asia — TSE / HKEX / SSE / SZSE / SGX / SET
  { symbol: "7203.T", name: "Toyota Motor", exchange: "TSE", region: "Asia", sector: "Consumer", cap: "Large" },
  { symbol: "6758.T", name: "Sony", exchange: "TSE", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "9984.T", name: "SoftBank Group", exchange: "TSE", region: "Asia", sector: "Telecom", cap: "Large" },
  { symbol: "6861.T", name: "Keyence", exchange: "TSE", region: "Asia", sector: "Industrial", cap: "Large" },
  { symbol: "8306.T", name: "Mitsubishi UFJ", exchange: "TSE", region: "Asia", sector: "Banking", cap: "Large" },
  { symbol: "9433.T", name: "KDDI", exchange: "TSE", region: "Asia", sector: "Telecom", cap: "Large" },
  { symbol: "4502.T", name: "Takeda Pharma", exchange: "TSE", region: "Asia", sector: "Healthcare", cap: "Large" },
  { symbol: "7974.T", name: "Nintendo", exchange: "TSE", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "0700.HK", name: "Tencent", exchange: "HKEX", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "9988.HK", name: "Alibaba", exchange: "HKEX", region: "Asia", sector: "Retail", cap: "Large" },
  { symbol: "9618.HK", name: "JD.com", exchange: "HKEX", region: "Asia", sector: "Retail", cap: "Large" },
  { symbol: "3690.HK", name: "Meituan", exchange: "HKEX", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "0939.HK", name: "China Construction Bank", exchange: "HKEX", region: "Asia", sector: "Banking", cap: "Large" },
  { symbol: "1398.HK", name: "ICBC", exchange: "HKEX", region: "Asia", sector: "Banking", cap: "Large" },
  { symbol: "1299.HK", name: "AIA Group", exchange: "HKEX", region: "Asia", sector: "Finance", cap: "Large" },
  { symbol: "0005.HK", name: "HSBC", exchange: "HKEX", region: "Asia", sector: "Banking", cap: "Large" },
  { symbol: "2330.TW", name: "TSMC", exchange: "TWSE", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "2317.TW", name: "Foxconn (Hon Hai)", exchange: "TWSE", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "005930.KS", name: "Samsung Electronics", exchange: "KRX", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "000660.KS", name: "SK Hynix", exchange: "KRX", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "035420.KS", name: "Naver", exchange: "KRX", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", region: "Asia", sector: "Energy", cap: "Large" },
  { symbol: "TCS.NS", name: "Tata Consultancy", exchange: "NSE", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "INFY.NS", name: "Infosys", exchange: "NSE", region: "Asia", sector: "Technology", cap: "Large" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", exchange: "NSE", region: "Asia", sector: "Banking", cap: "Large" },
  { symbol: "D05.SI", name: "DBS Group", exchange: "SGX", region: "Asia", sector: "Banking", cap: "Large" },
  { symbol: "O39.SI", name: "OCBC Bank", exchange: "SGX", region: "Asia", sector: "Banking", cap: "Large" },
  { symbol: "Z74.SI", name: "Singtel", exchange: "SGX", region: "Asia", sector: "Telecom", cap: "Large" },
  { symbol: "PTT.BK", name: "PTT PCL", exchange: "SET", region: "Asia", sector: "Energy", cap: "Large" },
  { symbol: "CPALL.BK", name: "CP All", exchange: "SET", region: "Asia", sector: "Retail", cap: "Large" },
];

export const REGIONS: { id: "all" | Region; label: string; flag: string }[] = [
  { id: "all", label: "All Markets", flag: "🌐" },
  { id: "Vietnam", label: "Vietnam", flag: "🇻🇳" },
  { id: "US", label: "United States", flag: "🇺🇸" },
  { id: "Europe", label: "Europe", flag: "🇪🇺" },
  { id: "Asia", label: "Asia", flag: "🌏" },
];

export const CAP_SIZES: { id: "all" | CapSize; label: string }[] = [
  { id: "all", label: "All Caps" },
  { id: "Large", label: "Large Cap" },
  { id: "Mid", label: "Mid Cap" },
  { id: "Small", label: "Small Cap" },
];

export const SECTORS: { id: "all" | Sector; label: string; icon: string }[] = [
  { id: "all", label: "All Sectors", icon: "🧩" },
  { id: "Technology", label: "Technology", icon: "💻" },
  { id: "Finance", label: "Finance", icon: "💰" },
  { id: "Banking", label: "Banking", icon: "🏦" },
  { id: "Retail", label: "Retail", icon: "🛒" },
  { id: "Healthcare", label: "Healthcare", icon: "💊" },
  { id: "Energy", label: "Energy", icon: "⚡" },
  { id: "Industrial", label: "Industrial", icon: "🏭" },
  { id: "Consumer", label: "Consumer", icon: "🥤" },
  { id: "Real Estate", label: "Real Estate", icon: "🏢" },
  { id: "Materials", label: "Materials", icon: "⛏️" },
  { id: "Telecom", label: "Telecom", icon: "📡" },
  { id: "Utilities", label: "Utilities", icon: "💡" },
];

export function filterStocks(opts: {
  region?: "all" | Region;
  cap?: "all" | CapSize;
  sector?: "all" | Sector;
  search?: string;
}): GlobalStock[] {
  const term = (opts.search || "").trim().toLowerCase();
  return GLOBAL_STOCKS.filter((s) => {
    if (opts.region && opts.region !== "all" && s.region !== opts.region) return false;
    if (opts.cap && opts.cap !== "all" && s.cap !== opts.cap) return false;
    if (opts.sector && opts.sector !== "all" && s.sector !== opts.sector) return false;
    if (term && !s.symbol.toLowerCase().includes(term) && !s.name.toLowerCase().includes(term)) return false;
    return true;
  });
}
