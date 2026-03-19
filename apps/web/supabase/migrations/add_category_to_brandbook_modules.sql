-- Add category column to brandbook_modules table
ALTER TABLE public.brandbook_modules
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'others';
-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_brandbook_modules_category ON public.brandbook_modules(category);
-- Backfill categories for existing modules based on title matching
-- Overview section
UPDATE public.brandbook_modules
SET category = 'overview'
WHERE LOWER(title) IN (
        'visão geral',
        'dna da marca',
        'história da marca',
        'hey, criativo',
        'nossa história'
    );
-- Visual Guide section
UPDATE public.brandbook_modules
SET category = 'visual_guide'
WHERE LOWER(title) IN ('guia de estilo visual');
-- Verbal Identity section
UPDATE public.brandbook_modules
SET category = 'verbal_identity'
WHERE LOWER(title) IN (
        'personalidade da marca',
        'tom de voz',
        'linguagem preferencial',
        'slogans e taglines',
        'naming system',
        'storytelling base',
        'copywriting guidelines',
        'identidade verbal'
    );
-- Visual Identity section
UPDATE public.brandbook_modules
SET category = 'visual_identity'
WHERE LOWER(title) IN (
        'logo',
        'cores',
        'tipografia',
        'iconografia',
        'imagens & fotografia',
        'ilustração',
        'grid & layouts',
        'elementos gráficos',
        'aplicações digitais',
        'aplicações offline',
        'motion design',
        'identidade visual'
    );
-- Sensory Identity section
UPDATE public.brandbook_modules
SET category = 'sensory_identity'
WHERE LOWER(title) IN (
        'identidade sonora',
        'identidade olfativa',
        'identidade tátil',
        'identidade gustativa',
        'experiência multimodal',
        'som da marca'
    );