
-- Watchlist table
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  asset_type text NOT NULL DEFAULT 'stock',
  name text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON public.watchlist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist" ON public.watchlist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist" ON public.watchlist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist" ON public.watchlist
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Price alerts table
CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  asset_type text NOT NULL DEFAULT 'stock',
  alert_type text NOT NULL DEFAULT 'above',
  target_price numeric NOT NULL,
  is_triggered boolean NOT NULL DEFAULT false,
  triggered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.price_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.price_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.price_alerts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.price_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
