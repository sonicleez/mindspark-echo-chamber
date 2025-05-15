
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AnimationPreview } from './AnimationPreview';
import { RiveAnimation } from './types';

interface PreviewDialogProps {
  animation: RiveAnimation | null;
  onClose: () => void;
  isMobile: boolean;
}

export const PreviewDialog: React.FC<PreviewDialogProps> = ({ animation, onClose, isMobile }) => {
  if (!animation) return null;
  
  const CloseButton = () => (
    <Button onClick={onClose}>Close</Button>
  );
  
  if (isMobile) {
    return (
      <Drawer open={!!animation} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Animation Preview</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <AnimationPreview animation={animation} />
          </div>
          <DrawerFooter>
            <CloseButton />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Dialog open={!!animation} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Animation Preview</DialogTitle>
        </DialogHeader>
        <AnimationPreview animation={animation} />
        <DialogFooter>
          <CloseButton />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
