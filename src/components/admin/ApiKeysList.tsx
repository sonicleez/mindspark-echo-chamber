
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ApiKeyCard from './ApiKeyCard';
import { ApiKeyConfig } from '@/types/apiKeys';

interface ApiKeysListProps {
  serviceName: string;
  keys: ApiKeyConfig[];
  activeKeyId: string | null;
  onAddKey: () => void;
  onDeleteKey: (keyId: string) => void;
  onSetActiveKey: (keyId: string) => void;
}

const ApiKeysList: React.FC<ApiKeysListProps> = ({ 
  serviceName, 
  keys, 
  activeKeyId, 
  onAddKey, 
  onDeleteKey, 
  onSetActiveKey 
}) => {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Available API Keys</h3>
        <Button onClick={onAddKey} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Key
        </Button>
      </div>
      
      {keys.length === 0 ? (
        <p className="text-gray-500">
          No API keys configured. Add a new key to start using {serviceName} API.
        </p>
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <ApiKeyCard 
              key={key.id} 
              apiKey={key}
              isActive={key.id === activeKeyId}
              onDelete={onDeleteKey}
              onSetActive={onSetActiveKey}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiKeysList;
