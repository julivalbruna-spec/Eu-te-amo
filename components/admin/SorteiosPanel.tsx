

import React, { useState, useEffect, useMemo } from 'react';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import firebase from 'firebase/compat/app';
import { Sorteio, Sale, Cliente } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Gift, Loader, Zap, Image as ImageIcon, Copy, Download, RefreshCw, Award } from 'react-feather';
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface SorteiosPanelProps {
    storeId: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    clientes: Cliente[];
}

// ... (rest of the component is fine until the main SorteiosPanel)

// --- MAIN COMPONENT ---
const SorteiosPanel: React.FC<SorteiosPanelProps> = ({ storeId, showToast, clientes }) => {
    const [sorteios, setSorteios] = useState<Sorteio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [editingSorteio, setEditingSorteio] = useState<Partial<Sorteio> | null>(null);
    const [sorteioForMedia, setSorteioForMedia] = useState<Sorteio | null>(null);

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }
        const unsubscribe = getCollectionRef('sorteios', storeId).orderBy('createdAt', 'desc').onSnapshot(snap => {
            setSorteios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sorteio[]);
            setLoading(false);
        }, err => showToast("Erro ao carregar sorteios.", 'error'));
        return () => unsubscribe();
    }, [storeId, showToast]);

    const handleOpenModal = (sorteio: Partial<Sorteio> | null = null) => {
        if (sorteio) {
            const dataToEdit = {
                ...sorteio,
                dataInicio: sorteio.dataInicio?.toDate ? sorteio.dataInicio.toDate().toISOString().split('T')[0] : '',
                dataFim: sorteio.dataFim?.toDate ? sorteio.dataFim.toDate().toISOString().split('T')[0] : ''
            };
            setEditingSorteio(dataToEdit);
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            
            setEditingSorteio({
                titulo: 'Sorteio Mega iPhone',
                premio: 'iPhone 15 Pro Max 256GB',
                premioImageUrl: 'https://www.trustedreviews.com/wp-content/uploads/sites/54/2023/09/iPhone-15-Pro-Max-vs-iPhone-14-Pro-Max-3.jpg',
                tipo: 'automatico_por_venda',
                dataInicio: tomorrow.toISOString().split('T')[0] as any,
                dataFim: thirtyDaysFromNow.toISOString().split('T')[0] as any,
                status: 'ativo'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (data: Partial<Sorteio>) => {
        const { id, ...dataToSave } = data;
        const finalData = {
            ...dataToSave,
            dataInicio: firebase.firestore.Timestamp.fromDate(new Date(data.dataInicio as any)),
            dataFim: firebase.firestore.Timestamp.fromDate(new Date(data.dataFim as any)),
        };

        try {
            if (id) {
                await getDocRef('sorteios', id, storeId).update(finalData);
                showToast("Sorteio atualizado!", 'success');
            } else {
                await getCollectionRef('sorteios', storeId).add({
                    ...finalData,
                    status: 'ativo',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast("Sorteio criado!", 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast("Erro ao salvar sorteio.", 'error');
        }
    };

    const handleDraw = async (sorteio: Sorteio) => {
        if (!window.confirm(`Realizar o sorteio "${sorteio.titulo}"? Esta ação é irreversível.`)) return;

        try {
            const salesQuery = getCollectionRef('sales', storeId)
                .where('saleDate', '>=', sorteio.dataInicio)
                .where('saleDate', '<=', sorteio.dataFim)
                .orderBy('saleDate');
            
            const salesSnapshot = await salesQuery.get();

            if (sorteio.tipo === 'automatico_por_venda') {
                const eligibleSales = salesSnapshot.docs.filter(doc => !doc.data().tags?.includes('telefone_negado'));
                if (eligibleSales.length === 0) {
                    showToast("Nenhuma venda elegível no período.", 'error'); return;
                }
                const winnerIndex = Math.floor(Math.random() * eligibleSales.length);
                const winningSaleDoc = eligibleSales[winnerIndex];
                const winningSale = winningSaleDoc.data();
                
                await getDocRef('sorteios', sorteio.id, storeId).update({
                    status: 'finalizado',
                    vendaPremiadaNumero: winnerIndex + 1,
                    clientePremiadoId: winningSale.customerId,
                    clientePremiadoNome: winningSale.customerName,
                    vendaPremiadaId: winningSaleDoc.id,
                });

            } else { // manual_por_cliente
                const customerIds = Array.from(new Set(salesSnapshot.docs.map(doc => doc.data().customerId).filter(id => id !== 'avulso')));
                if (customerIds.length === 0) {
                    showToast("Nenhum cliente elegível no período.", 'error'); return;
                }
                const winnerId = customerIds[Math.floor(Math.random() * customerIds.length)];
                const winner = clientes.find(c => c.id === winnerId);

                await getDocRef('sorteios', sorteio.id, storeId).update({
                    status: 'finalizado',
                    clientePremiadoId: winnerId,
                    clientePremiadoNome: winner?.nome || 'Nome não encontrado',
                });
            }
            showToast("Sorteio realizado com sucesso!", 'success');
        } catch (error) {
            showToast("Erro ao realizar sorteio.", 'error');
            console.error(error);
        }
    };

    // The rest of the component (Modals, UI rendering) is unchanged from the user's file
    // ... (omitting for brevity) ...
    const statusStyles = {
        ativo: 'bg-green-500/20 text-green-400',
        finalizado: 'bg-gray-500/20 text-gray-400'
    };
    
    const SorteioModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        onSave: (data: Partial<Sorteio>) => void;
        sorteio: Partial<Sorteio> | null;
    }> = ({ isOpen, onClose, onSave, sorteio }) => {
        const [formData, setFormData] = useState(sorteio);
    
        useEffect(() => {
            setFormData(sorteio);
        }, [sorteio]);
    
        if (!isOpen || !formData) return null;
    
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };
    
        const handleSave = () => {
            if (!formData.titulo || !formData.premio || !formData.dataFim) {
                alert("Título, Prêmio e Data Final são obrigatórios.");
                return;
            }
            onSave(formData);
        };
    
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-lg">
                    <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                        <h3 className="text-xl font-bold">{formData.id ? 'Editar' : 'Novo'} Sorteio</h3>
                        <button onClick={onClose}><X /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <input name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Título do Sorteio" className="w-full admin-input" />
                        <input name="premio" value={formData.premio} onChange={handleChange} placeholder="Prêmio (Ex: iPhone 15)" className="w-full admin-input" />
                        <input name="premioImageUrl" value={formData.premioImageUrl} onChange={handleChange} placeholder="URL da Imagem do Prêmio" className="w-full admin-input" />
                        <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full admin-input">
                            <option value="automatico_por_venda">Automático por Venda</option>
                            <option value="manual_por_cliente">Manual por Cliente</option>
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-400">Data de Início</label>
                                <input name="dataInicio" type="date" value={formData.dataInicio as string} onChange={handleChange} className="w-full admin-input" />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400">Data Final</label>
                                <input name="dataFim" type="date" value={formData.dataFim as string} onChange={handleChange} className="w-full admin-input" />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex justify-end">
                        <button onClick={handleSave} className="bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-400">Salvar</button>
                    </div>
                </div>
            </div>
        );
    };
    
    const MediaModal: React.FC<{
        sorteio: Sorteio | null,
        onClose: () => void,
        showToast: (message: string, type: 'success' | 'error') => void
    }> = ({ sorteio, onClose, showToast }) => {
        const [isLoading, setIsLoading] = useState(false);
        const [text, setText] = useState('');
        const [imageUrl, setImageUrl] = useState('');
        const [imageB64, setImageB64] = useState('');
    
        const generate = async () => {
            if (!sorteio) return;
            setIsLoading(true);
            try {
                const textPrompt = `Você é um social media de uma loja de eletrônicos. Crie um post para Instagram anunciando o vencedor do sorteio "${sorteio.titulo}". O prêmio foi: "${sorteio.premio}". O(A) grande vencedor(a) foi: ${sorteio.clientePremiadoNome}! Parabéns! Crie um texto animado e inclua hashtags relevantes.`;
                const imagePrompt = `Um banner comemorativo de sorteio, minimalista e elegante, com confetes e serpentinas douradas em um fundo escuro. O banner é sobre ganhar o prêmio: "${sorteio.premio}". Não inclua textos complexos.`;
    
                const [textResult, imageResult] = await Promise.all([
                    ai.models.generateContent({ model: 'gemini-2.5-flash', contents: textPrompt }),
                    ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: imagePrompt }] }, config: { responseModalities: [Modality.IMAGE] } })
                ]);
                
                setText(textResult.text);
                const b64 = imageResult.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
                setImageB64(b64);
                setImageUrl(`data:image/png;base64,${b64}`);
            } catch (error) {
                showToast("Erro ao gerar mídia.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
    
        useEffect(() => {
            if (sorteio) generate();
        }, [sorteio]);
    
        if (!sorteio) return null;
    
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-3xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Mídia Gerada por IA</h3>
                        <button onClick={onClose}><X/></button>
                    </div>
                    {isLoading ? <div className="flex justify-center p-12"><Loader className="animate-spin" /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h4 className="font-semibold mb-2">Texto para Post</h4>
                                <div className="relative">
                                    <textarea readOnly value={text} rows={12} className="w-full admin-input bg-black text-sm"/>
                                    <button onClick={() => navigator.clipboard.writeText(text)} className="absolute top-2 right-2 p-1.5 bg-zinc-800 rounded hover:bg-zinc-700"><Copy size={14}/></button>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Banner Gerado</h4>
                                <img src={imageUrl} alt="Banner do Sorteio" className="w-full rounded border border-zinc-700"/>
                                <a href={imageUrl} download={`sorteio_${sorteio.id.substring(0,5)}.png`} className="mt-2 w-full bg-green-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                                    <Download size={16}/> Baixar Imagem
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    return (
        <div>
            <SorteioModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} sorteio={editingSorteio} />
            <MediaModal sorteio={sorteioForMedia} onClose={() => setSorteioForMedia(null)} showToast={showToast} />
            <div className="admin-card">
                <div className="admin-card-header flex justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Gift/> Sorteios</h2>
                    <button onClick={() => handleOpenModal(null)} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400">
                        <Plus size={18} className="mr-2"/> Criar Sorteio
                    </button>
                </div>
                <div className="admin-card-content">
                    {loading ? <Loader className="animate-spin" /> : (
                        <div className="space-y-3">
                            {sorteios.map(s => (
                                <div key={s.id} className="bg-black/40 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusStyles[s.status]}`}>{s.status}</span>
                                            <h4 className="font-bold text-lg text-white">{s.titulo}</h4>
                                        </div>
                                        <p className="text-sm text-zinc-400"><strong>Prêmio:</strong> {s.premio}</p>
                                        <p className="text-xs text-zinc-500">
                                            {s.dataInicio.toDate().toLocaleDateString()} a {s.dataFim.toDate().toLocaleDateString()} | {s.tipo === 'automatico_por_venda' ? 'Por Venda' : 'Por Cliente'}
                                        </p>
                                        {s.status === 'finalizado' && (
                                            <p className="text-sm font-bold text-yellow-400 mt-2 flex items-center gap-2">
                                                <Award size={16}/> Ganhador: {s.clientePremiadoNome}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 self-end md:self-center">
                                        {s.status === 'ativo' && <button onClick={() => handleDraw(s)} className="text-sm font-bold bg-green-600 text-white px-3 py-2 rounded-md">Realizar Sorteio</button>}
                                        {s.status === 'finalizado' && <button onClick={() => { setSorteioForMedia(s); setIsMediaModalOpen(true); }} className="text-sm font-bold bg-purple-600 text-white px-3 py-2 rounded-md flex items-center gap-1"><Zap size={14}/> Gerar Mídia</button>}
                                        <a href={`/#/sorteio/${s.id}?storeId=${storeId}`} target="_blank" className="text-sm font-bold bg-zinc-700 text-white px-3 py-2 rounded-md">Ver Página</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SorteiosPanel;
