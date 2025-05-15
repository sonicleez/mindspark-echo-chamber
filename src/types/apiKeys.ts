
export type ApiServiceType = 'openai' | 'perplexity' | 'anthropic' | 'google' | 'custom';

export interface ApiKeyConfig {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  created_by: string;
  expires_at?: string | null;
  service?: ApiServiceType; // Make service optional since the column might not exist yet
}

export interface ApiServiceConfig {
  id: string;
  name: string;
  description: string;
  url: string;
}
