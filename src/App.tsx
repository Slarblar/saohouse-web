// React import not needed in modern React with automatic JSX transform
import { useState } from 'react';
import PremiumHero from './components/PremiumHero';
import FloatingButtons from './components/FloatingButtons';

function App() {
  return (
    <div className="app">
      <PremiumHero />
      <FloatingButtons />
    </div>
  );
}

export default App; 