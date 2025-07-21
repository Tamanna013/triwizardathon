import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScanSection from './components/ScanSection';
import Dashboard from './components/Dashboard';
import AnimatedBackground from './components/AnimatedBackground';

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [url, setUrl] = useState('');

  const handleScan = async (inputUrl) => {
    setIsScanning(true);
    setUrl(inputUrl);

    setTimeout(() => {
      setScanResults({
        url: inputUrl,
        score: 85,
        issues: [
          {
            id: 1,
            type: 'error',
            severity: 'high',
            title: 'Missing Alt Text',
            description: 'Images without alternative text are not accessible to screen readers.',
            element: '<img src="hero.jpg">',
            suggestion: 'Add descriptive alt text: <img src="hero.jpg" alt="Team collaboration in modern office">',
            count: 3
          }
          // Issues will go here
        ],
        totalIssues: 11,
        scanTime: '2.3s'
      });
      setIsScanning(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen relative"> 
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ScanSection
            onScan={handleScan}
            isScanning={isScanning}
          />
          {(scanResults || isScanning) && (
            <Dashboard
              results={scanResults}
              isScanning={isScanning}
              url={url}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;