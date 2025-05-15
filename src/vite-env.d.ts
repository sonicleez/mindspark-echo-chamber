
/// <reference types="vite/client" />

// Add type definitions for Rive
declare module '@rive-app/react-canvas' {
  import { FC } from 'react';

  export interface RiveProps {
    src: string;
    artboard?: string;
    animations?: string | string[];
    autoplay?: boolean;
    layout?: any;
    fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight' | 'none' | 'scale-down';
    className?: string;
    style?: React.CSSProperties;
    stateMachines?: string | string[];
    onPlay?: (animationName: string) => void;
    onPause?: (animationName: string) => void;
    onStop?: (animationName: string) => void;
    onLoad?: () => void;
    onLoadError?: (error: any) => void;
    onStateChange?: (stateMachineName: string, stateName: string) => void;
  }

  const Rive: FC<RiveProps>;
  export default Rive;
}
