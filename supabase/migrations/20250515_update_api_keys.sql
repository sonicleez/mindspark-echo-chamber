
-- Add service column to api_keys table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'service'
    ) THEN
        ALTER TABLE public.api_keys
        ADD COLUMN service text NOT NULL DEFAULT 'openai';
    END IF;
END
$$;

-- Create enum for API service types if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'api_service_type'
    ) THEN
        CREATE TYPE api_service_type AS ENUM ('openai', 'perplexity', 'anthropic', 'google', 'custom');
    END IF;
END
$$;

-- Update the column to use the enum type
ALTER TABLE public.api_keys 
ALTER COLUMN service TYPE api_service_type USING service::api_service_type;

-- Make sure the is_active column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.api_keys
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END
$$;
