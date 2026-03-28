import React, { useState, useMemo } from 'react';
import { useGetNifty50Stocks, useGetSensex30Stocks } from '@workspace/api-client-react';
import { Search, Plus, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button, Input, Card, Checkbox, Badge } from './ui-elements';
import { motion, AnimatePresence } from 'framer-motion';

export interface DraftHolding {
  symbol: string;
  name: string;
  sector: string;
  quantity: number | '';
  buyPrice: number | '';
}

interface PortfolioBuilderProps {
  onAnalyze: (holdings: { symbol: string; quantity: number; buyPrice: number }[]) => void;
  isAnalyzing: boolean;
}

export function PortfolioBuilder({ onAnalyze, isAnalyzing }: PortfolioBuilderProps) {
  const [activeTab, setActiveTab] = useState<'index' | 'custom'>('index');
  const [indexType, setIndexType] = useState<'NIFTY50' | 'SENSEX30'>('NIFTY50');
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Custom portfolio state
  const [customHoldings, setCustomHoldings] = useState<DraftHolding[]>([
    { symbol: '', name: '', sector: 'Custom', quantity: '', buyPrice: '' }
  ]);

  // Index portfolio state — tracks selected stocks and their inputs
  const [selectedStocks, setSelectedStocks] = useState<Record<string, DraftHolding>>({});

  const { data: niftyData, isLoading: isLoadingNifty, isError: isNiftyError } = useGetNifty50Stocks();
  const { data: sensexData, isLoading: isLoadingSensex, isError: isSensexError } = useGetSensex30Stocks();

  const currentStocks = useMemo(() => {
    const raw = indexType === 'NIFTY50' ? niftyData?.stocks : sensexData?.stocks;
    if (!raw) return [];
    if (!searchQuery) return raw;
    const lowerQ = searchQuery.toLowerCase();
    return raw.filter(
      (s) =>
        s.symbol.toLowerCase().includes(lowerQ) ||
        s.name.toLowerCase().includes(lowerQ) ||
        s.sector.toLowerCase().includes(lowerQ)
    );
  }, [indexType, niftyData, sensexData, searchQuery]);

  const selectedCount = Object.keys(selectedStocks).length;
  const readyCount = useMemo(() => {
    if (activeTab === 'index') {
      return Object.values(selectedStocks).filter(
        (h) => h.quantity !== '' && h.buyPrice !== '' && Number(h.quantity) > 0 && Number(h.buyPrice) > 0
      ).length;
    }
    return customHoldings.filter(
      (h) =>
        h.symbol.trim() !== '' &&
        h.quantity !== '' &&
        h.buyPrice !== '' &&
        Number(h.quantity) > 0 &&
        Number(h.buyPrice) > 0
    ).length;
  }, [activeTab, selectedStocks, customHoldings]);

  const handleToggleStock = (stock: { symbol: string; name: string; sector: string }) => {
    setValidationError(null);
    setSelectedStocks((prev) => {
      const next = { ...prev };
      if (next[stock.symbol]) {
        delete next[stock.symbol];
      } else {
        next[stock.symbol] = {
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          quantity: '',
          buyPrice: '',
        };
      }
      return next;
    });
  };

  const handleUpdateSelected = (symbol: string, field: 'quantity' | 'buyPrice', value: string) => {
    setValidationError(null);
    setSelectedStocks((prev) => ({
      ...prev,
      [symbol]: {
        ...prev[symbol]!,
        [field]: value === '' ? '' : Number(value),
      },
    }));
  };

  const handleUpdateCustom = (index: number, field: keyof DraftHolding, value: string) => {
    setValidationError(null);
    setCustomHoldings((prev) => {
      const next = [...prev];
      if (field === 'quantity' || field === 'buyPrice') {
        next[index] = { ...next[index]!, [field]: value === '' ? '' : Number(value) };
      } else {
        next[index] = { ...next[index]!, [field]: value };
      }
      return next;
    });
  };

  const handleAddCustomRow = () => {
    setCustomHoldings((prev) => [
      ...prev,
      { symbol: '', name: '', sector: 'Custom', quantity: '', buyPrice: '' },
    ]);
  };

  const handleRemoveCustomRow = (index: number) => {
    setCustomHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    setValidationError(null);
    let finalHoldings: { symbol: string; quantity: number; buyPrice: number }[] = [];

    if (activeTab === 'index') {
      if (selectedCount === 0) {
        setValidationError("Select at least one stock by clicking its checkbox.");
        return;
      }

      finalHoldings = Object.values(selectedStocks)
        .filter(
          (h) =>
            h.quantity !== '' &&
            h.buyPrice !== '' &&
            Number(h.quantity) > 0 &&
            Number(h.buyPrice) > 0
        )
        .map((h) => ({
          symbol: h.symbol,
          quantity: Number(h.quantity),
          buyPrice: Number(h.buyPrice),
        }));

      if (finalHoldings.length === 0) {
        setValidationError(
          `You selected ${selectedCount} stock${selectedCount > 1 ? 's' : ''}, but none have valid Quantity and Buy Price. Fill in both fields for selected stocks.`
        );
        return;
      }
    } else {
      finalHoldings = customHoldings
        .filter(
          (h) =>
            h.symbol.trim() !== '' &&
            h.quantity !== '' &&
            h.buyPrice !== '' &&
            Number(h.quantity) > 0 &&
            Number(h.buyPrice) > 0
        )
        .map((h) => ({
          symbol: h.symbol.trim().toUpperCase().endsWith('.NS')
            ? h.symbol.trim().toUpperCase()
            : h.symbol.trim().toUpperCase() + '.NS',
          quantity: Number(h.quantity),
          buyPrice: Number(h.buyPrice),
        }));

      if (finalHoldings.length === 0) {
        setValidationError("Add at least one row with a valid stock symbol, quantity, and buy price.");
        return;
      }
    }

    console.log("[PortfolioBuilder] Submitting holdings:", finalHoldings);
    onAnalyze(finalHoldings);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-muted/50 rounded-xl max-w-md mx-auto border border-border">
        <button
          onClick={() => { setActiveTab('index'); setValidationError(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'index' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Select from Index
        </button>
        <button
          onClick={() => { setActiveTab('custom'); setValidationError(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'custom' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Custom Portfolio
        </button>
      </div>

      <Card className="p-6 overflow-hidden">
        {activeTab === 'index' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2 items-center">
                <Button
                  variant={indexType === 'NIFTY50' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIndexType('NIFTY50')}
                >
                  NIFTY 50
                </Button>
                <Button
                  variant={indexType === 'SENSEX30' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIndexType('SENSEX30')}
                >
                  SENSEX 30
                </Button>
                {selectedCount > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {selectedCount} selected · {readyCount} ready
                  </span>
                )}
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search stocks, sectors..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {(isNiftyError || isSensexError) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Failed to load stock list. Please refresh the page.
              </div>
            )}

            <div className="border border-white/5 rounded-xl bg-background/30 overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Sector</th>
                      <th className="px-4 py-3 font-medium w-32">Quantity</th>
                      <th className="px-4 py-3 font-medium w-32">Avg Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(isLoadingNifty || isLoadingSensex) ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            Loading index data...
                          </div>
                        </td>
                      </tr>
                    ) : currentStocks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-muted-foreground">No stocks match your search.</td>
                      </tr>
                    ) : (
                      currentStocks.map((stock) => {
                        const isSelected = !!selectedStocks[stock.symbol];
                        const holding = selectedStocks[stock.symbol];
                        const hasQty = holding && holding.quantity !== '' && Number(holding.quantity) > 0;
                        const hasPrice = holding && holding.buyPrice !== '' && Number(holding.buyPrice) > 0;
                        const isReady = isSelected && hasQty && hasPrice;

                        return (
                          <tr
                            key={stock.symbol}
                            className={`hover:bg-white/[0.02] transition-colors ${
                              isReady ? 'bg-primary/5' : isSelected ? 'bg-yellow-500/5' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => handleToggleStock(stock)}
                                />
                                <div>
                                  <div className="font-bold text-foreground">{stock.symbol.replace('.NS', '')}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">{stock.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <Badge variant="outline" className="bg-background/50">{stock.sector}</Badge>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                className={`h-9 ${isSelected && !hasQty ? 'border-yellow-500/50' : ''}`}
                                disabled={!isSelected}
                                value={holding?.quantity ?? ''}
                                onChange={(e) => handleUpdateSelected(stock.symbol, 'quantity', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                placeholder="Price"
                                min="0.01"
                                step="0.01"
                                className={`h-9 ${isSelected && !hasPrice ? 'border-yellow-500/50' : ''}`}
                                disabled={!isSelected}
                                value={holding?.buyPrice ?? ''}
                                onChange={(e) => handleUpdateSelected(stock.symbol, 'buyPrice', e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'custom' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter NSE symbols (e.g. <code className="text-primary">RELIANCE</code> or <code className="text-primary">RELIANCE.NS</code>). The <code>.NS</code> suffix is added automatically.
            </p>
            <div className="border border-white/5 rounded-xl bg-background/30 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 font-medium">Symbol (NSE)</th>
                    <th className="px-4 py-3 font-medium w-32">Quantity</th>
                    <th className="px-4 py-3 font-medium w-32">Avg Price (₹)</th>
                    <th className="px-4 py-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {customHoldings.map((holding, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td className="px-4 py-2">
                          <Input
                            placeholder="e.g. RELIANCE"
                            className="h-9 uppercase"
                            value={holding.symbol}
                            onChange={(e) => handleUpdateCustom(idx, 'symbol', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            className="h-9"
                            value={holding.quantity}
                            onChange={(e) => handleUpdateCustom(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            placeholder="Price"
                            min="0.01"
                            step="0.01"
                            className="h-9"
                            value={holding.buyPrice}
                            onChange={(e) => handleUpdateCustom(idx, 'buyPrice', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleRemoveCustomRow(idx)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                            disabled={customHoldings.length === 1}
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCustomRow}
              className="w-full border-dashed border-2 text-muted-foreground h-12"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Another Stock
            </Button>
          </motion.div>
        )}

        {/* Validation error — inline, no alert() */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {validationError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          {activeTab === 'index' && readyCount > 0 && (
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-semibold">{readyCount}</span> stock{readyCount > 1 ? 's' : ''} ready to analyze
            </p>
          )}
          {activeTab === 'custom' && readyCount > 0 && (
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-semibold">{readyCount}</span> valid row{readyCount > 1 ? 's' : ''} ready
            </p>
          )}
          <div className={`${readyCount > 0 ? 'sm:ml-auto' : 'w-full'}`}>
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative flex items-center">
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Analyze Portfolio
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
