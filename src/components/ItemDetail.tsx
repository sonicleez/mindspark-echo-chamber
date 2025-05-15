
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Item } from './ItemCard';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, PencilLine, Tag, Trash, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ItemDetailProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ item, isOpen, onClose, onDelete, onEdit }) => {
  const [note, setNote] = useState('');
  
  if (!item) return null;

  const formatDate = (date: Date) => {
    return format(date, 'MMMM d, yyyy');
  };

  // Format URL for display (truncate if too long)
  const formatUrl = (url: string) => {
    if (url.length > 40) {
      return `${url.substring(0, 37)}...`;
    }
    return url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#1E1E24] border-[#333] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center justify-between text-white pr-8">
            <span className="line-clamp-1">{item.title}</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-[#333] absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {item.imageUrl && (
          <div className="my-4 w-full">
            <AspectRatio ratio={16 / 9} className="bg-[#2A2A30] overflow-hidden rounded-md">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </AspectRatio>
          </div>
        )}
        
        {/* Display summary if available with red background */}
        {item.summary && (
          <div className="bg-[#FF5733]/20 p-3 rounded-md mb-3 border border-[#FF5733]/30">
            <div className="flex items-center mb-1">
              <FileText className="h-4 w-4 mr-2 text-[#FF5733]" />
              <span className="text-sm font-medium text-[#FF5733]">TLDR</span>
            </div>
            <p className="text-sm">{item.summary}</p>
          </div>
        )}
        
        {item.description && (
          <p className="text-gray-300">{item.description}</p>
        )}
        
        <Separator className="my-4 bg-gray-700" />
        
        <div className="space-y-3">
          {item.url && (
            <div className="flex items-start">
              <ExternalLink className="h-4 w-4 mr-2 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-[#FF5733] underline break-all line-clamp-2"
                  title={item.url}
                >
                  {formatUrl(item.url)}
                </a>
                <span className="text-xs text-gray-500 mt-1">
                  Saved on {formatDate(item.dateAdded)}
                </span>
              </div>
            </div>
          )}
          
          {!item.url && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-300">
                Saved on {formatDate(item.dateAdded)}
              </span>
            </div>
          )}
          
          {/* Mind Tags Section */}
          <div>
            <div className="flex items-center mb-2">
              <Tag className="h-4 w-4 mr-1 text-gray-400" />
              <span className="text-sm text-gray-300">MIND TAGS</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tags && item.tags.length > 0 ? (
                item.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline"
                    className="bg-[#333] text-gray-300 hover:bg-[#444] border-none rounded-full px-3"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">No tags yet</span>
              )}
              <Button 
                size="sm" 
                variant="ghost"
                className="rounded-full bg-[#FF5733] hover:bg-[#FF5733]/80 text-white text-xs px-3 py-1 h-auto"
              >
                + Add tag
              </Button>
            </div>
          </div>
          
          {/* Add Mind Notes section */}
          <div>
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 mr-1 text-gray-400" />
              <span className="text-sm text-gray-300">MIND NOTES</span>
            </div>
            <div className="bg-[#333] rounded-md p-1">
              <Textarea
                placeholder="Type here to add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-300 placeholder:text-gray-500 min-h-[100px] focus-visible:ring-0 resize-none"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="flex items-center gap-1 bg-transparent text-white border-gray-600 hover:bg-[#333]"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onDelete}
              className="flex items-center gap-1 bg-[#FF5733] hover:bg-[#FF5733]/80"
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetail;
