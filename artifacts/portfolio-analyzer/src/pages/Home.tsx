import React, { useState, useRef, useCallback } from 'react';
import {
  useAnalyzePortfolio,
  useAiAnalyzePortfolio,
  type PortfolioAnalysisResponse,
  type AIAnalysisResponse,
} from '@workspace/api-client-react';
import { PortfolioBuilder } from '@/components/PortfolioBuilder';
import { DashboardMetrics } from '@/components/DashboardMetrics';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { HistoricalTrends } from '@/components/HistoricalTrends';
import { Button } from '@/components/ui-elements';
import {
  Download, Activity, Radar, Sparkles, Bot, BrainCircuit, LineChart as LineChartIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useExportPdf } from '@/hooks/use-export-pdf';
import { motion, AnimatePresence } from 'framer-motion';
const API_URL = "https://ai-portfolio-analyzer-india.onrender.com";
type DashboardTab = 'overview' | 'trends' | 'ai';

export default function Home() {
  const { toast } = useToast();
  const { exportPdf, isExporting } = useExportPdf();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [portfolioData, setPortfolioData] = useState<PortfolioAnalysisResponse | null>(null);
  const [aiData, setAiData] = useState<AIAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  // Store the submitted holdings so Historical Trends can reference them
  const [submittedHoldings, setSubmittedHoldings] = useState<{ symbol: string; quantity: number; buyPrice: number }[]>([]);

  const isRequestInFlight = useRef(false);

  const analyzeMutation = useAnalyzePortfolio({
    mutation: {
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to analyze portfolio.';
        console.error('[Portfolio] Analysis error:', err);
        toast({ title: 'Analysis Failed', description: message, variant: 'destructive' });
      },
    },
  });

  const aiMutation = useAiAnalyzePortfolio({
    mutation: {
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Could not generate AI insights.';
        console.error('[AI] Insights error:', err);
        toast({ title: 'AI Insights Failed', description: message, variant: 'destructive' });
      },
    },
  });

  const handleAnalyze = useCallback(
    async (holdings: { symbol: string; quantity: number; buyPrice: number }[]) => {
      if (isRequestInFlight.current) {
        console.warn('[Portfolio] Duplicate request blocked');
        return;
      }
      if (holdings.length === 0) {
        toast({ title: 'Empty Portfolio', description: 'Add at least one stock.', variant: 'destructive' });
        return;
      }

      isRequestInFlight.current = true;
      setPortfolioData(null);
      setAiData(null);
      setActiveTab('overview');
      setSubmittedHoldings(holdings);
      console.log('[Portfolio] Sending for analysis:', holdings);

      const res = await fetch(`${API_URL}/api/analyze`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ holdings }),
});

const data = await res.json();
        setPortfolioData(data);

        const aiPayload = {
          portfolioJson: data.portfolioJson,
          portfolioSummary: {
            totalCurrentValue: data.totalCurrentValue,
            totalGainLossPercent: data.totalGainLossPercent,
            weightedPE: data.weightedPE,
            niftyPE: data.niftyPE,
            numberOfHoldings: data.holdings.length,
            topSectors: data.sectorAllocation.slice(0, 3).map((s) => s.sector),
          },
        };

        console.log('[AI] Sending for analysis, JSON size:', data.portfolioJson.length);
        const aiRes = await fetch(`${API_URL}/api/ai-analyze`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(aiPayload),
});

