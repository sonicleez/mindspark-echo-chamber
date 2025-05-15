
import React from 'react';
import RiveAnimationManager from './rive-animations/RiveAnimationManager';

const RiveAnimationManagement: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Rive Animation Management</h1>
      <RiveAnimationManager />
    </div>
  );
};

export default RiveAnimationManagement;
