
import { supabase } from '@/integrations/supabase/client';
import { Item } from '@/components/ItemCard';
import { Database } from '@/types/database';

export async function getItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    imageUrl: item.image_url || undefined,
    url: item.url || undefined,
    tags: item.tags || [],
    dateAdded: new Date(item.created_at),
    summary: item.summary || undefined
  }));
}

export async function addItem(item: Omit<Item, 'id' | 'dateAdded'>): Promise<Item> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to add items');
  }
  
  const { data, error } = await supabase
    .from('items')
    .insert({
      title: item.title,
      description: item.description,
      image_url: item.imageUrl,
      url: item.url,
      tags: item.tags || [],
      user_id: user.id,
      summary: item.summary
    })
    .select()
    .single();
  
  if (error) throw error;
  
  if (!data) throw new Error('Failed to retrieve created item');
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    imageUrl: data.image_url || undefined,
    url: data.url || undefined,
    tags: data.tags || [],
    dateAdded: new Date(data.created_at),
    summary: data.summary || undefined
  };
}

export async function updateItem(id: string, item: Partial<Omit<Item, 'id' | 'dateAdded'>>): Promise<Item> {
  const updates: Record<string, any> = {};
  
  if (item.title !== undefined) updates.title = item.title;
  if (item.description !== undefined) updates.description = item.description;
  if (item.imageUrl !== undefined) updates.image_url = item.imageUrl;
  if (item.url !== undefined) updates.url = item.url;
  if (item.tags !== undefined) updates.tags = item.tags;
  if (item.summary !== undefined) updates.summary = item.summary;
  
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  if (!data) throw new Error('Failed to retrieve updated item');
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    imageUrl: data.image_url || undefined,
    url: data.url || undefined,
    tags: data.tags || [],
    dateAdded: new Date(data.created_at),
    summary: data.summary || undefined
  };
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function summarizeContent(content: string): Promise<string> {
  if (!content || content.trim() === '') {
    return '';
  }

  try {
    const { data, error } = await supabase.functions.invoke('summarize-content', {
      body: { content }
    });

    if (error) {
      console.error('Error calling summarize-content function:', error);
      throw error;
    }

    return data?.summary || '';
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}
