
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Key, Copy, Trash2, CheckCircle } from 'lucide-react';
import { ApiKey } from '@/types/apiKeys';
import { toast } from 'sonner';

interface ApiKeyCardProps {
  apiKey: ApiKey;
  isActive: boolean;
  onDelete: (keyId: string) => void;
  onSetActive: (keyId: string) => void;
}

const ApiKeyCard: React.FC<ApiKeyCardProps> = ({ apiKey, isActive, onDelete, onSetActive }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div 
      className={`p-3 border rounded-lg flex items-center justify-between ${isActive ? 'bg-green-50 border-green-200' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <Key className="h-4 w-4 text-gray-500" />
        <div>
          <div className="font-medium">{apiKey.name}</div>
          <div className="text-xs text-gray-500">
            Created: {new Date(apiKey.created_at).toLocaleDateString()}
          </div>
        </div>
        {apiKey.is_active && (
          <Badge className="bg-green-500">Active</Badge>
        )}
      </div>
      <div className="flex space-x-2">
        {!apiKey.is_active && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onSetActive(apiKey.id)}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Set Active
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => copyToClipboard(apiKey.key)}
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="sr-only">Copy</span>
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="text-red-500 hover:bg-red-50"
          onClick={() => onDelete(apiKey.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
};

export default ApiKeyCard;
