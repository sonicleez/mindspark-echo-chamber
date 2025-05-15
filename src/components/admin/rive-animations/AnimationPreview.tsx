
import React, { useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { Button } from '@/components/ui/button';
import { RiveAnimation } from './types';
import { getPublicUrl } from './utils';
import { Download, Link } from 'lucide-react';
import { toast } from 'sonner';

interface AnimationPreviewProps {
  animation: RiveAnimation;
}

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({ animation }) => {
  const [loadError, setLoadError] = useState(false);
  const downloadUrl = getPublicUrl(animation.file_path);
  
  const { RiveComponent } = useRive({
    src: downloadUrl,
    autoplay: true,
    onLoad: () => setLoadError(false),
    onLoadError: () => setLoadError(true),
  });
  
  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(downloadUrl)
      .then(() => toast.success('Download URL copied to clipboard'))
      .catch(() => toast.error('Failed to copy URL'));
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{animation.name}</h3>
      {animation.description && (
        <p className="text-sm text-gray-500 mb-4">{animation.description}</p>
      )}
      
      <div className="bg-muted p-3 rounded-md mb-4 flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Download URL:</span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={copyUrlToClipboard}>
              <Link className="h-4 w-4 mr-1" /> Copy URL
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(downloadUrl, '_blank')}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        </div>
        <div className="text-xs bg-background p-2 rounded overflow-auto break-all border">
          {downloadUrl}
        </div>
      </div>
      
      <div className="w-full h-96 bg-gray-100 rounded-md overflow-hidden">
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full bg-red-50">
            <p className="text-red-500 mb-2">Failed to load animation</p>
            <Button variant="outline" size="sm" onClick={() => window.open(downloadUrl, '_blank')}>
              Download File
            </Button>
          </div>
        ) : (
          <RiveComponent />
        )}
      </div>
    </div>
  );
};
