
import React, { useEffect, useRef } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface RiveAnimationProps {
  src: string;
  stateMachine?: string;
  autoplay?: boolean;
  className?: string;
  artboard?: string;
  fit?: Fit;
  alignment?: Alignment;
  layout?: Layout;
}

const RiveAnimation: React.FC<RiveAnimationProps> = ({
  src,
  stateMachine,
  autoplay = true,
  className = '',
  artboard,
  fit = Fit.Contain,
  alignment = Alignment.Center,
  layout = Layout.New,
}) => {
  const { RiveComponent, rive } = useRive({
    src,
    stateMachines: stateMachine ? [stateMachine] : undefined,
    autoplay,
    artboard,
    layout,
    fit,
    alignment,
  });

  return (
    <div className={className}>
      <RiveComponent />
    </div>
  );
};

export default RiveAnimation;
