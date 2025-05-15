
import React from 'react';
import Rive from '@rive-app/react-canvas';

interface RiveAnimationProps {
  src: string;
  artboard?: string;
  animations?: string | string[];
  stateMachines?: string | string[];
  className?: string;
  autoplay?: boolean;
  fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight' | 'none' | 'scale-down';
}

const RiveAnimation: React.FC<RiveAnimationProps> = ({ 
  src, 
  artboard, 
  animations, 
  stateMachines,
  className,
  autoplay = true,
  fit = 'contain'
}) => {
  return (
    <Rive 
      src={src}
      artboard={artboard}
      animations={animations}
      stateMachines={stateMachines}
      className={className}
      autoplay={autoplay}
      fit={fit}
    />
  );
};

export default RiveAnimation;
