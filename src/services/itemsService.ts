
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface Item {
  id: string;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  tags?: string[];
  space_id: string;
  dateAdded: string;
  user_id: string;
  type?: string;
  summary?: string;
}

type ItemInput = Omit<Item, 'id' | 'dateAdded'>;

// Get all items for the current user
export const getItems = async (): Promise<Item[]> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user || !user.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  // Map database fields to Item interface
  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    url: item.url,
    image_url: item.image_url,
    tags: item.tags,
    space_id: item.space_id,
    dateAdded: item.created_at,
    user_id: item.user_id,
    type: item.type || 'link',
    summary: item.summary,
  }));
};

// Add a new item
export const addItem = async (item: ItemInput): Promise<Item> => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData || !userData.user) {
    throw new Error('User not authenticated');
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  const user_id = userData.user.id;
  
  const { data, error } = await supabase
    .from('items')
    .insert({
      id,
      title: item.title,
      description: item.description || '',
      url: item.url || '',
      image_url: item.image_url || '',
      tags: item.tags || [],
      space_id: item.space_id,
      user_id: user_id,
      created_at: now,
      updated_at: now,
      type: item.type || 'link',
      summary: item.summary || '',
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    url: data.url,
    image_url: data.image_url,
    tags: data.tags,
    space_id: data.space_id,
    dateAdded: data.created_at,
    user_id: data.user_id,
    type: data.type || 'link',
    summary: data.summary,
  };
};

// Update an existing item
export const updateItem = async (id: string, updates: Partial<Item>): Promise<Item> => {
  const now = new Date().toISOString();
  
  // Remove id and dateAdded from updates if present
  const { id: _id, dateAdded: _dateAdded, ...cleanUpdates } = updates;
  
  const { data, error } = await supabase
    .from('items')
    .update({
      ...cleanUpdates,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    url: data.url,
    image_url: data.image_url,
    tags: data.tags,
    space_id: data.space_id,
    dateAdded: data.created_at,
    user_id: data.user_id,
    type: data.type || 'link',
    summary: data.summary,
  };
};

// Delete an item
export const deleteItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};
