
import React, { useState, useEffect } from 'react';
import { db, getCollectionRef, getDocRef } from '../../../firebase';
import firebase from 'firebase/compat/app';
import { FAQ_Oficial, FAQ_Sugestao, SiteInfo, Category } from '../../../types';
import { Plus, Edit2, Trash2, X, Save, HelpCircle, Check, ThumbsUp, ThumbsDown, Cpu, Loader, RefreshCw } from 'react-feather';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface FaqManagerPanelProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string;
}

const FaqManagerPanel: React.FC<FaqManagerPanelProps> = ({ showToast, storeId }) => {
    const [faqs, setFaqs] = useState<FAQ_Oficial[]>([]);
    const [sugestoes, setSugestoes] = useState<FAQ_Sugestao[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Partial<FAQ_Oficial> | null>(null);
    
    // AI Generation State
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if(!storeId) return;
        const unsubFaqs = getCollectionRef('faq_oficial', storeId).orderBy('atualizadoEm', 'desc').onSnapshot(snapshot => {
            setFaqs(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })) as FAQ_Oficial[]);
        });
        const unsubSugestoes = getCollectionRef('faq_sugestoes', storeId).where('status', '==', 'pendente').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            setSugestoes(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })) as FAQ_Sugestao[]);
            setLoading(false);
        });
        return () => {
            unsubFaqs();
            unsubSugestoes();
        };
    }, [storeId]);
    
    const handleOpenModal = (faq: Partial<FAQ_Oficial> | null = null) => {
        setEditingFaq(faq ? { ...faq } : { pergunta: '', resposta: '', tags: [] });
        setIsModalOpen(true);
    };

    const handleSaveFaq = async () => {
        if (!editingFaq || !editingFaq.pergunta || !editingFaq.resposta) {
            showToast("Pergunta e Resposta são obrigatórias.", 'error');
            return;
        }
        const dataToSave = {
            ...editingFaq,
            tags: typeof editingFaq.tags === 'string' ? (editingFaq.tags as string).split(',').map(t => t.trim()) : editingFaq.tags,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        delete dataToSave.docId;

        try {
            if (editingFaq.docId) {
                await getDocRef('faq_oficial', editingFaq.docId, storeId).update(dataToSave);
                showToast("FAQ atualizado!", 'success');
            } else {
                await getCollectionRef('faq_oficial', storeId).add({ ...dataToSave, origem: 'manual' });
                showToast("FAQ adicionado!", 'success');
            }
            setIsModalOpen(false);
        } catch (error) { showToast("Erro ao salvar FAQ.", 'error'); }
    };

    const handleDeleteFaq = async (docId: string) => {
        if (window.confirm('Tem certeza?')) {
            await getDocRef('faq_oficial', docId, storeId).delete();
            showToast("FAQ excluído.", 'success');
        }
    };
    
    const handleApproveSugestao = async (sugestao: FAQ_Sugestao) => {
        const newFaq: Omit<FAQ_Oficial, 'id'|'docId'> = {
            pergunta: sugestao.perguntaRealDoCliente,
            resposta: sugestao.respostaSugeridaIA,
            tags: [],
            origem: 'sugerido_aprovado',
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            const batch = db.batch();
            const newFaqRef = getCollectionRef('faq_oficial', storeId).doc();
            batch.set(newFaqRef, newFaq);
            const sugestaoRef = getDocRef('faq_sugestoes', sugestao.docId!, storeId);
            batch.update(sugestaoRef, { status: 'aprovada' });
            await batch.commit();
            showToast("Sugestão aprovada e adicionada ao FAQ!", 'success');
        } catch (error) { showToast("Erro ao aprovar sugestão.", 'error'); }
    };

    const handleRejectSugestao = async (docId: string) => {
        await getDocRef('faq_sugestoes', docId, storeId).update({ status: 'rejeitada' });
        showToast("Sugestão rejeitada.", 'success');
    };

    const handleGenerateEssentialFaqs = async () => {
        setIsGenerating(true);
        try {
            // 1. Buscar Contexto da Loja
            const [siteInfoSnap, categoriesSnap] = await Promise.all([
                getDocRef('settings', 'siteInfo', storeId).get(),
                getCollectionRef('categories', storeId).orderBy('order').get()
            ]);
            
            const siteInfo = siteInfoSnap.data() as SiteInfo;
            const categories = categoriesSnap.docs.map(d => d.data().name).join(', ');

            if (!siteInfo) {
                showToast("Erro: Configurações da loja não encontradas.", 'error');
                return;
            }

            // 2. Construir Prompt para Gemini 3 Pro
            const prompt = `
                Você é um Gerente de E-commerce experiente.
                Crie uma lista de 6 a 10 Perguntas Frequentes (FAQ) essenciais e altamente úteis para esta loja, baseando-se EXATAMENTE nos dados fornecidos.
                
                **DADOS DA LOJA:**
                - Nome: ${siteInfo.storeName}
                - Endereço: ${siteInfo.address.replace(/<br \/>/g, ' ')}
                - Horários: ${siteInfo.hoursWeek} | Sábado: ${siteInfo.hoursSaturday}
                - Taxas de Cartão: Débito (+${(siteInfo.rates.debit * 100).toFixed(1)}%), Crédito (${Object.keys(siteInfo.rates.credit).length}x opções, ex: 12x tem juros de ${(siteInfo.rates.credit[12] * 100).toFixed(1)}%).
                - Categorias de Produtos: ${categories}
                - Contato: WhatsApp ${siteInfo.links.whatsappSales}
                
                **REGRAS:**
                1. Crie perguntas sobre: Formas de Pagamento, Localização/Horário, Garantia (assuma 3 meses para seminovos se não especificado), Entregas (se local) e Procedência (Novos/Seminovos).
                2. As respostas devem ser diretas, educadas e em primeira pessoa ("Nós aceitamos...", "Estamos localizados...").
                3. Se os dados indicarem juros no parcelamento, deixe claro na resposta sobre pagamento ("Parcelamos em até 12x com pequeno acréscimo").
                4. Retorne APENAS um JSON array.

                Schema esperado:
                [
                  { "pergunta": "...", "resposta": "...", "tags": ["tag1", "tag2"] }
                ]
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pergunta: { type: Type.STRING },
                                resposta: { type: Type.STRING },
                                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ['pergunta', 'resposta', 'tags']
                        }
                    }
                }
            });

            const generatedFaqs = JSON.parse(response.text) as Partial<FAQ_Oficial>[];

            if (generatedFaqs.length > 0) {
                const batch = db.batch();
                generatedFaqs.forEach(faq => {
                    const docRef = getCollectionRef('faq_oficial', storeId).doc();
                    batch.set(docRef, {
                        ...faq,
                        origem: 'sugerido_aprovado', // Marcamos como aprovado pois foi gerado com dados confiáveis
                        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                showToast(`${generatedFaqs.length} FAQs gerados e adicionados com sucesso!`, 'success');
            } else {
                showToast("Nenhum FAQ gerado.", 'error');
            }

        } catch (error) {
            console.error("Erro ao gerar FAQs:", error);
            showToast("Erro ao gerar FAQs com IA.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="space-y-6">
            {/* Modal */}
            {isModalOpen && editingFaq && (
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                            <h3 className="text-xl font-bold">{editingFaq.docId ? 'Editar' : 'Adicionar'} FAQ</h3>
                            <button onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <textarea value={editingFaq.pergunta} onChange={e => setEditingFaq(p => ({...p, pergunta: e.target.value}))} rows={2} placeholder="Pergunta" className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                            <textarea value={editingFaq.resposta} onChange={e => setEditingFaq(p => ({...p, resposta: e.target.value}))} rows={5} placeholder="Resposta" className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                            <input value={Array.isArray(editingFaq.tags) ? editingFaq.tags.join(', ') : editingFaq.tags} onChange={e => setEditingFaq(p => ({...p, tags: e.target.value as any}))} placeholder="Tags (separadas por vírgula)" className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                        </div>
                        <div className="p-4 mt-auto border-t border-[#27272a] flex justify-end">
                            <button onClick={handleSaveFaq} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400"><Save className="mr-2" size={18}/>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Sugestões */}
             <div className="admin-card">
                <div className="admin-card-header"><h2 className="text-xl font-bold">Sugestões de FAQ da IA</h2></div>
                <div className="admin-card-content">
                    <p className="text-gray-400 mb-4">Analise as perguntas que o chatbot não soube responder e aprove as sugestões da IA para ensiná-lo.</p>
                     {loading ? <p>Carregando...</p> : sugestoes.length > 0 ? (
                         <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                            {sugestoes.map(s => (
                                <div key={s.docId} className="bg-black p-4 rounded-lg border border-[#27272a]">
                                    <p className="text-sm text-gray-400">"{s.perguntaRealDoCliente}"</p>
                                    <p className="mt-2 p-3 bg-gray-800/50 rounded text-sm"><strong>Sugestão da IA:</strong> {s.respostaSugeridaIA}</p>
                                    <div className="flex justify-end gap-3 mt-3">
                                        <button onClick={() => handleRejectSugestao(s.docId!)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-semibold"><ThumbsDown size={16}/> Rejeitar</button>
                                        <button onClick={() => handleApproveSugestao(s)} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 font-semibold"><ThumbsUp size={16}/> Aprovar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : <p className="text-center text-gray-500 py-4">Nenhuma nova sugestão pendente.</p>}
                </div>
            </div>

            {/* FAQ Oficial */}
            <div className="admin-card">
                <div className="admin-card-header"><h2 className="text-xl font-bold flex items-center gap-2"><HelpCircle /> FAQ Oficial</h2></div>
                <div className="admin-card-content">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-400 text-sm max-w-md">Perguntas e respostas oficiais que o chatbot usa como "Verdade Absoluta".</p>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleGenerateEssentialFaqs} 
                                disabled={isGenerating}
                                className="flex items-center bg-purple-600/20 border border-purple-500/30 text-purple-400 font-bold py-2 px-4 rounded-lg hover:bg-purple-600/40 transition-colors disabled:opacity-50"
                            >
                                {isGenerating ? <Loader className="mr-2 animate-spin" size={18}/> : <Cpu className="mr-2" size={18}/>} 
                                {isGenerating ? 'Gerando...' : 'Gerar FAQs com IA'}
                            </button>
                            <button onClick={() => handleOpenModal(null)} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400">
                                <Plus className="mr-2" size={20}/> Adicionar
                            </button>
                        </div>
                    </div>
                     {loading ? <p>Carregando...</p> : (
                         <div className="space-y-2">
                            {faqs.map(faq => (
                                <div key={faq.docId} className="bg-black p-3 rounded-md border border-[#27272a] flex justify-between items-center group hover:border-zinc-700 transition-colors">
                                    <div className="max-w-[80%]">
                                        <p className="font-semibold text-zinc-200">{faq.pergunta}</p>
                                        <p className="text-sm text-gray-500 truncate mt-1">{faq.resposta}</p>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(faq)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDeleteFaq(faq.docId!)} className="text-zinc-400 hover:text-red-500 p-2 hover:bg-zinc-800 rounded"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                            {faqs.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma pergunta cadastrada.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaqManagerPanel;
