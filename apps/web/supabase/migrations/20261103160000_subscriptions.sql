-- Plan subscriptions: a request is created at checkout (payment proof uploaded), an admin approves or rejects it.
-- Replaces 20260601223133_create_subscriptions_table.sql, which was never applied (and allowed no 'active' status).

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
    plan text NOT NULL,
    tier text NOT NULL DEFAULT 'individual',
    amount_aoa numeric NOT NULL DEFAULT 0,   -- amount in the local currency (historic column name)
    currency text NOT NULL DEFAULT 'AOA',
    bank text,
    proof_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'cancelled')),
    reject_reason text,
    approved_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON public.subscriptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions (status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users see and create their own requests; approving / rejecting is done on the server (admin check + service role)
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS rls_subscriptions_select_own ON public.subscriptions;
DROP POLICY IF EXISTS rls_subscriptions_insert_own ON public.subscriptions;
CREATE POLICY rls_subscriptions_select_own ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY rls_subscriptions_insert_own ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
