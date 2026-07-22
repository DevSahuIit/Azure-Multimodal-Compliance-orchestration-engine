import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RulesModal from './components/RulesModal';
import DocumentationPage from './components/DocumentationPage';
import AuditFormApp from './AuditFormApp';

export default function App() {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [currentView, setCurrentView] = useState('app'); // 'app' | 'docs'

  const handleGoHome = () => {
    setCurrentView('app');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-sans">
      <Navbar 
        onGoHome={handleGoHome}
        onOpenRules={() => setIsRulesOpen(true)} 
        onOpenDocs={() => setCurrentView('docs')} 
      />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        {currentView === 'app' ? (
          <AuditFormApp />
        ) : (
          <DocumentationPage onBackToApp={() => setCurrentView('app')} />
        )}
      </main>

      <Footer />

      {/* Compliance Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}