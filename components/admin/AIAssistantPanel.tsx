
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, ThemeColors, SiteInfo } from '../../types';
import { SITE_INFO as defaultSiteInfo } from '../../constants';
import AIOnboardingWizard from './AIOnboardingWizard';
import AIProductWizard from './AIProductWizard';
import AIPromoWizard from './AIPromoWizard';
import AIThemeWizard from './AIThemeWizard';
import AIGeneralAssistant from './AIGeneralAssistant';
import { Box, Tag, Settings, Droplet, Clock, RefreshCw, Cpu, AlertTriangle, CheckCircle, X, Command } from 'react-feather';
import { db, getDocRef } from '../../firebase';
import { useStoreDiagnostics } from './hooks/useStoreDiagnostics';

type AdminView = 'dashboard' | 'clientes' | 'ponto_de_venda' | 'historico_vendas' | 'ordens_de_servico' | 'identidade' | 'cores' | 'hero' | 'story' | 'textos_seo' | 'produtos' | 'categorias' | 'ai_assistant' | 'informacoes' | 'taxas';

interface AIAssistantPanelProps {
    storeId: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    allProducts: Product[];
    categories: Category[];
    siteInfo: SiteInfo;
    setActiveView: (view: AdminView) => void;
}

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 font-bold text-lg">
                {title}
                {isOpen ? <span>-</span> : <span>+</span>}
            </button>
            {isOpen && <div className="p-4 border-t border-[#27272a]">{children}</div>}
        </div>
    );
};

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
    storeId,
    showToast,
    uploadImage,
    allProducts,
    categories,
    siteInfo,
    setActiveView
}) => {
    const [productWizardOpen, setProductWizardOpen] = useState(false);
    const [promoWizardOpen, setPromoWizardOpen] = useState(false);
    const [themeWizardOpen, setThemeWizardOpen] = useState(false);
    const [generalAssistantOpen, setGeneralAssistantOpen] = useState(false);
    
    const [themeHistory, setThemeHistory] = useState<{theme: ThemeColors, timestamp: { toDate: () => Date }}[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

    const diagnostics = useStoreDiagnostics(allProducts, categories, siteInfo);
    
    useEffect(() => {
        if (!storeId) return;
        const historyRef = getDocRef('settings', 'themeHistory', storeId);
        const unsub = historyRef.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setThemeHistory(data?.history || []);
            }
            setHistoryLoading(false);
        }, (error) => {
            console.error("Error fetching theme history:", error);
            setHistoryLoading(false);
        });
        return () => unsub();
    }, [storeId]);

    const handleRestoreTheme = async (themeToRestore: ThemeColors) => {
        if (window.confirm('Tem certeza que deseja restaurar este tema? A paleta de cores atual será substituída.')) {
            try {
                await getDocRef('settings', 'siteInfo', storeId).set({ theme: themeToRestore }, { merge: true });
                showToast('Tema restaurado com sucesso!', 'success');
            } catch (error) {
                console.error("Failed to restore theme:", error);
                showToast('Erro ao restaurar o tema.', 'error');
            }
        }
    };

    const dismissNotification = (id: string) => {
        setDismissedNotifications(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };


    return (
        <div>
             <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">
                {!diagnostics.isSeoConfigured && !dismissedNotifications.has('seo') && (
                    <div className="relative w-full max-w-xs pointer-events-auto group animate-fade-in">
                        <button
                            onClick={() => setActiveView('textos_seo')}
                            className="flex items-start gap-3 p-3 rounded-lg shadow-lg bg-yellow-900/90 border border-yellow-500/50 backdrop-blur-sm text-left w-full hover:bg-yellow-800/90 transition-colors pr-8"
                        >
                            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                            <div>
                                <p className="font-bold text-yellow-300 text-sm">SEO Básico Incompleto</p>
                                <p className="text-xs text-yellow-200/80">Clique para configurar o título e a descrição da sua loja.</p>
                            </div>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); dismissNotification('seo'); }}
                            className="absolute top-2 right-2 text-yellow-400/60 hover:text-yellow-200 p-1 rounded-full hover:bg-yellow-800 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                {diagnostics.productsWithoutDetails.count > 0 && !dismissedNotifications.has('details') && (
                     <div className="relative w-full max-w-xs pointer-events-auto group animate-fade-in">
                        <button
                            onClick={() => setActiveView('produtos')}
                            className="flex items-start gap-3 p-3 rounded-lg shadow-lg bg-yellow-900/90 border border-yellow-500/50 backdrop-blur-sm text-left w-full hover:bg-yellow-800/90 transition-colors pr-8"
                        >
                            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                            <div>
                                <p className="font-bold text-yellow-300 text-sm">Produtos com Detalhes Faltando</p>
                                <p className="text-xs text-yellow-200/80">{`Clique para completar as informações de ${diagnostics.productsWithoutDetails.count} produto(s).`}</p>
                            </div>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); dismissNotification('details'); }}
                            className="absolute top-2 right-2 text-yellow-400/60 hover:text-yellow-200 p-1 rounded-full hover:bg-yellow-800 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                 {diagnostics.productsWithoutImage.count > 0 && !dismissedNotifications.has('images') && (
                     <div className="relative w-full max-w-xs pointer-events-auto group animate-fade-in">
                        <button
                            onClick={() => setActiveView('produtos')}
                            className="flex items-start gap-3 p-3 rounded-lg shadow-lg bg-yellow-900/90 border border-yellow-500/50 backdrop-blur-sm text-left w-full hover:bg-yellow-800/90 transition-colors pr-8"
                        >
                            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                            <div>
                                <p className="font-bold text-yellow-300 text-sm">Produtos Sem Imagem</p>
                                <p className="text-xs text-yellow-200/80">{`Clique para adicionar imagens a ${diagnostics.productsWithoutImage.count} produto(s).`}</p>
                            </div>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); dismissNotification('images'); }}
                            className="absolute top-2 right-2 text-yellow-400/60 hover:text-yellow-200 p-1 rounded-full hover:bg-yellow-800 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            <div className="admin-card">
                <div className="admin-card-content">
                    <p className="text-gray-400 mb-6">Use o poder da IA para automatizar tarefas e acelerar a configuração da sua loja.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <button onClick={() => setGeneralAssistantOpen(true)} className="p-4 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-indigo-500/30 rounded-lg text-left hover:border-indigo-400 transition-all shadow-lg shadow-indigo-900/10 group">
                            <div className="bg-indigo-500/20 p-2 rounded-md w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Command className="text-indigo-300" size={24} />
                            </div>
                            <p className="font-bold text-indigo-100">Comandos Rápidos & Preços</p>
                            <p className="text-xs text-indigo-200/60 mt-1">"Mude o 15 Pro para 5000", "Coloque o 17 Air normal"...</p>
                        </button>

                        <button onClick={() => setProductWizardOpen(true)} className="p-4 bg-[#0a0a0a] border border-[#27272a] rounded-lg text-left hover:border-blue-500 hover:bg-blue-900/20 transition-colors">
                            <Box className="text-blue-400 mb-2" />
                            <p className="font-semibold">Adicionar Produtos em Lote</p>
                            <p className="text-sm text-gray-400">Cole uma lista e a IA cadastra tudo para você.</p>
                        </button>
                        <button onClick={() => setPromoWizardOpen(true)} className="p-4 bg-[#0a0a0a] border border-[#27272a] rounded-lg text-left hover:border-green-500 hover:bg-green-900/20 transition-colors">
                            <Tag className="text-green-400 mb-2" />
                            <p className="font-semibold">Criar Promoções</p>
                            <p className="text-sm text-gray-400">Descreva os descontos e a IA aplica nos produtos.</p>
                        </button>
                        <button onClick={() => setThemeWizardOpen(true)} className="p-4 bg-[#0a0a0a] border border-[#27272a] rounded-lg text-left hover:border-pink-500 hover:bg-pink-900/20 transition-colors">
                            <Droplet className="text-pink-400 mb-2" />
                            <p className="font-semibold">Gerador de Tema</p>
                            <p className="text-sm text-gray-400">Crie uma paleta de cores para o site a partir de uma imagem.</p>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <Accordion title="Assistente de Configuração Rápida (Onboarding)" defaultOpen={false}>
                            <AIOnboardingWizard showToast={showToast} storeId={storeId} />
                        </Accordion>

                        <Accordion title="Histórico de Temas Gerados por IA" defaultOpen={false}>
                            {historyLoading ? (
                                <p>Carregando histórico...</p>
                            ) : themeHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {themeHistory.map((entry, index) => (
                                        <div key={index} className="bg-black p-3 rounded-lg border border-[#27272a] flex justify-between items-center flex-wrap gap-2">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <div className="flex items-center gap-1.5" title={`Brand: ${entry.theme.brand}, Background: ${entry.theme.background}, Surface: ${entry.theme.surface}, Text: ${entry.theme.primaryText}`}>
                                                    <div className="w-6 h-6 rounded-full border border-gray-600" style={{ backgroundColor: entry.theme.brand }}></div>
                                                    <div className="w-6 h-6 rounded-full border border-gray-600" style={{ backgroundColor: entry.theme.background }}></div>
                                                    <div className="w-6 h-6 rounded-full border border-gray-600" style={{ backgroundColor: entry.theme.surface }}></div>
                                                    <div className="w-6 h-6 rounded-full border border-gray-600" style={{ backgroundColor: entry.theme.primaryText }}></div>
                                                </div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    <span>Salvo em: {entry.timestamp.toDate().toLocaleString('pt-BR')}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRestoreTheme(entry.theme)} className="flex items-center gap-2 bg-gray-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-gray-600">
                                                <RefreshCw size={14} /> Restaurar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">Nenhum histórico de temas encontrado. Gere um novo tema com IA para começar.</p>
                            )}
                        </Accordion>
                    </div>
                </div>
            </div>


            {/* Wizards as Modals */}
            <AIGeneralAssistant
                isOpen={generalAssistantOpen}
                onClose={() => setGeneralAssistantOpen(false)}
                showToast={showToast}
                allProducts={allProducts}
                categories={categories}
                uploadImage={uploadImage}
                storeId={storeId}
            />
            <AIProductWizard 
                isOpen={productWizardOpen} 
                onClose={() => setProductWizardOpen(false)} 
                showToast={showToast}
                uploadImage={uploadImage}
                categories={categories}
            />
            <AIPromoWizard 
                isOpen={promoWizardOpen}
                onClose={() => setPromoWizardOpen(false)}
                showToast={showToast}
                allProducts={allProducts}
                storeId={storeId}
            />
            <AIThemeWizard
                isOpen={themeWizardOpen}
                onClose={() => setThemeWizardOpen(false)}
                showToast={showToast}
                onSave={async (newTheme) => {
                    const siteInfoRef = getDocRef('settings', 'siteInfo', storeId);
                    const historyRef = getDocRef('settings', 'themeHistory', storeId);
                    try {
                        const docSnap = await siteInfoRef.get();
                        const currentData = docSnap.exists ? docSnap.data() : {};
                        const currentTheme = currentData.theme || {};

                        const historyDoc = await historyRef.get();
                        const currentHistory = historyDoc.exists ? historyDoc.data()?.history || [] : [];
                        const newHistoryEntry = { theme: currentTheme, timestamp: new Date() };
                        const updatedHistory = [newHistoryEntry, ...currentHistory].slice(0, 10);
                        await historyRef.set({ history: updatedHistory });

                        const mergedTheme = { ...currentTheme, ...newTheme };
                        await siteInfoRef.set({ theme: mergedTheme }, { merge: true });

                        showToast('Novo tema aplicado e backup salvo!', 'success');
                    } catch (error) {
                        console.error("Failed to save theme:", error);
                        showToast('Erro ao salvar o tema.', 'error');
                    }
                }}
            />
        </div>
    );
};

export default AIAssistantPanel;
