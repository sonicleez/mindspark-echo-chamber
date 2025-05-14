
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

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<Item, 'id' | 'dateAdded'>) => void;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({ isOpen, onClose, onAddItem }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);

  useEffect(() => {
    // Reset form when dialog opens
    if (isOpen) {
      setTitle('');
      setUrl('');
      setImageUrl('');
      setDescription('');
      setTags('');
    }
  }, [isOpen]);

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

      if (data.title && title === '') {
        setTitle(data.title);
      }

      if (data.description && description === '') {
        setDescription(data.description);
      }

      if (data.imageUrl && imageUrl === '') {
        setImageUrl(data.imageUrl);
      }

      if (data.tags && data.tags.length > 0 && tags === '') {
        setTags(data.tags.join(', '));
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
    
    if (!title) {
      toast.error('Please enter a title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newItem: Omit<Item, 'id' | 'dateAdded'> = {
        title,
        url: url || undefined,
        imageUrl: imageUrl || undefined,
        description: description || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
      };
      
      await onAddItem(newItem);
      handleClose();
    } catch (error) {
      console.error('Error adding item:', error);
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    setTitle('');
    setUrl('');
    setImageUrl('');
    setDescription('');
    setTags('');
    setIsSubmitting(false);
    onClose();
  };

  const handleUrlBlur = () => {
    if (url && !title && !imageUrl && !description && !tags) {
      extractMetadata();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center justify-between">
            Add New Item
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com"
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={extractMetadata}
                disabled={!url || isExtractingMetadata || isSubmitting}
                className="shrink-0"
              >
                {isExtractingMetadata ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : 'Extract'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isSubmitting}
            />
            {imageUrl && (
              <div className="mt-2 border rounded-md p-2 flex justify-center">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="design, inspiration, article"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              className="bg-mind-accent hover:bg-mind-accent-hover text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
