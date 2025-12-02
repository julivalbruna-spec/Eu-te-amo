
import React, { useState, useEffect } from 'react';
import { db, getCollectionRef, getDocRef } from '../../../firebase';
import firebase from 'firebase/compat/app';
import { GoogleGenAI, Type } from '@google/genai';
import { Cpu, Loader, Zap, MessageSquare, BookOpen, AlertCircle, CheckCircle, RotateCcw, User, MessageCircle, Clock, ArrowRight, Copy, Check } from 'react-feather';
import { ChatMessage, ChatbotLearning, KB_Item } from '../../../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface ChatAnalysisPanelProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string;
}

interface ConversationSummary {
    id: string;
    sessionId?: string;
    lastMessageAt: any;
    messageCount?: number;
    analysisStatus?: 'pending' | 'completed';
}

const ChatAnalysisPanel: React.FC<ChatAnalysisPanelProps> = ({ showToast, storeId }) => {
    const [activeTab, setActiveTab] = useState<'history' | 'learnings'>('history');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzingSingle, setIsAnalyzingSingle] = useState(false);
    
    // Learnings State
    const [learnings, setLearnings] = useState<ChatbotLearning[]>([]);
    const [history, setHistory] = useState<ChatbotLearning[]>([]);
    
    // Conversations History State
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [selectedMessages, setSelectedMessages] = useState<ChatMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    useEffect(() => {
        if(!storeId) return;
        // Fetch Learnings History
        const unsubLearnings = getCollectionRef('chatbot_learnings_history', storeId)
            .orderBy('appliedAt', 'desc')
            .limit(20)
            .onSnapshot(snap => {
                const historyData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatbotLearning));
                setHistory(historyData);
            }, err => console.error("Error fetching learnings history:", err));

        // Fetch Conversations Summary
        const unsubConversations = getCollectionRef('conversas', storeId)
            .orderBy('lastMessageAt', 'desc')
            .limit(50)
            .onSnapshot(snap => {
                const convs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversationSummary));
                setConversations(convs);
            }, err => console.error("Error fetching conversations:", err));

        return () => {
            unsubLearnings();
            unsubConversations();
        };
    }, [storeId]);

    useEffect(() => {
        if (selectedConversationId) {
            setLoadingMessages(true);
            const fetchMessages = async () => {
                try {
                    const snap = await getDocRef('conversas', selectedConversationId, storeId).collection('messages').orderBy('createdAt', 'asc').get();
                    const msgs = snap.docs.map(doc => doc.data() as ChatMessage);
                    setSelectedMessages(msgs);
                } catch (error) {
                    console.error("Error fetching messages:", error);
                    showToast("Erro ao carregar mensagens.", 'error');
                } finally {
                    setLoadingMessages(false);
                }
            };
            fetchMessages();
        } else {
            setSelectedMessages([]);
        }
    }, [selectedConversationId, storeId]);

    // --- CORE ANALYSIS LOGIC ---
    const executeAnalysis = async (conversationsToAnalyze: { id: string, messages: ChatMessage[] }[]) => {
        let allMessagesText = '';
        
        conversationsToAnalyze.forEach(conv => {
            if(conv.messages.length < 2) return;
            allMessagesText += `--- CONVERSA ID: ${conv.id} ---\n`;
            conv.messages.forEach(m => { 
                const safeText = (m.text || '').replace(/\n/g, ' ');
                allMessagesText += `${m.role.toUpperCase()}: ${safeText}\n`; 
            });
            allMessagesText += `--- FIM DA CONVERSA ---\n\n`;
        });

        if (!allMessagesText.trim()) {
            throw new Error("Nenhum conteúdo de conversa válido para analisar.");
        }

        const prompt = `
        Você é um "Gerente de Sucesso do Cliente" especialista em E-commerce.
        Analise o log de conversas de um chatbot de vendas (iPhone/Eletrônicos) e gere aprendizados estratégicos.

        **Tarefas:**
        1.  **KNOWLEDGE_GAP**: O cliente fez uma pergunta específica sobre um produto, serviço ou regra que o bot NÃO soube responder ou respondeu genericamente? Crie um item para a KB.
        2.  **TONE_IMPROVEMENT**: O bot foi rude, robótico demais ou muito longo? Sugira uma regra para o prompt.
        3.  **SALES_OPPORTUNITY**: Uma venda foi perdida por objeção de preço ou falta de confiança? Crie uma FAQ para quebrar essa objeção na próxima.

        Retorne um ARRAY JSON. Cada item deve ter: "type", "description" (explicando o problema encontrado), "correctionPayload" (com os dados para corrigir), e "sourceConversationId" (Use o ID fornecido no texto).

        **LOGS DE CONVERSAS:**
        ${allMessagesText}
        `;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    correctionPayload: { 
                        type: Type.OBJECT, 
                        properties: {
                            kbItem: { type: Type.OBJECT, properties: { titulo: {type: Type.STRING}, categoria: {type: Type.STRING}, conteudo: {type: Type.STRING} } },
                            faqItem: { type: Type.OBJECT, properties: { pergunta: {type: Type.STRING}, resposta: {type: Type.STRING} } },
                            configUpdate: { type: Type.OBJECT, properties: { configId: {type: Type.STRING}, suggestion: {type: Type.STRING} } }
                        }
                    },
                    sourceConversationId: { type: Type.STRING },
                },
                required: ['type', 'description', 'correctionPayload']
            }
        };
        
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-pro-preview', 
            contents: prompt,
            config: { 
                responseMimeType: 'application/json', 
                responseSchema,
                thinkingConfig: { thinkingBudget: 2048 } 
            }
        });
        
        return JSON.parse(response.text) as Omit<ChatbotLearning, 'id'|'status'>[];
    };

    const markConversationsAsAnalyzed = async (ids: string[]) => {
        const batch = db.batch();
        ids.forEach(id => {
            const ref = getDocRef('conversas', id, storeId);
            batch.update(ref, { analysisStatus: 'completed' });
        });
        await batch.commit();
    };

    // --- BATCH ANALYSIS (NEW CHATS ONLY) ---
    const handleAnalyzeNew = async () => {
        setIsLoading(true);
        try {
            // Filter conversations that are NOT analyzed yet
            const pendingConversations = conversations.filter(c => c.analysisStatus !== 'completed');

            if (pendingConversations.length === 0) {
                showToast("Todas as conversas recentes já foram analisadas!", 'success');
                setIsLoading(false);
                return;
            }

            const limit = 10; // Batch limit to avoid token overflow
            const batchToAnalyze = pendingConversations.slice(0, limit);
            
            const convsWithMessages = [];

            for (const convSummary of batchToAnalyze) {
                const messagesSnapshot = await getDocRef('conversas', convSummary.id, storeId).collection('messages').orderBy('createdAt', 'asc').get();
                if (!messagesSnapshot.empty) {
                    const messages = messagesSnapshot.docs.map(d => d.data() as ChatMessage);
                    convsWithMessages.push({ id: convSummary.id, messages });
                }
            }

            if (convsWithMessages.length === 0) {
                showToast("Conversas vazias ignoradas.", 'error');
                setIsLoading(false);
                return;
            }

            const results = await executeAnalysis(convsWithMessages);
            
            if (results.length > 0) {
                setLearnings(prev => [...results.map(r => ({ ...r, id: Math.random().toString(36).substring(2,9), status: 'pending' as const })), ...prev]);
                showToast(`${results.length} novos aprendizados gerados!`, 'success');
                setActiveTab('learnings');
            } else {
                showToast("IA analisou e não encontrou problemas nas novas conversas.", 'success');
            }

            await markConversationsAsAnalyzed(convsWithMessages.map(c => c.id));

        } catch (error) {
            console.error(error);
            showToast("Erro ao analisar conversas.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- SINGLE CONVERSATION ANALYSIS ---
    const handleAnalyzeSingleConversation = async () => {
        if (!selectedConversationId || selectedMessages.length === 0) return;
        setIsAnalyzingSingle(true);
        try {
            const results = await executeAnalysis([{ id: selectedConversationId, messages: selectedMessages }]);
            
            if (results.length > 0) {
                setLearnings(prev => [...results.map(r => ({ ...r, id: Math.random().toString(36).substring(2,9), status: 'pending' as const })), ...prev]);
                showToast("Análise concluída! Verifique a aba de Aprendizados.", 'success');
                setActiveTab('learnings');
            } else {
                showToast("Esta conversa parece perfeita. Nenhuma ação sugerida.", 'success');
            }
            
            await markConversationsAsAnalyzed([selectedConversationId]);

        } catch (error) {
            console.error(error);
            showToast("Erro ao analisar esta conversa.", 'error');
        } finally {
            setIsAnalyzingSingle(false);
        }
    };

    const handleApplyLearning = async (learning: ChatbotLearning) => {
        let createdDocId: string | undefined = undefined;
        try {
            if (learning.type === 'KNOWLEDGE_GAP' && learning.correctionPayload.kbItem) {
                const newItem = {
                    ...learning.correctionPayload.kbItem,
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                };
                const docRef = await getCollectionRef('kb_chatbot', storeId).add(newItem);
                createdDocId = docRef.id;
            } else if (learning.type === 'SALES_OPPORTUNITY' && learning.correctionPayload.faqItem) {
                 const newItem = {
                    ...learning.correctionPayload.faqItem,
                    origem: 'sugerido_aprovado',
                    tags: [],
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                };
                const docRef = await getCollectionRef('faq_oficial', storeId).add(newItem);
                createdDocId = docRef.id;
            } else if (learning.type === 'TONE_IMPROVEMENT') {
                 // Tone improvements are manual for now, just mark as applied to move to history
                 showToast("Sugestão de tom copiada/visualizada. Marque como aplicada após ajustar o prompt.", 'success');
            }

            const historyItem: ChatbotLearning = {
                ...learning,
                status: 'applied',
                appliedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdDocId: createdDocId
            };
            await getCollectionRef('chatbot_learnings_history', storeId).add(historyItem);
            
            setLearnings(prev => prev.filter(l => l.id !== learning.id));
            if (learning.type !== 'TONE_IMPROVEMENT') {
                showToast("Aprendizado aplicado e salvo no banco!", 'success');
            }

        } catch (error) {
            showToast("Erro ao aplicar aprendizado.", 'error');
        }
    };
    
    const handleRevertLearning = async (learning: ChatbotLearning) => {
        if (!learning.createdDocId || !learning.id) return;
        
        try {
            if (learning.type === 'KNOWLEDGE_GAP') {
                await getDocRef('kb_chatbot', learning.createdDocId, storeId).delete();
            } else if (learning.type === 'SALES_OPPORTUNITY') {
                await getDocRef('faq_oficial', learning.createdDocId, storeId).delete();
            }
            
            await getDocRef('chatbot_learnings_history', learning.id, storeId).update({
                status: 'reverted',
                revertedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast("Ação revertida com sucesso!", 'success');
        } catch (error) {
            showToast("Erro ao reverter ação.", 'error');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Copiado para área de transferência!", 'success');
    };

    const getIcon = (type: ChatbotLearning['type']) => {
        switch(type) {
            case 'KNOWLEDGE_GAP': return <BookOpen className="text-blue-400" />;
            case 'TONE_IMPROVEMENT': return <MessageSquare className="text-yellow-400" />;
            case 'SALES_OPPORTUNITY': return <Zap className="text-green-400" />;
            default: return <Cpu />;
        }
    };
    
    const getActionLabel = (type: ChatbotLearning['type']) => {
         switch(type) {
            case 'KNOWLEDGE_GAP': return "Adicionar à KB";
            case 'SALES_OPPORTUNITY': return "Criar FAQ";
            case 'TONE_IMPROVEMENT': return "Manual (Config)";
            default: return "Aplicar";
        }
    };
    
    const getDestinationInfo = (type: ChatbotLearning['type']) => {
         switch(type) {
            case 'KNOWLEDGE_GAP': return "Implementar em: Base de Conhecimento";
            case 'SALES_OPPORTUNITY': return "Implementar em: FAQ Oficial";
            case 'TONE_IMPROVEMENT': return "Implementar em: Treinamento da IA (Prompt)";
            default: return "";
        }
    };

    // Count pending conversations
    const pendingCount = conversations.filter(c => c.analysisStatus !== 'completed').length;

    return (
        <div className="space-y-6">
            <div className="flex border-b border-[#27272a]">
                <button onClick={() => setActiveTab('history')} className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}`}>
                    Histórico de Conversas
                </button>
                <button onClick={() => setActiveTab('learnings')} className={`px-6 py-3 text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'learnings' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-white'}`}>
                    Aprendizados da IA
                    {learnings.length > 0 && <span className="bg-yellow-500 text-black text-[10px] px-1.5 rounded-full">{learnings.length}</span>}
                </button>
            </div>

            {/* --- ABA HISTÓRICO --- */}
            {activeTab === 'history' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Lista de Conversas */}
                    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg flex flex-col overflow-hidden">
                        <div className="p-3 bg-black border-b border-[#27272a] flex justify-between items-center">
                            <h3 className="font-bold text-gray-300 flex items-center gap-2"><User size={16}/> Sessões</h3>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">{pendingCount} não analisadas</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversationId(conv.id)}
                                    className={`w-full text-left p-3 rounded-md text-sm transition-colors flex justify-between items-center ${selectedConversationId === conv.id ? 'bg-blue-900/20 border border-blue-500/50 text-white' : 'bg-black border border-transparent hover:bg-gray-900 text-gray-400'}`}
                                >
                                    <div>
                                        <p className="font-semibold">Cliente (IP: {(conv.sessionId || conv.id).substring(0,6)})</p>
                                        <p className="text-xs opacity-60">{conv.lastMessageAt?.toDate().toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         {conv.analysisStatus === 'completed' ? (
                                             <div title="Já analisado pela IA">
                                                 <CheckCircle size={14} className="text-green-500"/>
                                             </div>
                                         ) : (
                                             <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Pendente de Análise"></div>
                                         )}
                                        <MessageCircle size={16} className={selectedConversationId === conv.id ? 'text-blue-400' : 'opacity-30'} />
                                    </div>
                                </button>
                            ))}
                            {conversations.length === 0 && <p className="text-gray-500 text-center p-4">Nenhuma conversa encontrada.</p>}
                        </div>
                    </div>

                    {/* Visualizador de Mensagens */}
                    <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#27272a] rounded-lg flex flex-col overflow-hidden relative">
                        <div className="p-3 bg-black border-b border-[#27272a] flex justify-between items-center">
                            <h3 className="font-bold text-gray-300">Transcript</h3>
                            <div className="flex items-center gap-3">
                                {selectedConversationId && (
                                    <button 
                                        onClick={handleAnalyzeSingleConversation} 
                                        disabled={isAnalyzingSingle}
                                        className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-bold px-3 py-1.5 rounded border border-blue-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {isAnalyzingSingle ? <Loader size={12} className="animate-spin"/> : <Zap size={12}/>}
                                        Analisar esta Conversa
                                    </button>
                                )}
                                {selectedConversationId && <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">ID: {selectedConversationId.substring(0,8)}</span>}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0e0e0e] custom-scrollbar">
                            {!selectedConversationId ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <MessageSquare size={48} strokeWidth={1} />
                                    <p className="mt-2">Selecione uma conversa ao lado para ver os detalhes.</p>
                                </div>
                            ) : loadingMessages ? (
                                <div className="h-full flex items-center justify-center"><Loader className="animate-spin text-blue-500"/></div>
                            ) : selectedMessages.length > 0 ? (
                                selectedMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-900/30 border border-blue-800/50 text-blue-100 rounded-br-none' : 'bg-[#1f1f1f] border border-[#333] text-gray-300 rounded-bl-none'}`}>
                                            <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text }} />
                                            <div className="flex justify-end mt-1">
                                                <span className="text-[10px] opacity-40 flex items-center gap-1">
                                                    {msg.role === 'assistant' ? <Cpu size={10}/> : <User size={10}/>} 
                                                    {msg.createdAt?.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">Nenhuma mensagem nesta conversa.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ABA APRENDIZADOS --- */}
            {activeTab === 'learnings' && (
                <div className="space-y-6">
                    <div className="admin-card">
                        <div className="admin-card-header"><h2 className="text-xl font-bold flex items-center gap-2"><Cpu size={22} className="text-yellow-500"/> Motor de Análise (Gemini 3 Pro)</h2></div>
                        <div className="admin-card-content">
                            <p className="text-gray-400 mb-4">
                                A IA analisará apenas as <strong>{pendingCount} conversas</strong> que ainda não foram processadas em busca de oportunidades de venda perdidas, dúvidas não respondidas e problemas de tom.
                            </p>
                            <button 
                                onClick={handleAnalyzeNew} 
                                disabled={isLoading || pendingCount === 0} 
                                className="flex items-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
                            >
                                {isLoading ? <Loader size={18} className="animate-spin" /> : <Cpu size={18} />}
                                {isLoading ? 'Processando Novos Chats...' : `Executar Análise (${pendingCount} pendentes)`}
                            </button>
                        </div>
                    </div>
                    
                    {learnings.length > 0 && (
                        <div className="admin-card border border-yellow-500/20">
                            <div className="admin-card-header"><h3 className="text-lg font-semibold text-yellow-400">Sugestões de Melhoria Pendentes</h3></div>
                            <div className="admin-card-content space-y-4">
                                {learnings.map(l => (
                                    <div key={l.id} className="bg-black p-4 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors relative overflow-hidden">
                                        {/* Destino Indicator */}
                                        <div className="absolute top-0 right-0 bg-gray-900 text-gray-500 text-[10px] px-2 py-1 rounded-bl-lg border-b border-l border-gray-800">
                                            {getDestinationInfo(l.type)}
                                        </div>

                                        <div className="flex items-start gap-3 mt-2">
                                            {getIcon(l.type)}
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                     <p className="font-bold text-gray-200 mb-1">{l.type.replace('_', ' ')}</p>
                                                     {l.sourceConversationId && <span className="text-[10px] text-gray-600 font-mono px-2">Chat ID: {l.sourceConversationId.substring(0, 6)}</span>}
                                                </div>
                                                <p className="text-sm text-gray-400 mb-3">{l.description}</p>
                                                
                                                {/* Payload Previews */}
                                                {l.correctionPayload.faqItem && (
                                                    <div className="bg-gray-900/50 p-3 rounded text-xs text-gray-300 mb-3 border border-gray-800">
                                                        <p className="font-bold text-gray-500 mb-1">Conteúdo Sugerido:</p>
                                                        <p><strong>P:</strong> {l.correctionPayload.faqItem.pergunta}</p>
                                                        <p className="mt-1"><strong>R:</strong> {l.correctionPayload.faqItem.resposta}</p>
                                                    </div>
                                                )}
                                                {l.correctionPayload.kbItem && (
                                                    <div className="bg-gray-900/50 p-3 rounded text-xs text-gray-300 mb-3 border border-gray-800">
                                                        <p className="font-bold text-gray-500 mb-1">Nova Entrada na KB:</p>
                                                        <p><strong>Título:</strong> {l.correctionPayload.kbItem.titulo}</p>
                                                        <p className="mt-1 truncate"><strong>Conteúdo:</strong> {l.correctionPayload.kbItem.conteudo}</p>
                                                    </div>
                                                )}
                                                 {l.correctionPayload.configUpdate && (
                                                    <div className="bg-gray-900/50 p-3 rounded text-xs text-gray-300 mb-3 border border-gray-800 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-gray-500 mb-1">Sugestão de Prompt:</p>
                                                            <p className="italic">"{l.correctionPayload.configUpdate.suggestion}"</p>
                                                        </div>
                                                        <button onClick={() => copyToClipboard(l.correctionPayload.configUpdate?.suggestion || '')} className="p-2 hover:bg-gray-700 rounded text-gray-400"><Copy size={14}/></button>
                                                    </div>
                                                )}
                                                
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => setLearnings(p => p.filter(i => i.id !== l.id))} className="text-sm font-semibold text-gray-500 hover:text-white transition-colors">Dispensar</button>
                                                    
                                                    <button 
                                                        onClick={() => handleApplyLearning(l)} 
                                                        className={`text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-md border transition-colors ${l.type === 'TONE_IMPROVEMENT' ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 border-yellow-900/50' : 'text-green-500 hover:text-green-400 bg-green-900/20 border-green-900/50'}`}
                                                    >
                                                        {l.type === 'TONE_IMPROVEMENT' ? <Check size={16}/> : <CheckCircle size={16}/>} 
                                                        {l.type === 'TONE_IMPROVEMENT' ? 'Marcar como Feito' : getActionLabel(l.type)}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                     <div className="admin-card">
                        <div className="admin-card-header"><h3 className="text-lg font-semibold text-gray-400">Histórico de Ações Automáticas</h3></div>
                        <div className="admin-card-content">
                            {history.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                    {history.map(h => (
                                        <div key={h.id} className={`p-3 rounded-md flex justify-between items-center ${h.status === 'reverted' ? 'bg-red-900/10 border border-red-900/30' : 'bg-black border border-gray-800'}`}>
                                            <div className="flex items-center gap-3">
                                                {h.status === 'reverted' ? <AlertCircle size={18} className="text-red-500"/> : <CheckCircle size={18} className="text-green-500"/>}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-300">{h.description}</p>
                                                    <p className="text-xs text-gray-600 flex items-center gap-1"><Clock size={10}/> {h.appliedAt?.toDate().toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            {h.status === 'applied' && h.type !== 'TONE_IMPROVEMENT' && (
                                                <button onClick={() => handleRevertLearning(h)} className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 bg-red-900/10 px-2 py-1 rounded hover:bg-red-900/20"><RotateCcw size={12}/> Desfazer</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-center text-gray-600 py-8 italic">Nenhuma ação automática registrada.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatAnalysisPanel;
