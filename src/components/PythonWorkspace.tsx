import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, Play, Square, RotateCcw, FileCode, CheckCircle2, 
  Download, Eye, Trash2, FileText, AlertTriangle, Loader2
} from "lucide-react";
import { TerminalLine, GeneratedFile } from "../types";

const DEFAULT_PYTHON_CODE = `# Stock Portfolio Tracker (Python Implementation)
# Goal: Calculate total investment based on manually defined stock prices.

# Hardcoded dictionary defining stock prices
prices = {
    "AAPL": 180.0,
    "TSLA": 250.0,
    "MSFT": 420.0,
    "GOOGL": 170.0,
    "NVDA": 130.0,
    "AMZN": 185.0
}

portfolio = {}

print("=========================================")
print("   PYTHON STOCK PORTFOLIO TRACKER        ")
print("=========================================")
print("Available Stock Prices in Dictionary:")
for sym, price in prices.items():
    print(f"  - {sym}: \${price:.2f}")
print("=========================================\\n")

while True:
    symbol = input("Enter stock symbol (or 'done' to calculate): ").strip().upper()
    if symbol == 'DONE':
        break
    
    if symbol not in prices:
        print(f"❌ Unknown symbol '{symbol}'. Symbol must be in the price dictionary.")
        print(f"👉 Available symbols: {', '.join(prices.keys())}")
        continue
        
    qty_str = input(f"Enter quantity for {symbol}: ").strip()
    try:
        qty = float(qty_str)
        if qty <= 0:
            print("❌ Quantity must be a positive number.")
            continue
        # Add to existing or initialize
        portfolio[symbol] = portfolio.get(symbol, 0.0) + qty
        print(f"✅ Added {qty} shares of {symbol} to portfolio.")
    except ValueError:
        print("❌ Invalid quantity. Please enter a valid decimal number.")

print("\\n=========================================")
print("          PORTFOLIO SUMMARY              ")
print("=========================================")

total_value = 0.0
if not portfolio:
    print("Your portfolio is currently empty!")
else:
    for symbol, qty in portfolio.items():
        price = prices[symbol]
        value = qty * price
        total_value += value
        print(f"📈 {symbol:5} | {qty:8.2f} shares @ \${price:6.2f} = \${value:10.2f}")

print("-----------------------------------------")
print(f"💰 Total Portfolio Value: \${total_value:,.2f}")
print("=========================================\\n")

# File handling (optional)
save = input("Would you like to save this summary to 'portfolio.txt'? (y/n): ").strip().lower()
if save == 'y' or save == 'yes':
    filename = "portfolio.txt"
    with open(filename, "w") as f:
        f.write("=========================================\\n")
        f.write("          PORTFOLIO SUMMARY              \\n")
        f.write("=========================================\\n")
        for symbol, qty in portfolio.items():
            price = prices[symbol]
            value = qty * price
            f.write(f"{symbol}: {qty} shares @ \${price} = \${value:.2f}\\n")
        f.write("-----------------------------------------\\n")
        f.write(f"Total Portfolio Value: \${total_value:.2f}\\n")
        f.write("=========================================\\n")
    print(f"🎉 Successfully saved portfolio to '{filename}'!")
else:
    print("Skipped saving portfolio to file.")

print("\\nScript completed. Have a nice day!")
`;

