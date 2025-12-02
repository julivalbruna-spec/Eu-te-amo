
import React, { useState, useMemo, useEffect } from 'react';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import firebase from 'firebase/compat/app';
import { ServiceOrder, Cliente } from '../../types';
import { Plus, Edit2, Trash2, X, Search, Tool, ChevronDown, Download } from 'react-feather';

// --- HELPER ---
const emptyServiceOrder: Partial<ServiceOrder> = {
    osNumber: 0,
    customerId: 'avulso',
    customerName: 'Cliente Avulso',
    device: '',
    issueDescription: '',
    status: 'Aguardando avaliação',
    price: 0,
    notes: '',
};

const statusColors: { [key in ServiceOrder['status']]: string } = {
    'Aguardando avaliação': 'bg-blue-500/20 text-blue-400',
    'Em reparo': 'bg-yellow-500/20 text-yellow-400',
    'Aguardando peça': 'bg-purple-500/20 text-purple-400',
    'Pronto para retirada': 'bg-green-500/20 text-green-400',
    'Finalizado': 'bg-gray-500/20 text-gray-400',
    'Cancelado': 'bg-red-500/20 text-red-400',
};

// --- MODAL SUB-COMPONENT ---
interface ServiceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceOrder: Partial<ServiceOrder> | null;
    onSave: (data: Partial<ServiceOrder>) => Promise<void>;
    clientes: Cliente[];
}

