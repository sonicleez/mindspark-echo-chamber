
-- Create enum for API service types
CREATE TYPE public.api_service_type AS ENUM ('openai', 'perplexity', 'anthropic', 'google', 'custom');

-- Create api_services table
CREATE TABLE public.api_services (
  service api_service_type PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  active_key_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create api_keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service api_service_type NOT NULL REFERENCES public.api_services(service) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE public.api_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can access and modify these tables
CREATE POLICY "Allow admins to select api_services" ON public.api_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow admins to insert api_services" ON public.api_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow admins to update api_services" ON public.api_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow admins to delete api_services" ON public.api_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow admins to select api_keys" ON public.api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow admins to insert api_keys" ON public.api_keys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow admins to update api_keys" ON public.api_keys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Allow admins to delete api_keys" ON public.api_keys
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Insert default API services
INSERT INTO public.api_services (service, name, description, url)
VALUES 
  ('openai', 'OpenAI', 'API for accessing powerful language models like GPT-4', 'https://platform.openai.com/docs/api-reference'),
  ('perplexity', 'Perplexity AI', 'Access advanced AI models for document understanding and generation', 'https://docs.perplexity.ai'),
  ('anthropic', 'Anthropic Claude', 'Claude AI models for natural language understanding and generation', 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api'),
  ('google', 'Google AI', 'Google Gemini and other AI models for various tasks', 'https://ai.google.dev/docs'),
  ('custom', 'Custom API', 'Custom API integrations for specialized needs', 'https://example.com/api-docs');

-- Update existing API keys with the correct service type (assuming they exist)
UPDATE public.api_keys SET service = 'openai' WHERE service IS NULL;
