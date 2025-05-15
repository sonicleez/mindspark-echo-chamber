import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export interface Item {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  tags?: string[];
  dateAdded: Date;
  summary?: string; // Add this new field
}

interface ItemCardProps {
  item: Item;
  onItemClick: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemClick }) => {
  return (
    <Card
      className="bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-mind-text-secondary line-clamp-2">{item.description}</p>
        )}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-32 object-cover rounded-md mt-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-mind-accent hover:text-mind-accent-hover underline flex items-center mt-2"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            <span>Visit</span>
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default ItemCard;
