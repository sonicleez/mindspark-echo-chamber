
import React, { useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { Button } from '@/components/ui/button';
import { RiveAnimation } from './types';
import { getPublicUrl } from './utils';

interface AnimationPreviewProps {
  animation: RiveAnimation;
}

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({ animation }) => {
  const [loadError, setLoadError] = useState(false);
  
  const { RiveComponent } = useRive({
    src: getPublicUrl(animation.file_path),
    autoplay: true,
    onLoad: () => setLoadError(false),
    onLoadError: () => setLoadError(true),
  });
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{animation.name}</h3>
      {animation.description && (
        <p className="text-sm text-gray-500 mb-4">{animation.description}</p>
      )}
      <div className="w-full h-96 bg-gray-100 rounded-md overflow-hidden">
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full bg-red-50">
            <p className="text-red-500 mb-2">Failed to load animation</p>
            <Button variant="outline" size="sm" onClick={() => window.open(getPublicUrl(animation.file_path), '_blank')}>
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
