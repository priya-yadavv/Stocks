import React from "react";
import { BookOpen, Key, DollarSign, PenTool, HelpCircle } from "lucide-react";

export default function AboutSection() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 space-y-6" id="educational-tab">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" /> Educational Concept Blueprint
        </h3>
        <p className="text-[11px] text-slate-500 font-mono uppercase mt-1">
          A deep dive into the programming concepts implemented in Python for this Stock Portfolio Tracker task.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concept 1: Dictionaries */}
        <div className="border border-slate-800 rounded-sm p-5 bg-[#0F172A] space-y-3 transition">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-blue-400 rounded-sm border border-slate-800">
              <Key className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">1. Python Dictionaries (`dict`)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A dictionary stores data in <strong className="text-white">key-value pairs</strong>. In our stock tracker, stock symbols act as the key, and their market prices act as the value.
          </p>
          <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-sm overflow-x-auto border border-slate-800/80">
{`# Declaring the price dictionary
prices = {
    "AAPL": 180.0,
    "TSLA": 250.0
}

# Fetching values safely
current_price = prices.get(symbol, 0.0)`}
          </pre>
        </div>

        {/* Concept 2: Keyboard Input & Type Casting */}
        <div className="border border-slate-800 rounded-sm p-5 bg-[#0F172A] space-y-3 transition">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-green-400 rounded-sm border border-slate-800">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">2. Input, Stripping & Casting</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The <code className="bg-slate-950 px-1.5 py-0.5 text-blue-400 rounded-sm font-mono text-[10px] border border-slate-800">input()</code> function reads inputs as strings. We use <code className="bg-slate-950 px-1.5 py-0.5 text-blue-400 rounded-sm font-mono text-[10px] border border-slate-800">.strip()</code> to remove whitespace, <code className="bg-slate-950 px-1.5 py-0.5 text-blue-400 rounded-sm font-mono text-[10px] border border-slate-800">.upper()</code> to normalize, and float conversion for decimals.
          </p>
          <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-sm overflow-x-auto border border-slate-800/80">
{`# Capture keyboard input
symbol = input("Enter symbol: ").strip().upper()

# Try-except block for safe casting
try:
    qty = float(input("Shares: "))
except ValueError:
    print("Invalid decimal entered!")`}
          </pre>
        </div>

        {/* Concept 3: Basic Arithmetic */}
        <div className="border border-slate-800 rounded-sm p-5 bg-[#0F172A] space-y-3 transition">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-amber-400 rounded-sm border border-slate-800">
              <DollarSign className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">3. Accumulation & Arithmetic</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            We loop through user holdings, multiply individual asset quantities by their corresponding market prices, accumulate a running total value, and use f-strings to format output.
          </p>
          <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-sm overflow-x-auto border border-slate-800/80">
{`# Multiplications and sums in loop
total_value = 0.0
for symbol, qty in portfolio.items():
    value = qty * prices[symbol]
    total_value += value

# Formatted decimal printing
print(f"Total: \${total_value:,.2f}")`}
          </pre>
        </div>

        {/* Concept 4: File Handling */}
        <div className="border border-slate-800 rounded-sm p-5 bg-[#0F172A] space-y-3 transition">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-pink-400 rounded-sm border border-slate-800">
              <PenTool className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">4. Optional File Handling (IO)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Using Python&apos;s <code className="bg-slate-950 px-1.5 py-0.5 text-blue-400 rounded-sm font-mono text-[10px] border border-slate-800">with open(...)</code> statement allows us to open/create a file and automatically close it afterwards, preventing memory leaks.
          </p>
          <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-sm overflow-x-auto border border-slate-800/80">
{`# Opening file in write ('w') mode
with open("portfolio.txt", "w") as f:
    f.write("--- PORTFOLIO SUMMARY ---\\n")
    f.write(f"Total: \${total_value:.2f}\\n")

# File is automatically closed here!`}
          </pre>
        </div>
      </div>
    </div>
  );
}
