
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

  // Handle hover interaction
  useEffect(() => {
    if (rive) {
      const container = document.getElementById('admin-badge-container');
      
      const handleMouseEnter = () => {
        if (rive && rive.stateMachineInputs) {
          const hoverInput = rive.stateMachineInputs('State Machine 1');
          const input = hoverInput?.find(input => input.name === 'Hover');
          if (input) input.value = true;
        }
      };
      
      const handleMouseLeave = () => {
        if (rive && rive.stateMachineInputs) {
          const hoverInput = rive.stateMachineInputs('State Machine 1');
          const input = hoverInput?.find(input => input.name === 'Hover');
          if (input) input.value = false;
        }
      };
      
      if (container) {
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);
      }
      
      return () => {
        if (container) {
          container.removeEventListener('mouseenter', handleMouseEnter);
          container.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
    }
  }, [rive]);

  return (
    <div id="admin-badge-container" className="w-6 h-6 mr-1">
      <RiveComponent />
    </div>
  );
};

export default AdminBadge;