export default function PythonWorkspace() {
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const [code, setCode] = useState(DEFAULT_PYTHON_CODE);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Generated files lists
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [viewingFile, setViewingFile] = useState<{ name: string; content: string } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scroll to bottom of terminal when output changes
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLines]);

  // Load generated files on mount and periodically
  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 4000);
    return () => clearInterval(interval);
  }, []);

  // Sync files list when process runs or stops
  useEffect(() => {
    fetchFiles();
  }, [isRunning]);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/files/list`);
      if (res.ok) {
        const data = await res.json();
        setGeneratedFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to fetch generated files list", err);
    }
  };

  const handleStartSession = async () => {
    if (isRunning || isStarting) return;
    setIsStarting(true);
    setTerminalLines([
      { id: "sys-start", type: "system", text: "--- Preparing python execution environment ---" },
    ]);
    setTerminalInput("");

    try {
      const res = await fetch(`${API_BASE}/api/terminal/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to start server process");
      }

      const { sessionId: sId } = await res.json();
      setSessionId(sId);
      setIsRunning(true);
      setTerminalLines((prev) => [
        ...prev,
        { id: "sys-connected", type: "system", text: `--- Python process spawned successfully (Session ID: ${sId}) ---` },
      ]);

      // Connect SSE
      const eventSource = new EventSource(`${API_BASE}/api/terminal/stream/${sId}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "output" || data.type === "error") {
            const lineType = data.type === "error" ? "error" : "output";
            setTerminalLines((prev) => [
              ...prev,
              { id: Math.random().toString(), type: lineType, text: data.text },
            ]);
          } else if (data.type === "exit") {
            setTerminalLines((prev) => [
              ...prev,
              { id: "sys-exit", type: "system", text: `\n--- Python process exited with code ${data.code} ---` },
            ]);
            cleanupSession();
          }
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE stream error", err);
        // Force cleanup if SSE fails or disconnects
        setTerminalLines((prev) => [
          ...prev,
          { id: "sys-stream-err", type: "error", text: "\n[System error: Terminal stream lost. Cleaning up...]" },
        ]);
        cleanupSession();
      };

      // Auto-focus terminal input
      setTimeout(() => inputRef.current?.focus(), 100);

    } catch (err: any) {
      setTerminalLines((prev) => [
        ...prev,
        { id: "sys-fail", type: "error", text: `[System Error] Failed to initialize: ${err.message}` },
      ]);
      cleanupSession();
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSession = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${API_BASE}/api/terminal/stop/${sessionId}`, { method: "POST" });
      setTerminalLines((prev) => [
        ...prev,
        { id: "sys-stop-force", type: "system", text: "\n--- Python process terminated by user ---" },
      ]);
      cleanupSession();
    } catch (err) {
      console.error("Failed to stop python session", err);
    }
  };

  const cleanupSession = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setSessionId(null);
    setIsRunning(false);
    setIsStarting(false);
    fetchFiles(); // Reload files list to see if anything was saved
  };

  const handleSendInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !terminalInput.trim()) return;

    const inputToSend = terminalInput;
    setTerminalInput("");

    // Append to local terminal log instantly
    setTerminalLines((prev) => [
      ...prev,
      { id: Math.random().toString(), type: "input", text: inputToSend },
    ]);

    try {
      await fetch(`${API_BASE}/api/terminal/input/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputToSend }),
      });
    } catch (err) {
      console.error("Failed to send terminal input", err);
      setTerminalLines((prev) => [
        ...prev,
        { id: Math.random().toString(), type: "error", text: "[System Error: Failed to transmit keystroke]" },
      ]);
    }
  };

  const handleResetCode = () => {
    if (window.confirm("Are you sure you want to reset the editor to the default Stock Portfolio Tracker code? Any edits you made will be lost.")) {
      setCode(DEFAULT_PYTHON_CODE);
    }
  };

  const handleViewFile = async (fileName: string) => {
    setIsLoadingFile(true);
    try {
      const res = await fetch(`${API_BASE}/api/files/download/${fileName}`);
      if (res.ok) {
        const text = await res.text();
        setViewingFile({ name: fileName, content: text });
      } else {
        alert("Failed to read file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reading file.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDeleteFile = async (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete '${fileName}'?`)) {
      try {
        const res = await fetch(`${API_BASE}/api/files/delete/${fileName}`, { method: "DELETE" });
        if (res.ok) {
          fetchFiles();
          if (viewingFile?.name === fileName) {
            setViewingFile(null);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="python-tab">
      
      {/* File Viewer Dialog */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-sm w-full max-w-2xl max-h-[81vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">{viewingFile.name}</h4>
              </div>
              <button 
                onClick={() => setViewingFile(null)}
                className="text-slate-400 hover:text-white font-mono text-[10px] uppercase border border-slate-700 px-2 py-1 hover:bg-slate-800 transition"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#131C31] font-mono text-xs text-slate-300 whitespace-pre leading-relaxed border-b border-slate-800 select-all">
              {viewingFile.content}
            </div>
            <div className="p-4 bg-slate-950 flex justify-end gap-2">
              <a 
                href={`${API_BASE}/api/files/download/${viewingFile.name}`}
                download={viewingFile.name}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs uppercase tracking-wider rounded-sm shadow-sm transition"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Code Editor Panel */}
      <div className="lg:col-span-6 flex flex-col h-[650px] bg-slate-900 border border-slate-800 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0F172A]">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Python Source Code</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Local Workspace Compiler Sandbox</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetCode}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-sm transition bg-slate-950"
              title="Reset to original stock portfolio tracker code"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Textarea Code Editor */}
        <div className="flex-1 relative font-mono text-xs leading-relaxed overflow-hidden bg-slate-950">
          {/* Numbers Bar */}
          <div className="absolute top-0 left-0 w-12 h-full bg-[#0F172A] text-slate-600 border-r border-slate-800/80 flex flex-col items-center pt-4 select-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className="h-5 text-[9px] leading-5 font-mono">{i + 1}</span>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isRunning}
            className="w-full h-full pl-14 pr-4 py-4 bg-transparent text-slate-300 outline-none resize-none font-mono text-xs focus:ring-0 leading-5"
            spellCheck="false"
            style={{ tabSize: 4 }}
          />
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#0F172A]">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {isRunning ? "PROCESS LOCKED DURING EXECUTION" : "READY_TO_COMPILE"}
          </span>
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={handleStopSession}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-wider py-2 px-4 rounded-sm shadow-sm transition"
              >
                <Square className="w-4 h-4 fill-white" /> Stop Subprocess
              </button>
            ) : (
              <button
                onClick={handleStartSession}
                disabled={isStarting}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs uppercase tracking-wider py-2 px-5 rounded-sm shadow-sm transition"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Compiling...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Run Python Script
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal & Generated Files Panel */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        
        {/* Terminal Screen */}
        <div className="flex flex-col h-[400px] bg-slate-950 border border-slate-800 rounded-sm shadow-xl overflow-hidden relative">
          
          {/* Terminal Window Header */}
          <div className="h-10 bg-[#0F172A] px-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/80"></span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>python3 (unbuffered stdout)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                {isRunning ? "Active" : "Idle"}
              </span>
            </div>
          </div>

          {/* Terminal Outputs Container */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-normal space-y-1 select-text scrollbar-thin bg-slate-950">
            {terminalLines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center select-none pt-4 bg-slate-950">
                <Terminal className="w-12 h-12 stroke-1 text-slate-800 mb-2" />
                <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Python Interactive Console</p>
                <p className="text-[10px] font-mono uppercase text-slate-600 mt-1 max-w-xs">
                  EXECUTE THE SCRIPT TO COMMENCE COMPILATION AND INTERACT WITH DICTIONARY VARIABLES.
                </p>
              </div>
            ) : (
              terminalLines.map((line) => {
                if (line.type === "system") {
                  return (
                    <div key={line.id} className="text-blue-400 font-mono text-[10px] uppercase tracking-wider bg-blue-950/40 p-2 my-2 rounded-sm border border-blue-900/60">
                      {line.text}
                    </div>
                  );
                }
                if (line.type === "error") {
                  return (
                    <div key={line.id} className="text-red-400 whitespace-pre-wrap font-mono">
                      {line.text}
                    </div>
                  );
                }
                if (line.type === "input") {
                  return (
                    <div key={line.id} className="text-amber-400 flex gap-2 font-mono">
                      <span className="text-slate-600 font-bold select-none">&gt;</span>
                      <span className="font-bold">{line.text}</span>
                    </div>
                  );
                }
                return (
                  <span key={line.id} className="whitespace-pre-wrap block font-mono">
                    {line.text}
                  </span>
                );
              })
            )}
            <div ref={terminalBottomRef} />
          </div>

          {/* Terminal Interactive Input Form */}
          <form onSubmit={handleSendInput} className="bg-slate-950 border-t border-slate-800 p-3 flex items-center gap-2">
            <span className="font-mono text-slate-600 text-xs select-none">&gt;&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              disabled={!isRunning}
              placeholder={isRunning ? "Input parameters and press enter..." : "Subprocess offline. Standard input deactivated."}
              className="flex-1 bg-transparent text-slate-200 outline-none border-none font-mono text-xs placeholder-slate-700 focus:ring-0 p-0"
              spellCheck="false"
              autoComplete="off"
            />
            {isRunning && (
              <span className="w-2 h-4 bg-blue-400 animate-[blink_1s_infinite] self-center"></span>
            )}
          </form>
        </div>

        {/* Generated Workspace Files panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 flex-1 flex flex-col h-[224px] overflow-hidden">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between bg-slate-900">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" /> Output Files Explorer
              </h4>
              <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Files written by Python interpreter</p>
            </div>
            <span className="text-[9px] bg-slate-950 text-blue-400 border border-slate-800 font-mono px-2 py-0.5 rounded-sm">
              {generatedFiles.length} FILE(S)
            </span>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
            {generatedFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-6 select-none">
                <p className="text-[10px] font-mono uppercase tracking-widest">Workspace is vacant</p>
                <p className="text-[9px] font-mono uppercase text-slate-600 mt-1 max-w-xs">
                  Run the Python file, specify positions, and answer <strong className="text-slate-400">Y</strong> when prompted to serialize the logs.
                </p>
              </div>
            ) : (
              generatedFiles.map((file) => (
                <div 
                  key={file.name}
                  className="flex items-center justify-between border border-slate-800/80 bg-slate-950 hover:bg-slate-950/80 rounded-sm p-2.5 transition group cursor-pointer"
                  onClick={() => handleViewFile(file.name)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-900 text-blue-400 rounded-sm border border-slate-800 group-hover:bg-slate-800 transition">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-mono font-bold text-white block truncate max-w-[200px]">{file.name}</span>
                      <span className="text-[9px] text-slate-500 block font-mono">
                        {(file.size / 1024).toFixed(2)} KB • {new Date(file.mtime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFile(file.name);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-900 rounded-sm transition"
                      title="View contents"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`${API_BASE}/api/files/download/${file.name}`}
                      download={file.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-900 rounded-sm transition"
                      title="Download to PC"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => handleDeleteFile(file.name, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-sm transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
