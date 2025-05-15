import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Item } from './ItemCard';

export interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (newItem: Partial<Item>) => Promise<void>;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({ isOpen, onClose, onAddItem }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [type, setType] = useState('other');
  
  const handleSubmit = async () => {
    const newItem = {
      title,
      description,
      url,
      tags,
      type
    };
    await onAddItem(newItem);
    onClose();
    resetForm();
  };
  
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setTags([]);
    setNewTag('');
    setType('other');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1E1E24] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center justify-between text-white">
            Add New Item
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-[#333]">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium leading-none">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#2A2A30] border-[#333] text-white"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium leading-none">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#2A2A30] border-[#333] text-white min-h-[80px]"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="url" className="text-sm font-medium leading-none">URL</label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-[#2A2A30] border-[#333] text-white"
            />
          </div>
          
          {/* Tags Input */}
          <div className="grid gap-2">
            <label htmlFor="tags" className="text-sm font-medium leading-none">Tags</label>
            <div className="flex items-center space-x-2">
              <Input
                id="new-tag"
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="bg-[#2A2A30] border-[#333] text-white"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddTag}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-[#333] text-gray-300 hover:bg-[#444] border-none rounded-full px-2.5 py-0.5 cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Type Selection */}
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-medium leading-none">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-[#2A2A30] border-[#333] text-white rounded-md px-3 py-2"
            >
              <option value="other">Other</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="book">Book</option>
            </select>
          </div>
        </div>
        
        <Button type="submit" className="w-full bg-[#FF5733] hover:bg-[#FF5733]/80 text-white" onClick={handleSubmit}>
          Add Item
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
