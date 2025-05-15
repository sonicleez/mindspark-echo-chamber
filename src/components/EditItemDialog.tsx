
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { Item } from '@/components/ItemCard';
import { summarizeContent } from '@/services/itemsService';
import { toast } from 'sonner';
import { Space } from '@/services/spacesService';

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditItem: (id: string, updatedItem: Partial<Omit<Item, 'id' | 'dateAdded'>>) => void;
  item: Item | null;
  spaces: Space[];
}

const EditItemDialog: React.FC<EditItemDialogProps> = ({ isOpen, onClose, onEditItem, item, spaces }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  useEffect(() => {
    if (item && isOpen) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setUrl(item.url || '');
      setImageUrl(item.imageUrl || '');
      setTags(item.tags || []);
      setSummary(item.summary || '');
      setSelectedSpaceId(item.space_id || null);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!item) return;

    onEditItem(item.id, {
      title,
      description: description || undefined,
      url: url || undefined,
      imageUrl: imageUrl || undefined,
      tags,
      summary: summary || undefined,
      space_id: selectedSpaceId || undefined
    });
    
    onClose();
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleGenerateSummary = async () => {
    if (!description) {
      toast.error("Please add a description to generate a summary");
      return;
    }
    
    try {
      setIsSummarizing(true);
      const generatedSummary = await summarizeContent(description);
      setSummary(generatedSummary);
      toast.success("Summary generated successfully");
    } catch (error) {
      toast.error("Failed to generate summary");
      console.error(error);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#1E1E24] border-[#333] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Edit Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="bg-[#2A2A30] border-[#333] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="bg-[#2A2A30] border-[#333] text-white min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={isSummarizing || !description}
                className="text-xs bg-transparent border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5]/20"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : "Generate Summary"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="text-gray-300">Summary (Optional)</Label>
            <Textarea 
              id="summary" 
              value={summary} 
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary"
              className="bg-[#2A2A30] border-[#333] text-white min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-gray-300">URL (Optional)</Label>
            <Input 
              id="url" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL"
              className="bg-[#2A2A30] border-[#333] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-gray-300">Image URL (Optional)</Label>
            <Input 
              id="imageUrl" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
              className="bg-[#2A2A30] border-[#333] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-gray-300">Tags (Optional)</Label>
            <div className="flex">
              <Input 
                id="tags" 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tags and press Enter"
                className="bg-[#2A2A30] border-[#333] text-white flex-1"
              />
              <Button 
                type="button" 
                onClick={addTag}
                className="ml-2 bg-[#9b87f5] hover:bg-[#8a76e4]"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge 
                    key={tag}
                    className="bg-[#333] hover:bg-[#444] text-white"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-300 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="space" className="text-gray-300">Space (Optional)</Label>
            <select
              id="space"
              value={selectedSpaceId || ""}
              onChange={(e) => setSelectedSpaceId(e.target.value || null)}
              className="w-full bg-[#2A2A30] border-[#333] text-white rounded-md px-3 py-2"
            >
              <option value="">No Space</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} className="border-[#333] text-white hover:bg-[#333]">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#9b87f5] hover:bg-[#8a76e4] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
