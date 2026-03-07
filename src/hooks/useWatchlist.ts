import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WatchlistItem {
  id: string;
  symbol: string;
  asset_type: string;
  name: string | null;
  notes: string | null;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  asset_type: string;
  alert_type: string;
  target_price: number;
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) { setItems([]); setAlerts([]); setLoading(false); return; }
    setLoading(true);
    const [wRes, aRes] = await Promise.all([
      supabase.from("watchlist").select("*").order("created_at", { ascending: false }),
      supabase.from("price_alerts").select("*").order("created_at", { ascending: false }),
    ]);
    if (wRes.data) setItems(wRes.data as WatchlistItem[]);
    if (aRes.data) setAlerts(aRes.data as PriceAlert[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addToWatchlist = useCallback(async (symbol: string, assetType: string, name?: string) => {
    if (!user) { toast.error("Vui lòng đăng nhập"); return; }
    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id, symbol, asset_type: assetType, name: name || null,
    });
    if (error) {
      if (error.code === "23505") toast.info(`${symbol} đã có trong watchlist`);
      else toast.error("Lỗi thêm watchlist");
      return;
    }
    toast.success(`Đã thêm ${symbol} vào watchlist`);
    fetchData();
  }, [user, fetchData]);

  const removeFromWatchlist = useCallback(async (symbol: string) => {
    if (!user) return;
    await supabase.from("watchlist").delete().eq("user_id", user.id).eq("symbol", symbol);
    toast.success(`Đã xóa ${symbol} khỏi watchlist`);
    fetchData();
  }, [user, fetchData]);

  const isInWatchlist = useCallback((symbol: string) => {
    return items.some(i => i.symbol === symbol);
  }, [items]);

  const addAlert = useCallback(async (symbol: string, assetType: string, alertType: string, targetPrice: number) => {
    if (!user) { toast.error("Vui lòng đăng nhập"); return; }
    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id, symbol, asset_type: assetType, alert_type: alertType, target_price: targetPrice,
    });
    if (error) { toast.error("Lỗi tạo alert"); return; }
    toast.success(`Đã tạo alert cho ${symbol} khi giá ${alertType === 'above' ? '≥' : '≤'} ${targetPrice}`);
    fetchData();
  }, [user, fetchData]);

  const removeAlert = useCallback(async (id: string) => {
    await supabase.from("price_alerts").delete().eq("id", id);
    toast.success("Đã xóa alert");
    fetchData();
  }, [fetchData]);

  const checkAlerts = useCallback((currentPrices: Record<string, number>) => {
    const triggered: PriceAlert[] = [];
    alerts.filter(a => !a.is_triggered).forEach(alert => {
      const price = currentPrices[alert.symbol];
      if (!price) return;
      const shouldTrigger = alert.alert_type === 'above' ? price >= alert.target_price : price <= alert.target_price;
      if (shouldTrigger) {
        triggered.push(alert);
        supabase.from("price_alerts").update({ is_triggered: true, triggered_at: new Date().toISOString() }).eq("id", alert.id).then(() => fetchData());
        toast.warning(`🔔 Alert: ${alert.symbol} đã ${alert.alert_type === 'above' ? 'vượt' : 'xuống dưới'} ${alert.target_price}! Giá hiện tại: ${price}`, { duration: 10000 });
      }
    });
    return triggered;
  }, [alerts, fetchData]);

  return { items, alerts, loading, user, addToWatchlist, removeFromWatchlist, isInWatchlist, addAlert, removeAlert, checkAlerts, refetch: fetchData };
}
