
import { supabase } from '@/integrations/supabase/client';

export const getPublicUrl = (filePath: string): string => {
  return supabase.storage.from('animations').getPublicUrl(filePath).data.publicUrl;
};
