
import React, { useState, useMemo, useEffect } from 'react';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import firebase from 'firebase/compat/app';
import { Cliente, Product, Category, SiteInfo, Coupon } from '../../types';
import { BarChart2, Users, TrendingUp, UserX, Repeat, Download, Zap, X, Loader, Send, RefreshCw, Search, CheckCircle, Tag, Plus, Trash2, Power } from 'react-feather';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface MarketingPanelProps {
    clientes: Cliente[];
    allProducts: Product[];
    categories: Category[];
    showToast: (message: string, type: 'success' | 'error') => void;
    siteInfo: SiteInfo;
    storeId: string; // Added storeId
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- SUB-COMPONENTS ---

// ... (AICampaignModal and ClientList components remain exactly the same, omitting for brevity but they should be kept) ...
// RE-INSERTING AICampaignModal AND ClientList TO ENSURE FILE INTEGRITY
const AICampaignModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    segmentName: string,
    clients: Cliente[],
    allProducts: Product[],
    showToast: (message: string, type: 'success' | 'error') => void,
    siteInfo: SiteInfo,
}> = ({ isOpen, onClose, segmentName, clients, allProducts, showToast, siteInfo }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [campaign, setCampaign] = useState<{ message: string, offer: string } | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return allProducts;
        return allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    }, [productSearch, allProducts]);

    const addProduct = (product: Product) => {
        if (!selectedProducts.some(p => p.id === product.id)) {
            setSelectedProducts([...selectedProducts, product]);
        }
        setProductSearch('');
        setIsDropdownOpen(false);
    };

    const removeProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    const generateCampaign = async () => {
        setIsLoading(true);
        setCampaign(null);
        try {
            const clientSample = clients.slice(0, 5).map(c => `- ${c.nome} (gastou ${formatCurrency(c.totalGasto)}, comprou ${c.purchaseCount}x, tags: ${c.tags.join(', ')})`).join('\n');
            
            let offerDirective = '';
            if (selectedProducts.length > 0) {
                const productDetails = selectedProducts.map(p => `${p.name} por ${formatCurrency(p.price)}`).join(', ');
                offerDirective = `
                    **DIRETRIZ DE OFERTA OBRIGATÓRIA:**
                    A campanha DEVE ser focada EXCLUSIVAMENTE nos seguintes produtos: ${productDetails}.
                    Crie uma oferta atraente para ELES (ex: "Leve os dois com 15% OFF", "Compre o ${selectedProducts[0].name} e ganhe um acessório").
                `;
            } else {
                offerDirective = `
                    **DIRETRIZ DE OFERTA INTELIGENTE:**
                    Com base no segmento, sugira a oferta ideal.
                    - Para 'Clientes de Alto Valor', sugira um acesso antecipado a um lançamento ou um brinde premium.
                    - Para 'Clientes Inativos', sugira um cupom de desconto (ex: 10% OFF) para reativá-los.
                    - Para 'Clientes Recorrentes', sugira um benefício de fidelidade (ex: película grátis na próxima compra).
                    - Para 'Filtro por Consumo', sugira um acessório complementar ao que eles já compraram.
                `;
            }
            
            const prompt = `
                Você é um especialista em marketing de retenção para uma loja de eletrônicos chamada "${siteInfo.storeName}".
                Crie uma campanha de WhatsApp direcionada para o seguinte segmento de clientes: "${segmentName}".

                Amostra de Clientes no Segmento:
                ${clientSample}

                ${offerDirective}

                Sua Tarefa:
                1.  **Criar a Mensagem:** Escreva uma mensagem curta e pessoal para WhatsApp. Use as variáveis {{nome_cliente}} e {{store_name}} para personalização. A mensagem deve reconhecer o perfil do cliente e apresentar a oferta de forma atrativa.
                2.  **Sugerir a Oferta:** Descreva a oferta de forma clara no campo 'offer'.
                
                Retorne um objeto JSON com as chaves "message" e "offer".
            `;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            let text = result.text.replace(/```json/g, '').replace(/```/g, '');
            try {
                let parsedCampaign = JSON.parse(text);
                if (parsedCampaign.message) {
                    parsedCampaign.message = parsedCampaign.message.replace(/\{\{store_name\}\}/g, siteInfo.storeName);
                }
                setCampaign(parsedCampaign);
            } catch(e) {
                 showToast("A IA retornou um formato inesperado. Tente novamente.", 'error');
                 setCampaign(null);
            }
        } catch (error) {
            showToast("Erro ao gerar campanha.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Zap className="text-purple-400" /> Gerador de Campanha IA</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <p className="text-sm text-gray-400 mb-4">Gerando campanha para <strong>{clients.length} clientes</strong> no segmento <strong>"{segmentName}"</strong>.</p>
                
                <div className="mb-4">
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Opcional: Selecione produtos para a oferta</label>
                    <div className="bg-black border border-zinc-700 rounded-lg p-2">
                         <div className="flex flex-wrap gap-2 mb-2">
                            {selectedProducts.map(p => (
                                <div key={p.id} className="flex items-center gap-1 bg-purple-900/50 text-purple-200 text-xs font-semibold px-2 py-1 rounded-full">
                                    {p.name}
                                    <button onClick={() => removeProduct(p.id)} className="text-purple-300 hover:text-white"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                onFocus={() => setIsDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                placeholder="Pesquisar produto para adicionar..."
                                className="w-full bg-transparent p-1 focus:outline-none"
                            />
                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full bg-zinc-900 border border-zinc-700 rounded-lg mt-1 max-h-40 overflow-y-auto">
                                    {filteredProducts.map(p => (
                                        <button key={p.id} onClick={() => addProduct(p)} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-800">
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Se nenhum produto for selecionado, a IA sugerirá a melhor oferta para o segmento.</p>
                </div>

                {!campaign && (
                    <div className="text-center mt-6">
                        <button onClick={generateCampaign} disabled={isLoading} className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-500 disabled:opacity-50">
                            {isLoading ? <Loader className="animate-spin" /> : 'Sugerir Campanha'}
                        </button>
                    </div>
                )}

                {campaign && (
                    <div className="space-y-4 animate-fade-in mt-6">
                        <div className="bg-black p-4 rounded-lg border border-zinc-800">
                            <h4 className="font-semibold text-purple-400 mb-2">Oferta Sugerida</h4>
                            <p className="text-lg font-bold">{campaign.offer}</p>
                        </div>
                        <div className="bg-black p-4 rounded-lg border border-zinc-800">
                            <h4 className="font-semibold text-purple-400 mb-2">Mensagem para WhatsApp</h4>
                            <p className="text-sm whitespace-pre-wrap bg-zinc-900 p-3 rounded">{campaign.message}</p>
                        </div>
                         <button onClick={generateCampaign} disabled={isLoading} className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
                            {isLoading ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Regerar Sugestão
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ClientList: React.FC<{
    clients: Cliente[],
    segmentName: string,
    onCampaign: (clients: Cliente[], name: string) => void
}> = ({ clients, segmentName, onCampaign }) => {
    
    const exportToCSV = () => {
        const headers = ['Nome', 'Telefone', 'Total Gasto', 'Compras', 'Ultima Compra'];
        const rows = clients.map(c => 
            [
                `"${c.nome.replace(/"/g, '""')}"`,
                c.telefone || 'N/A',
                c.totalGasto,
                c.purchaseCount,
                c.ultimaCompra ? c.ultimaCompra.toDate().toLocaleDateString() : 'N/A'
            ].join(',')
        );
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `segmento_${segmentName.replace(/\s+/g, '_').toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-black/30 border border-zinc-800 rounded-lg">
            <div className="p-4 flex justify-between items-center bg-zinc-900/50 rounded-t-lg">
                <h4 className="font-bold text-white">{segmentName} <span className="text-sm font-normal text-zinc-400">({clients.length} clientes)</span></h4>
                <div className="flex gap-2">
                    <button onClick={exportToCSV} disabled={clients.length === 0} className="text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md disabled:opacity-50 flex items-center gap-1"><Download size={12}/> Exportar</button>
                    <button onClick={() => onCampaign(clients, segmentName)} disabled={clients.length === 0} className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-md disabled:opacity-50 flex items-center gap-1"><Zap size={12}/> Criar Campanha</button>
                </div>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                {clients.length > 0 ? (
                    <ul className="space-y-1">
                        {clients.map(c => (
                            <li key={c.id} className="flex justify-between items-center p-2 hover:bg-zinc-800/50 rounded">
                                <div>
                                    <p className="text-sm font-semibold">{c.nome}</p>
                                    <p className="text-xs text-zinc-500">{c.telefone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-400">{formatCurrency(c.totalGasto)}</p>
                                    <p className="text-xs text-zinc-500">{c.purchaseCount} compras</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center text-zinc-600 text-sm p-8">Nenhum cliente neste segmento.</p>}
            </div>
        </div>
    );
};

// --- COUPON COMPONENT ---
const CouponsManager: React.FC<{ storeId: string, showToast: (message: string, type: 'success' | 'error') => void }> = ({ storeId, showToast }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [newCode, setNewCode] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!storeId) return;
        const unsub = getCollectionRef('coupons', storeId).orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
        });
        return () => unsub();
    }, [storeId]);

    const handleCreateCoupon = async () => {
        if (!newCode || !newValue) {
            showToast("Código e Valor são obrigatórios.", 'error');
            return;
        }
        setIsLoading(true);
        try {
            await getCollectionRef('coupons', storeId).add({
                code: newCode.toUpperCase().trim(),
                type: newType,
                value: parseFloat(newValue),
                active: true,
                usageCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast("Cupom criado com sucesso!", 'success');
            setNewCode('');
            setNewValue('');
        } catch (e) {
            showToast("Erro ao criar cupom.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleActive = async (coupon: Coupon) => {
        try {
            await getDocRef('coupons', coupon.id, storeId).update({ active: !coupon.active });
        } catch (e) {
            showToast("Erro ao atualizar status.", 'error');
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este cupom?")) return;
        try {
            await getDocRef('coupons', id, storeId).delete();
            showToast("Cupom excluído.", 'success');
        } catch (e) {
            showToast("Erro ao excluir.", 'error');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Plus size={16} /> Criar Novo Cupom</h4>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs text-zinc-400 block mb-1">Código</label>
                        <input 
                            value={newCode} 
                            onChange={e => setNewCode(e.target.value.toUpperCase())} 
                            placeholder="Ex: BEMVINDO10" 
                            className="w-full admin-input uppercase" 
                        />
                    </div>
                    <div className="w-[120px]">
                        <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                        <select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full admin-input">
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="fixed">Valor Fixo (R$)</option>
                        </select>
                    </div>
                    <div className="w-[100px]">
                        <label className="text-xs text-zinc-400 block mb-1">Valor</label>
                        <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="10" className="w-full admin-input" />
                    </div>
                    <button onClick={handleCreateCoupon} disabled={isLoading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                        {isLoading ? <Loader size={16} className="animate-spin"/> : <Plus size={16}/>} Criar
                    </button>
                </div>
            </div>

            <div className="bg-black/20 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                        <tr>
                            <th className="p-3">Código</th>
                            <th className="p-3">Desconto</th>
                            <th className="p-3">Usos</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {coupons.map(c => (
                            <tr key={c.id} className="hover:bg-zinc-900/50">
                                <td className="p-3 font-bold text-white">{c.code}</td>
                                <td className="p-3 text-green-400 font-mono">
                                    {c.type === 'percentage' ? `${c.value}% OFF` : `- ${formatCurrency(c.value)}`}
                                </td>
                                <td className="p-3 text-zinc-400">{c.usageCount}</td>
                                <td className="p-3">
                                    <button onClick={() => toggleActive(c)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${c.active ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-zinc-600 bg-zinc-800 text-zinc-500'}`}>
                                        {c.active ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => deleteCoupon(c.id)} className="text-zinc-500 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-zinc-500">Nenhum cupom criado.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const MarketingPanel: React.FC<MarketingPanelProps> = ({ clientes, allProducts, categories, showToast, siteInfo, storeId }) => {
    const [activeTab, setActiveTab] = useState<'segments' | 'filter' | 'coupons'>('segments');
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignData, setCampaignData] = useState<{ clients: Cliente[], name: string } | null>(null);

    // SEGMENTS LOGIC
    const highValueClients = useMemo(() => {
        const sorted = [...clientes].sort((a, b) => (b.totalGasto || 0) - (a.totalGasto || 0));
        const top10PercentIndex = Math.max(1, Math.floor(sorted.length * 0.1));
        return sorted.slice(0, top10PercentIndex);
    }, [clientes]);

    const inactiveClients = useMemo(() => {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return clientes.filter(c => c.ultimaCompra && c.ultimaCompra.toDate() < sixtyDaysAgo);
    }, [clientes]);

    const recurrentClients = useMemo(() => {
        return clientes.filter(c => (c.purchaseCount || 0) >= 3);
    }, [clientes]);

    // FILTER LOGIC
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const clientsByConsumption = useMemo(() => {
        if (selectedCategory === 'all') return [];
        return clientes.filter(c => c.tags && c.tags.includes(selectedCategory));
    }, [clientes, selectedCategory]);

    const handleCreateCampaign = (clients: Cliente[], name: string) => {
        setCampaignData({ clients, name });
        setIsCampaignModalOpen(true);
    };

    return (
        <div>
            {isCampaignModalOpen && campaignData && (
                <AICampaignModal 
                    isOpen={isCampaignModalOpen}
                    onClose={() => setIsCampaignModalOpen(false)}
                    segmentName={campaignData.name}
                    clients={campaignData.clients}
                    allProducts={allProducts}
                    showToast={showToast}
                    siteInfo={siteInfo}
                />
            )}
            <div className="admin-card">
                <div className="admin-card-header">
                    <h2 className="text-xl font-bold flex items-center gap-2"><BarChart2 /> Segmentação & Campanhas</h2>
                </div>
                <div className="admin-card-content">
                    <div className="flex border-b border-zinc-800 mb-6">
                        <button onClick={() => setActiveTab('segments')} className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'segments' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-zinc-400 hover:text-zinc-200'}`}>Segmentos Automáticos</button>
                        <button onClick={() => setActiveTab('filter')} className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'filter' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-zinc-400 hover:text-zinc-200'}`}>Filtrar por Consumo</button>
                        <button onClick={() => setActiveTab('coupons')} className={`px-4 py-2 text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'coupons' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-zinc-400 hover:text-zinc-200'}`}><Tag size={14}/> Cupons de Desconto</button>
                    </div>

                    {activeTab === 'segments' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
                            <ClientList clients={highValueClients} segmentName="Clientes de Alto Valor" onCampaign={handleCreateCampaign} />
                            <ClientList clients={recurrentClients} segmentName="Clientes Recorrentes" onCampaign={handleCreateCampaign} />
                            <ClientList clients={inactiveClients} segmentName="Clientes Inativos" onCampaign={handleCreateCampaign} />
                        </div>
                    )}

                    {activeTab === 'filter' && (
                        <div className="animate-fade-in">
                            <div className="max-w-md mb-4">
                                <label className="text-sm text-zinc-400 mb-1 block">Mostrar clientes que já compraram na categoria:</label>
                                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full admin-input">
                                    <option value="all">Selecione uma categoria</option>
                                    {categories.filter(c => c.id !== 'todos' && c.id !== 'black_friday').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedCategory !== 'all' && (
                                <ClientList clients={clientsByConsumption} segmentName={`Compraram "${categories.find(c=>c.id === selectedCategory)?.name}"`} onCampaign={handleCreateCampaign} />
                            )}
                        </div>
                    )}

                    {activeTab === 'coupons' && (
                        <CouponsManager storeId={storeId} showToast={showToast} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketingPanel;
