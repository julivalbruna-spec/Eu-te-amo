

import React, { useState, useMemo, useEffect } from 'react';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import firebase from 'firebase/compat/app';
import { Cliente, Sale, ServiceOrder } from '../../types';
import { Plus, Edit2, Trash2, X, Search, Cpu, User, ShoppingBag, FileText, Loader, Tool, RefreshCw, Download } from 'react-feather';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- HELPER ---
const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const emptyCliente: Partial<Cliente> = {
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    endereco: { rua: '', numero: '', bairro: '', cidade: '' }
};

// --- SUB-COMPONENTS ---

interface ClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: Partial<Cliente> | null;
    onSave: (clienteData: Partial<Cliente>) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ isOpen, onClose, cliente, onSave, showToast, storeId }) => {
    const [formData, setFormData] = useState(cliente || emptyCliente);
    const [activeTab, setActiveTab] = useState<'pessoal' | 'historico' | 'servicos'>('pessoal');
    const [vendas, setVendas] = useState<Sale[]>([]);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [loadingVendas, setLoadingVendas] = useState(false);
    const [loadingServiceOrders, setLoadingServiceOrders] = useState(false);
    
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [aiServiceAnalysis, setAiServiceAnalysis] = useState<string | null>(null);
    const [isGeneratingServiceAnalysis, setIsGeneratingServiceAnalysis] = useState(false);

    useEffect(() => {
        setFormData(cliente || emptyCliente);
        setActiveTab('pessoal');
        setVendas([]);
        setServiceOrders([]);
        setAiAnalysis(null);
        setAiServiceAnalysis(null);
        if (cliente?.id && storeId) {
            setLoadingVendas(true);
            getCollectionRef('sales', storeId).where('customerId', '==', cliente.id).orderBy('saleDate', 'desc').get()
                .then(snapshot => {
                    const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
                    setVendas(salesData);
                })
                .catch(err => {
                    console.error("Erro ao buscar histórico de vendas:", err);
                    showToast("Erro ao buscar histórico de vendas.", 'error');
                })
                .finally(() => setLoadingVendas(false));
            
            setLoadingServiceOrders(true);
            getCollectionRef('serviceOrders', storeId).where('customerId', '==', cliente.id).orderBy('creationDate', 'desc').get()
                .then(snapshot => {
                    const soData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceOrder[];
                    setServiceOrders(soData);
                })
                .catch(err => {
                    console.error("Erro ao buscar O.S.:", err);
                    showToast("Erro ao buscar ordens de serviço.", 'error');
                })
                .finally(() => setLoadingServiceOrders(false));
        }
    }, [cliente, storeId, showToast]);

    // ... (rest of modal logic is fine)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('endereco.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, endereco: { ...(prev?.endereco || {}), [field]: value } as any }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        if (!formData.nome || !formData.telefone) {
            showToast("Nome e Telefone são obrigatórios.", 'error');
            return;
        }
        await onSave(formData);
    };

    const handleGenerateAIAnalysis = async () => {
        if (vendas.length === 0) {
            setAiAnalysis("Não há dados de vendas suficientes para uma análise precisa.");
            return;
        }
        setIsGeneratingAnalysis(true);
        setAiAnalysis(null);

        try {
            const salesSummary = vendas.map(v => ({
                date: v.saleDate.toDate().toLocaleDateString(),
                total: v.total,
                items: v.items.map(i => i.productName).join(', ')
            }));

            const prompt = `
                Você é um analista de CRM especialista em e-commerce de eletrônicos (iPhones).
                Analise o seguinte histórico de compras deste cliente e gere um perfil comportamental curto (máx 3 linhas).
                
                DADOS DO CLIENTE:
                ${JSON.stringify(salesSummary)}

                TAREFA:
                1. Identifique o padrão de compra (ex: compra lançamentos, compra custo-benefício, compra muitos acessórios).
                2. Sugira qual seria o PRÓXIMO produto ideal para oferecer a ele (Upsell/Cross-sell).
                3. Use um tom profissional e direto.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setAiAnalysis(response.text);
        } catch (error) {
            console.error(error);
            showToast("Erro ao gerar análise.", 'error');
        } finally {
            setIsGeneratingAnalysis(false);
        }
    };

    const handleGenerateAIServiceAnalysis = async () => {
        setIsGeneratingServiceAnalysis(true);
        setAiServiceAnalysis(null);

        try {
            const serviceSummary = serviceOrders.map(s => ({
                date: s.creationDate.toDate().toLocaleDateString(),
                device: s.device,
                issue: s.issueDescription,
                status: s.status
            }));
            
            const salesDevices = vendas.map(v => ({
                date: v.saleDate.toDate().toLocaleDateString(),
                items: v.items.map(i => i.productName).join(', ')
            }));

            const prompt = `
                Você é um técnico especialista Apple. Analise o histórico deste cliente e sugira uma manutenção preventiva ou oportunidade de serviço.
                
                HISTÓRICO DE SERVIÇOS:
                ${JSON.stringify(serviceSummary)}

                HISTÓRICO DE COMPRAS (para estimar idade dos aparelhos):
                ${JSON.stringify(salesDevices)}

                TAREFA:
                1. Identifique se há aparelhos antigos que podem precisar de troca de bateria.
                2. Se o cliente teve muitos problemas de quebra, sugira proteção (película/capa).
                3. Se não houver dados suficientes, dê uma dica genérica de manutenção para iPhones.
                4. Resposta curta (máx 2 frases).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setAiServiceAnalysis(response.text);
        } catch (error) {
            console.error(error);
            showToast("Erro ao gerar sugestão.", 'error');
        } finally {
            setIsGeneratingServiceAnalysis(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold">{cliente?.id ? 'Editar' : 'Adicionar'} Cliente</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="flex border-b border-[#27272a]">
                    <button onClick={() => setActiveTab('pessoal')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'pessoal' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-400'}`}>
                        Dados Pessoais
                    </button>
                    <button onClick={() => setActiveTab('historico')} disabled={!cliente?.id} className={`flex-1 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'historico' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-400'}`}>
                        Histórico de Compras
                    </button>
                    <button onClick={() => setActiveTab('servicos')} disabled={!cliente?.id} className={`flex-1 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'servicos' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-400'}`}>
                        Ordens de Serviço
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {activeTab === 'pessoal' && (
                         <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Nome Completo *</label>
                                <input name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Telefone / WhatsApp *</label>
                                    <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">E-mail</label>
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">CPF/CNPJ</label>
                                <input name="cpf" value={formData.cpf} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                            </div>
                            <div className="pt-4 border-t border-[#27272a]">
                                <h4 className="font-semibold mb-2">Endereço</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-sm text-gray-400 block mb-1">Rua</label>
                                        <input name="endereco.rua" value={formData.endereco?.rua} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Número</label>
                                        <input name="endereco.numero" value={formData.endereco?.numero} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Bairro</label>
                                        <input name="endereco.bairro" value={formData.endereco?.bairro} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm text-gray-400 block mb-1">Cidade</label>
                                        <input name="endereco.cidade" value={formData.endereco?.cidade} onChange={handleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'historico' && (
                        <div>
                            {loadingVendas ? <div className="flex justify-center"><Loader className="animate-spin text-yellow-500"/></div> : (
                                vendas.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                             <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-blue-400 font-bold flex items-center gap-2"><Cpu size={16}/> Perfil de Compra (IA)</h4>
                                                <button onClick={handleGenerateAIAnalysis} disabled={isGeneratingAnalysis} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50 transition-colors">
                                                    {isGeneratingAnalysis ? <Loader size={12} className="animate-spin"/> : <RefreshCw size={12}/>} {aiAnalysis ? 'Regenerar' : 'Analisar'}
                                                </button>
                                             </div>
                                             {aiAnalysis ? (
                                                <p className="text-sm text-blue-200 leading-relaxed animate-fade-in">{aiAnalysis}</p>
                                             ) : (
                                                <p className="text-xs text-gray-500">Clique em analisar para descobrir o perfil deste cliente.</p>
                                             )}
                                        </div>

                                        {vendas.map(venda => (
                                            <div key={venda.id} className="bg-black p-3 rounded-md border border-gray-800">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{venda.saleDate.toDate().toLocaleDateString('pt-BR')}</p>
                                                        <p className="text-sm text-gray-400">{venda.items.map(i => i.productName).join(', ')}</p>
                                                    </div>
                                                    <p className="font-bold text-lg text-green-400">{formatCurrency(venda.total)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-500 text-center">Nenhuma compra registrada para este cliente.</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'servicos' && (
                        <div>
                            <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-purple-400 font-bold flex items-center gap-2"><Tool size={16}/> Oportunidade de Serviço (IA)</h4>
                                    <button onClick={handleGenerateAIServiceAnalysis} disabled={isGeneratingServiceAnalysis} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded disabled:opacity-50 transition-colors">
                                        {isGeneratingServiceAnalysis ? <Loader size={12} className="animate-spin"/> : <RefreshCw size={12}/>} {aiServiceAnalysis ? 'Regenerar' : 'Analisar'}
                                    </button>
                                    </div>
                                    {aiServiceAnalysis ? (
                                    <p className="text-sm text-purple-200 leading-relaxed animate-fade-in">{aiServiceAnalysis}</p>
                                    ) : (
                                    <p className="text-xs text-gray-500">A IA analisará a idade dos aparelhos comprados para sugerir manutenção.</p>
                                    )}
                            </div>

                            {loadingServiceOrders ? <div className="flex justify-center"><Loader className="animate-spin text-yellow-500"/></div> : (
                                serviceOrders.length > 0 ? (
                                    <div className="space-y-3">
                                        {serviceOrders.map(os => (
                                            <div key={os.id} className="bg-black p-3 rounded-md border border-gray-800">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">O.S. #{os.osNumber} - {os.device}</p>
                                                        <p className="text-sm text-gray-400">Data: {os.creationDate.toDate().toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">{os.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-500 text-center">Nenhuma ordem de serviço registrada.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 mt-auto border-t border-[#27272a] flex justify-end gap-3">
                    <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleSave} className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400">Salvar</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface CrmClientesPanelProps {
    storeId: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
}

const CrmClientesPanel: React.FC<CrmClientesPanelProps> = ({ storeId, showToast, uploadImage }) => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Partial<Cliente> | null>(null);

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }
        const unsubscribe = getCollectionRef('clientes', storeId).orderBy('nome').onSnapshot(snapshot => {
            const clientesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Cliente[];
            setClientes(clientesData);
            setLoading(false);
        }, error => {
            console.error("Erro ao buscar clientes:", error);
            showToast("Erro ao carregar clientes.", 'error');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [storeId, showToast]);

    const filteredClientes = useMemo(() => {
        if (!searchTerm) return clientes;
        return clientes.filter(c => 
            c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telefone?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clientes, searchTerm]);

    const handleOpenModal = (cliente: Partial<Cliente> | null = null) => {
        setEditingCliente(cliente ? { ...cliente } : { ...emptyCliente });
        setIsModalOpen(true);
    };

    const handleSaveCliente = async (clienteData: Partial<Cliente>) => {
        try {
            if (clienteData.id) {
                const { id, ...dataToUpdate } = clienteData;
                await getDocRef('clientes', id, storeId).update(dataToUpdate);
                showToast("Cliente atualizado com sucesso!", 'success');
            } else {
                const { id, ...dataToAdd } = clienteData;
                await getCollectionRef('clientes', storeId).add({
                    ...dataToAdd,
                    dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast("Cliente adicionado com sucesso!", 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar cliente:", error);
            showToast("Erro ao salvar cliente.", 'error');
        }
    };

    const handleDeleteCliente = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? O histórico de vendas associado não será perdido.')) {
            try {
                await getDocRef('clientes', id, storeId).delete();
                showToast("Cliente excluído com sucesso!", 'success');
            } catch (error) {
                console.error("Erro ao excluir cliente:", error);
                showToast("Erro ao excluir cliente.", 'error');
            }
        }
    };
    
    const exportContacts = (type: 'telefone' | 'email') => {
        const contacts = clientes
            .map(c => c[type])
            .filter(Boolean) // Remove null/undefined/empty strings
            .join('\n');
            
        if (!contacts) {
            showToast(`Nenhum ${type === 'telefone' ? 'telefone' : 'e-mail'} para exportar.`, 'error');
            return;
        }

        const blob = new Blob([contacts], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lista_${type}s.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <ClienteModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                cliente={editingCliente}
                onSave={handleSaveCliente}
                showToast={showToast}
                storeId={storeId}
            />
            <div className="admin-card">
                <div className="admin-card-header">
                     <h2 className="text-xl font-bold flex items-center gap-2">
                        <User size={24} /> Gestão de Clientes
                    </h2>
                </div>
                <div className="admin-card-content">
                    <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                        <div className="relative flex-grow max-w-lg">
                            <input
                                type="text"
                                placeholder="Pesquisar por nome ou telefone..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-black border border-[#27272a] rounded-lg p-2 pl-10 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-text)]" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => exportContacts('telefone')} className="flex items-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"><Download size={16} className="mr-2"/> Baixar Telefones</button>
                            <button onClick={() => exportContacts('email')} className="flex items-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"><Download size={16} className="mr-2"/> Baixar Emails</button>
                            <button onClick={() => handleOpenModal(null)} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">
                                <Plus size={20} className="mr-2" /> Adicionar Cliente
                            </button>
                        </div>
                    </div>

                    {loading ? <p>Carregando clientes...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[600px]">
                                <thead className="bg-[#1a1a1a]">
                                    <tr>
                                        <th className="p-4">Nome</th>
                                        <th className="p-4">Telefone</th>
                                        <th className="p-4">E-mail</th>
                                        <th className="p-4">Data de Cadastro</th>
                                        <th className="p-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClientes.map(cliente => (
                                        <tr key={cliente.id} className="border-t border-[#27272a]">
                                            <td className="p-4 font-medium">{cliente.nome}</td>
                                            <td className="p-4">{cliente.telefone}</td>
                                            <td className="p-4">{cliente.email}</td>
                                            <td className="p-4">{cliente.dataCadastro?.toDate().toLocaleDateString('pt-BR')}</td>
                                            <td className="p-4 flex items-center space-x-3">
                                                <button onClick={() => handleOpenModal(cliente)} className="text-gray-400 hover:text-white"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDeleteCliente(cliente.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                     {filteredClientes.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500">
                            <p>Nenhum cliente encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrmClientesPanel;