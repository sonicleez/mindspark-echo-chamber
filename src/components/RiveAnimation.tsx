
import React from 'react';
import { useRiveAnimation } from '@rive-app/react-canvas';

interface RiveAnimationProps {
  src: string;
  artboard?: string;
  animations?: string | string[];
  stateMachines?: string | string[];
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const RiveAnimation: React.FC<RiveAnimationProps> = ({
  src,
  artboard,
  animations,
  stateMachines,
  autoplay = true,
  className = '',
  style,
}) => {
  const { RiveComponent, rive } = useRiveAnimation({
    src,
    artboard,
    animations,
    stateMachines,
    autoplay,
  });

  return (
    <div className={className} style={style}>
      <RiveComponent />
    </div>
  );
};

export default RiveAnimation;
