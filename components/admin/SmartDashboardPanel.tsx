
import React, { useState } from 'react';
import { useStoreDiagnostics } from './hooks/useStoreDiagnostics';
import { Product, Category, SiteInfo } from '../../../types';
import { AlertTriangle, CheckCircle, Image, FileText, Package, Globe, Eye, ArrowRight, Cpu, BarChart2, Loader, DollarSign } from 'react-feather';
import ActionModal from './ActionModal';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

type AdminView = 'dashboard' | 'smart_dashboard' | 'identidade' | 'cores' | 'hero' | 'story' | 'textos_seo' | 'produtos' | 'categorias' | 'ai_assistant' | 'informacoes' | 'taxas';

interface SmartDashboardPanelProps {
    allProducts: Product[];
    categories: Category[];
    siteInfo: SiteInfo;
    setActiveView: (view: AdminView) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    storeId: string;
}

const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    let colorClass = 'text-emerald-500';
    if (score < 75) colorClass = 'text-yellow-500';
    if (score < 50) colorClass = 'text-red-500';

    return (
        <div className="relative w-32 h-32 md:w-40 md:h-40">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                    className="text-zinc-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                />
                <circle
                    className={`transform -rotate-90 origin-center ${colorClass}`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    stroke="currentColor"
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${colorClass}`}>
                {score}%
            </span>
        </div>
    );
};

const DiagnosticCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    statusText: React.ReactNode;
    issues: string[];
    actionText: string;
    onAction: () => void;
    isGood: boolean;
}> = ({ icon, title, statusText, issues, actionText, onAction, isGood }) => {
    const iconColor = isGood ? 'text-emerald-400' : 'text-yellow-400';
    const bgColor = isGood ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-yellow-500/10 border-yellow-500/20';

    return (
        <div className={`admin-card flex flex-col justify-between transition-all hover:translate-y-[-2px] ${!isGood ? 'border-yellow-500/30' : ''}`}>
            <div className="admin-card-content h-full flex flex-col">
                <div className="flex-1">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${bgColor} ${iconColor}`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">{title}</h3>
                            <p className={`text-sm font-semibold mt-1 ${iconColor}`}>{statusText}</p>
                        </div>
                    </div>
                    {issues.length > 0 && (
                        <ul className="mt-4 space-y-2">
                            {issues.map((issue, i) => (
                                <li key={i} className="text-sm text-zinc-400 flex items-start gap-2 bg-black/20 p-2 rounded">
                                    <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0"/> 
                                    {issue}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {!isGood && (
                     <button onClick={onAction} className="mt-6 w-full py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors group">
                        {actionText} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                )}
            </div>
        </div>
    );
};


const SmartDashboardPanel: React.FC<SmartDashboardPanelProps> = ({ allProducts, categories, siteInfo, setActiveView, showToast, uploadImage, storeId }) => {
    const diagnostics = useStoreDiagnostics(allProducts, categories, siteInfo);
    const [modalState, setModalState] = useState<{ isOpen: boolean; type: string; items: any[]; title: string }>({
        isOpen: false,
        type: '',
        items: [],
        title: '',
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    const handleOpenModal = (type: string, items: any[], title: string) => {
        setModalState({ isOpen: true, type, items, title });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, type: '', items: [], title: '' });
    };
    
    const handleStrategicAnalysis = async () => {
        setIsAnalyzing(true);
        setAiAnalysis(null);
        try {
             const storeSummary = {
                productCount: allProducts.length,
                categoryCount: categories.length,
                categoriesWithoutProducts: diagnostics.emptyCategories.count,
                productsWithoutDetails: diagnostics.productsWithoutDetails.count,
                productsWithoutImage: diagnostics.productsWithoutImage.count,
                seoScore: diagnostics.seoHealth.score,
                seoIssues: diagnostics.seoHealth.issues,
                uncategorized: diagnostics.uncategorizedProducts.count
            };

            const prompt = `
                Você é um consultor estrategista de e-commerce sênior.
                Analise os dados técnicos desta loja e me dê um relatório curto e direto sobre o que está impedindo o crescimento dela.
                
                DADOS DA LOJA:
                ${JSON.stringify(storeSummary, null, 2)}
                
                Responda com um texto de 3 parágrafos curtos:
                1. Diagnóstico Geral (Onde está o maior gargalo).
                2. Impacto no Cliente (Como isso afeta a venda).
                3. Plano de Ação Imediato (O que priorizar).
                
                Seja direto, sem "Olá". Use formatação markdown.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            setAiAnalysis(response.text);

        } catch (error) {
            console.error(error);
            showToast("Erro ao gerar análise estratégica.", 'error');
        } finally {
            setIsAnalyzing(false);
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-1 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <CircularProgress score={diagnostics.overallHealthScore} />
                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-3 text-white">
                            <Cpu className="text-indigo-400"/> Painel de Inteligência
                        </h2>
                        <p className="text-zinc-400 mt-2 mb-6 max-w-2xl leading-relaxed">
                            Esta pontuação reflete a qualidade técnica da sua loja. Melhore dados, SEO e imagens para aumentar a conversão.
                        </p>
                         {aiAnalysis ? (
                            <div className="bg-zinc-900/80 border border-indigo-500/30 p-5 rounded-xl text-sm text-indigo-100 leading-relaxed shadow-lg animate-fade-in text-left">
                                <h4 className="font-bold mb-3 text-indigo-400 flex items-center gap-2 uppercase tracking-wider text-xs"><BarChart2 size={14}/> Relatório Estratégico IA</h4>
                                <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{__html: aiAnalysis.replace(/\n/g, '<br/>')}} />
                            </div>
                        ) : (
                             <button onClick={handleStrategicAnalysis} disabled={isAnalyzing} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 disabled:opacity-50 disabled:shadow-none mx-auto md:mx-0">
                                {isAnalyzing ? <Loader className="animate-spin" size={20} /> : <BarChart2 size={20} />}
                                {isAnalyzing ? "Consultando Banco de Dados..." : "Gerar Análise Estratégica com IA"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DiagnosticCard
                    icon={<Globe size={28} />}
                    title="Saúde do SEO"
                    isGood={diagnostics.seoHealth.score === 100}
                    statusText={`Pontuação: ${diagnostics.seoHealth.score} / 100`}
                    issues={diagnostics.seoHealth.issues}
                    actionText="Otimizar SEO"
                    onAction={() => setActiveView('textos_seo')}
                />
                 <DiagnosticCard
                    icon={<FileText size={28} />}
                    title="Detalhes dos Produtos"
                    isGood={diagnostics.productsWithoutDetails.count === 0}
                    statusText={
                        diagnostics.productsWithoutDetails.count > 0 
                        ? `${diagnostics.productsWithoutDetails.count} produto(s) precisam de detalhes.`
                        : "Todos os produtos têm detalhes!"
                    }
                    issues={[]}
                    actionText="Corrigir Produtos"
                    onAction={() => handleOpenModal('details', diagnostics.productsWithoutDetails.items, 'Corrigir Detalhes de Produtos')}
                />
                <DiagnosticCard
                    icon={<Image size={28} />}
                    title="Imagens dos Produtos"
                    isGood={diagnostics.productsWithoutImage.count === 0}
                    statusText={
                        diagnostics.productsWithoutImage.count > 0 
                        ? `${diagnostics.productsWithoutImage.count} produto(s) estão sem imagem.`
                        : "Todos os produtos têm imagens!"
                    }
                    issues={[]}
                    actionText="Adicionar Imagens"
                    onAction={() => handleOpenModal('images', diagnostics.productsWithoutImage.items, 'Gerar Imagens de Produtos')}
                />
                <DiagnosticCard
                    icon={<DollarSign size={28} />}
                    title="Produtos sem Custo"
                    isGood={diagnostics.productsWithoutCostPrice.count === 0}
                    statusText={
                        diagnostics.productsWithoutCostPrice.count > 0 
                        ? `${diagnostics.productsWithoutCostPrice.count} produto(s) sem preço de custo.`
                        : "Todos os produtos têm custo cadastrado!"
                    }
                    issues={[]}
                    actionText="Definir Custos"
                    onAction={() => setActiveView('produtos')} // Redirect to products panel to edit costs
                />
                 <DiagnosticCard
                    icon={<Package size={28} />}
                    title="Organização das Categorias"
                    isGood={diagnostics.emptyCategories.count === 0 && diagnostics.uncategorizedProducts.count === 0}
                    statusText={
                        diagnostics.emptyCategories.count + diagnostics.uncategorizedProducts.count > 0
                        ? `${diagnostics.emptyCategories.count + diagnostics.uncategorizedProducts.count} problemas encontrados.`
                        : "Categorias bem organizadas!"
                    }
                    issues={[
                        diagnostics.emptyCategories.count > 0 && `${diagnostics.emptyCategories.count} categorias estão vazias.`,
                        diagnostics.uncategorizedProducts.count > 0 && `${diagnostics.uncategorizedProducts.count} produtos com categoria inválida.`
                    ].filter(Boolean) as string[]}
                    actionText="Gerenciar Categorias"
                    onAction={() => handleOpenModal('categories', diagnostics.emptyCategories.items, 'Gerenciar Categorias Vazias')}
                />
                <DiagnosticCard
                    icon={<Eye size={28} />}
                    title="Aparência do 'Hero'"
                    isGood={!diagnostics.heroContrastWarning.hasWarning}
                    statusText={
                        diagnostics.heroContrastWarning.hasWarning
                        ? "Potencial problema de contraste."
                        : "Boas configurações de cores!"
                    }
                    issues={diagnostics.heroContrastWarning.hasWarning ? [diagnostics.heroContrastWarning.message] : []}
                    actionText="Ajustar Cores do Hero"
                    onAction={() => setActiveView('hero')}
                />
            </div>

            <ActionModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                type={modalState.type}
                items={modalState.items}
                title={modalState.title}
                showToast={showToast}
                uploadImage={uploadImage}
                categories={categories} // Pass categories context
                storeId={storeId}
            />
        </div>
    );
};

export default SmartDashboardPanel;
