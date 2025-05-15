
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  animationName: string;
  setAnimationName: (name: string) => void;
  animationDescription: string;
  setAnimationDescription: (desc: string) => void;
  animationFile: File | null;
  setAnimationFile: (file: File | null) => void;
  isSubmitting: boolean;
  resetForm: () => void;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  animationName,
  setAnimationName,
  animationDescription,
  setAnimationDescription,
  animationFile,
  setAnimationFile,
  isSubmitting,
  resetForm
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.riv')) {
        setAnimationFile(file);
      } else {
        // Using sonner toast directly since it's already used in the parent component
        const { toast } = require('sonner');
        toast.error('Please upload a valid Rive animation file (.riv)');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Rive Animation</DialogTitle>
          <DialogDescription>
            Upload a new .riv animation file to use in your application.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Animation Name</label>
              <Input
                id="name"
                placeholder="My Cool Animation"
                value={animationName}
                onChange={(e) => setAnimationName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description">Description (optional)</label>
              <Textarea
                id="description"
                placeholder="Describe what this animation does"
                value={animationDescription}
                onChange={(e) => setAnimationDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <label>Animation File (.riv)</label>
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  {!animationFile ? (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag and drop or click to upload
                      </p>
                      <Input
                        id="file"
                        type="file"
                        accept=".riv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById('file')?.click()}
                      >
                        Select File
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="font-medium">{animationFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(animationFile.size / 1024).toFixed(2)} KB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setAnimationFile(null)}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Spinner size="sm" className="mr-2" /> Uploading...</>
              ) : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
