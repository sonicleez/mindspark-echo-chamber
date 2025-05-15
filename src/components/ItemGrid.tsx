
import React from 'react';
import ItemCard, { Item } from './ItemCard';

interface ItemGridProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

const ItemGrid: React.FC<ItemGridProps> = ({ items, onItemClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {items.map((item) => (
        <div key={item.id} className="animate-fade-in">
          <ItemCard item={item} onItemClick={onItemClick} />
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;
