import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Terminal, BookOpen, Sparkles, TrendingUp, Cpu
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import PythonWorkspace from "./components/PythonWorkspace";
import AboutSection from "./components/AboutSection";
import { StockHolding, StockPriceMap } from "./types";

export default function App() {
  // Global active tab state
  const [activeTab, setActiveTab] = useState<"gui" | "python" | "about">("gui");

  // Default Holdings
  const [holdings, setHoldings] = useState<StockHolding[]>([
    { symbol: "AAPL", quantity: 15 },
    { symbol: "TSLA", quantity: 8 },
    { symbol: "MSFT", quantity: 5 },
    { symbol: "GOOGL", quantity: 12 },
    { symbol: "NVDA", quantity: 25 },
  ]);

  // Default Price Dictionary
  const [prices, setPrices] = useState<StockPriceMap>({
    "AAPL": 180.0,
    "TSLA": 250.0,
    "MSFT": 420.0,
    "GOOGL": 170.0,
    "NVDA": 130.0,
    "AMZN": 185.0
  });

  return (
    <div className="min-h-screen bg-[#131C31] text-slate-300 flex flex-col antialiased font-sans">
      {/* Header Bar */}
      <header className="bg-[#0F172A] border-b border-slate-800 sticky top-0 z-40 h-14 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Logo Title Section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center select-none">
              <div className="w-4 h-4 border-2 border-white rotate-45"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tighter text-base sm:text-lg text-white uppercase">
                  PyPortfolio<span className="text-blue-400">.OS</span>
                </span>
                <span className="bg-slate-900 text-blue-400 font-mono text-[9px] px-2 py-0.5 rounded-sm border border-slate-800">
                  SYS_ID: 8821
                </span>
              </div>
            </div>
          </div>

          {/* Environment Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-sm text-[10px] font-mono text-green-500 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            PROD_ENVIRONMENT
          </div>

        </div>
      </header>

      {/* Navigation Sub-Header */}
      <div className="bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-start gap-6 h-12">
          
          <button
            onClick={() => setActiveTab("gui")}
            className={`flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-widest transition border-b-2 h-full ${
              activeTab === "gui"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Visual Dashboard
          </button>

          <button
            onClick={() => setActiveTab("python")}
            className={`flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-widest transition border-b-2 h-full ${
              activeTab === "python"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Terminal className="w-4 h-4" /> Python Workspace
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-widest transition border-b-2 h-full ${
              activeTab === "about"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Educational Blueprint
          </button>

        </div>
      </div>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Render selected active section with transitions */}
        <div className="transition-all duration-150">
          {activeTab === "gui" && (
            <Dashboard 
              holdings={holdings} 
              prices={prices} 
              onUpdateHoldings={setHoldings} 
              onUpdatePrices={setPrices} 
            />
          )}

          {activeTab === "python" && (
            <PythonWorkspace />
          )}

          {activeTab === "about" && (
            <AboutSection />
          )}
        </div>

      </main>

      {/* Simple elegant footer */}
      <footer className="h-10 bg-slate-950 border-t border-slate-900 flex items-center px-6 justify-between text-[10px] font-mono text-slate-500">
        <div>BUILD_VERSION: 1.0.82-STABLE | PYENGINE KERNEL</div>
        <div className="flex gap-6">
          <span>REGION: AWS-US-EAST-1</span>
          <span className="text-blue-500">● CONNECTION SECURE</span>
        </div>
      </footer>
    </div>
  );
}
