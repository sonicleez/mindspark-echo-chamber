import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Item } from './ItemCard';

export interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onUpdateItem: (updatedItem: Partial<Item>) => Promise<void>;
}

const EditItemDialog: React.FC<EditItemDialogProps> = ({ isOpen, onClose, item, onUpdateItem }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setUrl(item.url || '');
      setTags(item.tags || []);
      setImageUrl(item.imageUrl || '');
      setType(item.type || '');
    }
  }, [item]);

  const handleTagAdd = () => {
    if (newTag.trim() !== '') {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleSubmit = async () => {
    if (!item) return;

    const updatedItem: Partial<Item> = {
      title,
      description,
      url,
      tags,
      imageUrl,
      type
    };

    await onUpdateItem(updatedItem);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1E1E24] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-white">Edit Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="title" className="text-right text-sm font-medium text-gray-300">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 bg-[#2A2A30] border-[#333] text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right text-sm font-medium text-gray-300">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 bg-[#2A2A30] border-[#333] text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="url" className="text-right text-sm font-medium text-gray-300">
              URL
            </label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="col-span-3 bg-[#2A2A30] border-[#333] text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="imageUrl" className="text-right text-sm font-medium text-gray-300">
              Image URL
            </label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="col-span-3 bg-[#2A2A30] border-[#333] text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="text-right text-sm font-medium text-gray-300">
              Type
            </label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="col-span-3 bg-[#2A2A30] border-[#333] text-white"
            />
          </div>
          <div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-300">Tags</label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-[#333] text-gray-300 hover:bg-[#444] border-none rounded-full px-3">
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 rounded-full"
                      onClick={() => handleTagDelete(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-2">
              <label htmlFor="newTag" className="text-right text-sm font-medium text-gray-300"></label>
              <Input
                id="newTag"
                placeholder="New tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="col-span-2 bg-[#2A2A30] border-[#333] text-white"
              />
              <Button variant="secondary" size="sm" onClick={handleTagAdd} className="bg-[#333] hover:bg-[#444]">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" onClick={handleSubmit} className="bg-[#FF5733] hover:bg-[#FF5733]/80 text-white">
            Update Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
