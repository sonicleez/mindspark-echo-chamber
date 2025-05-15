
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Edit, Trash2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

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
  type?: string;
}

interface ItemCardProps {
  item: Item;
  onItemClick: (item: Item) => void;
  onEditItem?: (item: Item) => void;
  onDeleteItem?: (id: string) => Promise<void>;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemClick, onEditItem, onDeleteItem }) => {
  const handleClick = (e: React.MouseEvent) => {
    onItemClick(item);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditItem) onEditItem(item);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteItem) await onDeleteItem(item.id);
  };

  return (
    <Card
      className="bg-[#1E1E24] text-white hover:bg-[#2A2A30] transition-colors cursor-pointer border-[#333] h-full flex flex-col relative"
      onClick={handleClick}
    >
      {(onEditItem || onDeleteItem) && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2A2A30] border-[#333] text-white">
              {onEditItem && (
                <DropdownMenuItem className="hover:bg-[#3A3A40]" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDeleteItem && (
                <DropdownMenuItem className="hover:bg-[#3A3A40] text-red-400" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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
