-- n8n_runs: track outbound runs to n8n + callback results
CREATE TABLE public.n8n_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb,
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.n8n_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own n8n runs" ON public.n8n_runs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own n8n runs" ON public.n8n_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own n8n runs" ON public.n8n_runs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own n8n runs" ON public.n8n_runs
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all n8n runs" ON public.n8n_runs
  FOR SELECT USING (public.is_admin());

CREATE TRIGGER update_n8n_runs_updated_at
  BEFORE UPDATE ON public.n8n_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_n8n_runs_user_created ON public.n8n_runs(user_id, created_at DESC);

-- Realtime
ALTER TABLE public.n8n_runs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.n8n_runs;

-- powerbi_reports
CREATE TABLE public.powerbi_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  embed_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.powerbi_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own powerbi reports" ON public.powerbi_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own powerbi reports" ON public.powerbi_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own powerbi reports" ON public.powerbi_reports
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own powerbi reports" ON public.powerbi_reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_powerbi_reports_updated_at
  BEFORE UPDATE ON public.powerbi_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();