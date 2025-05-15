import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export interface Item {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  tags?: string[];
  dateAdded: Date;
  summary?: string;
  space_id?: string;
}

interface ItemCardProps {
  item: Item;
  onItemClick: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemClick }) => {
  return (
    <Card
      className="bg-[#1E1E24] text-white hover:bg-[#2A2A30] transition-colors cursor-pointer border-[#333] h-full flex flex-col"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1 text-white">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{item.description}</p>
        )}
        {item.imageUrl && (
          <div className="w-full mb-2">
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
        {item.summary && !item.imageUrl && (
          <div className="mt-auto mb-2 p-2 bg-[#FF5733]/20 border border-[#FF5733]/30 rounded text-sm">
            <span className="text-xs font-medium text-[#FF5733] block mb-1">TLDR</span>
            <p className="text-gray-200 line-clamp-2">{item.summary}</p>
          </div>
        )}
        <div className="mt-auto">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#FF5733] hover:text-[#FF5733]/80 underline flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              <span className="truncate">Visit</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemCard;
