
import { supabase } from '@/integrations/supabase/client';

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
  
  if (error) {
    console.error("Error fetching spaces:", error);
    throw error;
  }
  
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
      user_id: user.id
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating space:", error);
    throw error;
  }
  
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
  
  if (error) {
    console.error("Error updating space:", error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    created_at: new Date(data.created_at)
  };
}

export async function deleteSpace(id: string): Promise<void> {
  // First, update any items in this space to set space_id to null
  const { error: itemsError } = await supabase
    .from('items')
    .update({ space_id: null })
    .eq('space_id', id);
  
  if (itemsError) {
    console.error("Error updating items:", itemsError);
    throw itemsError;
  }
  
  // Then delete the space
  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting space:", error);
    throw error;
  }
}
