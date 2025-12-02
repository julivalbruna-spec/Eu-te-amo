
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import firebase from 'firebase/compat/app';
import { Product, SiteInfo, Rates, Cliente, Sale, SaleItem, Employee, Sorteio } from '../../types';
import { Search, X, Plus, Minus, Trash2, DollarSign, CreditCard, ShoppingBag, Printer, FileText, Cpu, User, Gift, Loader, ArrowRight, Box, AlertTriangle, ChevronDown, PauseCircle, PlayCircle, Shield, PlusCircle } from 'react-feather';
import { GoogleGenAI, Type } from '@google/genai';
import { logAuditEvent } from '../../utils/analytics';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface CartItem {
    product: Product;
    quantity: number;
}

interface ParkedSale {
    id: string;
    timestamp: number;
    cart: CartItem[];
    customerName?: string;
}

interface PdvPanelProps {
    storeId: string;
    allProducts: Product[];
    siteInfo: SiteInfo;
    clientes: Cliente[];
    employees: Employee[];
    showToast: (message: string, type: 'success' | 'error') => void;
}
interface PaymentFinalizedData {
    total: number;
    paymentMethod: string; // Primary method or 'misto'
    details: string;
    installments?: number;
    paymentsList?: { method: string; amount: number; installments?: number }[];
}

interface PaymentModalProps {
    total: number;
    rates: Rates;
    onClose: () => void;
    onSaleFinalized: (data: PaymentFinalizedData) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatCurrencyInput = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
};

