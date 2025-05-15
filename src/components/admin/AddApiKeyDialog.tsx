
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiServiceType } from '@/types/apiKeys';

interface AddApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddKey: (name: string, key: string) => void;
  selectedServiceName: string;
}

const AddApiKeyDialog: React.FC<AddApiKeyDialogProps> = ({ 
  open, 
  onOpenChange, 
  onAddKey, 
  selectedServiceName 
}) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  const handleAddKey = () => {
    onAddKey(newKeyName, newApiKey);
    setNewKeyName('');
    setNewApiKey('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New API Key</DialogTitle>
          <DialogDescription>
            Add a new API key for {selectedServiceName || 'selected service'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="keyName" className="text-sm font-medium">Key Name</label>
            <Input
              id="keyName"
              placeholder="My API Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">API Key</label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter the API key"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddKey} disabled={!newKeyName || !newApiKey}>Add Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddApiKeyDialog;