const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({ isOpen, onClose, serviceOrder, onSave, clientes }) => {
    const [formData, setFormData] = useState(serviceOrder || emptyServiceOrder);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

    useEffect(() => {
        setFormData(serviceOrder || emptyServiceOrder);
        setCustomerSearch(serviceOrder?.customerName || '');
    }, [serviceOrder]);

    const filteredClientes = useMemo(() => {
        if (!customerSearch) return clientes;
        return clientes.filter(c => c.nome.toLowerCase().includes(customerSearch.toLowerCase()));
    }, [customerSearch, clientes]);

    const handleCustomerSelect = (cliente: Cliente | null) => {
        if (cliente) {
            setFormData(prev => ({ ...prev, customerId: cliente.id, customerName: cliente.nome }));
            setCustomerSearch(cliente.nome);
        } else { // Cliente Avulso
            setFormData(prev => ({ ...prev, customerId: 'avulso', customerName: 'Cliente Avulso' }));
            setCustomerSearch('Cliente Avulso');
        }
        setIsCustomerDropdownOpen(false);
    };
    
    const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerSearch(e.target.value);
        setIsCustomerDropdownOpen(true);
        if (!clientes.some(c => c.nome.toLowerCase() === e.target.value.toLowerCase())) {
             setFormData(prev => ({ ...prev, customerId: 'avulso', customerName: e.target.value || 'Cliente Avulso' }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold">{serviceOrder?.id ? `Editar O.S. #${serviceOrder.osNumber}` : 'Nova Ordem de Serviço'}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="relative">
                        <label className="text-sm text-gray-400 block mb-1">Cliente</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={customerSearch}
                                onChange={handleCustomerSearchChange}
                                onFocus={() => setIsCustomerDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                                placeholder="Pesquisar ou digitar nome..."
                                className="w-full bg-black border border-[#27272a] rounded-lg p-2 pr-12"
                            />
                             <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>
                        {isCustomerDropdownOpen && (
                            <div className="absolute z-10 w-full bg-black border border-[#27272a] rounded-lg mt-1 max-h-48 overflow-y-auto">
                                <button onClick={() => handleCustomerSelect(null)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800">Cliente Avulso</button>
                                {filteredClientes.map(c => (
                                    <button key={c.id} onClick={() => handleCustomerSelect(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800">
                                        {c.nome}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Aparelho</label>
                        <input name="device" value={formData.device} onChange={handleChange} placeholder="Ex: iPhone 13 Pro" className="w-full bg-black border border-[#27272a] rounded-lg p-2"/>
                    </div>
                     <div>
                        <label className="text-sm text-gray-400 block mb-1">Problema Relatado</label>
                        <textarea name="issueDescription" value={formData.issueDescription} onChange={handleChange} rows={3} placeholder="Ex: Tela não liga, aparelho caiu na água." className="w-full bg-black border border-[#27272a] rounded-lg p-2"/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2">
                                {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="text-sm text-gray-400 block mb-1">Valor do Serviço (R$)</label>
                            <input name="price" type="number" value={formData.price || ''} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2"/>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm text-gray-400 block mb-1">Notas Internas</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Ex: Cliente deixou carregador." className="w-full bg-black border border-[#27272a] rounded-lg p-2"/>
                    </div>
                </div>
                <div className="p-4 mt-auto border-t border-[#27272a] flex justify-end gap-3">
                    <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">Cancelar</button>
                    <button onClick={() => onSave(formData)} className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400">Salvar</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface ServicosPanelProps {
    storeId: string;
    clientes: Cliente[];
    showToast: (message: string, type: 'success' | 'error') => void;
}

const ServicosPanel: React.FC<ServicosPanelProps> = ({ storeId, clientes, showToast }) => {
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Partial<ServiceOrder> | null>(null);

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }
        const unsubscribe = getCollectionRef('serviceOrders', storeId).orderBy('osNumber', 'desc').onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceOrder[];
            setServiceOrders(data);
            setLoading(false);
        }, error => {
            showToast("Erro ao carregar O.S.", 'error');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [storeId, showToast]);

    const filteredOrders = useMemo(() => {
        if (!searchTerm) return serviceOrders;
        return serviceOrders.filter(o => 
            o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(o.osNumber).includes(searchTerm)
        );
    }, [serviceOrders, searchTerm]);

    const handleOpenModal = (order: Partial<ServiceOrder> | null = null) => {
        setEditingOrder(order ? { ...order } : { ...emptyServiceOrder });
        setIsModalOpen(true);
    };

    const handleSaveOrder = async (data: Partial<ServiceOrder>) => {
        try {
            if (data.id) {
                const { id, ...dataToUpdate } = data;
                await getDocRef('serviceOrders', id, storeId).update(dataToUpdate);
                showToast("O.S. atualizada com sucesso!", 'success');
            } else {
                const counterRef = getDocRef('counters', 'serviceOrders', storeId);
                const newOsNumber = await db.runTransaction(async (transaction) => {
                    const counterDoc = await transaction.get(counterRef);
                    if (!counterDoc.exists) {
                        transaction.set(counterRef, { count: 1 });
                        return 1;
                    }
                    const newCount = (counterDoc.data()?.count || 0) + 1;
                    transaction.update(counterRef, { count: newCount });
                    return newCount;
                });
                
                const { id, ...dataToAdd } = data;
                await getCollectionRef('serviceOrders', storeId).add({
                    ...dataToAdd,
                    osNumber: newOsNumber,
                    creationDate: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast(`O.S. #${newOsNumber} criada com sucesso!`, 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast("Erro ao salvar O.S.", 'error');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
            await getDocRef('serviceOrders', id, storeId).delete();
            showToast("O.S. excluída.", 'success');
        }
    };
    
    const handleExportOS = () => {
        if (filteredOrders.length === 0) {
            showToast("Nenhuma ordem de serviço para exportar.", 'error');
            return;
        }
        
        try {
            const headers = ['OS #', 'Data', 'Cliente', 'Aparelho', 'Problema', 'Status', 'Valor'];
            const rows = filteredOrders.map(os => [
                os.osNumber,
                os.creationDate?.toDate().toLocaleString('pt-BR'),
                `"${os.customerName}"`,
                `"${os.device}"`,
                `"${os.issueDescription}"`,
                os.status,
                os.price.toFixed(2).replace('.', ',')
            ]);
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `relatorio_servicos_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast("Exportação concluída!", 'success');
        } catch (error) {
            console.error(error);
            showToast("Erro ao exportar.", 'error');
        }
    };

    return (
        <div>
            <ServiceOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} serviceOrder={editingOrder} onSave={handleSaveOrder} clientes={clientes} />
            <div className="admin-card">
                <div className="admin-card-header flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Tool /> Ordens de Serviço</h2>
                    <button onClick={handleExportOS} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                        <Download size={16} /> Exportar CSV
                    </button>
                </div>
                <div className="admin-card-content">
                    <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                        <div className="relative flex-grow max-w-lg">
                            <input type="text" placeholder="Buscar por cliente, aparelho ou nº da O.S..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2 pl-10"/>
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-text)]" />
                        </div>
                        <button onClick={() => handleOpenModal(null)} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400">
                            <Plus size={20} className="mr-2" /> Nova O.S.
                        </button>
                    </div>
                     {loading ? <p>Carregando...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[700px]">
                                <thead className="bg-[#1a1a1a]">
                                    <tr>
                                        <th className="p-4">O.S. #</th>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Aparelho</th>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id} className="border-t border-[#27272a]">
                                            <td className="p-4 font-bold">{order.osNumber}</td>
                                            <td className="p-4">{order.customerName}</td>
                                            <td className="p-4">{order.device}</td>
                                            <td className="p-4">{order.creationDate?.toDate().toLocaleDateString('pt-BR')}</td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[order.status]}`}>{order.status}</span>
                                            </td>
                                            <td className="p-4 flex items-center space-x-3">
                                                <button onClick={() => handleOpenModal(order)}><Edit2 size={18} /></button>
                                                <button onClick={() => handleDeleteOrder(order.id)} className="text-red-500"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {filteredOrders.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500"><p>Nenhuma ordem de serviço encontrada.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServicosPanel;
