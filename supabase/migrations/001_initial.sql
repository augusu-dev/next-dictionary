-- Next Dictionary: Initial Migration
-- ====================================
-- nd_ プレフィックス付きテーブルで他プロジェクトと安全に共存

-- 0. 共通トリガー関数
CREATE OR REPLACE FUNCTION public.nd_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.nd_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.nd_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存の on_auth_user_created トリガーがあれば削除して作り直す
DROP TRIGGER IF EXISTS nd_on_auth_user_created ON auth.users;
CREATE TRIGGER nd_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.nd_handle_new_user();

-- ============================================

-- 1. nd_profiles
CREATE TABLE IF NOT EXISTS public.nd_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nd_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ND: Profiles are viewable by everyone"
  ON public.nd_profiles FOR SELECT
  USING (true);

CREATE POLICY "ND: Users can update own profile"
  ON public.nd_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "ND: Users can insert own profile"
  ON public.nd_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================

-- 2. nd_projects
CREATE TABLE IF NOT EXISTS public.nd_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('dictionary', 'tree', 'flow')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nd_projects_user_id ON public.nd_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_nd_projects_visibility ON public.nd_projects(visibility);
CREATE INDEX IF NOT EXISTS idx_nd_projects_updated_at ON public.nd_projects(updated_at DESC);

ALTER TABLE public.nd_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ND: Users can view own projects"
  ON public.nd_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ND: Anyone can view public projects"
  ON public.nd_projects FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "ND: Users can create own projects"
  ON public.nd_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ND: Users can update own projects"
  ON public.nd_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ND: Users can delete own projects"
  ON public.nd_projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 3. nd_nodes
CREATE TABLE IF NOT EXISTS public.nd_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.nd_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  level INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nd_nodes_project_id ON public.nd_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nd_nodes_order ON public.nd_nodes(project_id, order_index);

ALTER TABLE public.nd_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ND: Users can view nodes of own projects"
  ON public.nd_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nd_projects
      WHERE nd_projects.id = nd_nodes.project_id
      AND (nd_projects.user_id = auth.uid() OR nd_projects.visibility = 'public')
    )
  );

CREATE POLICY "ND: Users can insert nodes into own projects"
  ON public.nd_nodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nd_projects
      WHERE nd_projects.id = nd_nodes.project_id
      AND nd_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "ND: Users can update nodes of own projects"
  ON public.nd_nodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.nd_projects
      WHERE nd_projects.id = nd_nodes.project_id
      AND nd_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "ND: Users can delete nodes of own projects"
  ON public.nd_nodes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.nd_projects
      WHERE nd_projects.id = nd_nodes.project_id
      AND nd_projects.user_id = auth.uid()
    )
  );

-- ============================================

-- 4. nd_edges
CREATE TABLE IF NOT EXISTS public.nd_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.nd_projects(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES public.nd_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.nd_nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('tree', 'flow', 'dependency')),
  label TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nd_edges_project_id ON public.nd_edges(project_id);

ALTER TABLE public.nd_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ND: Users can view edges of accessible projects"
  ON public.nd_edges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nd_projects
      WHERE nd_projects.id = nd_edges.project_id
      AND (nd_projects.user_id = auth.uid() OR nd_projects.visibility = 'public')
    )
  );

CREATE POLICY "ND: Users can insert edges into own projects"
  ON public.nd_edges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nd_projects
      WHERE nd_projects.id = nd_edges.project_id
      AND nd_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "ND: Users can delete edges of own projects"
  ON public.nd_edges FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.nd_projects
      WHERE nd_projects.id = nd_edges.project_id
      AND nd_projects.user_id = auth.uid()
    )
  );

-- ============================================

-- 5. nd_user_provider_keys
CREATE TABLE IF NOT EXISTS public.nd_user_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openrouter')),
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.nd_user_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ND: Users can view own keys"
  ON public.nd_user_provider_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ND: Users can insert own keys"
  ON public.nd_user_provider_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ND: Users can update own keys"
  ON public.nd_user_provider_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ND: Users can delete own keys"
  ON public.nd_user_provider_keys FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 6. nd_generation_logs
CREATE TABLE IF NOT EXISTS public.nd_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.nd_projects(id) ON DELETE SET NULL,
  mode TEXT,
  topic TEXT,
  provider TEXT,
  used_user_key BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nd_generation_logs_user_id ON public.nd_generation_logs(user_id);

ALTER TABLE public.nd_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ND: Users can view own generation logs"
  ON public.nd_generation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ND: Users can insert own generation logs"
  ON public.nd_generation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================

-- 7. updated_at トリガー
DROP TRIGGER IF EXISTS nd_set_projects_updated_at ON public.nd_projects;
CREATE TRIGGER nd_set_projects_updated_at
  BEFORE UPDATE ON public.nd_projects
  FOR EACH ROW EXECUTE FUNCTION public.nd_update_updated_at();

DROP TRIGGER IF EXISTS nd_set_nodes_updated_at ON public.nd_nodes;
CREATE TRIGGER nd_set_nodes_updated_at
  BEFORE UPDATE ON public.nd_nodes
  FOR EACH ROW EXECUTE FUNCTION public.nd_update_updated_at();

DROP TRIGGER IF EXISTS nd_set_profiles_updated_at ON public.nd_profiles;
CREATE TRIGGER nd_set_profiles_updated_at
  BEFORE UPDATE ON public.nd_profiles
  FOR EACH ROW EXECUTE FUNCTION public.nd_update_updated_at();

DROP TRIGGER IF EXISTS nd_set_user_provider_keys_updated_at ON public.nd_user_provider_keys;
CREATE TRIGGER nd_set_user_provider_keys_updated_at
  BEFORE UPDATE ON public.nd_user_provider_keys
  FOR EACH ROW EXECUTE FUNCTION public.nd_update_updated_at();
