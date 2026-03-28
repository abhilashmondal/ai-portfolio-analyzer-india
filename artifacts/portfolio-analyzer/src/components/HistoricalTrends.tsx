import React, { useState, useCallback } from 'react';
import { useGetStockHistory } from '@workspace/api-client-react';
import type { StockHistoryResponse } from '@workspace/api-client-react';
import { Card } from './ui-elements';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui-elements';

interface HistoricalTrendsProps {
  holdings: { symbol: string; quantity: number; buyPrice: number }[];
}

type ViewMode = 'portfolio' | 'individual' | 'percent';
type Period = '6mo' | '1y';

function formatINR(v: number): string {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === '1y') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function CustomTooltip({ active, payload, label, mode, period }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[180px]">
      <p className="text-xs text-muted-foreground mb-2 font-medium">
        {label ? formatDate(label, period) : ''}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-gray-300 truncate max-w-[110px]">{entry.name}</span>
          </div>
          <span className="font-semibold text-white tabular-nums">
            {mode === 'percent'
              ? `${entry.value >= 0 ? '+' : ''}${entry.value}%`
              : mode === 'portfolio'
              ? formatINR(entry.value)
              : `₹${Number(entry.value).toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function TickFormatter(value: string, period: Period) {
  const d = new Date(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function HistoricalTrends({ holdings }: HistoricalTrendsProps) {
  const [period, setPeriod] = useState<Period>('6mo');
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
  const [data, setData] = useState<StockHistoryResponse | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const mutation = useGetStockHistory();

  const load = useCallback((p: Period) => {
    mutation.mutate(
      { data: { holdings, period: p } },
      {
        onSuccess: (result) => {
          setData(result);
          setHasLoaded(true);
        },
      }
    );
  }, [holdings, mutation]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    load(p);
  };

  // Auto-load on first mount
  React.useEffect(() => {
    if (!hasLoaded && !mutation.isPending) {
      load(period);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge all data points into a single array keyed by date for Recharts
  const chartData = React.useMemo(() => {
    if (!data) return [];

    if (viewMode === 'portfolio') {
      return data.portfolio.map((p) => ({
        date: p.date,
        'Portfolio Value': p.value,
      }));
    }

    if (viewMode === 'percent') {
      // Merge all stocks by date
      const dateMap = new Map<string, Record<string, number>>();
      data.stocks
        .filter((s) => s.available && s.data.length > 0)
        .forEach((s) => {
          s.data.forEach((pt) => {
            const existing = dateMap.get(pt.date) ?? {};
            existing[s.symbol.replace('.NS', '')] = pt.changeFromStart;
            dateMap.set(pt.date, existing);
          });
        });
      // Also add portfolio
      data.portfolio.forEach((p) => {
        const existing = dateMap.get(p.date) ?? {};
        existing['Portfolio'] = p.changeFromStart;
        dateMap.set(p.date, existing);
      });
      return Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({ date, ...vals }));
    }

    // individual: price per stock
    const dateMap = new Map<string, Record<string, number>>();
    data.stocks
      .filter((s) => s.available && s.data.length > 0)
      .forEach((s) => {
        s.data.forEach((pt) => {
          const existing = dateMap.get(pt.date) ?? {};
          existing[s.symbol.replace('.NS', '')] = pt.price;
          dateMap.set(pt.date, existing);
        });
      });
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));
  }, [data, viewMode]);

  const availableStocks = data?.stocks.filter((s) => s.available) ?? [];
  const unavailableStocks = data?.stocks.filter((s) => !s.available) ?? [];

  const latestPortfolioChange = data?.portfolio?.[data.portfolio.length - 1]?.changeFromStart ?? 0;
  const isUp = latestPortfolioChange >= 0;

  const tickInterval = chartData.length > 80 ? Math.floor(chartData.length / 8) :
    chartData.length > 40 ? Math.floor(chartData.length / 6) : 'preserveStartEnd';

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-white/5">
            {(['6mo', '1y'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                disabled={mutation.isPending}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === p
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === '6mo' ? '6 Months' : '1 Year'}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-white/5">
            {([
              { key: 'portfolio', label: 'Portfolio ₹' },
              { key: 'percent', label: '% Change' },
              { key: 'individual', label: 'Stock Price' },
            ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === key
                    ? 'bg-background shadow text-foreground border border-white/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {hasLoaded && data && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-bold ${isUp ? 'text-success' : 'text-destructive'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? '+' : ''}{latestPortfolioChange}% ({period})
            </div>
            <button
              onClick={() => load(period)}
              disabled={mutation.isPending}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${mutation.isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Chart Card */}
      <Card className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {mutation.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[350px] flex flex-col items-center justify-center gap-4"
            >
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm animate-pulse">
                Fetching {period === '6mo' ? '6-month' : '1-year'} historical data...
              </p>
            </motion.div>
          ) : mutation.isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[350px] flex flex-col items-center justify-center gap-3"
            >
              <AlertCircle className="w-10 h-10 text-destructive/60" />
              <p className="text-muted-foreground text-sm text-center">
                Could not load historical data. Yahoo Finance may be temporarily unavailable.
              </p>
              <Button variant="outline" size="sm" onClick={() => load(period)}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Try Again
              </Button>
            </motion.div>
          ) : chartData.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[350px] flex flex-col items-center justify-center gap-3"
            >
              <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No historical data available for the selected period.</p>
            </motion.div>
          ) : (
            <motion.div
              key={`${viewMode}-${period}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => TickFormatter(v, period)}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    interval={tickInterval}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      viewMode === 'portfolio'
                        ? formatINR(v)
                        : viewMode === 'percent'
                        ? `${v}%`
                        : `₹${v}`
                    }
                    width={viewMode === 'portfolio' ? 72 : 48}
                  />
                  <Tooltip
                    content={<CustomTooltip mode={viewMode} period={period} />}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    formatter={(value) => (
                      <span style={{ color: '#9ca3af' }}>{value}</span>
                    )}
                  />
                  {viewMode === 'percent' && (
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
                  )}

                  {viewMode === 'portfolio' && (
                    <Line
                      type="monotone"
                      dataKey="Portfolio Value"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  )}

                  {viewMode === 'percent' && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Portfolio"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        strokeDasharray="none"
                      />
                      {availableStocks.map((s) => (
                        <Line
                          key={s.symbol}
                          type="monotone"
                          dataKey={s.symbol.replace('.NS', '')}
                          stroke={s.color}
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                          opacity={0.7}
                        />
                      ))}
                    </>
                  )}

                  {viewMode === 'individual' &&
                    availableStocks.map((s) => (
                      <Line
                        key={s.symbol}
                        type="monotone"
                        dataKey={s.symbol.replace('.NS', '')}
                        name={s.name}
                        stroke={s.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Unavailable stocks notice */}
      {unavailableStocks.length > 0 && hasLoaded && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-400">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Historical data not available for:{' '}
            {unavailableStocks.map((s) => s.symbol.replace('.NS', '')).join(', ')}.
            These are excluded from the portfolio trend.
          </span>
        </div>
      )}

      {/* Stock stats cards */}
      {hasLoaded && availableStocks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableStocks.map((s) => {
            const last = s.data[s.data.length - 1];
            const isStockUp = (last?.changeFromStart ?? 0) >= 0;
            return (
              <div
                key={s.symbol}
                className="bg-card/40 border border-white/5 rounded-xl p-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs font-bold text-foreground truncate">
                    {s.symbol.replace('.NS', '')}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                <div className={`text-sm font-bold mt-0.5 ${isStockUp ? 'text-success' : 'text-destructive'}`}>
                  {isStockUp ? '+' : ''}{last?.changeFromStart ?? 0}%
                </div>
                <span className="text-xs text-muted-foreground">
                  ₹{last?.price?.toFixed(2) ?? '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
