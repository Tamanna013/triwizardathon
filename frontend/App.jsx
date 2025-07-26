import { useState, useEffect } from 'react';
import Results from './components/Results';

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('accessibilityHistory')) || [];
    setHistory(savedHistory);
    
    // Check for URL in query params
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setUrl(urlParam);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Save to history
      const newHistoryItem = {
        url,
        date: new Date().toISOString(),
        issues: {
          missingAlt: data.missingAltTags?.length || 0,
          contrast: data.contrastIssues?.length || 0,
          headings: data.headingIssues?.length || 0,
          unlabeled: data.unlabeledInputs?.length || 0
        }
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)];
      setHistory(updatedHistory);
      localStorage.setItem('accessibilityHistory', JSON.stringify(updatedHistory));

      setResults(data);
    } catch (error) {
      setResults({
        error: true,
        message: error.message || 'Failed to scan website',
        details: 'Please check the URL and try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input & History */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Accessibility Scanner</h1>
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex flex-col space-y-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </span>
                  ) : 'Scan Website'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Scan History</h2>
              {history.length > 0 && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('accessibilityHistory');
                    setHistory([]);
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">Your scan history will appear here</p>
            ) : (
              <ul className="space-y-3">
                {history.map((item, index) => (
                  <li 
                    key={index} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${results?.url === item.url ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                    onClick={() => {
                      setUrl(item.url);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium truncate">{new URL(item.url).hostname}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {Object.entries(item.issues).map(([key, count]) => (
                        count > 0 && (
                          <span 
                            key={key}
                            className={`text-xs px-2 py-1 rounded-full ${
                              key === 'missingAlt' ? 'bg-red-100 text-red-800' :
                              key === 'contrast' ? 'bg-yellow-100 text-yellow-800' :
                              key === 'headings' ? 'bg-orange-100 text-orange-800' :
                              'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {count} {key === 'missingAlt' ? 'Alt' : key === 'contrast' ? 'Contrast' : key === 'headings' ? 'Heading' : 'Label'}
                          </span>
                        )
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {isLoading && (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Scanning {new URL(url).hostname}...</p>
              <p className="text-gray-600 mt-2">This may take a few seconds</p>
            </div>
          )}
          
          {results && <Results results={results} />}
          
          {results?.error && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Scan Failed</h3>
              <p className="text-gray-700 text-center mb-4">{results.message}</p>
              <p className="text-sm text-gray-500 text-center">{results.details}</p>
              <button
                onClick={() => setResults(null)}
                className="mt-6 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;