
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
  summary?: string;
}

interface ItemCardProps {
  item: Item;
  onItemClick: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemClick }) => {
  return (
    <Card
      className="bg-[#1E1E24] text-white hover:bg-[#2A2A30] transition-colors cursor-pointer border-[#333]"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1 text-white">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-gray-300 line-clamp-2">{item.description}</p>
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
        {item.summary && !item.imageUrl && (
          <div className="mt-2 p-2 bg-[#FF5733]/20 border border-[#FF5733]/30 rounded text-sm">
            <span className="text-xs font-medium text-[#FF5733] block mb-1">TLDR</span>
            <p className="text-gray-200 line-clamp-2">{item.summary}</p>
          </div>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#FF5733] hover:text-[#FF5733]/80 underline flex items-center mt-2"
            onClick={(e) => e.stopPropagation()}
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
