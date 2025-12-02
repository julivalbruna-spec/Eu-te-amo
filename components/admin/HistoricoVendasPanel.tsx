
import React, { useState, useMemo, useEffect } from 'react';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import { Sale, Cliente } from '../../types';
import { Search, X, Calendar, Eye, Trash2, AlertTriangle, ArrowLeft, ArrowRight, Loader, Download } from 'react-feather';
import { logAuditEvent } from '../../utils/analytics';

// --- HELPER ---
const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- SUB-COMPONENTS ---
interface SaleDetailModalProps {
    sale: Sale | null;
    onClose: () => void;
    storeId: string;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, onClose, storeId }) => {
    if (!sale) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold">Detalhes da Venda #{sale.id.substring(0, 6)}...</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="bg-black p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Cliente e Data</h4>
                        <p><strong>Cliente:</strong> {sale.customerName}</p>
                        <p><strong>Data:</strong> {sale.saleDate.toDate().toLocaleString('pt-BR')}</p>
                    </div>
                     <div className="bg-black p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Itens Comprados</h4>
                        <ul className="space-y-2">
                            {sale.items.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                    <span>{item.quantity}x {item.productName}</span>
                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-black p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Resumo Financeiro</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Subtotal:</span> <span>{formatCurrency(sale.subtotal)}</span></div>
                            {sale.discount > 0 && <div className="flex justify-between"><span className="text-gray-400">Desconto:</span> <span className="text-red-400">-{formatCurrency(sale.discount)}</span></div>}
                            {sale.deliveryFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Taxa de Entrega:</span> <span>{formatCurrency(sale.deliveryFee)}</span></div>}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700"><span >Total:</span> <span>{formatCurrency(sale.total)}</span></div>
                        </div>
                    </div>
                     <div className="bg-black p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Pagamento</h4>
                        <p><strong>Método:</strong> <span className="capitalize">{sale.paymentMethod}</span></p>
                        <p><strong>Detalhes:</strong> {sale.paymentDetails}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
interface HistoricoVendasPanelProps {
    storeId: string;
    clientes: Cliente[];
    showToast: (message: string, type: 'success' | 'error') => void;
}

const HistoricoVendasPanel: React.FC<HistoricoVendasPanelProps> = ({ storeId, clientes, showToast }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', customerId: 'all' });
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const [cursors, setCursors] = useState<any[]>([null]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchSales = async (cursor: any = null) => {
        if (!storeId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let query = getCollectionRef('sales', storeId).orderBy('saleDate', 'desc');

            // Filters
            if (filters.startDate) {
                const start = new Date(filters.startDate);
                query = query.where('saleDate', '>=', start);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                query = query.where('saleDate', '<=', end);
            }
            if (filters.customerId !== 'all') {
                query = query.where('customerId', '==', filters.customerId);
            }

            if (cursor) {
                query = query.startAfter(cursor);
            }
            
            query = query.limit(ITEMS_PER_PAGE);

            const snapshot = await query.get();
            const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
            
            setSales(salesData);
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

            if (snapshot.docs.length > 0) {
                const lastVisible = snapshot.docs[snapshot.docs.length - 1];
                setCursors(prev => {
                    const newCursors = [...prev];
                    newCursors[page] = lastVisible;
                    return newCursors;
                });
            }

        } catch (error) {
            console.error("Erro ao buscar vendas:", error);
            showToast("Erro ao buscar vendas.", 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        setCursors([null]);
        fetchSales(null);
    }, [filters, storeId]); // Refetch when filters or storeId change

    const handleNextPage = () => {
        if (hasMore) {
            const nextPage = page + 1;
            const cursor = cursors[page];
            setPage(nextPage);
            fetchSales(cursor);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            const prevPage = page - 1;
            const cursor = cursors[prevPage - 1];
            setPage(prevPage);
            fetchSales(cursor);
        }
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDeleteSale = async (saleId: string) => {
        if (window.confirm('Tem certeza que deseja cancelar/excluir esta venda? Essa ação não pode ser desfeita.')) {
            try {
                await getDocRef('sales', saleId, storeId).delete();
                // FIX: Pass storeId
                logAuditEvent('sale_deleted', { saleId }, storeId);
                showToast('Venda excluída com sucesso.', 'success');
                // Refresh current page
                fetchSales(cursors[page - 1]);
            } catch (error) {
                console.error("Erro ao excluir venda:", error);
                showToast('Erro ao excluir venda.', 'error');
            }
        }
    };

    const handleClearHistory = async () => {
        const confirmInput = window.prompt('ATENÇÃO: Você está prestes a apagar TODO o histórico de vendas. Isso é irreversível. Digite "DELETAR" para confirmar:');
        if (confirmInput === 'DELETAR') {
            setIsDeleting(true);
            try {
                const snapshot = await getCollectionRef('sales', storeId).get();
                if (snapshot.empty) {
                    showToast('Não há vendas para excluir.', 'success');
                    setIsDeleting(false);
                    return;
                }

                // Batch delete in chunks of 400
                const chunks = [];
                for (let i = 0; i < snapshot.docs.length; i += 400) {
                    chunks.push(snapshot.docs.slice(i, i + 400));
                }

                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }

                // FIX: Pass storeId
                logAuditEvent('sales_history_cleared', { count: snapshot.size }, storeId);
                showToast(`Histórico limpo! ${snapshot.size} vendas foram removidas.`, 'success');
                fetchSales(null);
            } catch (error) {
                console.error("Erro ao limpar histórico:", error);
                showToast('Erro ao limpar histórico.', 'error');
            } finally {
                setIsDeleting(false);
            }
        } else if (confirmInput !== null) {
            showToast('Código de confirmação incorreto. Ação cancelada.', 'error');
        }
    };
    
    const handleExportSales = async () => {
        if (sales.length === 0) {
            showToast("Nenhuma venda para exportar na visualização atual.", 'error');
            return;
        }
        
        try {
            // Fetch all sales for export if needed, or just export current view
            // For better UX, let's export all matching current filters without pagination limit
            showToast("Gerando arquivo CSV...", 'success');
            
            let query = getCollectionRef('sales', storeId).orderBy('saleDate', 'desc');
            if (filters.startDate) {
                const start = new Date(filters.startDate);
                query = query.where('saleDate', '>=', start);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                query = query.where('saleDate', '<=', end);
            }
            if (filters.customerId !== 'all') {
                query = query.where('customerId', '==', filters.customerId);
            }
            
            const snapshot = await query.get();
            const allSales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
            
            const headers = ['ID', 'Data', 'Cliente', 'Itens', 'Valor Total', 'Método Pagamento'];
            const rows = allSales.map(sale => [
                sale.id,
                sale.saleDate?.toDate().toLocaleString('pt-BR'),
                `"${sale.customerName}"`,
                `"${sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}"`,
                sale.total.toFixed(2).replace('.', ','),
                sale.paymentMethod
            ]);
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error(error);
            showToast("Erro ao exportar vendas.", 'error');
        }
    };

    return (
        <div>
            <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} storeId={storeId} />
            <div className="admin-card">
                 <div className="admin-card-header flex justify-between items-center">
                     <h2 className="text-xl font-bold">Histórico de Vendas</h2>
                     <button onClick={handleExportSales} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                        <Download size={16} /> Exportar CSV
                     </button>
                </div>
                <div className="admin-card-content">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm text-gray-400" />
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm text-gray-400" />
                        <select name="customerId" value={filters.customerId} onChange={handleFilterChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm">
                            <option value="all">Todos os Clientes</option>
                            <option value="avulso">Cliente Avulso</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {loading ? <div className="flex justify-center p-8"><Loader className="animate-spin text-yellow-500"/></div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[700px]">
                                <thead className="bg-[#1a1a1a]">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Itens</th>
                                        <th className="p-4">Total</th>
                                        <th className="p-4">Pagamento</th>
                                        <th className="p-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map(sale => (
                                        <tr key={sale.id} className="border-t border-[#27272a] hover:bg-zinc-900/30 transition-colors">
                                            <td className="p-4 font-mono text-xs">{sale.id.substring(0, 8)}...</td>
                                            <td className="p-4 font-medium">{sale.customerName}</td>
                                            <td className="p-4">{sale.saleDate?.toDate().toLocaleString('pt-BR')}</td>
                                            <td className="p-4">{sale.items.length}</td>
                                            <td className="p-4 font-bold">{formatCurrency(sale.total)}</td>
                                            <td className="p-4 capitalize">{sale.paymentMethod}</td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedSale(sale)} 
                                                    className="text-gray-400 hover:text-yellow-400 p-1.5 hover:bg-zinc-800 rounded transition-colors" 
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteSale(sale.id)} 
                                                    className="text-gray-400 hover:text-red-400 p-1.5 hover:bg-zinc-800 rounded transition-colors" 
                                                    title="Cancelar Venda"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {sales.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500">
                            <p>Nenhuma venda encontrada com os filtros selecionados.</p>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800">
                        <div className="flex gap-4">
                             <button 
                                onClick={handlePrevPage} 
                                disabled={page === 1 || loading}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-bold text-sm transition-colors"
                            >
                                <ArrowLeft size={16}/> Anterior
                            </button>
                            <span className="text-zinc-400 text-sm flex items-center">Página {page}</span>
                            <button 
                                onClick={handleNextPage} 
                                disabled={!hasMore || loading}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-bold text-sm transition-colors"
                            >
                                Próximo <ArrowRight size={16}/>
                            </button>
                        </div>

                        <button 
                            onClick={handleClearHistory} 
                            disabled={isDeleting || sales.length === 0}
                            className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 bg-red-950/10 hover:bg-red-950/30 px-4 py-2 rounded border border-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <AlertTriangle size={14}/>
                            {isDeleting ? 'Apagando...' : 'Limpar Histórico'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoricoVendasPanel;
