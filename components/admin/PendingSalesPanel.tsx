
import React, { useState, useEffect } from 'react';
import { getCollectionRef, getDocRef } from '../../firebase';
import { PendingSale } from '../../types';
import { CheckCircle, XCircle, Clock, MessageSquare, Trash2 } from 'react-feather';
import firebase from 'firebase/compat/app';

interface PendingSalesPanelProps {
    storeId: string;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PendingSalesPanel: React.FC<PendingSalesPanelProps> = ({ storeId, showToast }) => {
    const [sales, setSales] = useState<PendingSale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;
        const unsubscribe = getCollectionRef('pending_sales', storeId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingSale));
                setSales(salesData);
                setLoading(false);
            }, error => {
                console.error("Error fetching pending sales:", error);
                setLoading(false);
            });
        return () => unsubscribe();
    }, [storeId]);

    const handleAction = async (saleId: string, action: 'complete' | 'cancel' | 'delete') => {
        try {
            if (action === 'delete') {
                if (!window.confirm("Tem certeza que deseja remover este registro?")) return;
                await getDocRef('pending_sales', saleId, storeId).delete();
                showToast("Registro removido.", 'success');
            } else {
                const status = action === 'complete' ? 'completed' : 'cancelled';
                await getDocRef('pending_sales', saleId, storeId).update({ status });
                showToast(`Status atualizado para ${status === 'completed' ? 'Concretizada' : 'Cancelada'}.`, 'success');
            }
        } catch (error) {
            showToast("Erro ao atualizar venda.", 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Carregando vendas pendentes...</div>;

    return (
        <div className="admin-card">
            <div className="admin-card-header">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <MessageSquare className="text-green-500"/> Vendas via WhatsApp (Confirmar)
                </h2>
            </div>
            <div className="admin-card-content">
                <p className="text-gray-400 mb-6 text-sm">
                    Estes são os clientes que clicaram no botão de "Finalizar no WhatsApp". Confirme se a venda foi realmente concretizada na conversa.
                </p>
                
                <div className="space-y-3">
                    {sales.map(sale => (
                        <div key={sale.id} className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
                            sale.status === 'completed' ? 'bg-green-900/10 border-green-900/30' : 
                            sale.status === 'cancelled' ? 'bg-red-900/10 border-red-900/30 opacity-60' : 
                            'bg-zinc-900/50 border-zinc-800'
                        }`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                        sale.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                        sale.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                        'bg-red-500/20 text-red-500'
                                    }`}>
                                        {sale.status === 'pending' ? 'Pendente' : sale.status === 'completed' ? 'Concretizada' : 'Cancelada'}
                                    </span>
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Clock size={12}/> {sale.createdAt?.toDate().toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <p className="font-bold text-white text-lg">{formatCurrency(sale.totalValue)}</p>
                                <div className="text-sm text-zinc-400 mt-1">
                                    {sale.products.map((p, i) => (
                                        <div key={i}>
                                            {p.quantity}x {p.productName} {p.variantName && <span className="text-zinc-500">({p.variantName})</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                                {sale.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleAction(sale.id, 'complete')} className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors">
                                            <CheckCircle size={16}/> Confirmar Venda
                                        </button>
                                        <button onClick={() => handleAction(sale.id, 'cancel')} className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors">
                                            <XCircle size={16}/> Não Vendeu
                                        </button>
                                    </>
                                )}
                                {(sale.status === 'completed' || sale.status === 'cancelled') && (
                                    <button onClick={() => handleAction(sale.id, 'delete')} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded transition-colors ml-auto">
                                        <Trash2 size={18}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {sales.length === 0 && <p className="text-center text-zinc-500 py-8">Nenhuma venda pendente registrada.</p>}
                </div>
            </div>
        </div>
    );
};

export default PendingSalesPanel;
