import React from 'react';
import { Card } from './ui-elements';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { PortfolioAnalysisResponse } from '@workspace/api-client-react';

interface DashboardMetricsProps {
  data: PortfolioAnalysisResponse;
}

export function DashboardMetrics({ data }: DashboardMetricsProps) {
  const isPositive = data.totalGainLoss >= 0;

  // Colors for chart
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'];

  return (
    <div className="space-y-6">
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
          value={formatNumber(data.weightedPE)} 
          subtitle={`vs NIFTY 50 P/E: ${formatNumber(data.niftyPE)}`}
        />
        <MetricCard 
          title="Portfolio Beta" 
          value={formatNumber(data.riskMetrics.portfolioBeta)} 
          subtitle={`Volatility: ${data.riskMetrics.volatilityCategory}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 flex flex-col items-center justify-center min-h-[350px]">
          <h3 className="text-lg font-display font-semibold mb-4 self-start w-full">Sector Allocation</h3>
          {data.sectorAllocation.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.sectorAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.sectorAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No sector data available</div>
          )}
        </Card>

        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 pb-2">
             <h3 className="text-lg font-display font-semibold">Holdings Breakdown</h3>
          </div>
          <div className="flex-1 overflow-auto p-0">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium text-right">Weight</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Price</th>
                    <th className="px-4 py-3 font-medium text-right">LTP</th>
                    <th className="px-6 py-3 font-medium text-right">P&L (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.holdings.map((h) => {
                    const isGain = h.gainLoss >= 0;
                    return (
                      <tr key={h.symbol} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-bold text-foreground">{h.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">{h.name}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatPercent(h.weight)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(h.buyPrice)}</td>
                        <td className="px-4 py-3 text-right text-foreground">{formatCurrency(h.currentPrice)}</td>
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

function MetricCard({ title, value, subtitle, valueClass = "text-foreground", prefix = "" }: any) {
  return (
    <Card className="p-5 flex flex-col justify-center relative overflow-hidden group">
      <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]"></div>
      <p className="text-sm text-muted-foreground font-medium mb-1 relative">{title}</p>
      <div className="flex items-baseline gap-1 relative">
        {prefix && <span className={valueClass}>{prefix}</span>}
        <h3 className={`text-2xl lg:text-3xl font-bold font-display tracking-tight ${valueClass}`}>
          {value}
        </h3>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-2 relative">{subtitle}</p>}
    </Card>
  )
}
