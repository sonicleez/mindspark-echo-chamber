
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Item } from './ItemCard';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FiltersProps {
  onFilterChange: (filters: {
    types: string[];
    tags: string[];
    dateRange: { from: Date | null; to: Date | null };
  }) => void;
  items: Item[];
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange, items }) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  
  // Extract unique types and tags from items
  const uniqueTypes = [...new Set(items.map(item => item.type || 'other').filter(Boolean))];
  const uniqueTags = [...new Set(items.flatMap(item => item.tags || []).filter(Boolean))];
  
  // Update filters when selections change
  useEffect(() => {
    onFilterChange({
      types: selectedTypes,
      tags: selectedTags,
      dateRange,
    });
  }, [selectedTypes, selectedTags, dateRange]);
  
  const handleTypeChange = (type: string, checked: boolean) => {
    setSelectedTypes(prev => 
      checked ? [...prev, type] : prev.filter(t => t !== type)
    );
  };
  
  const handleTagChange = (tag: string, checked: boolean) => {
    setSelectedTags(prev => 
      checked ? [...prev, tag] : prev.filter(t => t !== tag)
    );
  };
  
  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedTags([]);
    setDateRange({ from: null, to: null });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-white mb-3">Filter by Type</h3>
        <div className="space-y-2">
          {uniqueTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`type-${type}`} 
                checked={selectedTypes.includes(type)}
                onCheckedChange={(checked) => handleTypeChange(type, !!checked)}
              />
              <label 
                htmlFor={`type-${type}`}
                className="text-sm text-gray-300 cursor-pointer"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {uniqueTags.length > 0 && (
        <div>
          <h3 className="font-medium text-white mb-3">Filter by Tag</h3>
          <div className="space-y-2">
            {uniqueTags.map(tag => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox 
                  id={`tag-${tag}`} 
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={(checked) => handleTagChange(tag, !!checked)}
                />
                <label 
                  htmlFor={`tag-${tag}`}
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  {tag}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="font-medium text-white mb-3">Filter by Date</h3>
        <div className="space-y-2">
          <div>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from || undefined,
                      to: dateRange.to || undefined,
                    }}
                    onSelect={(range) =>
                      setDateRange({
                        from: range?.from || null,
                        to: range?.to || null,
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={clearFilters}
        className="w-full"
      >
        Clear Filters
      </Button>
    </div>
  );
};

export default Filters;
