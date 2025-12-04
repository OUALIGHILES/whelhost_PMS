-- Migration to ensure is_visible column exists with proper default
DO $$ 
BEGIN
    -- Add the column if it doesn't exist, with default TRUE
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'is_visible') THEN
        ALTER TABLE public.units ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
        
        -- Ensure the default value is set
        ALTER TABLE public.units ALTER COLUMN is_visible SET DEFAULT TRUE;
        
        -- Update all existing records to be visible by default
        UPDATE public.units SET is_visible = TRUE WHERE is_visible IS NULL;
    ELSE
        -- If the column exists, ensure default is set correctly
        ALTER TABLE public.units ALTER COLUMN is_visible SET DEFAULT TRUE;
    END IF;
END $$; 