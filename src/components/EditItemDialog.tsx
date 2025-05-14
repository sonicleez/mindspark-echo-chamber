
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Item } from './ItemCard';
import { X } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setUrl(item.url || '');
      setImageUrl(item.imageUrl || '');
      setDescription(item.description || '');
      setTags(item.tags ? item.tags.join(', ') : '');
    }
  }, [item]);

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center justify-between">
            Edit Item
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {item && (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
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