const aiResult = await aiRes.json();
        console.log('[AI] Received:', {
          gptRisk: aiResult.gpt.risk_level,
          claudeRisk: aiResult.claude.risk_level,
          agreedRecs: aiResult.consensus.agreedRecommendations.length,
        });
        setAiData(aiResult);
      } catch (e) {
        console.error('[Portfolio] handleAnalyze caught:', e);
      } finally {
        isRequestInFlight.current = false;
      }
    },
    [analyzeMutation, aiMutation, toast]
  );

  const handleExport = () => {
    if (!portfolioData) {
      toast({ title: 'No data to export', description: 'Analyze a portfolio first.', variant: 'destructive' });
      return;
    }
    exportPdf('exportable-dashboard', 'AI-Portfolio-Analysis.pdf');
  };

  const isProcessing = analyzeMutation.isPending || aiMutation.isPending;

  const tabs: { key: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { key: 'trends', label: 'Historical Trends', icon: <LineChartIcon className="w-4 h-4" /> },
    { key: 'ai', label: 'AI Research', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight text-gradient">AI Portfolio Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs text-muted-foreground/60 font-medium">
              Created by <span className="text-muted-foreground font-semibold">Abhilash Mondal</span>
            </span>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              India Markets Live
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero */}
        {!portfolioData && !isProcessing && (
          <div className="text-center py-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-foreground">
              Institutional-grade analysis,<br />
              <span className="text-gradient-primary">powered by dual AI.</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Build your portfolio from NIFTY 50 or SENSEX 30, and get instant risk metrics,
              valuation comparisons, and consensus recommendations from ChatGPT & Claude.
            </p>
          </div>
        )}

        {/* Portfolio Builder */}
        <section>
          <PortfolioBuilder onAnalyze={handleAnalyze} isAnalyzing={isProcessing} />
        </section>

        {/* Results */}
        {(portfolioData || isProcessing) && (
          <div className="space-y-6">
            {/* Top bar: title + export */}
            {portfolioData && !isProcessing && (
              <div className="flex items-center justify-between" data-html2canvas-ignore>
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Portfolio Intelligence
                </h2>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                  {isExporting
                    ? <span className="animate-pulse">Generating PDF…</span>
                    : <><Download className="w-4 h-4 mr-2" />Export PDF</>}
                </Button>
              </div>
            )}

            {/* Loading: metrics still computing */}
            {analyzeMutation.isPending && (
              <div className="h-[400px] flex items-center justify-center border border-white/5 rounded-2xl bg-card/30">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted-foreground font-medium animate-pulse">
                    Fetching live prices and calculating metrics…
                  </p>
                </div>
              </div>
            )}

            {/* Tab bar — shown once metrics are ready */}
            {portfolioData && (
              <>
                <div id="exportable-dashboard" ref={dashboardRef}>
                  {/* Tab navigation */}
                  <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-white/5 w-fit mb-6" data-html2canvas-ignore>
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                          activeTab === tab.key
                            ? 'bg-background text-foreground shadow border border-white/10'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                        {tab.key === 'ai' && aiMutation.isPending && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-1" />
                        )}
                        {tab.key === 'ai' && aiData && (
                          <span className="w-1.5 h-1.5 rounded-full bg-success ml-1" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab panels */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                      >
                        <DashboardMetrics data={portfolioData} />
                      </motion.div>
                    )}

                    {activeTab === 'trends' && (
                      <motion.div
                        key="trends"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                      >
                        <HistoricalTrends holdings={submittedHoldings} />
                      </motion.div>
                    )}

                    {activeTab === 'ai' && (
                      <motion.div
                        key="ai"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                      >
                        {aiMutation.isPending ? (
                          <div className="h-[300px] flex items-center justify-center border border-primary/20 rounded-2xl bg-gradient-to-b from-card/60 to-background relative overflow-hidden">
                            <div className="flex flex-col items-center gap-5 relative z-10">
                              <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center animate-bounce">
                                  <Bot className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.15s' }}>
                                  <BrainCircuit className="w-6 h-6 text-orange-400" />
                                </div>
                              </div>
                              <p className="text-primary font-medium animate-pulse">
                                Synthesizing multi-model consensus (~20s)…
                              </p>
                            </div>
                          </div>
                        ) : aiMutation.isError ? (
                          <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-3">
                            <p className="text-destructive font-semibold">AI analysis failed</p>
                            <p className="text-muted-foreground text-sm">
                              {aiMutation.error instanceof Error
                                ? aiMutation.error.message
                                : 'An unexpected error occurred. Please retry.'}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                portfolioData &&
                                aiMutation
                                  .mutateAsync({
                                    data: {
                                      portfolioJson: portfolioData.portfolioJson,
                                      portfolioSummary: {
                                        totalCurrentValue: portfolioData.totalCurrentValue,
                                        totalGainLossPercent: portfolioData.totalGainLossPercent,
                                        weightedPE: portfolioData.weightedPE,
                                        niftyPE: portfolioData.niftyPE,
                                        numberOfHoldings: portfolioData.holdings.length,
                                        topSectors: portfolioData.sectorAllocation.slice(0, 3).map((s) => s.sector),
                                      },
                                    },
                                  })
                                  .then(setAiData)
                              }
                            >
                              Retry AI Analysis
                            </Button>
                          </div>
                        ) : aiData ? (
                          <AIInsightsPanel analysis={aiData} />
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
