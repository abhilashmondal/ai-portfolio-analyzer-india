import React, { useState, useMemo } from 'react';
import { useGetNifty50Stocks, useGetSensex30Stocks } from '@workspace/api-client-react';
import { Search, Plus, Trash2, TrendingUp, Filter } from 'lucide-react';
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
  
  // Custom portfolio state
  const [customHoldings, setCustomHoldings] = useState<DraftHolding[]>([
    { symbol: '', name: '', sector: 'Custom', quantity: '', buyPrice: '' }
  ]);

  // Index portfolio state
  const [selectedStocks, setSelectedStocks] = useState<Record<string, DraftHolding>>({});

  const { data: niftyData, isLoading: isLoadingNifty } = useGetNifty50Stocks();
  const { data: sensexData, isLoading: isLoadingSensex } = useGetSensex30Stocks();

  const currentStocks = useMemo(() => {
    const raw = indexType === 'NIFTY50' ? niftyData?.stocks : sensexData?.stocks;
    if (!raw) return [];
    if (!searchQuery) return raw;
    const lowerQ = searchQuery.toLowerCase();
    return raw.filter(s => s.symbol.toLowerCase().includes(lowerQ) || s.name.toLowerCase().includes(lowerQ) || s.sector.toLowerCase().includes(lowerQ));
  }, [indexType, niftyData, sensexData, searchQuery]);

  const handleToggleStock = (stock: any) => {
    setSelectedStocks(prev => {
      const next = { ...prev };
      if (next[stock.symbol]) {
        delete next[stock.symbol];
      } else {
        next[stock.symbol] = {
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          quantity: '',
          buyPrice: ''
        };
      }
      return next;
    });
  };

  const handleUpdateSelected = (symbol: string, field: 'quantity' | 'buyPrice', value: string) => {
    setSelectedStocks(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        [field]: value === '' ? '' : Number(value)
      }
    }));
  };

  const handleUpdateCustom = (index: number, field: keyof DraftHolding, value: string) => {
    setCustomHoldings(prev => {
      const next = [...prev];
      if (field === 'quantity' || field === 'buyPrice') {
        next[index] = { ...next[index], [field]: value === '' ? '' : Number(value) };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleAddCustomRow = () => {
    setCustomHoldings(prev => [...prev, { symbol: '', name: '', sector: 'Custom', quantity: '', buyPrice: '' }]);
  };

  const handleRemoveCustomRow = (index: number) => {
    setCustomHoldings(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    let finalHoldings: { symbol: string; quantity: number; buyPrice: number }[] = [];
    
    if (activeTab === 'index') {
      finalHoldings = Object.values(selectedStocks)
        .filter(h => h.quantity !== '' && h.buyPrice !== '' && Number(h.quantity) > 0 && Number(h.buyPrice) > 0)
        .map(h => ({ symbol: h.symbol, quantity: Number(h.quantity), buyPrice: Number(h.buyPrice) }));
    } else {
      finalHoldings = customHoldings
        .filter(h => h.symbol.trim() !== '' && h.quantity !== '' && h.buyPrice !== '' && Number(h.quantity) > 0 && Number(h.buyPrice) > 0)
        .map(h => ({ symbol: h.symbol.toUpperCase(), quantity: Number(h.quantity), buyPrice: Number(h.buyPrice) }));
    }

    if (finalHoldings.length === 0) {
      alert("Please enter valid quantity and buy price for at least one stock.");
      return;
    }

    onAnalyze(finalHoldings);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-muted/50 rounded-xl max-w-md mx-auto border border-border">
        <button
          onClick={() => setActiveTab('index')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'index' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Select from Index
        </button>
        <button
          onClick={() => setActiveTab('custom')}
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
              <div className="flex gap-2">
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
                      <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">Loading index data...</td></tr>
                    ) : currentStocks?.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No stocks found.</td></tr>
                    ) : (
                      currentStocks?.map((stock) => {
                        const isSelected = !!selectedStocks[stock.symbol];
                        const holding = selectedStocks[stock.symbol];
                        
                        return (
                          <tr key={stock.symbol} className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={isSelected}
                                  onChange={() => handleToggleStock(stock)}
                                />
                                <div>
                                  <div className="font-bold text-foreground">{stock.symbol}</div>
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
                                className="h-9"
                                disabled={!isSelected}
                                value={holding?.quantity ?? ''}
                                onChange={(e) => handleUpdateSelected(stock.symbol, 'quantity', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input 
                                type="number" 
                                placeholder="Price" 
                                className="h-9"
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
                              className="h-9"
                              value={holding.quantity}
                              onChange={(e) => handleUpdateCustom(idx, 'quantity', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input 
                              type="number" 
                              placeholder="Price" 
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
            <Button variant="outline" size="sm" onClick={handleAddCustomRow} className="w-full border-dashed border-2 text-muted-foreground h-12">
              <Plus className="w-4 h-4 mr-2" /> Add Another Stock
            </Button>
          </motion.div>
        )}

        <div className="mt-8 flex justify-end">
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
                  Analyzing Engine...
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
      </Card>
    </div>
  );
}
