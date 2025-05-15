
import { supabase } from '@/integrations/supabase/client';
import { Item } from '@/components/ItemCard';

export async function getItems(space_id?: string): Promise<Item[]> {
  let query = supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
  
  // If space_id is provided, filter items by that space
  if (space_id) {
    query = query.eq('space_id', space_id);
  } else {
    // Otherwise, show items without a space (null space_id)
    query = query.is('space_id', null);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    imageUrl: item.image_url || undefined,
    url: item.url || undefined,
    tags: item.tags || [],
    dateAdded: new Date(item.created_at),
    summary: item.summary || undefined,
    space_id: item.space_id || undefined
  }));
}

export async function addItem(item: Omit<Item, 'id' | 'dateAdded'>): Promise<Item> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to add items');
  }
  
  let finalItem = {...item};
  
  // If URL is provided, extract metadata
  if (item.url) {
    try {
      const { data, error } = await supabase.functions.invoke('extract-metadata', {
        body: { url: item.url }
      });
      
      if (!error && data) {
        // Only override these fields if they're empty or not provided
        if (!finalItem.title) finalItem.title = data.title;
        if (!finalItem.description) finalItem.description = data.description;
        if (!finalItem.imageUrl) finalItem.imageUrl = data.imageUrl;
        if (!finalItem.tags || finalItem.tags.length === 0) finalItem.tags = data.tags;
        if (data.summary) finalItem.summary = data.summary;
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      // Continue with item creation even if metadata extraction fails
    }
  }
  
  const { data, error } = await supabase
    .from('items')
    .insert({
      title: finalItem.title,
      description: finalItem.description,
      image_url: finalItem.imageUrl,
      url: finalItem.url,
      tags: finalItem.tags || [],
      user_id: user.id,
      summary: finalItem.summary,
      space_id: finalItem.space_id
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    imageUrl: data.image_url || undefined,
    url: data.url || undefined,
    tags: data.tags || [],
    dateAdded: new Date(data.created_at),
    summary: data.summary || undefined,
    space_id: data.space_id || undefined
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
  if (item.space_id !== undefined) updates.space_id = item.space_id;
  
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    imageUrl: data.image_url || undefined,
    url: data.url || undefined,
    tags: data.tags || [],
    dateAdded: new Date(data.created_at),
    summary: data.summary || undefined,
    space_id: data.space_id || undefined
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

    return data.summary || '';
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}
