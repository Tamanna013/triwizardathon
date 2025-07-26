import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ScanSection from './components/ScanSection';
import Dashboard from './components/Dashboard';
import AnimatedBackground from './components/AnimatedBackground';

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [url, setUrl] = useState('');
  const dashboardRef = useRef();

  // ✅ useEffect at the top level
  useEffect(() => {
    if (isScanning && dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isScanning]);

  const handleScan = async (inputUrl) => {
    setIsScanning(true);
    setUrl(inputUrl);

    try {
      const response = await fetch('http://127.0.0.1:8000/generate-alt-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await response.json();

      if (data.uncaptioned_images) {
        const uncaptioned = data.uncaptioned_images.length;
        const total = (data.captioned_images?.length || 0) + uncaptioned;

        const issues = data.uncaptioned_images.map((item, index) => ({
          id: index + 1,
          type: 'error',
          severity: 'high',
          title: 'Missing Alt Text',
          description: 'Images without alternative text are not accessible to screen readers.',
          element: `<img src="${item.img_url}">`,
          suggestion: `Add descriptive alt text: <img src="${item.img_url}" alt="${item.caption}">`,
          count: 1,
        }));

        const calculatedScore = total === 0 ? 100 : Math.round(((total - uncaptioned) / total) * 100);

        setScanResults({
          url: inputUrl,
          score: calculatedScore,
          issues: issues,
          totalIssues: issues.length,
          scanTime: '-',
        });
      } else if (data.message === "All images on this page have alt text.") {
        setScanResults({
          url: inputUrl,
          score: 100,
          issues: [],
          totalIssues: 0,
          scanTime: '-',
        });
      }
    } catch (err) {
      console.error(err);
      setScanResults({
        url: inputUrl,
        score: 0,
        issues: [
          {
            id: 1,
            type: 'error',
            severity: 'high',
            title: 'Server Error',
            description: 'Could not connect to backend or process request.',
            element: '',
            suggestion: 'Check backend server or URL input.',
            count: 1,
          },
        ],
        totalIssues: 1,
        scanTime: '-',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ScanSection onScan={handleScan} isScanning={isScanning} />
          {(scanResults || isScanning) && (
            <div ref={dashboardRef}>
              <Dashboard results={scanResults} isScanning={isScanning} url={url} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
