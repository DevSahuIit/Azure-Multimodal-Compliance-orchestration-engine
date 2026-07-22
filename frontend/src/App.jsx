import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RulesModal from './components/RulesModal';
import AuditFormApp from './AuditFormApp';

export default function App() {
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-sans">
      <Navbar onOpenRules={() => setIsRulesOpen(true)} />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <AuditFormApp />
      </main>

      <Footer />

      {/* Compliance Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}