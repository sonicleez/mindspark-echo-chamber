
import React from 'react';
import ItemCard, { Item } from './ItemCard';

interface ItemGridProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  onEditItem?: (item: Item) => void;
  onDeleteItem?: (id: string) => Promise<void>;
}

const ItemGrid: React.FC<ItemGridProps> = ({ items, onItemClick, onEditItem, onDeleteItem }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="animate-fade-in" 
          style={{ 
            animationDelay: `${index * 0.05}s`,
            transform: 'translateY(0)' 
          }}
        >
          <ItemCard 
            item={item} 
            onItemClick={onItemClick} 
            onEditItem={onEditItem} 
            onDeleteItem={onDeleteItem}
          />
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;
