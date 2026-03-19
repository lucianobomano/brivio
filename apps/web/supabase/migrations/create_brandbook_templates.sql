-- Create brandbook_templates table
CREATE TABLE IF NOT EXISTS brandbook_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'custom',
    modules_json JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        brand_id UUID REFERENCES brands(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE brandbook_templates ENABLE ROW LEVEL SECURITY;
-- Policy: Users can view public templates or their own
CREATE POLICY "View public or own templates" ON brandbook_templates FOR
SELECT USING (
        is_public = true
        OR created_by = auth.uid()
    );
-- Policy: Users can insert their own templates
CREATE POLICY "Insert own templates" ON brandbook_templates FOR
INSERT WITH CHECK (created_by = auth.uid());
-- Policy: Users can update their own templates
CREATE POLICY "Update own templates" ON brandbook_templates FOR
UPDATE USING (created_by = auth.uid());
-- Policy: Users can delete their own templates
CREATE POLICY "Delete own templates" ON brandbook_templates FOR DELETE USING (created_by = auth.uid());
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_brandbook_templates_created_by ON brandbook_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_brandbook_templates_is_public ON brandbook_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_brandbook_templates_category ON brandbook_templates(category);