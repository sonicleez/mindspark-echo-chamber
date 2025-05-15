
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Space {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
}

export async function getSpaces(): Promise<Space[]> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(space => ({
    id: space.id,
    name: space.name,
    description: space.description || undefined,
    created_at: new Date(space.created_at)
  }));
}

export async function createSpace(space: { name: string; description?: string }): Promise<Space> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a space');
  }
  
  const { data, error } = await supabase
    .from('spaces')
    .insert({
      name: space.name,
      description: space.description,
      user_id: user.id // Add the user_id from the authenticated user
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    created_at: new Date(data.created_at)
  };
}

export async function updateSpace(id: string, updates: { name?: string; description?: string }): Promise<Space> {
  const { data, error } = await supabase
    .from('spaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    created_at: new Date(data.created_at)
  };
}

export async function deleteSpace(id: string): Promise<void> {
  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
