
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure Rive asset is loaded
const preloadRiveAsset = () => {
  const img = new Image();
  img.src = 'https://public.rive.app/community/runtime-files/2244-4463-admin-badge.riv';
};

// Preload assets
preloadRiveAsset();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
