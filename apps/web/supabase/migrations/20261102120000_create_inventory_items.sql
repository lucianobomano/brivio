-- Studio inventory: font licences, software and subscriptions, stock libraries, equipment and domains,
-- with cost, billing cycle and renewal date. One row per item, scoped to the workspace.

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 140),
  category text NOT NULL DEFAULT 'software' CHECK (category IN ('font', 'software', 'stock', 'equipment', 'domain', 'other')),
  vendor text,
  license text,
  seats integer CHECK (seats IS NULL OR seats >= 0),
  cost numeric(12, 2) CHECK (cost IS NULL OR cost >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  billing text NOT NULL DEFAULT 'one_time' CHECK (billing IN ('one_time', 'monthly', 'yearly')),
  purchased_at date,
  renews_at date,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_items_workspace_idx ON public.inventory_items (workspace_id);
CREATE INDEX IF NOT EXISTS inventory_items_renews_idx ON public.inventory_items (workspace_id, renews_at);
CREATE INDEX IF NOT EXISTS inventory_items_assigned_idx ON public.inventory_items (assigned_to);
CREATE INDEX IF NOT EXISTS inventory_items_brand_idx ON public.inventory_items (brand_id);
CREATE INDEX IF NOT EXISTS inventory_items_created_by_idx ON public.inventory_items (created_by);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_inventory_items_member ON public.inventory_items;
CREATE POLICY rls_inventory_items_member ON public.inventory_items
  FOR ALL TO authenticated
  USING (public.rls_is_workspace_member(workspace_id))
  WITH CHECK (public.rls_is_workspace_member(workspace_id));
