import React from 'react';
import { Card } from './ui-elements';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { PortfolioAnalysisResponse } from '@workspace/api-client-react';

interface DashboardMetricsProps {
  data: PortfolioAnalysisResponse;
}

const SECTOR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6',
  '#F97316', '#84CC16', '#A78BFA', '#FB923C',
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white">{item.sector}</p>
      <p className="text-gray-300">{formatCurrency(item.value)}</p>
      <p className="text-gray-400">{item.percentage}% of portfolio</p>
      <p className="text-gray-500 text-xs">{item.count} holding{item.count !== 1 ? 's' : ''}</p>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <ul className="flex flex-col gap-1.5 text-xs mt-2">
      {payload.map((entry: any, i: number) => (
        <li key={i} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-gray-300 truncate max-w-[110px]" title={entry.value}>
            {entry.value}
          </span>
          <span className="text-gray-500 ml-auto pl-2 shrink-0">
            {entry.payload?.percentage}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardMetrics({ data }: DashboardMetricsProps) {
  const isPositive = data.totalGainLoss >= 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Value"
          value={formatCurrency(data.totalCurrentValue)}
          subtitle={`Invested: ${formatCurrency(data.totalInvestedValue)}`}
        />
        <MetricCard
          title="Total P&L"
          value={formatCurrency(Math.abs(data.totalGainLoss))}
          valueClass={isPositive ? 'text-success' : 'text-destructive'}
          prefix={isPositive ? '+' : '-'}
          subtitle={
            <span className={isPositive ? 'text-success font-medium' : 'text-destructive font-medium'}>
              {isPositive ? '▲' : '▼'} {formatPercent(data.totalGainLossPercent)}
            </span>
          }
        />
        <MetricCard
          title="Portfolio P/E"
          value={data.weightedPE > 0 ? formatNumber(data.weightedPE) : '—'}
          subtitle={`vs NIFTY 50 P/E: ${formatNumber(data.niftyPE)}`}
        />
        <MetricCard
          title="Concentration Risk"
          value={data.riskMetrics.concentrationRisk}
          valueClass={
            data.riskMetrics.concentrationRisk === 'High'
              ? 'text-destructive'
              : data.riskMetrics.concentrationRisk === 'Moderate'
              ? 'text-yellow-400'
              : 'text-success'
          }
          subtitle={`${data.riskMetrics.numberOfSectors} sector${data.riskMetrics.numberOfSectors !== 1 ? 's' : ''} · ${data.holdings.length} holdings`}
        />
      </div>

      {/* Sector pie + Holdings table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 flex flex-col min-h-[380px]">
          <h3 className="text-lg font-display font-semibold mb-4">Sector Allocation</h3>
          {data.sectorAllocation.length > 0 ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.sectorAllocation}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="sector"
                    stroke="none"
                  >
                    {data.sectorAllocation.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SECTOR_COLORS[index % SECTOR_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    content={<CustomLegend />}
                    layout="vertical"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No sector data available
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-display font-semibold">Holdings Breakdown</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Sector</th>
                  <th className="px-4 py-3 font-medium text-right">Weight</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Price</th>
                  <th className="px-4 py-3 font-medium text-right">LTP</th>
                  <th className="px-6 py-3 font-medium text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.holdings.map((h, i) => {
                  const isGain = h.gainLoss >= 0;
                  const color = SECTOR_COLORS[
                    data.sectorAllocation.findIndex((s) => s.sector === h.sector) % SECTOR_COLORS.length
                  ];
                  return (
                    <tr key={h.symbol} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <div>
                            <div className="font-bold text-foreground">{h.symbol.replace('.NS', '')}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[130px]">{h.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">{h.sector}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatPercent(h.weight)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(h.buyPrice)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(h.currentPrice)}</td>
                      <td className={`px-6 py-3 text-right font-bold ${isGain ? 'text-success' : 'text-destructive'}`}>
                        {isGain ? '+' : ''}{formatPercent(h.gainLossPercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, valueClass = 'text-foreground', prefix = '' }: any) {
  return (
    <Card className="p-5 flex flex-col justify-center relative overflow-hidden group">
      <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]" />
      <p className="text-sm text-muted-foreground font-medium mb-1 relative">{title}</p>
      <div className="flex items-baseline gap-1 relative">
        {prefix && <span className={valueClass}>{prefix}</span>}
        <h3 className={`text-2xl lg:text-3xl font-bold font-display tracking-tight ${valueClass}`}>
          {value}
        </h3>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-2 relative">{subtitle}</p>}
    </Card>
  );
}
