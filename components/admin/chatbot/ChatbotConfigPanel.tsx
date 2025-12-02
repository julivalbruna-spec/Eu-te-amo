
import React, { useState, useEffect } from 'react';
import { db, getDocRef, getCollectionRef } from '../../../firebase';
import firebase from 'firebase/compat/app';
import { ChatbotConfig, SiteInfo, ChatbotVersion } from '../../../types';
import { Save, Loader, Cpu, BookOpen, MessageSquare, Zap, Sliders, AlertTriangle, CheckCircle, Activity, RefreshCw, Search, Tool, Gift, Clock, RotateCcw, Eye, Play, BarChart2, ThumbsUp, ThumbsDown, PlusCircle, ArrowRight, Lock, X } from 'react-feather';
import { GoogleGenAI, Type } from '@google/genai';
import { 
    generateChatbotLogic, 
    regenerateUpsellMatrix, 
    detectStoreChanges, 
    LogicGenerationMode
} from '../../../utils/chatbotLogicGenerator';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface ChatbotConfigPanelProps {
    storeId: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    siteInfo: SiteInfo;
}

const ChatbotConfigPanel: React.FC<ChatbotConfigPanelProps> = ({ showToast, siteInfo, storeId }) => {
    const [config, setConfig] = useState<ChatbotConfig | null>(null);
    const [versions, setVersions] = useState<ChatbotVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'testing' | 'metrics'>('editor');
    const [comparisonVersion, setComparisonVersion] = useState<ChatbotVersion | null>(null);
    
    // Rule Injection State
    const [newRule, setNewRule] = useState('');
    const [isInjecting, setIsInjecting] = useState(false);

    // Testing State
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    // Security Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        mode: LogicGenerationMode | null;
        step: number; // 1 or 2 (for double confirmation)
    }>({ isOpen: false, mode: null, step: 1 });
    const [confirmInput, setConfirmInput] = useState('');

    useEffect(() => {
        if(!storeId) return;
        const fetchConfig = async () => {
            try {
                const doc = await getDocRef('chatbot_config', 'cliente_publico', storeId).get();
                if (doc.exists) {
                    setConfig({ id: doc.id, ...doc.data() } as ChatbotConfig);
                }
                
                const versionsSnap = await db.collection('stores').doc(storeId).collection('chatbot_config')
                    .doc('cliente_publico')
                    .collection('versions')
                    .orderBy('createdAt', 'desc')
                    .limit(20)
                    .get();
                
                setVersions(versionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatbotVersion)));
                
            } catch (error) {
                console.error("Error fetching config:", error);
                showToast("Erro ao carregar configuração.", 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [storeId]);

    // --- ACTION HANDLERS ---

    const handleOpenActionModal = (mode: LogicGenerationMode) => {
        setModalConfig({ isOpen: true, mode, step: 1 });
        setConfirmInput('');
    };

    const handleCloseModal = () => {
        setModalConfig({ isOpen: false, mode: null, step: 1 });
        setConfirmInput('');
    };

    const handleConfirmStep1 = () => {
        if (modalConfig.mode === 'generate') {
            if (confirmInput.toUpperCase() !== 'RESETAR') {
                showToast('Digite "RESETAR" corretamente para continuar.', 'error');
                return;
            }
            setModalConfig(prev => ({ ...prev, step: 2 }));
        } else {
            // For other modes, step 1 is the only confirmation needed
            executeGeneration(modalConfig.mode!);
            handleCloseModal();
        }
    };

    const handleConfirmStep2 = () => {
        if (modalConfig.mode === 'generate') {
            executeGeneration('generate');
            handleCloseModal();
        }
    };

    const executeGeneration = async (mode: LogicGenerationMode) => {
        setIsGenerating(true);
        try {
            if (mode === 'update') {
                const changes = await detectStoreChanges(storeId);
                if (!changes.hasChanges) {
                     // Just a notification, but we proceed anyway if the user wants to force sync
                     showToast("Nenhuma mudança crítica detectada, mas forçando sincronização...", 'success');
                }
            }

            const result = await generateChatbotLogic(storeId, mode);

            if (result.success) {
                showToast(result.message, 'success');
                // Refresh config
                const doc = await getDocRef('chatbot_config', 'cliente_publico', storeId).get();
                setConfig({ id: doc.id, ...doc.data() } as ChatbotConfig);
                // Refresh versions
                 const versionsSnap = await db.collection('stores').doc(storeId).collection('chatbot_config').doc('cliente_publico').collection('versions').orderBy('createdAt', 'desc').get();
                setVersions(versionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatbotVersion)));
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast("Erro ao executar Arquiteto de IA.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // --- INJECT RULE LOGIC ---
    const handleInjectRule = async () => {
        if (!newRule.trim() || !config?.systemPrompt) {
            showToast("Digite uma regra para adicionar.", 'error');
            return;
        }
        setIsInjecting(true);
        try {
             const prompt = `
                Você é um **Editor de Texto Cirúrgico** (Gemini 3 Pro).
                Sua missão é INSERIR uma nova regra em um Prompt de Sistema existente, preservando a integridade total do resto do conteúdo.

                --- PROMPT ATUAL (BASE) ---
                ${config.systemPrompt}
                --- FIM PROMPT ATUAL ---

                --- NOVA REGRA A INSERIR ---
                "${newRule}"
                ----------------------------

                **DIRETRIZES ESTRITAS DE SEGURANÇA:**
                1. **NÃO REESCREVA:** Não mude o tom de voz, não resuma e não altere a estrutura geral.
                2. **DADOS INTOCÁVEIS:** Não toque na lista de produtos, preços, taxas ou especificações técnicas. Mantenha-os idênticos byte a byte.
                3. **LOCALIZAÇÃO INTELIGENTE:** Encontre a seção lógica onde essa regra faz mais sentido (ex: se for sobre pagamento, coloque perto das regras de pagamento; se for comportamento, coloque no início).
                4. **FORMATO:** Se o texto usa Markdown ou listas, mantenha o padrão.
                5. **INTEGRAÇÃO:** A nova regra deve parecer que sempre esteve lá.

                **SAÍDA:**
                Retorne APENAS o novo texto completo do prompt atualizado. Nada mais.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt
            });

            let updatedPrompt = response.text?.trim();
            if (updatedPrompt?.startsWith('```')) {
                updatedPrompt = updatedPrompt.replace(/^```.*\n/, '').replace(/```$/, '');
            }

            if (updatedPrompt && updatedPrompt.length > 100) {
                const batch = db.batch();
                // Note: We need manual path construction for sub-sub-collections in multi-tenant
                const historyRef = db.collection('stores').doc(storeId).collection('chatbot_config').doc('cliente_publico').collection('versions').doc();
                
                batch.set(historyRef, {
                    configId: 'cliente_publico',
                    systemPrompt: config.systemPrompt,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    author: 'User (Regra Rápida)',
                    changeNote: `Regra adicionada: "${newRule.substring(0, 50)}..."`
                });

                const configRef = getDocRef('chatbot_config', 'cliente_publico', storeId);
                batch.update(configRef, {
                    systemPrompt: updatedPrompt,
                    lastAutoGenerated: firebase.firestore.FieldValue.serverTimestamp()
                });

                await batch.commit();
                setConfig(prev => prev ? { ...prev, systemPrompt: updatedPrompt } : null);
                
                const versionsSnap = await db.collection('stores').doc(storeId).collection('chatbot_config').doc('cliente_publico').collection('versions').orderBy('createdAt', 'desc').get();
                setVersions(versionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatbotVersion)));

                showToast("Regra aplicada com sucesso!", 'success');
                setNewRule('');
            } else {
                throw new Error("Resposta da IA inválida.");
            }

        } catch (error) {
            console.error(error);
            showToast("Erro ao injetar regra.", 'error');
        } finally {
            setIsInjecting(false);
        }
    };

    const handleRunTest = async () => {
        if (!testMessage || !config?.systemPrompt) return;
        setIsTesting(true);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: testMessage,
                config: {
                    systemInstruction: config.systemPrompt,
                    temperature: 0.4
                }
            });
            setTestResponse(response.text || "Sem resposta.");
        } catch (error) {
            setTestResponse("Erro ao testar fluxo.");
        } finally {
            setIsTesting(false);
        }
    };

    const handleRestoreVersion = async (version: ChatbotVersion) => {
        if (!window.confirm("Restaurar esta versão substituirá o prompt atual. Continuar?")) return;
        try {
            await getDocRef('chatbot_config', 'cliente_publico', storeId).update({
                systemPrompt: version.systemPrompt,
                lastAutoGenerated: firebase.firestore.FieldValue.serverTimestamp()
            });
            setConfig(prev => prev ? { ...prev, systemPrompt: version.systemPrompt } : null);
            showToast("Versão restaurada com sucesso!", 'success');
        } catch (error) {
            showToast("Erro ao restaurar versão.", 'error');
        }
    };
    
    if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-yellow-500" /></div>;

    return (
        <div className="space-y-6 relative animate-fade-in">
            {/* ... (rest of the component JSX remains the same) ... */}
            {/* ... (The modals and buttons call functions that are now store-aware) ... */}
            {/* --- SECURITY MODAL --- */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-in">
                    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {modalConfig.mode === 'generate' ? <AlertTriangle className="text-red-500" /> : <CheckCircle className="text-blue-500" />}
                                Confirmação de Segurança
                            </h3>
                            <button onClick={handleCloseModal}><X className="text-gray-500 hover:text-white" /></button>
                        </div>

                        {/* --- RESET MODE (DESTRUCTIVE) --- */}
                        {modalConfig.mode === 'generate' && (
                            <>
                                {modalConfig.step === 1 ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm">
                                            <strong>ATENÇÃO:</strong> Você está prestes a <u>RESETAR</u> o cérebro do Chatbot.
                                            <ul className="list-disc list-inside mt-2 opacity-80">
                                                <li>Toda a personalidade atual será apagada.</li>
                                                <li>Regras manuais adicionadas anteriormente serão perdidas.</li>
                                                <li>A IA reescreverá a lógica do zero baseada no banco de dados atual.</li>
                                            </ul>
                                        </div>
                                        <p className="text-sm text-gray-400">Para continuar, digite <strong>RESETAR</strong> abaixo:</p>
                                        <input 
                                            type="text" 
                                            value={confirmInput}
                                            onChange={e => setConfirmInput(e.target.value.toUpperCase())}
                                            placeholder="RESETAR"
                                            className="w-full bg-black border border-red-900/50 rounded p-2 text-center font-bold text-white focus:border-red-500 outline-none tracking-widest"
                                        />
                                        <div className="flex justify-end gap-3 mt-4">
                                            <button onClick={handleCloseModal} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold">Cancelar</button>
                                            <button 
                                                onClick={handleConfirmStep1} 
                                                disabled={confirmInput !== 'RESETAR'}
                                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Continuar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="p-4 bg-red-600/20 border border-red-500 text-white rounded-lg text-center">
                                            <AlertTriangle size={48} className="mx-auto mb-2 text-red-500" />
                                            <h4 className="text-lg font-bold">Tem certeza absoluta?</h4>
                                            <p className="text-sm mt-2">Esta é sua última chance de cancelar. O prompt atual será substituído.</p>
                                        </div>
                                        <div className="flex justify-center gap-3 mt-6">
                                            <button onClick={handleCloseModal} className="px-6 py-3 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-bold">Não, Cancelar</button>
                                            <button onClick={handleConfirmStep2} className="px-6 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/20">Sim, Resetar Agora</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* --- UPDATE MODE (SYNC) --- */}
                        {modalConfig.mode === 'update' && (
                            <div className="space-y-4">
                                <p className="text-gray-300 text-sm">
                                    Esta ação irá <strong>sincronizar os dados</strong> (novos produtos, preços alterados, taxas de cartão) com o cérebro da IA.
                                </p>
                                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-blue-200 text-sm">
                                    <CheckCircle size={16} className="inline mr-2" />
                                    A personalidade e as regras de comportamento serão <strong>MANTIDAS</strong>. Apenas os dados brutos serão atualizados.
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={handleCloseModal} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white">Cancelar</button>
                                    <button onClick={handleConfirmStep1} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold">Confirmar Atualização</button>
                                </div>
                            </div>
                        )}

                         {/* --- IMPROVE MODE (OPTIMIZE) --- */}
                         {modalConfig.mode === 'improve' && (
                            <div className="space-y-4">
                                <p className="text-gray-300 text-sm">
                                    O Arquiteto de IA analisará seu prompt atual e aplicará <strong>técnicas avançadas de persuasão e vendas</strong>.
                                </p>
                                <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded text-purple-200 text-sm">
                                    <Zap size={16} className="inline mr-2" />
                                    O objetivo é tornar o bot mais proativo no fechamento de vendas, sem perder as informações técnicas.
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={handleCloseModal} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white">Cancelar</button>
                                    <button onClick={handleConfirmStep1} className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold">Melhorar Agora</button>
                                </div>
                            </div>
                        )}

                        {/* --- DIAGNOSE MODE --- */}
                        {modalConfig.mode === 'diagnose' && (
                            <div className="space-y-4">
                                <p className="text-gray-300 text-sm">
                                    Será feita uma varredura completa para encontrar inconsistências entre seus produtos, categorias e o conhecimento da IA.
                                </p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={handleCloseModal} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white">Cancelar</button>
                                    <button onClick={handleConfirmStep1} className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-black font-bold">Iniciar Diagnóstico</button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* HEADER & ACTIONS */}
            <div className="admin-card">
                <div className="admin-card-header">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Cpu className="text-blue-400" /> Cérebro Autônomo da Loja
                    </h2>
                </div>
                <div className="admin-card-content">
                    <p className="text-gray-400 mb-6">
                        O Arquiteto de IA (Gemini 3 Pro) analisa toda sua loja e escreve a lógica do chatbot automaticamente.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button onClick={() => handleOpenActionModal('generate')} disabled={isGenerating} className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl hover:bg-red-900/20 transition-all text-left group disabled:opacity-50">
                            <div className="flex items-center gap-2 text-red-400 font-bold mb-1 group-hover:text-red-300">
                                {isGenerating ? <Loader size={18} className="animate-spin"/> : <Zap size={18} />}
                                Resetar (Gerar Zero)
                            </div>
                            <p className="text-xs text-gray-500">Recria toda a lógica do zero. <strong>Requer confirmação dupla.</strong></p>
                        </button>

                        <button onClick={() => handleOpenActionModal('update')} disabled={isGenerating} className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl hover:bg-blue-900/20 transition-all text-left group disabled:opacity-50">
                            <div className="flex items-center gap-2 text-blue-400 font-bold mb-1 group-hover:text-blue-300">
                                {isGenerating ? <Loader size={18} className="animate-spin"/> : <RefreshCw size={18} />}
                                Atualizar Dados
                            </div>
                            <p className="text-xs text-gray-500">Sincroniza produtos e taxas mantendo a personalidade.</p>
                        </button>

                        <button onClick={() => handleOpenActionModal('improve')} disabled={isGenerating} className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl hover:bg-purple-900/20 transition-all text-left group disabled:opacity-50">
                            <div className="flex items-center gap-2 text-purple-400 font-bold mb-1 group-hover:text-purple-300">
                                {isGenerating ? <Loader size={18} className="animate-spin"/> : <Activity size={18} />}
                                Melhorar Conversão
                            </div>
                            <p className="text-xs text-gray-500">Refina persuasão e gatilhos de venda.</p>
                        </button>

                        <button onClick={() => handleOpenActionModal('diagnose')} disabled={isGenerating} className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-900/20 transition-all text-left group disabled:opacity-50">
                            <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1 group-hover:text-yellow-300">
                                {isGenerating ? <Loader size={18} className="animate-spin"/> : <Search size={18} />}
                                Diagnosticar
                            </div>
                            <p className="text-xs text-gray-500">Verifica integridade da lógica e da loja.</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex border-b border-zinc-800">
                <button onClick={() => setActiveTab('editor')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'editor' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    Prompt Atual
                </button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <Clock size={16} className="inline mr-2" /> Histórico de Versões
                </button>
                <button onClick={() => setActiveTab('testing')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'testing' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <Play size={16} className="inline mr-2" /> Simulador
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="admin-card min-h-[400px]">
                <div className="admin-card-content">
                    
                    {/* EDITOR TAB */}
                    {activeTab === 'editor' && (
                        <div>
                            {/* Micro-Ajustes Section */}
                            <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <PlusCircle size={16} className="text-green-400"/> Micro-Ajustes Rápidos
                                </h4>
                                <p className="text-xs text-gray-500 mb-3">Adicione uma regra específica à lógica atual sem regenerar tudo. A IA encontrará o lugar certo para inseri-la.</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newRule}
                                        onChange={e => setNewRule(e.target.value)}
                                        placeholder='Ex: "Antes de enviar o botão do whatsapp, informe o valor total parcelado."'
                                        className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                                        onKeyDown={e => e.key === 'Enter' && handleInjectRule()}
                                    />
                                    <button 
                                        onClick={handleInjectRule}
                                        disabled={isInjecting || !newRule.trim()}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 transition-colors"
                                    >
                                        {isInjecting ? <Loader size={14} className="animate-spin"/> : <ArrowRight size={14}/>}
                                        Inserir Regra
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white">Prompt de Sistema (Lógica Mestre)</h3>
                                <span className="text-xs text-gray-500">Última geração: {config?.lastAutoGenerated?.toDate().toLocaleString()}</span>
                            </div>
                            <textarea 
                                value={config?.systemPrompt || ''} 
                                readOnly 
                                className="w-full h-[500px] bg-[#0e0e0e] border border-[#27272a] rounded-lg p-4 font-mono text-sm text-zinc-400 focus:outline-none resize-none shadow-inner"
                            />
                            <p className="mt-2 text-xs text-gray-500">* Este prompt é gerado automaticamente pelo Arquiteto. Para alterar, use os "Micro-Ajustes" acima ou os botões de regeneração.</p>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                             <div className="bg-black/20 border border-zinc-800 rounded-lg overflow-y-auto custom-scrollbar">
                                {versions.map((v) => (
                                    <button 
                                        key={v.id} 
                                        onClick={() => setComparisonVersion(v)}
                                        className={`w-full text-left p-4 border-b border-zinc-800 hover:bg-zinc-900 transition-colors ${comparisonVersion?.id === v.id ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm text-white">{v.createdAt?.toDate().toLocaleDateString()}</span>
                                            <span className="text-xs text-gray-500">{v.createdAt?.toDate().toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{v.author}</p>
                                        <p className="text-xs text-blue-400 mt-1 truncate">{v.changeNote || 'Sem notas'}</p>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="lg:col-span-2 bg-[#0e0e0e] border border-zinc-800 rounded-lg p-4 flex flex-col">
                                {comparisonVersion ? (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-200">Versão de {comparisonVersion.createdAt?.toDate().toLocaleString()}</h4>
                                            <button onClick={() => handleRestoreVersion(comparisonVersion)} className="flex items-center gap-2 bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-500 text-sm font-bold">
                                                <RotateCcw size={16} /> Restaurar esta Versão
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto bg-black p-4 rounded border border-[#27272a] custom-scrollbar">
                                            <pre className="whitespace-pre-wrap font-mono text-xs text-gray-400">{comparisonVersion.systemPrompt}</pre>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <p>Selecione uma versão para visualizar.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TESTING TAB */}
                    {activeTab === 'testing' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                            <div className="flex flex-col">
                                <h3 className="font-bold mb-2 text-white">Entrada do Usuário (Teste)</h3>
                                <textarea 
                                    value={testMessage}
                                    onChange={e => setTestMessage(e.target.value)}
                                    className="flex-1 bg-black/50 border border-zinc-800 rounded-lg p-4 text-white resize-none focus:ring-1 focus:ring-green-500 focus:outline-none"
                                    placeholder="Ex: Quero um iPhone 15 Pro. Quanto custa?"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleRunTest();
                                        }
                                    }}
                                />
                                <button onClick={handleRunTest} disabled={isTesting} className="mt-4 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-900/20">
                                    {isTesting ? <Loader size={18} className="animate-spin"/> : <Play size={18} />}
                                    Executar Simulação
                                </button>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold mb-2 text-white">Resposta da IA</h3>
                                <div className="flex-1 bg-[#0e0e0e] border border-zinc-800 rounded-lg p-4 overflow-y-auto relative custom-scrollbar">
                                    {isTesting ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                            <Loader className="animate-spin text-green-500" size={32}/>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert text-sm" dangerouslySetInnerHTML={{ __html: testResponse || '<span class="text-gray-600">A resposta aparecerá aqui...</span>' }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatbotConfigPanel;
