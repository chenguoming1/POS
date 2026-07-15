import { useMemo, useState } from 'react';
import { Sale, Product } from '../types';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  PackageCheck,
  PackageOpen
} from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  currencySymbol: string;
}

export default function Dashboard({ sales, products, currencySymbol }: DashboardProps) {
  const activeSales = useMemo(() => sales.filter(s => !s.refunded), [sales]);

  // General KPIs
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    let totalTransactions = activeSales.length;

    activeSales.forEach(sale => {
      totalRevenue += sale.total;
      totalDiscount += sale.discountAmount;
      
      // Calculate costs of items sold
      sale.items.forEach(item => {
        totalCost += (item.product.cost || 0) * item.quantity;
      });
    });

    const netProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Low stock count
    const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

    return {
      totalRevenue,
      totalCost,
      totalDiscount,
      totalTransactions,
      netProfit,
      marginPercent,
      averageOrderValue,
      lowStockCount
    };
  }, [activeSales, products]);

  // Daily revenue grouping (Last 7 days)
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; revenue: number; transactions: number }>();
    
    // Initialize past 7 days with zeros so chart looks full even if no sales occur
    const now = new Date('2026-05-25T06:43:37Z');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyMap.set(dayStr, { date: dayStr, revenue: 0, transactions: 0 });
    }

    // Populate with real values
    activeSales.forEach(sale => {
      const d = new Date(sale.timestamp);
      const dayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      if (dailyMap.has(dayStr)) {
        const current = dailyMap.get(dayStr)!;
        current.revenue = parseFloat((current.revenue + sale.total).toFixed(2));
        current.transactions += 1;
        dailyMap.set(dayStr, current);
      }
    });

    return Array.from(dailyMap.values());
  }, [activeSales]);

  // Category breakdown
  const categoryChartData = useMemo(() => {
    const catMap = new Map<string, number>();
    
    activeSales.forEach(sale => {
      sale.items.forEach(itm => {
        const cat = itm.product.category || 'uncategorized';
        const lineTotal = itm.product.price * itm.quantity * (1 - itm.discountPercentage / 100);
        catMap.set(cat, (catMap.get(cat) || 0) + lineTotal);
      });
    });

    const colorsMap: Record<string, string> = {
      beverage: '#8FA38F', // sage (Natural Tones primary)
      bakery: '#C2B29F',   // soft clay/warm gray (Natural Tones)
      food: '#A19C80',     // olive stone (Natural Tones)
      snacks: '#D1BC9D',   // warm sand
      tech: '#7F8F7F',     // slate sage
      office: '#A39081',   // warm taupe
      uncategorized: '#94a3b8'
    };

    const friendlyNames: Record<string, string> = {
      beverage: 'Drinks & Beverages',
      bakery: 'Bakery & Sweets',
      food: 'Prepared Deli',
      snacks: 'Salty Snacks',
      tech: 'Tech & Gadgets',
      office: 'Office & Paper',
      uncategorized: 'Uncategorized'
    };

    return Array.from(catMap.entries()).map(([cat, total]) => ({
      name: friendlyNames[cat] || cat,
      value: parseFloat(total.toFixed(2)),
      color: colorsMap[cat] || '#cbd5e1'
    })).sort((a, b) => b.value - a.value);
  }, [activeSales]);

  // Top products sold (Qty-wise)
  const topProducts = useMemo(() => {
    const prodMap = new Map<string, { product: Product; qty: number; salesTotal: number }>();
    
    activeSales.forEach(sale => {
      sale.items.forEach(itm => {
        const existing = prodMap.get(itm.product.id) || { product: itm.product, qty: 0, salesTotal: 0 };
        existing.qty += itm.quantity;
        existing.salesTotal += (itm.product.price * itm.quantity) * (1 - itm.discountPercentage / 100);
        prodMap.set(itm.product.id, existing);
      });
    });

    return Array.from(prodMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [activeSales]);

  const lowStockItems = useMemo(() => {
    return products
      .filter(p => p.stock <= p.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4);
  }, [products]);

  // Formatter functions
  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // State for interactive charts
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);

  // Compute maximum revenue for SVG Area Chart scaling
  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => d.revenue), 0);
    return maxVal > 0 ? maxVal : 100;
  }, [chartData]);

  // Compute points for SVG Area Chart (viewBox: 600 x 240)
  // Left margin = 60, Right margin = 20, Top margin = 20, Bottom margin = 40
  const svgPoints = useMemo(() => {
    const width = 520;
    const height = 180;
    return chartData.map((d, i) => {
      const x = 60 + i * (width / 6);
      const y = 200 - (d.revenue / maxRevenue * height);
      return { x, y, ...d };
    });
  }, [chartData, maxRevenue]);

  // Create SVG path strings for line and filled area
  const areaChartPaths = useMemo(() => {
    if (svgPoints.length === 0) return { line: '', area: '' };
    const line = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${svgPoints[svgPoints.length - 1].x.toFixed(1)} 200 L ${svgPoints[0].x.toFixed(1)} 200 Z`;
    return { line, area };
  }, [svgPoints]);

  // Donut slices layout calculation (Radius = 50, Center = 100, 100)
  const totalCategoryValue = useMemo(() => {
    return categoryChartData.reduce((acc, d) => acc + d.value, 0);
  }, [categoryChartData]);

  const donutSlices = useMemo(() => {
    let currentOffset = 0;
    return categoryChartData.map((d) => {
      const percentage = totalCategoryValue > 0 ? d.value / totalCategoryValue : 0;
      const strokeDasharray = `${(percentage * 314.159).toFixed(2)} 314.159`;
      const strokeDashoffset = (-currentOffset * 314.159).toFixed(2);
      currentOffset += percentage;
      return { ...d, strokeDasharray, strokeDashoffset, percentage };
    });
  }, [categoryChartData, totalCategoryValue]);

  return (
    <div className="space-y-6" id="dashboard-viewport">
      {/* Page Title & Metrics Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">Business Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time point of sale performance tracking, margins and stock diagnostics.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8FA38F]/10 text-[#5A5A40] rounded-lg text-xs font-mono font-bold border border-[#8FA38F]/20" id="live-indicator">
          <span className="w-2 h-2 rounded-full bg-[#8FA38F] animate-pulse"></span>
          <span>Live Register Cache Synchronization</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-grid">
        {/* KPI 1: Net Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36" id="kpi-revenue">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Gross Sales Revenue</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5 font-sans">
                {formatCurrency(stats.totalRevenue)}
              </h3>
            </div>
            <div className="p-2.5 bg-[#8FA38F]/10 text-[#5A5A40] rounded-xl">
              <DollarSign className="w-5 h-5 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#8FA38F] mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-semibold">Healthy Flow</span>
            <span className="text-slate-400">({stats.totalTransactions} bills)</span>
          </div>
        </div>

        {/* KPI 2: Profit Margin */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36" id="kpi-margin">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Net Profit &amp; Margin</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1.5 font-sans">
                {formatCurrency(stats.netProfit)}
              </h3>
            </div>
            <div className="p-2.5 bg-[#C2B29F]/15 text-[#8b7a67] rounded-xl">
              <Percent className="w-5 h-5 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
            <span className="text-[#8FA38F] font-bold">{stats.marginPercent.toFixed(1)}%</span>
            <span>gross profit margin to cost</span>
          </div>
        </div>

        {/* KPI 3: Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36" id="kpi-aov">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Order Value</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1.5 font-sans">
                {formatCurrency(stats.averageOrderValue)}
              </h3>
            </div>
            <div className="p-2.5 bg-[#A19C80]/15 text-[#7c7860] rounded-xl">
              <ShoppingCart className="w-5 h-5 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#8FA38F] mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Avg {stats.totalTransactions > 0 ? (stats.totalRevenue / stats.totalTransactions).toFixed(0) : 0} items per bag</span>
          </div>
        </div>

        {/* KPI 4: Low Inventory alert */}
        <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-36 ${
          stats.lowStockCount > 0 
            ? 'bg-amber-50/50 border-amber-100 shadow-xs hover:shadow-md text-amber-900' 
            : 'bg-white border-slate-100 shadow-xs hover:shadow-md text-slate-800'
        }`} id="kpi-stock">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Inventory Health</p>
              <h3 className="text-2xl font-bold mt-1.5 font-sans">
                {stats.lowStockCount} {stats.lowStockCount === 1 ? 'Alert' : 'Alerts'}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${stats.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-500">
            {stats.lowStockCount > 0 ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span>Requires action immediately</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5 inline" /> Excellent Stock Level
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-panel">
        {/* Daily Revenue Flow SVG Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 lg:col-span-2 space-y-4 relative" id="revenue-chart">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
              <TrendingUp className="w-4 h-4 text-[#8FA38F]" /> Revenue Flow (Last 7 Days)
            </h4>
            <span className="text-xs text-slate-400 font-mono">Roll-over nodes to inspect</span>
          </div>
          
          <div className="h-72 w-full relative">
            {activeSales.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 gap-2 border bg-slate-50/50 border-dashed rounded-xl">
                <PackageOpen className="w-10 h-10 stroke-1" />
                <span className="text-xs">No active transactions in database yet.</span>
              </div>
            ) : (
              <div className="w-full h-full relative">
                {/* SVG Chart Layer */}
                <svg viewBox="0 0 600 240" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8FA38F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8FA38F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 0.33, 0.66, 1].map((pct, idx) => {
                    const yLine = 200 - (pct * 160);
                    return (
                      <g key={idx}>
                        <line x1="60" y1={yLine} x2="580" y2={yLine} stroke="#f1f5f9" strokeWidth="1" />
                      </g>
                    );
                  })}

                  {/* Shaded Area Under Curve */}
                  {areaChartPaths.area && (
                    <path d={areaChartPaths.area} fill="url(#colorRevenue)" />
                  )}

                  {/* Curve Outline */}
                  {areaChartPaths.line && (
                    <path d={areaChartPaths.line} fill="none" stroke="#8FA38F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  )}

                  {/* Vertical Hover Indicator Line */}
                  {hoveredPointIndex !== null && (
                    <line 
                      x1={svgPoints[hoveredPointIndex].x} 
                      y1="40" 
                      x2={svgPoints[hoveredPointIndex].x} 
                      y2="200" 
                      stroke="#C2B29F" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4" 
                    />
                  )}

                  {/* Circles on Nodes */}
                  {svgPoints.map((p, idx) => (
                    <circle 
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPointIndex === idx ? 6 : 4}
                      fill={hoveredPointIndex === idx ? '#8FA38F' : '#ffffff'}
                      stroke="#8FA38F"
                      strokeWidth={hoveredPointIndex === idx ? 3 : 2}
                      className="transition-all duration-200"
                    />
                  ))}

                  {/* Y Axis Labels (aligned statically) */}
                  {[0, 0.33, 0.66, 1].map((pct, idx) => {
                    const val = maxRevenue * pct;
                    const yLine = 200 - (pct * 160);
                    return (
                      <text key={idx} x="50" y={yLine + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-400 font-bold">
                        {currencySymbol}{Math.round(val)}
                      </text>
                    );
                  })}

                  {/* X Axis Date Labels */}
                  {svgPoints.map((p, idx) => (
                    <text key={idx} x={p.x} y="222" textAnchor="middle" className="text-[10px] fill-slate-500 font-bold font-sans">
                      {p.date}
                    </text>
                  ))}

                  {/* Invisible broad slice rectangles for bullet-proof hover capture */}
                  {svgPoints.map((p, idx) => {
                    const sliceWidth = 600 / 7;
                    return (
                      <rect
                        key={idx}
                        x={p.x - sliceWidth / 2}
                        y="20"
                        width={sliceWidth}
                        height="180"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      />
                    );
                  })}
                </svg>

                {/* Micro-Interaction Floating Tooltip */}
                {hoveredPointIndex !== null && (
                  <div 
                    className="absolute bg-white border border-slate-100 rounded-xl p-3 shadow-lg text-xs space-y-1 pointer-events-none transition-all duration-150 z-20"
                    style={{
                      left: `${(svgPoints[hoveredPointIndex].x / 600) * 100}%`,
                      top: `${(svgPoints[hoveredPointIndex].y / 240) * 100 - 15}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <p className="font-bold text-slate-700">{svgPoints[hoveredPointIndex].date}</p>
                    <p className="text-[#8FA38F] font-bold">Revenue: {formatCurrency(svgPoints[hoveredPointIndex].revenue)}</p>
                    <p className="text-slate-400 font-mono text-[10px]">Sales Volume: {svgPoints[hoveredPointIndex].transactions} txn</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between" id="category-chart-card">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
              Sales by Category
            </h4>
            
            <div className="h-44 flex justify-center items-center relative">
              {categoryChartData.length === 0 ? (
                <div className="text-slate-400 text-xs">No data is available</div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-36 h-36">
                    {donutSlices.map((slice, idx) => (
                      <circle
                        key={idx}
                        cx="100"
                        cy="100"
                        r="50"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={hoveredSliceIndex === idx ? "20" : "14"}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        transform="rotate(-90 100 100)"
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredSliceIndex(idx)}
                        onMouseLeave={() => setHoveredSliceIndex(null)}
                      />
                    ))}
                  </svg>
                  
                  {/* Absolute Centered Legend Card */}
                  <div className="absolute text-center pointer-events-none flex flex-col items-center justify-center">
                    {hoveredSliceIndex !== null ? (
                      <>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block max-w-[100px] truncate">
                          {donutSlices[hoveredSliceIndex].name}
                        </span>
                        <p className="text-xs font-extrabold text-slate-700">
                          {formatCurrency(donutSlices[hoveredSliceIndex].value)}
                        </p>
                        <span className="text-[9px] text-[#8FA38F] font-bold block">
                          {Math.round(donutSlices[hoveredSliceIndex].percentage * 100)}% share
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Total Sum</span>
                        <p className="text-xs font-extrabold text-slate-700">{formatCurrency(stats.totalRevenue)}</p>
                        <span className="text-[9px] text-slate-400 block">7 Days</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {categoryChartData.slice(0, 4).map((entry, i) => {
              const matchingSliceIdx = donutSlices.findIndex(s => s.name === entry.name);
              return (
                <div 
                  key={i} 
                  className={`flex justify-between items-center text-xs p-1 rounded-lg transition-colors cursor-pointer ${
                    hoveredSliceIndex === matchingSliceIdx ? 'bg-slate-50' : ''
                  }`}
                  onMouseEnter={() => matchingSliceIdx !== -1 && setHoveredSliceIndex(matchingSliceIdx)}
                  onMouseLeave={() => setHoveredSliceIndex(null)}
                >
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span className="font-medium truncate max-w-36">{entry.name}</span>
                  </div>
                  <div className="font-semibold text-slate-700">
                    {formatCurrency(entry.value)}
                  </div>
                </div>
              );
            })}
            {categoryChartData.length > 4 && (
              <p className="text-[10px] text-center text-slate-400 italic pt-1">+{categoryChartData.length - 4} other categories with active sales</p>
            )}
          </div>
        </div>
      </div>

      {/* Lists row: Top Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="details-panel">
        
        {/* Top Product Leaderboard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4" id="top-selling-products">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 tracking-tight uppercase tracking-wider text-slate-500">
              Top Selling Products
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Leading inventory items sorted by units sold.</p>
          </div>

          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center border border-dashed rounded-lg">No sales logged yet.</p>
            ) : (
              topProducts.map((item) => {
                const colorsMap: Record<string, string> = {
                  emerald: 'bg-[#8FA38F]', 
                  amber: 'bg-[#C2B29F]', 
                  rose: 'bg-[#A19C80]',
                  violet: 'bg-[#D1BC9D]',
                  indigo: 'bg-[#7F8F7F]',
                  cyan: 'bg-[#A39081]'
                };
                const bgProgress = colorsMap[item.product.color || ''] || 'bg-slate-400';
                
                // percentage based on top product's qty
                const maxQty = topProducts[0].qty;
                const pct = maxQty > 0 ? (item.qty / maxQty) * 100 : 0;

                return (
                  <div key={item.product.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 truncate max-w-48">{item.product.name}</span>
                      <span className="text-slate-500 text-[11px]">
                        <strong className="text-slate-800">{item.qty}</strong> units ({formatCurrency(item.salesTotal)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${bgProgress}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4" id="watchlist-low-stock">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 tracking-tight uppercase tracking-wider text-slate-500">
                Low Stock Watchlist
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Critical items currently below threshold limits.</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md font-mono">
              Action Priority
            </span>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 border border-dashed rounded-lg bg-emerald-50/10 gap-1">
                <PackageCheck className="w-7 h-7 text-emerald-500 stroke-1" />
                <span className="text-xs text-emerald-700 font-medium">All products fully stocked!</span>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">SKU: {item.sku} | Lvl: {item.lowStockThreshold} min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 font-mono font-bold rounded-lg ${
                      item.stock === 0 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.stock} {item.stock === 1 ? 'unit' : 'units'} left
                    </span>
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
