
import React from 'react';
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, Download } from 'lucide-react';
import { RiveAnimation } from './types';
import { Spinner } from '@/components/ui/spinner';
import { getPublicUrl } from './utils';

interface AnimationsTableProps {
  animations: RiveAnimation[];
  isLoading: boolean;
  onPreviewClick: (animation: RiveAnimation) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDeleteClick: (animation: RiveAnimation) => void;
}

export const AnimationsTable: React.FC<AnimationsTableProps> = ({
  animations,
  isLoading,
  onPreviewClick,
  onToggleStatus,
  onDeleteClick
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-4">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </TableCell>
            </TableRow>
          ) : animations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-4">
                No animations found. Upload your first animation!
              </TableCell>
            </TableRow>
          ) : (
            animations.map((animation) => (
              <TableRow key={animation.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{animation.name}</div>
                    {animation.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {animation.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{new Date(animation.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(animation.updated_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Switch
                    checked={animation.is_active}
                    onCheckedChange={(checked) => 
                      onToggleStatus(animation.id, checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onPreviewClick(animation)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(getPublicUrl(animation.file_path), '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteClick(animation)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
