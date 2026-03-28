import React, { useState } from 'react';
import { Card, Badge } from './ui-elements';
import type { AIAnalysisResponse, AIAnalysisResult, ConsensusView, StockRecommendation } from '@workspace/api-client-react';
import { BrainCircuit, Bot, Sparkles, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsightsPanelProps {
  analysis: AIAnalysisResponse;
}

export function AIInsightsPanel({ analysis }: AIInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'gpt' | 'claude' | 'consensus'>('consensus');

  return (
    <Card className="overflow-hidden border-primary/20 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.15)] relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
      
      <div className="border-b border-white/10 bg-muted/20">
        <div className="flex overflow-x-auto hide-scrollbar">
          <TabButton 
            active={activeTab === 'consensus'} 
            onClick={() => setActiveTab('consensus')}
            icon={<Sparkles className="w-4 h-4 text-purple-400" />}
            label="Consensus View"
          />
          <TabButton 
            active={activeTab === 'gpt'} 
            onClick={() => setActiveTab('gpt')}
            icon={<Bot className="w-4 h-4 text-emerald-400" />}
            label="ChatGPT Analysis"
            subtitle={analysis.gptModel}
          />
          <TabButton 
            active={activeTab === 'claude'} 
            onClick={() => setActiveTab('claude')}
            icon={<BrainCircuit className="w-4 h-4 text-orange-400" />}
            label="Claude Analysis"
            subtitle={analysis.claudeModel}
          />
        </div>
      </div>

      <div className="p-6 md:p-8 bg-gradient-to-b from-background/50 to-transparent">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'consensus' && <ConsensusPanel data={analysis.consensus} />}
          {activeTab === 'gpt' && <ModelPanel data={analysis.gpt} provider="gpt" />}
          {activeTab === 'claude' && <ModelPanel data={analysis.claude} provider="claude" />}
        </motion.div>
      </div>
    </Card>
  );
}

function TabButton({ active, onClick, icon, label, subtitle }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all min-w-max ${
        active 
          ? 'border-primary bg-primary/5 text-foreground' 
          : 'border-transparent text-muted-foreground hover:bg-white/[0.02] hover:text-foreground'
      }`}
    >
      {icon}
      <div className="text-left">
        <div className="text-sm font-bold">{label}</div>
        {subtitle && <div className="text-[10px] opacity-60 font-mono mt-0.5">{subtitle}</div>}
      </div>
    </button>
  );
}

function ConsensusPanel({ data }: { data: ConsensusView }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display font-bold">Overall Verdict</h3>
            <RiskBadge risk={data.overallRisk} />
          </div>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            {data.consensusSummary}
          </p>
        </div>
      </div>

      {data.divergentViews.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
          <h4 className="flex items-center text-sm font-bold text-orange-400 mb-3">
            <AlertTriangle className="w-4 h-4 mr-2" />
            AI Disagreements
          </h4>
          <ul className="space-y-2">
            {data.divergentViews.map((view, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start">
                <span className="text-orange-500 mr-2">•</span> {view}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="text-sm font-bold text-foreground mb-4 border-b border-white/5 pb-2">Agreed Recommendations</h4>
        <RecommendationsGrid recommendations={data.agreedRecommendations} />
      </div>
    </div>
  );
}

function ModelPanel({ data, provider }: { data: AIAnalysisResult, provider: 'gpt' | 'claude' }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xl font-display font-bold">Executive Summary</h3>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            {data.summary}
          </p>
        </div>
        <div className="space-y-4 bg-muted/30 p-5 rounded-xl border border-white/5">
          <div>
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Assessed Risk Level</div>
            <RiskBadge risk={data.risk_level} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Diversification Score</div>
            <div className="text-2xl font-bold font-display">{data.diversification_score}</div>
          </div>
        </div>
      </div>

      {data.key_issues.length > 0 && (
        <div>
          <h4 className="flex items-center text-sm font-bold text-destructive mb-3">
            <TrendingDown className="w-4 h-4 mr-2" />
            Key Risk Factors Identified
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.key_issues.map((issue, i) => (
              <li key={i} className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="text-sm font-bold text-foreground mb-4 border-b border-white/5 pb-2">Actionable Recommendations</h4>
        <RecommendationsGrid recommendations={data.stock_recommendations} />
      </div>
    </div>
  );
}

function RecommendationsGrid({ recommendations }: { recommendations: StockRecommendation[] }) {
  if (!recommendations || recommendations.length === 0) {
    return <div className="text-sm text-muted-foreground">No specific stock actions recommended.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendations.map((rec, i) => {
        const isBuy = rec.action === 'BUY';
        const isSell = rec.action === 'SELL';
        return (
          <div key={i} className="bg-background/40 border border-white/5 rounded-xl p-4 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-foreground font-display">{rec.stock}</span>
              <Badge variant={isBuy ? 'success' : isSell ? 'destructive' : 'warning'}>
                {rec.action}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-auto leading-relaxed">{rec.reason}</p>
          </div>
        );
      })}
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const normalized = risk.toLowerCase();
  let variant: any = 'outline';
  if (normalized.includes('low')) variant = 'success';
  else if (normalized.includes('high')) variant = 'destructive';
  else if (normalized.includes('moderate')) variant = 'warning';

  return <Badge variant={variant} className="px-3 py-1 text-sm uppercase tracking-widest">{risk}</Badge>;
}
