import React from 'react';
import LoadingAnimation from './LoadingAnimation';
import ResultsPanel from './ResultsPanel';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

const Dashboard = ({ results, isScanning, url }) => {
  const downloadCSV = () => {
    if (!results || !results.issues) return;

    const header = "ID,Title,Severity,Description,Element,Suggestion\n";
    const rows = results.issues.map(issue =>
      `${issue.id},"${issue.title}",${issue.severity},"${issue.description}","${issue.element}","${issue.suggestion}"`
    );
    const csvContent = header + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `AltTextReport-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadPDF = () => {
    if (!results || !results.issues) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Alt Text Accessibility Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`URL: ${results.url}`, 14, 30);
    doc.text(`Score: ${results.score}`, 14, 40);
    doc.text(`Total Issues: ${results.totalIssues}`, 14, 50);

    let y = 60;
    results.issues.forEach((issue, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${issue.title} (${issue.severity})`, 14, y);
      y += 7;
      doc.text(`Desc: ${issue.description}`, 14, y);
      y += 7;
      doc.text(`Element: ${issue.element}`, 14, y);
      y += 7;
      doc.text(`Suggestion: ${issue.suggestion}`, 14, y);
      y += 10;
    });

    doc.save(`AltTextReport-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <section className="mt-12">
      <div className="bg-gray-900/40 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl shadow-blue-500/5">
        {isScanning ? (
          <LoadingAnimation url={url} />
        ) : (
          <>
            <div className="flex justify-end mb-4 space-x-4">
              <button
                onClick={downloadPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
              >
                Download PDF
              </button>
              <button
                onClick={downloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
              >
                Download CSV
              </button>
            </div>
            <ResultsPanel results={results} />
          </>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
