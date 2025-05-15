
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useRive } from '@rive-app/react-canvas';
import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerHeader, 
  DrawerTitle, DrawerFooter
} from '@/components/ui/drawer';
import { Plus, Eye, Trash2, Upload } from 'lucide-react';

interface RiveAnimation {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

const RiveAnimationManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewAnimationDialog, setShowNewAnimationDialog] = useState(false);
  const [animationFile, setAnimationFile] = useState<File | null>(null);
  const [animationName, setAnimationName] = useState('');
  const [animationDescription, setAnimationDescription] = useState('');
  const [previewAnimation, setPreviewAnimation] = useState<RiveAnimation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { data: animations = [], isLoading } = useQuery({
    queryKey: ['riveAnimations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rive_animations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });
  
  const uploadAnimation = useMutation({
    mutationFn: async () => {
      if (!animationFile || !user) throw new Error('Missing file or user');
      setIsSubmitting(true);
      
      // Upload file to storage
      const fileName = `${Date.now()}_${animationFile.name}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('animations')
        .upload(filePath, animationFile);
        
      if (uploadError) throw uploadError;
      
      // Create record in rive_animations table
      const { error: insertError } = await supabase
        .from('rive_animations')
        .insert({
          name: animationName,
          description: animationDescription || null,
          file_path: filePath,
          created_by: user.id,
        });
        
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riveAnimations'] });
      toast.success('Animation uploaded successfully');
      resetForm();
      setShowNewAnimationDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to upload animation: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
  
  const toggleAnimationStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const { error } = await supabase
        .from('rive_animations')
        .update({ is_active: isActive })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riveAnimations'] });
      toast.success('Animation status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update animation: ${error.message}`);
    },
  });
  
  const deleteAnimation = useMutation({
    mutationFn: async (animation: RiveAnimation) => {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('animations')
        .remove([animation.file_path]);
        
      if (storageError) throw storageError;
      
      // Delete record from database
      const { error: dbError } = await supabase
        .from('rive_animations')
        .delete()
        .eq('id', animation.id);
        
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riveAnimations'] });
      toast.success('Animation deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete animation: ${error.message}`);
    },
  });
  
  const resetForm = () => {
    setAnimationFile(null);
    setAnimationName('');
    setAnimationDescription('');
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.riv')) {
        setAnimationFile(file);
      } else {
        toast.error('Please upload a valid Rive animation file (.riv)');
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!animationFile) {
      toast.error('Please select a Rive animation file');
      return;
    }
    
    if (!animationName.trim()) {
      toast.error('Please enter a name for the animation');
      return;
    }
    
    uploadAnimation.mutate();
  };
  
  const getPublicUrl = (filePath: string) => {
    return supabase.storage.from('animations').getPublicUrl(filePath).data.publicUrl;
  };
  
  // Animation Preview Component
  const AnimationPreview: React.FC<{ animation: RiveAnimation }> = ({ animation }) => {
    const { RiveComponent } = useRive({
      src: getPublicUrl(animation.file_path),
      autoplay: true,
    });
    
    return (
      <div>
        <h3 className="text-lg font-medium mb-2">{animation.name}</h3>
        {animation.description && (
          <p className="text-sm text-gray-500 mb-4">{animation.description}</p>
        )}
        <div className="w-full h-96 bg-gray-100 rounded-md overflow-hidden">
          <RiveComponent />
        </div>
      </div>
    );
  };
  
  const PreviewDialog = () => {
    if (!previewAnimation) return null;
    
    const CloseButton = () => (
      <Button onClick={() => setPreviewAnimation(null)}>Close</Button>
    );
    
    if (isMobile) {
      return (
        <Drawer open={!!previewAnimation} onOpenChange={() => setPreviewAnimation(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Animation Preview</DrawerTitle>
            </DrawerHeader>
            <div className="px-4">
              <AnimationPreview animation={previewAnimation} />
            </div>
            <DrawerFooter>
              <CloseButton />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }
    
    return (
      <Dialog open={!!previewAnimation} onOpenChange={() => setPreviewAnimation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Animation Preview</DialogTitle>
          </DialogHeader>
          <AnimationPreview animation={previewAnimation} />
          <DialogFooter>
            <CloseButton />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Rive Animations</h2>
        <Button onClick={() => setShowNewAnimationDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Upload Animation
        </Button>
      </div>
      
      {/* Animation List */}
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
                  Loading...
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
                        toggleAnimationStatus.mutate({ id: animation.id, isActive: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPreviewAnimation(animation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteAnimation.mutate(animation)}
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
      
      {/* Upload Dialog */}
      <Dialog open={showNewAnimationDialog} onOpenChange={setShowNewAnimationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Rive Animation</DialogTitle>
            <DialogDescription>
              Upload a new .riv animation file to use in your application.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
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
                  setShowNewAnimationDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Preview Dialog/Drawer */}
      <PreviewDialog />
    </div>
  );
};

export default RiveAnimationManagement;
