import React, { useState, useRef } from 'react';
import { 
  useAnalyzePortfolio, 
  useAiAnalyzePortfolio, 
  type PortfolioAnalysisResponse,
  type AIAnalysisResponse
} from '@workspace/api-client-react';
import { PortfolioBuilder } from '@/components/PortfolioBuilder';
import { DashboardMetrics } from '@/components/DashboardMetrics';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Button } from '@/components/ui-elements';
import { Download, Activity, Radar, Sparkles, Bot, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useExportPdf } from '@/hooks/use-export-pdf';
import { motion } from 'framer-motion';

export default function Home() {
  const { toast } = useToast();
  const { exportPdf, isExporting } = useExportPdf();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [portfolioData, setPortfolioData] = useState<PortfolioAnalysisResponse | null>(null);
  const [aiData, setAiData] = useState<AIAnalysisResponse | null>(null);

  const analyzeMutation = useAnalyzePortfolio({
    mutation: {
      onError: (err: any) => {
        toast({
          title: "Analysis Failed",
          description: err.message || "Failed to analyze portfolio. Please check inputs.",
          variant: "destructive"
        });
      }
    }
  });

  const aiMutation = useAiAnalyzePortfolio({
    mutation: {
      onError: (err: any) => {
        toast({
          title: "AI Insights Failed",
          description: err.message || "Could not generate AI insights.",
          variant: "destructive"
        });
      }
    }
  });

  const handleAnalyze = async (holdings: { symbol: string; quantity: number; buyPrice: number }[]) => {
    setPortfolioData(null);
    setAiData(null);
    
    // Step 1: Analyze Portfolio Metrics
    try {
      const data = await analyzeMutation.mutateAsync({ data: { holdings } });
      setPortfolioData(data);
      
      // Step 2: Automatically trigger AI analysis using the generated JSON and summary
      await aiMutation.mutateAsync({
        data: {
          portfolioJson: data.portfolioJson,
          portfolioSummary: {
            totalCurrentValue: data.totalCurrentValue,
            totalGainLossPercent: data.totalGainLossPercent,
            weightedPE: data.weightedPE,
            niftyPE: data.niftyPE,
            numberOfHoldings: data.holdings.length,
            topSectors: data.sectorAllocation.slice(0,3).map(s => s.sector)
          }
        }
      }).then(setAiData);

    } catch (e) {
      // Errors handled by mutation config
    }
  };

  const handleExport = () => {
    if (dashboardRef.current) {
      exportPdf('exportable-dashboard', 'AI-Portfolio-Analysis.pdf');
    }
  };

  const isProcessing = analyzeMutation.isPending || aiMutation.isPending;

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
          
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            India Markets Live
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Intro Section */}
        {!portfolioData && !isProcessing && (
          <div className="text-center py-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-foreground">
              Institutional-grade analysis,<br/>
              <span className="text-gradient-primary">powered by dual AI.</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Build your portfolio from NIFTY 50 or SENSEX 30, and get instant risk metrics, valuation comparisons, and consensus recommendations from ChatGPT & Claude.
            </p>
          </div>
        )}

        {/* Input Section */}
        <section>
          <PortfolioBuilder onAnalyze={handleAnalyze} isAnalyzing={isProcessing} />
        </section>

        {/* Dashboard Results - Wrapped for PDF export */}
        {(portfolioData || isProcessing) && (
          <div id="exportable-dashboard" className="space-y-10 relative pt-8">
            
            {/* Export Header - only visible when data is ready */}
            {portfolioData && !isProcessing && (
              <div className="flex items-center justify-between" data-html2canvas-ignore>
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Portfolio Intelligence
                </h2>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                  {isExporting ? <span className="animate-pulse">Generating PDF...</span> : <><Download className="w-4 h-4 mr-2" /> Export PDF</>}
                </Button>
              </div>
            )}

            {/* Metrics Section */}
            {analyzeMutation.isPending ? (
              <div className="h-[400px] flex items-center justify-center border border-white/5 rounded-2xl bg-card/30">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-muted-foreground font-medium animate-pulse">Calculating valuations and risk metrics...</p>
                </div>
              </div>
            ) : portfolioData && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <DashboardMetrics data={portfolioData} />
              </motion.div>
            )}

            {/* AI Insights Section */}
            {portfolioData && (
              <div className="pt-6">
                <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  AI Research Analyst
                </h2>
                
                {aiMutation.isPending ? (
                   <div className="h-[300px] flex items-center justify-center border border-primary/20 rounded-2xl bg-gradient-to-b from-card/60 to-background shadow-[0_0_30px_-10px_hsl(var(--primary)/0.1)] relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                     <div className="flex flex-col items-center gap-5 relative z-10">
                       <div className="flex gap-4">
                         <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center animate-bounce shadow-[0_0_15px_0_rgba(16,185,129,0.3)]">
                           <Bot className="w-6 h-6 text-emerald-400" />
                         </div>
                         <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center animate-bounce shadow-[0_0_15px_0_rgba(249,115,22,0.3)]" style={{ animationDelay: '0.1s' }}>
                           <BrainCircuit className="w-6 h-6 text-orange-400" />
                         </div>
                       </div>
                       <p className="text-primary font-medium tracking-wide">Synthesizing multi-model consensus...</p>
                     </div>
                   </div>
                ) : aiData && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
                    <AIInsightsPanel analysis={aiData} />
                  </motion.div>
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
