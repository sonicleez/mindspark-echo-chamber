
import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Item {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  tags?: string[];
  dateAdded: Date;
}

interface ItemCardProps {
  item: Item;
  onClick: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const handleClick = () => {
    onClick(item);
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden card-hover cursor-pointer bg-mind-card border-mind-border h-full",
        !item.imageUrl && "p-4"
      )}
      onClick={handleClick}
    >
      {item.imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={cn("p-4", item.imageUrl && "pt-3")}>
        <h3 className="font-medium text-mind-text line-clamp-2">{item.title}</h3>
        {item.description && (
          <p className="text-mind-text-secondary text-sm mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((tag) => (
              <span 
                key={tag} 
                className="text-xs px-2 py-0.5 bg-secondary text-mind-text-secondary rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ItemCard;
