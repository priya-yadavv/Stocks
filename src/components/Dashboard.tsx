import React, { useState } from "react";
import { 
  TrendingUp, Plus, Trash2, Edit2, Download, RefreshCw, AlertCircle, 
  HelpCircle, Check, Landmark, DollarSign, PieChart as PieIcon, BarChart2
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from "recharts";
import { StockHolding, StockPriceMap } from "../types";

interface DashboardProps {
  holdings: StockHolding[];
  prices: StockPriceMap;
  onUpdateHoldings: (holdings: StockHolding[]) => void;
  onUpdatePrices: (prices: StockPriceMap) => void;
}

export default function Dashboard({ holdings, prices, onUpdateHoldings, onUpdatePrices }: DashboardProps) {
  // Input states for adding/editing holdings
  const [newSymbol, setNewSymbol] = useState("");
  const [newQty, setNewQty] = useState("");
  
  // States for updating stock prices in dictionary
  const [editingPriceSymbol, setEditingPriceSymbol] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [newDictSymbol, setNewDictSymbol] = useState("");
  const [newDictPrice, setNewDictPrice] = useState("");

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add holding to visual GUI portfolio
  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newQty) return;

    const symbol = newSymbol.trim().toUpperCase();
    const qty = parseFloat(newQty);

    if (isNaN(qty) || qty <= 0) {
      showNotification("Please enter a valid positive quantity", "error");
      return;
    }

    // Ensure stock exists in price dictionary
    if (!(symbol in prices)) {
      showNotification(`Symbol ${symbol} is not in the Price Dictionary. Add it below first!`, "error");
      return;
    }

    const existingIndex = holdings.findIndex(h => h.symbol === symbol);
    if (existingIndex > -1) {
      const updated = [...holdings];
      updated[existingIndex].quantity = Number((updated[existingIndex].quantity + qty).toFixed(4));
      onUpdateHoldings(updated);
      showNotification(`Added ${qty} shares to existing ${symbol} holding.`);
    } else {
      onUpdateHoldings([...holdings, { symbol, quantity: qty }]);
      showNotification(`Added ${qty} shares of ${symbol} to portfolio.`);
    }

    setNewSymbol("");
    setNewQty("");
  };

  // Remove holding
  const handleRemoveHolding = (symbol: string) => {
    const updated = holdings.filter(h => h.symbol !== symbol);
    onUpdateHoldings(updated);
    showNotification(`Removed ${symbol} from portfolio.`);
  };

  // Direct editing of shares
  const handleUpdateHoldingQty = (symbol: string, value: string) => {
    const qty = parseFloat(value);
    if (isNaN(qty) || qty < 0) return;

    if (qty === 0) {
      handleRemoveHolding(symbol);
      return;
    }

    const updated = holdings.map(h => h.symbol === symbol ? { ...h, quantity: Number(qty.toFixed(4)) } : h);
    onUpdateHoldings(updated);
  };

  // Add stock to dictionary
  const handleAddDictPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDictSymbol || !newDictPrice) return;

    const symbol = newDictSymbol.trim().toUpperCase();
    const price = parseFloat(newDictPrice);

    if (isNaN(price) || price <= 0) {
      showNotification("Please enter a valid stock price", "error");
      return;
    }

    const updated = { ...prices, [symbol]: Number(price.toFixed(2)) };
    onUpdatePrices(updated);
    showNotification(`Added ${symbol} to dictionary at $${price.toFixed(2)}`);
    setNewDictSymbol("");
    setNewDictPrice("");
  };

  // Save edited price in dictionary
  const handleSavePriceEdit = (symbol: string) => {
    const price = parseFloat(editingPriceValue);
    if (isNaN(price) || price <= 0) {
      showNotification("Invalid price. Must be a positive number.", "error");
      return;
    }

    const updated = { ...prices, [symbol]: Number(price.toFixed(2)) };
    onUpdatePrices(updated);
    showNotification(`Updated ${symbol} price to $${price.toFixed(2)}`);
    setEditingPriceSymbol(null);
    setEditingPriceValue("");
  };

  // Remove symbol from dictionary (if not held)
  const handleRemoveDictSymbol = (symbol: string) => {
    if (holdings.some(h => h.symbol === symbol)) {
      showNotification(`Cannot remove ${symbol} because you currently hold it in your portfolio!`, "error");
      return;
    }
    const updated = { ...prices };
    delete updated[symbol];
    onUpdatePrices(updated);
    showNotification(`Removed ${symbol} from price dictionary.`);
  };

  // Calculations
  const calculatedHoldings = holdings.map(h => {
    const price = prices[h.symbol] || 0;
    const value = h.quantity * price;
    return {
      ...h,
      price,
      value
    };
  });

  const totalValue = calculatedHoldings.reduce((sum, h) => sum + h.value, 0);

  // Chart Data preparation
  const chartData = calculatedHoldings.map(h => ({
    name: h.symbol,
    value: Number(h.value.toFixed(2)),
    quantity: h.quantity,
    price: h.price
  }));

  // Visual Palette for Pie Chart
  const COLORS = [
    "#0EA5E9", // Sky 500
    "#10B981", // Emerald 500
    "#F59E0B", // Amber 500
    "#8B5CF6", // Violet 500
    "#EC4899", // Pink 500
    "#3B82F6", // Blue 500
    "#EF4444", // Red 500
    "#64748B", // Slate 500
  ];

  // Export functions
  const handleExportCSV = () => {
    if (holdings.length === 0) {
      showNotification("Portfolio is empty!", "error");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Stock Symbol,Quantity (Shares),Current Price ($),Total Value ($)\n";
    
    calculatedHoldings.forEach(h => {
      csvContent += `${h.symbol},${h.quantity},${h.price},${h.value.toFixed(2)}\n`;
    });
    
    csvContent += `TOTAL,,,${totalValue.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "portfolio_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Downloaded portfolio_export.csv!");
  };

  const handleExportTXT = () => {
    if (holdings.length === 0) {
      showNotification("Portfolio is empty!", "error");
      return;
    }

    let txtContent = "=========================================\n";
    txtContent += "          PORTFOLIO SUMMARY              \n";
    txtContent += "=========================================\n\n";
    
    calculatedHoldings.forEach(h => {
      txtContent += `${h.symbol}: ${h.quantity} shares @ $${h.price.toFixed(2)} = $${h.value.toFixed(2)}\n`;
    });
    
    txtContent += "-----------------------------------------\n";
    txtContent += `Total Portfolio Value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    txtContent += "=========================================\n";

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "portfolio_export.txt");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Downloaded portfolio_export.txt!");
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-sm shadow-xl text-white transition-all duration-300 font-mono text-xs border ${
          notification.type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-red-950 border-red-500 text-red-400"
        }`}>
          {notification.type === "success" ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top statistics banners - Styled strictly like Geometric Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Value */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Portfolio Value</span>
            <div className="text-3xl font-light text-white tracking-tight">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Live Valuation</div>
          </div>
          <div className="p-3 bg-slate-800 text-blue-400 rounded-sm border border-slate-700">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        {/* Unique Holdings */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Positions</span>
            <div className="text-3xl font-light text-white tracking-tight">
              {holdings.length} <span className="text-sm font-normal text-slate-400 uppercase tracking-wider font-mono">ASSETS</span>
            </div>
            <div className="text-[10px] text-green-500 font-mono uppercase tracking-widest">Stable Connection</div>
          </div>
          <div className="p-3 bg-slate-800 text-green-400 rounded-sm border border-slate-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Largest position */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Top Allocation</span>
            <div className="text-2xl font-light text-white tracking-tight py-0.5">
              {calculatedHoldings.length > 0 ? (
                (() => {
                  const sorted = [...calculatedHoldings].sort((a, b) => b.value - a.value);
                  return `${sorted[0].symbol} ($${sorted[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })})`;
                })()
              ) : (
                "None"
              )}
            </div>
            <div className="text-[10px] text-amber-500 font-mono uppercase tracking-widest">Dominant Position</div>
          </div>
          <div className="p-3 bg-slate-800 text-amber-400 rounded-sm border border-slate-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content: holdings & visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Holdings Table & Add holding form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asset Holdings Manager</h3>
                <p className="text-[11px] text-slate-500 font-mono uppercase mt-1">Configure active allocations and decimal shares.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 rounded-sm transition"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button 
                  onClick={handleExportTXT}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 rounded-sm transition"
                >
                  <Download className="w-3.5 h-3.5" /> TXT
                </button>
              </div>
            </div>

            {/* Quick add holding */}
            <form onSubmit={handleAddHolding} className="p-4 bg-slate-950/80 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Stock Symbol</label>
                <select
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-sm px-3 py-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="" className="bg-slate-950">Select stock...</option>
                  {Object.keys(prices).map(symbol => (
                    <option key={symbol} value={symbol} className="bg-slate-950">{symbol} (${prices[symbol].toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Shares Quantity</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 10.25"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-sm px-3 py-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition placeholder-slate-600"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-sm transition uppercase tracking-wider shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add position
              </button>
            </form>

            {/* Holdings Table */}
            {calculatedHoldings.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="font-semibold text-sm uppercase tracking-wider">No positions detected</p>
                <p className="text-xs mt-1 text-slate-600">Select a dictionary asset above to populate your portfolio.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#0F172A] border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-6">Asset</th>
                      <th className="py-3 px-4">Shares Held</th>
                      <th className="py-3 px-4">Market Price</th>
                      <th className="py-3 px-4 text-right">Current Value</th>
                      <th className="py-3 px-4 text-right">% Allocation</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                    {calculatedHoldings.map((h, idx) => {
                      const allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
                      return (
                        <tr key={h.symbol} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-6 font-bold text-white flex items-center gap-3">
                            <span 
                              className="w-2.5 h-2.5 rounded-sm inline-block" 
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            {h.symbol}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="any"
                              value={h.quantity}
                              onChange={(e) => handleUpdateHoldingQty(h.symbol, e.target.value)}
                              className="w-20 bg-slate-950 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-slate-800 focus:outline-none rounded-sm px-1.5 py-1 font-medium font-mono text-white text-xs"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            ${h.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white font-mono">
                            ${h.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {allocation.toFixed(1)}%
                          </td>
                          <td className="py-3 px-6 text-center">
                            <button
                              onClick={() => handleRemoveHolding(h.symbol)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition"
                              title="Delete position"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Price Dictionary Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hardcoded Stock Prices (Python Dictionary)</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                In Python, we declare prices in a dictionary structure: <code className="bg-slate-950 text-blue-400 px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-800">prices = {"{"}&quot;AAPL&quot;: 180, &quot;TSLA&quot;: 250{"}"}</code>. 
                Edit values below to emulate changing market values.
              </p>
            </div>

            {/* Grid of Prices with Edit buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(prices).map((symbol) => (
                <div key={symbol} className="border border-slate-800 rounded-sm p-3 bg-slate-950 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">{symbol}</span>
                    <div className="mt-0.5 font-bold text-white font-mono">
                      {editingPriceSymbol === symbol ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-xs">$</span>
                          <input
                            type="number"
                            step="any"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            className="w-16 text-xs font-mono bg-slate-900 border border-slate-800 rounded-sm px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            autoFocus
                          />
                        </div>
                      ) : (
                        `$${prices[symbol].toFixed(2)}`
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {editingPriceSymbol === symbol ? (
                      <>
                        <button
                          onClick={() => handleSavePriceEdit(symbol)}
                          className="p-1 text-green-400 hover:bg-slate-900 rounded-sm"
                          title="Save price"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPriceSymbol(null)}
                          className="p-1 text-slate-500 hover:bg-slate-900 rounded-sm"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingPriceSymbol(symbol);
                            setEditingPriceValue(prices[symbol].toString());
                          }}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-sm transition"
                          title="Edit price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveDictSymbol(symbol)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-sm transition"
                          title="Remove from dictionary"
                          disabled={holdings.some(h => h.symbol === symbol)}
                          style={{ opacity: holdings.some(h => h.symbol === symbol) ? 0.3 : 1 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add a new price into dictionary */}
            <form onSubmit={handleAddDictPrice} className="border border-slate-800 rounded-sm p-4 bg-[#0F172A] grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">New Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. COIN"
                  value={newDictSymbol}
                  onChange={(e) => setNewDictSymbol(e.target.value)}
                  className="w-full text-xs uppercase bg-slate-900 border border-slate-800 rounded-sm px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Stock Price ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 150.00"
                  value={newDictPrice}
                  onChange={(e) => setNewDictPrice(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-sm px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs py-2 px-3 rounded-sm border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Dict Price
              </button>
            </form>
          </div>
        </div>

        {/* Portfolio Visualizations (Pie and Bar Chart) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Allocation Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 flex flex-col h-[340px]">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <PieIcon className="w-4 h-4 text-blue-400" /> Holdings Distribution
            </h4>
            
            {holdings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-xs text-center">
                <PieIcon className="w-12 h-12 stroke-1 mb-2" />
                <p>No asset allocation data.</p>
              </div>
            ) : (
              <div className="flex-1 relative mt-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Valuation"]}
                      contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "2px", color: "#F8FAFC" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for total value */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Total</span>
                  <span className="text-base font-bold text-white tracking-tight block">
                    ${totalValue > 1000000 ? `${(totalValue / 1000000).toFixed(1)}M` : totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Asset Values Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 flex flex-col h-[340px]">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="w-4 h-4 text-green-400" /> Holdings Valuation
            </h4>

            {holdings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-xs text-center">
                <BarChart2 className="w-12 h-12 stroke-1 mb-2" />
                <p>No valuation data.</p>
              </div>
            ) : (
              <div className="flex-1 mt-4 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Valuation"]}
                      contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "2px", color: "#F8FAFC" }}
                    />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