// ... UpsellConfirmationModal remains the same ...
const UpsellConfirmationModal: React.FC<{
    suggestions: Product[];
    onClose: () => void;
    onConfirm: () => void;
}> = ({ suggestions, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2"><Gift size={22} /> Oportunidade de Venda!</h3>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
                </div>
                <p className="text-gray-300 mb-6 text-center">Antes de finalizar, você ofereceu estes itens ao cliente?</p>
                
                <div className="space-y-3 max-h-60 overflow-y-auto bg-black/30 p-1 rounded-lg mb-6 custom-scrollbar">
                    {suggestions.map(suggestion => (
                        <div key={suggestion.id} className="flex items-center gap-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                             <img src={suggestion.image || suggestion.variants?.[0]?.imageUrl} alt={suggestion.name} className="w-12 h-12 object-contain rounded bg-black p-1 flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-white truncate">{suggestion.name}</p>
                                <p className="text-sm text-yellow-500 font-bold">{formatCurrency(suggestion.price)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3">
                     <button onClick={onClose} className="bg-zinc-800 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-zinc-700 transition-colors">Voltar</button>
                    <button onClick={onConfirm} className="bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-green-500 flex items-center gap-2 transition-colors shadow-lg shadow-green-900/20">
                        Continuar para Pagamento <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- UPDATED PAYMENT MODAL (SPLIT PAYMENTS) ---
const PaymentModal: React.FC<PaymentModalProps> = ({ total, rates, onClose, onSaleFinalized, showToast }) => {
    const [payments, setPayments] = useState<{ method: string; amount: number; installments?: number }[]>([]);
    const [currentMethod, setCurrentMethod] = useState<'dinheiro' | 'pix' | 'debito' | 'credito'>('dinheiro');
    const [currentAmount, setCurrentAmount] = useState('');
    const [installments, setInstallments] = useState(1);

    // Calculate remaining amount to pay
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = Math.max(0, total - totalPaid);
    const change = totalPaid > total ? totalPaid - total : 0;

    // Initialize current amount with remaining when it changes (for UX)
    useEffect(() => {
        if (remaining > 0) setCurrentAmount(remaining.toFixed(2).replace('.', ','));
        else setCurrentAmount('');
    }, [payments, total]); // Don't depend on 'remaining' directly to avoid loop if we formatted differently

    const handleAddPayment = () => {
        const val = parseFloat(currentAmount.replace(',', '.')) || 0;
        if (val <= 0) return;

        let finalAmount = val;
        // Logic for tax calculation if needed, but usually POS inputs the value *to be charged*.
        // If we want to simulate taxes added ON TOP:
        // if (currentMethod === 'debito') finalAmount = val * (1 + rates.debit);
        // For now, we assume the input is what the customer pays.

        setPayments([...payments, { 
            method: currentMethod, 
            amount: finalAmount,
            installments: currentMethod === 'credito' ? installments : undefined 
        }]);
        
        setInstallments(1);
    };

    const removePayment = (index: number) => {
        setPayments(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        if (remaining > 0.01) { // Small tolerance
            showToast(`Ainda faltam ${formatCurrency(remaining)} para fechar a conta.`, 'error');
            return;
        }

        const isSingle = payments.length === 1;
        const mainMethod = isSingle ? payments[0].method : 'misto';
        
        let details = '';
        if (isSingle) {
            const p = payments[0];
            if (p.method === 'credito') details = `${p.installments}x no Crédito`;
            else if (p.method === 'dinheiro' && change > 0) details = `Dinheiro (Troco: ${formatCurrency(change)})`;
            else details = p.method.charAt(0).toUpperCase() + p.method.slice(1);
        } else {
            details = payments.map(p => `${p.method} (${formatCurrency(p.amount)})`).join(' + ');
        }

        onSaleFinalized({
            total: total, // The sale total is the product total. Taxes are usually absorbed or calculated differently.
            paymentMethod: mainMethod,
            details: details,
            paymentsList: payments,
            installments: isSingle ? payments[0].installments : undefined
        });
    };
    
    // Calculate credit simulation based on REMAINING value
    const creditValue = useMemo(() => {
        const val = parseFloat(currentAmount.replace(',', '.')) || 0;
        const rate = rates.credit[installments as keyof typeof rates.credit] || 0;
        const totalWithRate = val * (1 + rate);
        const installmentValue = totalWithRate / installments;
        return { total: totalWithRate, installment: installmentValue };
    }, [installments, currentAmount, rates.credit]);


    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl p-6 shadow-2xl flex flex-col md:flex-row gap-6">
                
                {/* Left: Payment Entry */}
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">Pagamento</h3>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Total da Venda</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(total)}</p>
                        </div>
                    </div>

                    <div className="flex border-b border-zinc-800 mb-4">
                        {(['dinheiro', 'pix', 'debito', 'credito'] as const).map(method => (
                            <button key={method} onClick={() => setCurrentMethod(method)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-all ${currentMethod === method ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                {method}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Valor a Pagar nesta forma</label>
                        <input 
                            value={currentAmount} 
                            onChange={e => setCurrentAmount(e.target.value)} 
                            className="admin-input w-full text-xl" 
                            placeholder="0,00"
                        />
                    </div>

                    {currentMethod === 'credito' && (
                         <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                            <label className="text-sm text-gray-400 mb-1 block">Parcelas</label>
                            <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="admin-input w-full mb-2">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(i => <option key={i} value={i}>{i}x</option>)}
                            </select>
                             <p className="text-xs text-zinc-500 flex justify-between">
                                <span>Cliente paga: {formatCurrency(creditValue.installment)}/mês</span>
                                <span>Total c/ Taxa: {formatCurrency(creditValue.total)}</span>
                            </p>
                        </div>
                    )}

                    <button onClick={handleAddPayment} disabled={remaining <= 0} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                        <Plus size={18}/> Adicionar Pagamento
                    </button>
                </div>

                {/* Right: Summary */}
                <div className="w-full md:w-72 bg-zinc-900/30 rounded-xl border border-zinc-800 p-4 flex flex-col">
                    <h4 className="font-bold text-white mb-4 border-b border-zinc-800 pb-2">Resumo dos Pagamentos</h4>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar max-h-[200px]">
                        {payments.map((p, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/40 p-2 rounded text-sm">
                                <div>
                                    <span className="font-bold text-zinc-300 capitalize">{p.method}</span>
                                    {p.installments && <span className="text-xs text-zinc-500 ml-1">({p.installments}x)</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white">{formatCurrency(p.amount)}</span>
                                    <button onClick={() => removePayment(i)} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        {payments.length === 0 && <p className="text-center text-zinc-600 text-xs py-4">Nenhum pagamento adicionado.</p>}
                    </div>
                    
                    <div className="mt-auto space-y-2 border-t border-zinc-800 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Pago:</span>
                            <span className="text-green-400 font-bold">{formatCurrency(totalPaid)}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Faltam:</span>
                            <span className={`${remaining > 0 ? 'text-red-400' : 'text-zinc-600'} font-bold`}>{formatCurrency(remaining)}</span>
                        </div>
                        {change > 0 && (
                             <div className="flex justify-between text-sm bg-green-900/20 p-2 rounded">
                                <span className="text-green-400 font-bold">Troco:</span>
                                <span className="text-green-400 font-bold">{formatCurrency(change)}</span>
                            </div>
                        )}
                    </div>
                    
                    <button onClick={handleConfirm} disabled={remaining > 0.01} className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        Finalizar Venda
                    </button>
                     <button onClick={onClose} className="w-full mt-2 text-zinc-500 hover:text-white text-sm py-2">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const FinalizedSale: React.FC<{ data: Sale, onNewSale: () => void, siteInfo: SiteInfo, storeId: string }> = ({ data, onNewSale, siteInfo, storeId }) => {
    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) { alert("Pop-up bloqueado!"); return; }
        
        const itemsHtml = data.items.map(item => 
            `<tr><td>${item.quantity}x ${item.productName}</td><td style="text-align:right">${formatCurrency(item.price * item.quantity)}</td></tr>`
        ).join('');
        
        const paymentsHtml = data.paymentDetails; // Simplified

        const receiptHTML = `
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    table { width: 100%; }
                    .total { font-size: 14px; font-weight: bold; margin-top: 10px; text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>${siteInfo.storeName}</h3>
                    <p>${siteInfo.address.replace(/<br\s*\/?>/gi, ' ')}</p>
                    <p>Tel: ${siteInfo.links.whatsappSales}</p>
                </div>
                <div class="divider"></div>
                <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
                <p>Cliente: ${data.customerName}</p>
                <div class="divider"></div>
                <table>${itemsHtml}</table>
                <div class="divider"></div>
                <div class="total">Total: ${formatCurrency(data.total)}</div>
                <p>Pagamento: ${paymentsHtml}</p>
                <div class="divider"></div>
                <p style="text-align:center">Obrigado pela preferência!</p>
                <script>window.onload=function(){window.print();window.close();}</script>
            </body>
            </html>
        `;
        printWindow.document.write(receiptHTML); printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-scale-in">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl w-full max-w-md p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CreditCard className="text-green-500" size={32}/></div>
                <h3 className="text-2xl font-bold text-white mb-2">Venda Finalizada!</h3>
                <p className="text-zinc-400 mb-6">ID: {data.id.substring(0, 8)}...</p>
                <div className="flex gap-3 mt-6">
                    <button onClick={handlePrint} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700"><Printer size={18}/> Recibo</button>
                    <button onClick={onNewSale} className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400">Nova Venda</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PDV PANEL ---
export const PdvPanel: React.FC<PdvPanelProps> = ({ storeId, allProducts, siteInfo, clientes, employees, showToast }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    // PERSISTENT CART INITIALIZATION
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem(`pdv_cart_${storeId}`);
            return saved ? JSON.parse(saved) : [];
        } catch(e) { return []; }
    });

    // Parked Sales
    const [parkedSales, setParkedSales] = useState<ParkedSale[]>(() => {
         try {
            const saved = localStorage.getItem(`pdv_parked_${storeId}`);
            return saved ? JSON.parse(saved) : [];
        } catch(e) { return []; }
    });
    const [showParkedModal, setShowParkedModal] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState<string>('avulso');
    const [discount, setDiscount] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [saleFinalizedData, setSaleFinalizedData] = useState<Sale | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<Product[]>([]);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
    
    // AI Margin Analysis
    const [isAnalyzingMargin, setIsAnalyzingMargin] = useState(false);
    const [marginAnalysis, setMarginAnalysis] = useState<string | null>(null);

    // SAVE CART ON CHANGE
    useEffect(() => {
        localStorage.setItem(`pdv_cart_${storeId}`, JSON.stringify(cart));
    }, [cart, storeId]);
    
    // SAVE PARKED SALES
    useEffect(() => {
        localStorage.setItem(`pdv_parked_${storeId}`, JSON.stringify(parkedSales));
    }, [parkedSales, storeId]);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
    }, [searchTerm, allProducts]);

    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);
    const total = useMemo(() => Math.max(0, subtotal - discount + deliveryFee), [subtotal, discount, deliveryFee]);

    const handleAddProduct = (product: Product) => {
        // Stock Check
        if (product.stock !== undefined && product.stock <= 0) {
            showToast(`Produto "${product.name}" sem estoque!`, 'error');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (product.stock !== undefined && existing.quantity >= product.stock) {
                    showToast(`Limite de estoque atingido para "${product.name}".`, 'error');
                    return prev;
                }
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
        setSearchTerm('');
    };

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                // Check Stock on Increase
                if (delta > 0 && item.product.stock !== undefined && newQty > item.product.stock) {
                     showToast(`Estoque insuficiente. Máximo: ${item.product.stock}`, 'error');
                     return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleParkSale = () => {
        if (cart.length === 0) return;
        const newPark: ParkedSale = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            cart: cart,
            customerName: clientes.find(c => c.id === selectedCustomer)?.nome || 'Cliente Avulso'
        };
        setParkedSales([...parkedSales, newPark]);
        setCart([]);
        setSelectedCustomer('avulso');
        setDiscount(0);
        showToast("Venda colocada em espera.", 'success');
    };

    const handleRestoreParkedSale = (sale: ParkedSale) => {
        if (cart.length > 0) {
            if (!window.confirm("Existe uma venda ativa. Deseja sobrescrevê-la?")) return;
        }
        setCart(sale.cart);
        setParkedSales(prev => prev.filter(p => p.id !== sale.id));
        setShowParkedModal(false);
        showToast("Venda recuperada!", 'success');
    };
    
    const handleDeleteParkedSale = (id: string) => {
        setParkedSales(prev => prev.filter(p => p.id !== id));
    }

    const handleAnalyzeMargin = async () => {
        if (cart.length === 0) return;
        setIsAnalyzingMargin(true);
        setMarginAnalysis(null);
        
        try {
            // Create context string
            const cartContext = cart.map(item => {
                const cost = item.product.costPrice || 0;
                const sell = item.product.price;
                return `- ${item.product.name} (Qtd: ${item.quantity}): Custo R$ ${cost}, Venda R$ ${sell}`;
            }).join('\n');
            
            const prompt = `
                Você é um assistente financeiro "Guardião de Margem".
                Analise este carrinho de compras e diga se é seguro dar um desconto.
                
                CARRINHO:
                ${cartContext}
                
                Desconto Atual Proposto: R$ ${discount}
                
                TAREFA:
                1. Calcule o Lucro Bruto atual (Venda - Custo).
                2. Calcule a Margem %.
                3. Diga se o desconto proposto (R$ ${discount}) é perigoso (margem < 15%) ou seguro.
                4. Dê uma sugestão de desconto máximo.
                
                Responda curto e direto (max 3 linhas).
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            setMarginAnalysis(response.text);
        } catch (e) {
            showToast("Erro na análise de IA.", 'error');
        } finally {
            setIsAnalyzingMargin(false);
        }
    };


    const handleSaleFinalized = async (paymentData: PaymentFinalizedData) => {
        let customerId = selectedCustomer;
        let customerName = clientes.find(c => c.id === customerId)?.nome || 'Cliente Avulso';
        
        const saleData: Partial<Sale> = {
            customerId, customerName,
            items: cart.map(i => ({ productId: i.product.id, productName: i.product.name, quantity: i.quantity, price: i.product.price, costPrice: i.product.costPrice })),
            subtotal, discount, deliveryFee, total: paymentData.total,
            paymentMethod: paymentData.paymentMethod, paymentDetails: paymentData.details,
            saleDate: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = await getCollectionRef('sales', storeId).add(saleData);
            
            // Update Stock
            const batch = db.batch();
            cart.forEach(item => {
                 if (item.product.stock !== undefined) {
                     const prodRef = getDocRef('products', item.product.id, storeId);
                     const newStock = Math.max(0, item.product.stock - item.quantity);
                     batch.update(prodRef, { stock: newStock });
                 }
            });
            await batch.commit();

            setSaleFinalizedData({ id: docRef.id, ...saleData } as Sale);
            showToast('Venda salva e estoque atualizado!', 'success');
            setCart([]);
            localStorage.removeItem(`pdv_cart_${storeId}`);
            setDiscount(0);
            setDeliveryFee(0);
        } catch (error) {
            showToast('Erro ao salvar venda.', 'error');
        } finally {
            setIsPaymentModalOpen(false);
        }
    };
    
    const resetSale = useCallback(() => {
        setCart([]);
        localStorage.removeItem(`pdv_cart_${storeId}`);
        setSearchTerm('');
        setSelectedCustomer('avulso');
        setDiscount(0);
        setDeliveryFee(0);
        setIsPaymentModalOpen(false);
        setSaleFinalizedData(null);
    }, [storeId]);

    const handleRemoveProduct = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
            {/* Parked Sales Modal */}
            {showParkedModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><PauseCircle /> Vendas em Espera</h3>
                            <button onClick={() => setShowParkedModal(false)}><X className="text-gray-500 hover:text-white"/></button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {parkedSales.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Nenhuma venda pausada.</p>
                            ) : (
                                parkedSales.map(sale => (
                                    <div key={sale.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-white">{sale.customerName}</p>
                                            <p className="text-xs text-gray-500">{new Date(sale.timestamp).toLocaleTimeString()} • {sale.cart.reduce((a,b)=>a+b.quantity,0)} itens</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRestoreParkedSale(sale)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg" title="Retomar"><PlayCircle size={18}/></button>
                                            <button onClick={() => handleDeleteParkedSale(sale.id)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg" title="Descartar"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isUpsellModalOpen && <UpsellConfirmationModal suggestions={aiSuggestions} onClose={() => setIsUpsellModalOpen(false)} onConfirm={() => { setIsUpsellModalOpen(false); setIsPaymentModalOpen(true); }} />}
            {isPaymentModalOpen && !saleFinalizedData && <PaymentModal total={total} rates={siteInfo.rates} onClose={() => setIsPaymentModalOpen(false)} onSaleFinalized={handleSaleFinalized} showToast={showToast} />}
            {saleFinalizedData && <FinalizedSale data={saleFinalizedData} onNewSale={resetSale} siteInfo={siteInfo} storeId={storeId} />}
            
            <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="relative z-20 flex gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar produto ou código de barras..." className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 pl-12 text-lg focus:ring-1 focus:ring-yellow-500 outline-none transition-all shadow-lg" autoFocus />
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-zinc-800 rounded-xl shadow-2xl z-30 overflow-hidden animate-scale-in">
                                {searchResults.map(p => (
                                    <div key={p.id} onClick={() => handleAddProduct(p)} className="flex justify-between items-center p-4 border-b border-zinc-800/50 hover:bg-zinc-900 cursor-pointer group">
                                        <div>
                                            <p className="font-bold text-zinc-200">{p.name}</p>
                                            <p className="text-xs text-zinc-500">Estoque: {p.stock ?? '∞'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-green-400">{formatCurrency(p.price)}</p>
                                            <PlusCircle size={20} className="text-zinc-500 group-hover:text-yellow-500 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="admin-card flex-1 flex flex-col min-h-[500px]">
                    <div className="admin-card-header flex justify-between items-center">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white"><ShoppingBag size={20}/> Carrinho</h3>
                        <div className="flex gap-2">
                             {parkedSales.length > 0 && (
                                <button onClick={() => setShowParkedModal(true)} className="bg-zinc-800 text-yellow-500 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-yellow-500/20">
                                    <PauseCircle size={14} /> {parkedSales.length} Em Espera
                                </button>
                             )}
                             <button onClick={handleParkSale} disabled={cart.length === 0} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50">
                                <PauseCircle size={14} /> Segurar Venda
                            </button>
                            <span className="bg-zinc-900 text-zinc-400 text-xs px-2 py-1 rounded-md border border-zinc-800 flex items-center">{cart.length} itens</span>
                        </div>
                    </div>
                    <div className="admin-card-content flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {cart.map(item => (
                            <div key={item.product.id} className="flex items-center gap-4 p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl group hover:bg-zinc-900/60 transition-colors">
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{item.product.name}</p>
                                    <p className="text-xs text-zinc-400">{formatCurrency(item.product.price)}</p>
                                </div>
                                <div className="flex items-center bg-black rounded-lg border border-zinc-800">
                                    <button onClick={() => handleUpdateQuantity(item.product.id, -1)} className="p-2 text-zinc-400 hover:text-white"><Minus size={14}/></button>
                                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                    <button onClick={() => handleUpdateQuantity(item.product.id, 1)} className="p-2 text-zinc-400 hover:text-white"><Plus size={14}/></button>
                                </div>
                                <button onClick={() => handleRemoveProduct(item.product.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="admin-card p-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Cliente</label>
                    <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full admin-input mb-4">
                        <option value="avulso">Cliente Avulso</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>

                <div className="admin-card flex-1 flex flex-col">
                     <div className="admin-card-header"><h3 className="text-lg font-bold flex items-center gap-2 text-white"><FileText size={20}/> Resumo</h3></div>
                    <div className="admin-card-content flex-1 flex flex-col justify-between">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-zinc-400">Subtotal</span> <span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                            
                            {/* Discount with AI */}
                            <div className="bg-black/40 p-3 rounded-lg border border-zinc-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-zinc-400">Desconto</span>
                                    <input type="number" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 bg-transparent border-b border-zinc-700 text-right text-red-400 outline-none focus:border-red-400" placeholder="0.00" />
                                </div>
                                <div className="flex justify-end">
                                     <button onClick={handleAnalyzeMargin} disabled={isAnalyzingMargin || cart.length === 0} className="text-[10px] font-bold flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50">
                                        {isAnalyzingMargin ? <Loader size={10} className="animate-spin"/> : <Shield size={10} />} 
                                        Analisar Margem com IA
                                    </button>
                                </div>
                                {marginAnalysis && (
                                    <div className="mt-2 text-xs text-blue-200 bg-blue-900/20 p-2 rounded border border-blue-500/30 animate-fade-in">
                                        {marginAnalysis}
                                    </div>
                                )}
                            </div>
                            
                             <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Taxa de Entrega</span>
                                <input type="number" value={deliveryFee || ''} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} className="w-24 bg-transparent border-b border-zinc-700 text-right text-green-400 outline-none focus:border-green-400" placeholder="0.00" />
                            </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-zinc-400 font-medium">Total Final</span>
                                <span className="text-3xl font-bold text-white">{formatCurrency(total)}</span>
                            </div>
                            <button onClick={() => setIsPaymentModalOpen(true)} disabled={cart.length === 0} className="w-full bg-white text-black font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-zinc-200 transition-all shadow-lg">
                                <CreditCard size={18} /> Finalizar Venda
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
