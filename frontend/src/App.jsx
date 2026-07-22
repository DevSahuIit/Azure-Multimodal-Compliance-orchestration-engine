import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuditFormApp from './AuditFormApp';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-sans">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <AuditFormApp />
      </main>

      <Footer />
    </div>
  );
}