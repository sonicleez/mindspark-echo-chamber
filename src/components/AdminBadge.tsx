
import React, { useEffect } from 'react';
import { useRive, Layout, Fit, Alignment } from 'rive-react';

const AdminBadge: React.FC = () => {
  const { RiveComponent, rive } = useRive({
    src: 'https://public.rive.app/community/runtime-files/2244-4463-admin-badge.riv',
    stateMachines: 'State Machine 1',
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    autoplay: true,
  });

  // Trigger animation when component is mounted
  useEffect(() => {
    if (rive) {
      rive.play();
    }
    return () => {
      if (rive) {
        rive.pause();
      }
    };
  }, [rive]);

  return (
    <div className="w-6 h-6">
      <RiveComponent />
    </div>
  );
};

export default AdminBadge;
