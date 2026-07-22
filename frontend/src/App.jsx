import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuditFormApp from './AuditFormApp';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Header Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <AuditFormApp />
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}