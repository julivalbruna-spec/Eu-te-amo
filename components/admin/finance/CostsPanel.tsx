
import React, { useState, useEffect, useMemo } from 'react';
import { getCollectionRef } from '../../../firebase';
import firebase from 'firebase/compat/app';
import { FixedCost, VariableCost } from '../../../types';
import { Plus, Trash2, Loader, DollarSign, TrendingDown } from 'react-feather';

interface CostsPanelProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CostsPanel: React.FC<CostsPanelProps> = ({ showToast, storeId }) => {
    const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
    const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
    const [loading, setLoading] = useState(true);

    const [newFixedCost, setNewFixedCost] = useState({ name: '', amount: '' });
    const [newVariableCost, setNewVariableCost] = useState({ name: '', amount: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        if (!storeId) return;
        
        const unsubFixed = getCollectionRef('fixed_costs', storeId).orderBy('createdAt', 'desc').onSnapshot(snap => {
            setFixedCosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FixedCost)));
            if(loading) setLoading(false);
        });
        
        const unsubVariable = getCollectionRef('variable_costs', storeId).orderBy('date', 'desc').limit(100).onSnapshot(snap => {
            setVariableCosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VariableCost)));
            if(loading) setLoading(false);
        });

        return () => {
            unsubFixed();
            unsubVariable();
        };
    }, [storeId]);

    const handleAddFixedCost = async () => {
        if (!newFixedCost.name || !newFixedCost.amount) return;
        await getCollectionRef('fixed_costs', storeId).add({ 
            name: newFixedCost.name, 
            amount: parseFloat(newFixedCost.amount),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setNewFixedCost({ name: '', amount: '' });
        showToast("Custo fixo adicionado!", 'success');
    };
    
    const handleDeleteFixedCost = async (id: string) => {
        if (window.confirm("Tem certeza?")) {
            await getCollectionRef('fixed_costs', storeId).doc(id).delete();
            showToast("Custo fixo removido.", 'success');
        }
    };
    
    const handleAddVariableCost = async () => {
        if (!newVariableCost.name || !newVariableCost.amount || !newVariableCost.date) return;
        const [year, month, day] = newVariableCost.date.split('-').map(Number);
        const dateObject = new Date(year, month - 1, day);

        await getCollectionRef('variable_costs', storeId).add({ 
            name: newVariableCost.name, 
            amount: parseFloat(newVariableCost.amount),
            date: firebase.firestore.Timestamp.fromDate(dateObject),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setNewVariableCost({ name: '', amount: '', date: new Date().toISOString().split('T')[0] });
        showToast("Custo variável adicionado!", 'success');
    };
    
    const handleDeleteVariableCost = async (id: string) => {
        if (window.confirm("Tem certeza?")) {
            await getCollectionRef('variable_costs', storeId).doc(id).delete();
            showToast("Custo variável removido.", 'success');
        }
    };

    const totalFixedMonthly = useMemo(() => fixedCosts.reduce((sum, cost) => sum + cost.amount, 0), [fixedCosts]);
    
    const { recentVariableCosts, totalVariableRecent } = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recent = variableCosts.filter(c => c.date && c.date.toDate() >= thirtyDaysAgo);
        const total = recent.reduce((sum, cost) => sum + cost.amount, 0);
        return { recentVariableCosts: recent, totalVariableRecent: total };
    }, [variableCosts]);


    if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-yellow-500" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="admin-card">
                <div className="admin-card-header"><h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign size={18}/> Custos Fixos Mensais</h3></div>
                <div className="admin-card-content">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                        <input value={newFixedCost.name} onChange={e => setNewFixedCost(p => ({...p, name: e.target.value}))} placeholder="Ex: Aluguel" className="md:col-span-2 admin-input" />
                        <input value={newFixedCost.amount} onChange={e => setNewFixedCost(p => ({...p, amount: e.target.value}))} type="number" placeholder="Valor" className="admin-input" />
                    </div>
                    <button onClick={handleAddFixedCost} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg mb-6 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"><Plus size={18}/>Adicionar</button>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {fixedCosts.map(cost => (
                            <div key={cost.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                                <span className="font-medium text-zinc-300">{cost.name}</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-white">{formatCurrency(cost.amount)}</span>
                                    <button onClick={() => handleDeleteFixedCost(cost.id)} className="text-zinc-500 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="pt-4 mt-4 border-t border-white/10 flex justify-between font-bold text-lg">
                        <span className="text-zinc-300">Total Mensal:</span>
                        <span className="text-white">{formatCurrency(totalFixedMonthly)}</span>
                    </div>
                </div>
            </div>
            <div className="admin-card">
                <div className="admin-card-header"><h3 className="text-lg font-semibold flex items-center gap-2"><TrendingDown size={18}/> Custos Variáveis</h3></div>
                <div className="admin-card-content">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                        <input value={newVariableCost.name} onChange={e => setNewVariableCost(p => ({...p, name: e.target.value}))} placeholder="Ex: Material de Limpeza" className="md:col-span-2 admin-input" />
                        <input value={newVariableCost.amount} onChange={e => setNewVariableCost(p => ({...p, amount: e.target.value}))} type="number" placeholder="Valor" className="admin-input" />
                        <input value={newVariableCost.date} onChange={e => setNewVariableCost(p => ({...p, date: e.target.value}))} type="date" className="md:col-span-3 admin-input text-zinc-400" />
                    </div>
                    <button onClick={handleAddVariableCost} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg mb-6 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"><Plus size={18}/>Adicionar</button>
                     <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {recentVariableCosts.map(cost => (
                            <div key={cost.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                                <div>
                                    <p className="font-medium text-zinc-300">{cost.name}</p>
                                    <p className="text-xs text-zinc-500">{cost.date?.toDate().toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-white">{formatCurrency(cost.amount)}</span>
                                    <button onClick={() => handleDeleteVariableCost(cost.id)} className="text-zinc-500 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 mt-4 border-t border-white/10 flex justify-between font-bold text-lg">
                        <span className="text-zinc-300">Soma (Últimos 30 dias):</span>
                        <span className="text-white">{formatCurrency(totalVariableRecent)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostsPanel;
