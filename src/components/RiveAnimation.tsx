
import React, { useEffect, useRef } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface RiveAnimationProps {
  src: string;
  stateMachine?: string;
  className?: string;
  autoplay?: boolean;
}

const RiveAnimation: React.FC<RiveAnimationProps> = ({ 
  src, 
  stateMachine, 
  className,
  autoplay = true
}) => {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine ? [stateMachine] : undefined,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center
    }),
    autoplay,
  });

  return (
    <div className={className}>
      <RiveComponent />
    </div>
  );
};

export default RiveAnimation;
