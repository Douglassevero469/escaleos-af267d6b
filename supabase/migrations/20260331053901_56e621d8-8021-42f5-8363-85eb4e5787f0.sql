
-- Table: demand_boards
CREATE TABLE public.demand_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  columns jsonb NOT NULL DEFAULT '[{"id":"todo","name":"A Fazer","color":"#3b82f6","order":0},{"id":"in_progress","name":"Em Andamento","color":"#f59e0b","order":1},{"id":"review","name":"Revisão","color":"#8b5cf6","order":2},{"id":"done","name":"Concluído","color":"#22c55e","order":3}]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boards" ON public.demand_boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own boards" ON public.demand_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boards" ON public.demand_boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own boards" ON public.demand_boards FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_demand_boards_updated_at BEFORE UPDATE ON public.demand_boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: demand_items
CREATE TABLE public.demand_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.demand_boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  assignee_name text,
  due_date date,
  start_date date,
  tags text[] DEFAULT '{}',
  color text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items" ON public.demand_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.demand_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.demand_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.demand_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_demand_items_updated_at BEFORE UPDATE ON public.demand_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: demand_comments
CREATE TABLE public.demand_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.demand_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comments" ON public.demand_comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comments" ON public.demand_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.demand_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.demand_comments FOR DELETE USING (auth.uid() = user_id);
