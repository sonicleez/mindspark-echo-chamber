
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Item } from './ItemCard';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditItem: (id: string, item: Partial<Omit<Item, 'id' | 'dateAdded'>>) => void;
  item: Item | null;
}

const EditItemDialog: React.FC<EditItemDialogProps> = ({ isOpen, onClose, onEditItem, item }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setUrl(item.url || '');
      setImageUrl(item.imageUrl || '');
      setDescription(item.description || '');
      setSummary(item.summary || '');
      setTags(item.tags ? item.tags.join(', ') : '');
    }
  }, [item]);

  const extractMetadata = async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsExtractingMetadata(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-metadata', {
        body: { url }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Extracted metadata response:', data);

      // Always set the extracted data if available
      if (data?.metadata) {
        if (data.metadata.title) {
          setTitle(data.metadata.title);
        }

        if (data.metadata.description) {
          setDescription(data.metadata.description);
        }

        if (data.metadata.image) {
          setImageUrl(data.metadata.image);
        }

        if (data.metadata.tags && data.metadata.tags.length > 0) {
          setTags(data.metadata.tags.join(', '));
        }
      }

      toast.success('Metadata extracted successfully');
    } catch (error) {
      console.error('Error extracting metadata:', error);
      toast.error('Failed to extract metadata');
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;
    
    if (!title) {
      toast.error('Please enter a title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedItem: Partial<Omit<Item, 'id' | 'dateAdded'>> = {
        title,
        url: url || undefined,
        imageUrl: imageUrl || undefined,
        description: description || undefined,
        summary: summary || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
      };
      
      await onEditItem(item.id, updatedItem);
      handleClose();
    } catch (error) {
      console.error('Error editing item:', error);
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    onClose();
  };

  const handleUrlBlur = () => {
    if (url && url !== item?.url) {
      extractMetadata();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#1E1E24] text-white border-[#333]">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center justify-between text-white">
            Edit Item
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 text-white hover:bg-[#333]">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {item && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-gray-300">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#333] border-[#444] text-white placeholder:text-gray-500"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={extractMetadata}
                  disabled={!url || isExtractingMetadata || isSubmitting}
                  className="shrink-0 bg-transparent border-[#444] text-white hover:bg-[#444]"
                >
                  {isExtractingMetadata ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : 'Extract'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title"
                required
                disabled={isSubmitting}
                className="bg-[#333] border-[#444] text-white placeholder:text-gray-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-gray-300">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isSubmitting}
                className="bg-[#333] border-[#444] text-white placeholder:text-gray-500"
              />
              {imageUrl && (
                <div className="mt-2 border border-[#444] rounded-md p-2 flex justify-center">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="max-h-40 object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description"
                rows={3}
                disabled={isSubmitting}
                className="bg-[#333] border-[#444] text-white placeholder:text-gray-500 min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="summary" className="text-gray-300">TLDR (200 chars)</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Short summary of content"
                rows={2}
                disabled={isSubmitting}
                maxLength={200}
                className="bg-[#FF5733]/20 border-[#FF5733]/30 text-white placeholder:text-gray-500"
              />
              <div className="text-xs text-right text-gray-500">
                {summary ? summary.length : 0}/200 characters
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-gray-300">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="design, inspiration, article"
                disabled={isSubmitting}
                className="bg-[#333] border-[#444] text-white placeholder:text-gray-500"
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                className="bg-[#FF5733] hover:bg-[#FF5733]/80 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
