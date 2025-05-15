
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { File, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useRive } from '@rive-app/react-canvas';

const RiveAnimationManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddAnimationDialogOpen, setIsAddAnimationDialogOpen] = useState(false);
  const [newAnimationName, setNewAnimationName] = useState('');
  const [newAnimationDescription, setNewAnimationDescription] = useState('');
  const [newAnimationFilePath, setNewAnimationFilePath] = useState('');
  const [animationToDelete, setAnimationToDelete] = useState<string | null>(null);

  // Fetch animations
  const { data: animations = [], isLoading } = useQuery({
    queryKey: ['riveAnimations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rive_animations')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  const addAnimation = useMutation({
    mutationFn: async () => {
      if (!newAnimationName.trim() || !newAnimationFilePath.trim()) {
        throw new Error('Name and file path are required');
      }
      
      const { data, error } = await supabase
        .from('rive_animations')
        .insert({
          name: newAnimationName.trim(),
          description: newAnimationDescription.trim() || null,
          file_path: newAnimationFilePath.trim(),
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        })
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riveAnimations'] });
      setIsAddAnimationDialogOpen(false);
      setNewAnimationName('');
      setNewAnimationDescription('');
      setNewAnimationFilePath('');
      toast.success('Animation added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add animation: ${error.message}`);
    }
  });

  const deleteAnimation = useMutation({
    mutationFn: async (animationId: string) => {
      const { error } = await supabase
        .from('rive_animations')
        .delete()
        .eq('id', animationId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riveAnimations'] });
      setAnimationToDelete(null);
      toast.success('Animation deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete animation: ${error.message}`);
    }
  });

  const setActiveAnimation = useMutation({
    mutationFn: async (animationId: string) => {
      // First, deactivate all animations
      const { error: deactivateError } = await supabase
        .from('rive_animations')
        .update({ is_active: false });
        
      if (deactivateError) throw deactivateError;
      
      // Then, activate the selected animation
      const { error: activateError } = await supabase
        .from('rive_animations')
        .update({ is_active: true })
        .eq('id', animationId);
        
      if (activateError) throw activateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riveAnimations'] });
      toast.success('Active animation updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update active animation: ${error.message}`);
    }
  });

  const handleAddAnimation = () => {
    addAnimation.mutate();
  };

  const confirmDeleteAnimation = (animationId: string) => {
    setAnimationToDelete(animationId);
  };

  const handleDeleteAnimation = () => {
    if (animationToDelete) {
      deleteAnimation.mutate(animationToDelete);
    }
  };

  const handleSetActiveAnimation = (animationId: string) => {
    setActiveAnimation.mutate(animationId);
  };

  // Sample Rive Animation Preview
  const { RiveComponent } = useRive({
    src: '/Addnew.riv',
    autoplay: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rive Animation Management</h2>
        <Button onClick={() => setIsAddAnimationDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Animation
        </Button>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-center">Loading animations...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {animations.length === 0 ? (
              <p className="col-span-full text-center text-gray-500">
                No animations configured. Add a new animation to get started.
              </p>
            ) : (
              animations.map(animation => (
                <Card key={animation.id} className="overflow-hidden">
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    {animation.file_path === '/Addnew.riv' ? (
                      <div className="h-full w-full">
                        <RiveComponent />
                      </div>
                    ) : (
                      <File className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{animation.name}</CardTitle>
                      {animation.is_active && (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {animation.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(animation.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        {!animation.is_active && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSetActiveAnimation(animation.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Set Active
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => confirmDeleteAnimation(animation.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
      
      {/* Add Animation Dialog */}
      <Dialog open={isAddAnimationDialogOpen} onOpenChange={setIsAddAnimationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Rive Animation</DialogTitle>
            <DialogDescription>
              Add a new Rive animation to your application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="animationName" className="text-sm font-medium">Animation Name</label>
              <Input
                id="animationName"
                placeholder="My Animation"
                value={newAnimationName}
                onChange={(e) => setNewAnimationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                placeholder="Describe the animation"
                value={newAnimationDescription}
                onChange={(e) => setNewAnimationDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="filePath" className="text-sm font-medium">File Path</label>
              <Input
                id="filePath"
                placeholder="/path/to/animation.riv"
                value={newAnimationFilePath}
                onChange={(e) => setNewAnimationFilePath(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                For testing purposes, you can use "/Addnew.riv" which is included in the project.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAnimationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAnimation} disabled={!newAnimationName || !newAnimationFilePath}>Add Animation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!animationToDelete} onOpenChange={(open) => !open && setAnimationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this animation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAnimation} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RiveAnimationManagement;
