import { useState } from "react";
import { Star, StarOff, Bell, BellOff, Trash2, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWatchlist, WatchlistItem, PriceAlert } from "@/hooks/useWatchlist";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface WatchlistPanelProps {
  currentPrices?: Record<string, number>;
  onSelectSymbol?: (symbol: string) => void;
}

export function WatchlistPanel({ currentPrices = {}, onSelectSymbol }: WatchlistPanelProps) {
  const { items, alerts, loading, user, addToWatchlist, removeFromWatchlist, addAlert, removeAlert } = useWatchlist();
  const [newSymbol, setNewSymbol] = useState("");
  const [newAssetType, setNewAssetType] = useState("stock");
  const [alertSymbol, setAlertSymbol] = useState("");
  const [alertType, setAlertType] = useState("above");
  const [alertPrice, setAlertPrice] = useState("");

  if (!user) {
    return (
      <div className="quant-card text-center py-8">
        <Star className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Đăng nhập để sử dụng Watchlist & Price Alerts</p>
      </div>
    );
  }

  const handleAddWatchlist = () => {
    if (!newSymbol.trim()) return;
    addToWatchlist(newSymbol.trim().toUpperCase(), newAssetType);
    setNewSymbol("");
  };

  const handleAddAlert = () => {
    if (!alertSymbol.trim() || !alertPrice) return;
    addAlert(alertSymbol.trim().toUpperCase(), newAssetType, alertType, parseFloat(alertPrice));
    setAlertSymbol("");
    setAlertPrice("");
  };

  return (
    <div className="quant-card">
      <Tabs defaultValue="watchlist">
        <TabsList className="bg-muted/30 border border-border/30 w-full">
          <TabsTrigger value="watchlist" className="text-xs flex-1">
            <Star className="w-3.5 h-3.5 mr-1" />
            Watchlist ({items.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs flex-1">
            <Bell className="w-3.5 h-3.5 mr-1" />
            Alerts ({alerts.filter(a => !a.is_triggered).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="space-y-3 mt-3">
          {/* Add form */}
          <div className="flex gap-2">
            <Input
              placeholder="Mã CK (VNM.VN, AAPL...)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWatchlist()}
              className="h-8 text-xs flex-1"
            />
            <Select value={newAssetType} onValueChange={setNewAssetType}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8" onClick={handleAddWatchlist}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Chưa có mã nào trong watchlist</p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => {
                const price = currentPrices[item.symbol];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => onSelectSymbol?.(item.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <div>
                        <p className="text-xs font-mono font-medium">{item.symbol}</p>
                        {item.name && <p className="text-[10px] text-muted-foreground">{item.name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {price !== undefined && (
                        <span className="text-xs font-mono">{price.toFixed(2)}</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                        {item.asset_type}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.symbol); }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3 mt-3">
          {/* Add alert form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Mã CK"
                value={alertSymbol}
                onChange={(e) => setAlertSymbol(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">≥</SelectItem>
                  <SelectItem value="below">≤</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Giá"
                type="number"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                className="h-8 text-xs w-24"
              />
              <Button size="sm" variant="outline" className="h-8" onClick={handleAddAlert}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Chưa có price alert nào</p>
          ) : (
            <div className="space-y-1">
              {alerts.map((alert) => {
                const price = currentPrices[alert.symbol];
                return (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                      alert.is_triggered ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {alert.is_triggered ? (
                        <BellOff className="w-3.5 h-3.5 text-yellow-500" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-primary" />
                      )}
                      <div>
                        <p className="text-xs font-mono font-medium">
                          {alert.symbol}{' '}
                          <span className="text-muted-foreground">
                            {alert.alert_type === 'above' ? '≥' : '≤'} {alert.target_price}
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {alert.is_triggered ? `Triggered ${alert.triggered_at ? new Date(alert.triggered_at).toLocaleString('vi-VN') : ''}` : 'Active'}
                          {price !== undefined && ` · Current: ${price.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeAlert(alert.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
