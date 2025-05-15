
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Item } from './ItemCard';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, PencilLine, Tag, Trash, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface ItemDetailProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ item, isOpen, onClose, onDelete, onEdit }) => {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center justify-between">
            {item.title}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {item.imageUrl && (
          <div className="rounded-md overflow-hidden my-2">
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-full object-cover"
            />
          </div>
        )}
        
        {/* Display summary if available */}
        {item.summary && (
          <div className="bg-secondary/50 p-3 rounded-md mb-3">
            <div className="flex items-center mb-1">
              <FileText className="h-4 w-4 mr-2 text-mind-accent" />
              <span className="text-sm font-medium text-mind-accent">Summary</span>
            </div>
            <p className="text-sm italic">{item.summary}</p>
          </div>
        )}
        
        {item.description && (
          <p className="text-mind-text-secondary">{item.description}</p>
        )}
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          {item.url && (
            <div className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2 text-mind-text-secondary" />
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-mind-text-secondary hover:text-mind-accent underline truncate"
              >
                {item.url}
              </a>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-mind-text-secondary" />
            <span className="text-sm text-mind-text-secondary">
              Saved on {format(item.dateAdded, 'MMMM d, yyyy')}
            </span>
          </div>
          
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2">
              <Tag className="h-4 w-4 mr-1 text-mind-text-secondary" />
              {item.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="text-xs px-2 py-1 bg-secondary text-mind-text-secondary rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="flex items-center gap-1"
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
              className="flex items-center gap-1"
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
