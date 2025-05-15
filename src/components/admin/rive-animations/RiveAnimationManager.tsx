
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RiveAnimation } from './types';
import { AnimationsTable } from './AnimationsTable';
import { UploadDialog } from './UploadDialog';
import { PreviewDialog } from './PreviewDialog';

const RiveAnimationManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewAnimationDialog, setShowNewAnimationDialog] = useState(false);
  const [animationFile, setAnimationFile] = useState<File | null>(null);
  const [animationName, setAnimationName] = useState('');
  const [animationDescription, setAnimationDescription] = useState('');
  const [previewAnimation, setPreviewAnimation] = useState<RiveAnimation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { data: animations = [], isLoading, error } = useQuery({
    queryKey: ['riveAnimations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rive_animations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
  
  const uploadAnimation = useMutation({
    mutationFn: async () => {
      if (!animationFile || !user) throw new Error('Missing file or user');
      setIsSubmitting(true);
      
      try {
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
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
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
      queryClient.invalidateQueries({ queryKey: ['activeRiveAnimations'] });
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
      queryClient.invalidateQueries({ queryKey: ['activeRiveAnimations'] });
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
  
  const handleSubmit = () => {
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
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <h3 className="text-lg font-medium text-red-800">Error loading animations</h3>
        <p className="text-red-700 mt-2">There was a problem loading animations. Please try again later.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['riveAnimations'] })}
        >
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Rive Animations</h2>
        <Button onClick={() => setShowNewAnimationDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Upload Animation
        </Button>
      </div>
      
      <AnimationsTable 
        animations={animations}
        isLoading={isLoading}
        onPreviewClick={setPreviewAnimation}
        onToggleStatus={(id, isActive) => toggleAnimationStatus.mutate({ id, isActive })}
        onDeleteClick={(animation) => deleteAnimation.mutate(animation)}
      />
      
      <UploadDialog 
        open={showNewAnimationDialog}
        onOpenChange={setShowNewAnimationDialog}
        onSubmit={handleSubmit}
        animationName={animationName}
        setAnimationName={setAnimationName}
        animationDescription={animationDescription}
        setAnimationDescription={setAnimationDescription}
        animationFile={animationFile}
        setAnimationFile={setAnimationFile}
        isSubmitting={isSubmitting}
        resetForm={resetForm}
      />
      
      <PreviewDialog
        animation={previewAnimation}
        onClose={() => setPreviewAnimation(null)}
        isMobile={isMobile}
      />
    </div>
  );
};

export default RiveAnimationManager;
