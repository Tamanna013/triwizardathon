import React from 'react';
import LoadingAnimation from './LoadingAnimation';
import ResultsPanel from './ResultsPanel';

const Dashboard = ({ results, isScanning, url }) => {
  return (
    <section className="mt-12">
      <div className="bg-gray-900/40 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl shadow-blue-500/5">
        {isScanning ? (
          <LoadingAnimation url={url} />
        ) : (
          <ResultsPanel results={results} />
        )}
      </div>
    </section>
  );
};

export default Dashboard;