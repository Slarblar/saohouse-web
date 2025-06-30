// React import not needed in modern React with automatic JSX transform
import { useState } from 'react';
import PremiumHero from './components/PremiumHero';
import FloatingButtons from './components/FloatingButtons';
import BaselineTest from './components/BaselineTest';
import MinimalShaderTest from './components/MinimalShaderTest';
import StaticTest from './components/StaticTest';

function App() {
  const [testMode, setTestMode] = useState<'normal' | 'baseline' | 'shader' | 'static'>('normal');

  const renderTestMode = () => {
    switch (testMode) {
      case 'static':
        return <StaticTest />;
      case 'baseline':
        return <BaselineTest />;
      case 'shader':
        return <MinimalShaderTest />;
      default:
        return (
          <>
            <PremiumHero />
            <FloatingButtons />
          </>
        );
    }
  };

  return (
    <div className="app">
      {/* Test mode switcher */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        gap: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '10px',
        borderRadius: '8px',
      }}>
                 <button 
           onClick={() => setTestMode('normal')}
           style={{
             padding: '8px 16px',
             backgroundColor: testMode === 'normal' ? '#2563eb' : 'transparent',
             color: 'white',
             border: '1px solid #2563eb',
             borderRadius: '4px',
             cursor: 'pointer',
             fontSize: '12px',
           }}
         >
           Normal
         </button>
         <button 
           onClick={() => setTestMode('static')}
           style={{
             padding: '8px 16px',
             backgroundColor: testMode === 'static' ? '#8b5cf6' : 'transparent',
             color: 'white',
             border: '1px solid #8b5cf6',
             borderRadius: '4px',
             cursor: 'pointer',
             fontSize: '12px',
           }}
         >
           Static Test
         </button>
         <button 
           onClick={() => setTestMode('baseline')}
           style={{
             padding: '8px 16px',
             backgroundColor: testMode === 'baseline' ? '#10b981' : 'transparent',
             color: 'white',
             border: '1px solid #10b981',
             borderRadius: '4px',
             cursor: 'pointer',
             fontSize: '12px',
           }}
         >
           Baseline Test
         </button>
         <button 
           onClick={() => setTestMode('shader')}
           style={{
             padding: '8px 16px',
             backgroundColor: testMode === 'shader' ? '#f59e0b' : 'transparent',
             color: 'white',
             border: '1px solid #f59e0b',
             borderRadius: '4px',
             cursor: 'pointer',
             fontSize: '12px',
           }}
         >
           Shader Test
         </button>
      </div>

      {renderTestMode()}
    </div>
  );
}

export default App; 