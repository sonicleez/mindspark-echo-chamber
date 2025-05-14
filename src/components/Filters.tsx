
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'images' | 'articles' | 'notes';

interface FiltersProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const Filters: React.FC<FiltersProps> = ({ currentFilter, onFilterChange }) => {
  const filters: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'images', label: 'Images' },
    { type: 'articles', label: 'Articles' },
    { type: 'notes', label: 'Notes' },
  ];
  
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.type}
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(filter.type)}
          className={cn(
            "text-mind-text-secondary hover:bg-secondary rounded-full px-4",
            currentFilter === filter.type && "bg-secondary font-medium text-mind-text"
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default Filters;
