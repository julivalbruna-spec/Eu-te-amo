
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GoogleGenAI, Type } from '@google/genai';
import { HeroInfo, Product } from '../../types';
import { db } from '../../firebase';
import { X, Cpu, Loader, ArrowRight, Layout, CheckCircle, Image as ImageIcon, Droplet } from 'react-feather';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface AIHeroWizardProps {
    isOpen: boolean;
    onClose: () => void;
    existingHeroes: HeroInfo[];
    onSave: (newHero: HeroInfo) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const AIHeroWizard: React.FC<AIHeroWizardProps> = ({ isOpen, onClose, existingHeroes, onSave, showToast }) => {
    const [step, setStep] = useState(1);
    const [baseHeroId, setBaseHeroId] = useState<string | 'none' | null>(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedOptions, setGeneratedOptions] = useState<HeroInfo[]>([]);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [productsContext, setProductsContext] = useState<string>('');

    // Color Preferences
    const [useCustomColors, setUseCustomColors] = useState(false);
    const [preferredBgColor, setPreferredBgColor] = useState('#000000');
    const [preferredAuroraColor, setPreferredAuroraColor] = useState('#ffae00');


    // Fetch products for context
    useEffect(() => {
        if (isOpen) {
            const fetchProducts = async () => {
                try {
                    const snap = await db.collection('products').where('price', '>', 0).limit(50).get();
                    const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
                    
                    // Simplify product data for AI token efficiency
                    const context = products.map(p => {
                        const img = p.image || p.variants?.[0]?.imageUrl || '';
                        return `ID: ${p.id} | Nome: ${p.name} | Preço: ${p.price} | Imagem: ${img}`;
                    }).join('\n');
                    
                    setProductsContext(context);
                } catch (e) {
                    console.error("Error fetching products for context", e);
                }
            };
            fetchProducts();
            
            // Reset state on open
            setStep(1);
            setBaseHeroId(null);
            setUserPrompt('');
            setGeneratedOptions([]);
            setSelectedOptionIndex(null);
            setUseCustomColors(false);
            setPreferredBgColor('#000000');
            setPreferredAuroraColor('#ffae00');
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!userPrompt.trim()) {
            showToast("Por favor, descreva o que você quer criar.", 'error');
            return;
        }

        setIsGenerating(true);

        try {
            let baseStyleContext = "Use um estilo padrão moderno e minimalista.";
            
            if (baseHeroId && baseHeroId !== 'none') {
                const baseHero = existingHeroes.find(h => h.id === baseHeroId);
                if (baseHero) {
                    baseStyleContext = `
                        IMPORTANTE: COPIE EXATAMENTE AS CONFIGURAÇÕES VISUAIS DESTE HERO EXISTENTE:
                        - Cores (titleColor, subtitleColor, backgroundColor, buttonColors).
                        - Fontes e tamanhos (fontSizes, lineHeights).
                        - Configurações de Aurora (auroraElements, blurStrength).
                        - Layout (carouselHeight, imageSize).
                        
                        OBJETO BASE (Use como template para os campos visuais, mas mude os textos e imagens do carrossel):
                        ${JSON.stringify(baseHero)}
                    `;
                }
            }

            const colorDirective = useCustomColors ? `
                **PREFERÊNCIAS DE COR OBRIGATÓRIAS DO USUÁRIO:**
                1. O campo 'backgroundColor' DEVE ser exatamente "${preferredBgColor}".
                2. Gere o array 'auroraElements' usando variações e tons complementares baseados na cor "${preferredAuroraColor}".
            ` : '';

            const prompt = `
                Você é um Designer de UI/UX e Copywriter especialista em E-commerce de alto padrão (Apple/Tech).
                
                TAREFA: Criar 2 opções de "Hero Section" (Banner Principal) para um site de venda de iPhones.
                
                PEDIDO DO USUÁRIO: "${userPrompt}"
                
                CONTEXTO DE ESTILO:
                ${baseStyleContext}
                
                ${colorDirective}

                CONTEXTO DE PRODUTOS REAIS (Use estas URLs de imagem e nomes exatos):
                ${productsContext}

                REGRAS:
                1. **Textos**: Crie títulos (title) curtos e impactantes. 
                   **IMPORTANTE:** Use o caractere de quebra de linha (\\n) para pular linhas no título. **NÃO** use tags HTML como <br> ou <br/>. O texto deve ser limpo e editável em um textarea.
                2. **Imagens**: Preencha o array 'carouselItems'. Tente encontrar produtos no contexto acima que combinem com o pedido do usuário. Se encontrar, use a URL real da imagem no campo 'src'. Se não encontrar, deixe uma URL de placeholder.
                3. **Botões**: Defina textos para 'buttonPrimary' (ex: Comprar Agora) e 'buttonSecondary' (ex: Ver Detalhes).

                SAÍDA ESPERADA:
                Retorne um JSON com um array de objetos 'HeroInfo'.
                O array deve conter exatamente 2 opções distintas (Opção A e Opção B).
            `;

            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
                        carouselTitle: { type: Type.STRING },
                        buttonPrimary: { type: Type.STRING },
                        buttonSecondary: { type: Type.STRING },
                        backgroundColor: { type: Type.STRING },
                        titleColor: { type: Type.STRING },
                        subtitleColor: { type: Type.STRING },
                        carouselItems: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    src: { type: Type.STRING },
                                    alt: { type: Type.STRING }
                                }
                            }
                        },
                        // Visual properties
                        buttonPrimaryBackgroundColor: { type: Type.STRING },
                        buttonPrimaryTextColor: { type: Type.STRING },
                        buttonSecondaryBackgroundColor: { type: Type.STRING },
                        buttonSecondaryTextColor: { type: Type.STRING },
                        buttonSecondaryBorderColor: { type: Type.STRING },
                        auroraElements: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    color: { type: Type.STRING },
                                    sizeMobile: { type: Type.NUMBER },
                                    sizeDesktop: { type: Type.NUMBER }
                                } 
                            } 
                        },
                        blurStrength: { type: Type.NUMBER }
                    },
                    required: ['title', 'phrases', 'carouselItems']
                }
            };

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema
                }
            });

            const generated = JSON.parse(result.text) as HeroInfo[];
            
            // Merge generated data with base style defaults if needed to ensure completeness
            const finalOptions = generated.map(opt => {
                const baseHero = baseHeroId && baseHeroId !== 'none' ? existingHeroes.find(h => h.id === baseHeroId) : {};
                
                // Clean title removing any HTML tags if AI hallucinated them
                const cleanTitle = opt.title ? opt.title.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, "") : '';

                return {
                    ...baseHero, // Inherit base styles
                    ...opt, // Override with generated content
                    title: cleanTitle,
                    id: Math.random().toString(36).substr(2, 9), // New ID
                    enabled: true,
                    // Ensure critical defaults exist if AI missed them
                    carouselHeightMobile: (baseHero as any)?.carouselHeightMobile || 240,
                    carouselHeightDesktop: (baseHero as any)?.carouselHeightDesktop || 300,
                    carouselImageSizeMobile: (baseHero as any)?.carouselImageSizeMobile || 74,
                    carouselImageSizeDesktop: (baseHero as any)?.carouselImageSizeDesktop || 80,
                    titleFontSizeMobile: (baseHero as any)?.titleFontSizeMobile || 40,
                    titleFontSizeDesktop: (baseHero as any)?.titleFontSizeDesktop || 56,
                } as HeroInfo;
            });

            setGeneratedOptions(finalOptions);
            setStep(3);

        } catch (error) {
            console.error(error);
            showToast("Erro ao gerar Hero com IA.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        if (selectedOptionIndex !== null) {
            onSave(generatedOptions[selectedOptionIndex]);
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#27272a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Arquiteto de Hero IA</h3>
                            <p className="text-xs text-gray-400">Crie banners de alta conversão em segundos.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {/* STEP 1: Base Style */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h4 className="text-lg font-semibold text-white">1. Escolha a base estética</h4>
                            <p className="text-gray-400 text-sm">Você quer copiar as cores, fontes e animações de um Hero que já existe, ou começar do zero?</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <button 
                                    onClick={() => setBaseHeroId('none')}
                                    className={`p-4 rounded-xl border text-left transition-all ${baseHeroId === 'none' ? 'bg-purple-900/20 border-purple-500 ring-1 ring-purple-500' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'}`}
                                >
                                    <div className="w-full h-24 bg-zinc-800 rounded-lg mb-3 flex items-center justify-center border border-zinc-700 border-dashed">
                                        <Layout className="text-zinc-600" />
                                    </div>
                                    <p className="font-bold text-white">Estilo Padrão (Novo)</p>
                                    <p className="text-xs text-gray-500">Começar com config limpa.</p>
                                </button>

                                {existingHeroes.map((hero, idx) => (
                                    <button 
                                        key={hero.id}
                                        onClick={() => setBaseHeroId(hero.id)}
                                        className={`p-4 rounded-xl border text-left transition-all ${baseHeroId === hero.id ? 'bg-purple-900/20 border-purple-500 ring-1 ring-purple-500' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'}`}
                                    >
                                        <div className="w-full h-24 bg-black rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                                            {hero.backgroundColor && <div className="absolute inset-0" style={{backgroundColor: hero.backgroundColor}}></div>}
                                            <span className="relative z-10 font-bold text-xs px-2 text-center truncate w-full" style={{color: hero.titleColor || 'white'}}>{hero.title ? hero.title.substring(0, 30) : 'Sem título'}...</span>
                                        </div>
                                        <p className="font-bold text-white truncate">Baseado em: {idx + 1}</p>
                                        <p className="text-xs text-gray-500">Copia cores e layout.</p>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    disabled={!baseHeroId}
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Próximo <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Prompt & Colors */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h4 className="text-lg font-semibold text-white">2. Descreva a Campanha</h4>
                            <p className="text-gray-400 text-sm">Sobre o que é este banner? A IA usará os produtos da sua loja para montar o carrossel.</p>
                            
                            <textarea
                                value={userPrompt}
                                onChange={e => setUserPrompt(e.target.value)}
                                placeholder="Ex: Crie um banner para o lançamento do iPhone 16 Pro, com foco nas novas cores e câmera. Quero algo elegante e minimalista."
                                className="w-full h-32 bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none resize-none"
                            />

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-gray-300 font-semibold">
                                        <Droplet size={18} className="text-purple-400"/>
                                        Preferências Visuais (Opcional)
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white">
                                        <input 
                                            type="checkbox" 
                                            checked={useCustomColors} 
                                            onChange={e => setUseCustomColors(e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-600 bg-black text-purple-600 focus:ring-purple-500"
                                        />
                                        Definir Cores Manualmente
                                    </label>
                                </div>

                                {useCustomColors && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-2">Cor de Fundo Principal</label>
                                            <div className="flex items-center gap-3 bg-black p-2 rounded-lg border border-zinc-800">
                                                <input 
                                                    type="color" 
                                                    value={preferredBgColor} 
                                                    onChange={e => setPreferredBgColor(e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={preferredBgColor} 
                                                    onChange={e => setPreferredBgColor(e.target.value)}
                                                    className="bg-transparent text-white font-mono text-sm outline-none w-full"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-2">Cor Principal da Aurora (Animação)</label>
                                            <div className="flex items-center gap-3 bg-black p-2 rounded-lg border border-zinc-800">
                                                <input 
                                                    type="color" 
                                                    value={preferredAuroraColor} 
                                                    onChange={e => setPreferredAuroraColor(e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={preferredAuroraColor} 
                                                    onChange={e => setPreferredAuroraColor(e.target.value)}
                                                    className="bg-transparent text-white font-mono text-sm outline-none w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center pt-4">
                                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white font-semibold px-4">Voltar</button>
                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !userPrompt.trim()}
                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20"
                                >
                                    {isGenerating ? <Loader className="animate-spin" size={20}/> : <Cpu size={20}/>}
                                    {isGenerating ? 'Criando Mágica...' : 'Gerar Hero com IA'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Selection */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                             <h4 className="text-lg font-semibold text-white">3. Escolha uma opção</h4>
                             <p className="text-gray-400 text-sm">A IA gerou estas variações baseadas no seu pedido.</p>
                             
                             <div className="grid grid-cols-1 gap-6">
                                 {generatedOptions.map((option, idx) => (
                                     <div 
                                        key={idx}
                                        onClick={() => setSelectedOptionIndex(idx)}
                                        className={`border rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] ${selectedOptionIndex === idx ? 'border-purple-500 ring-2 ring-purple-500/50 bg-purple-900/10' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600'}`}
                                     >
                                         <div className="p-6 flex flex-col md:flex-row gap-6">
                                             {/* Preview Mini */}
                                             <div 
                                                className="w-full md:w-1/3 aspect-video rounded-lg flex flex-col items-center justify-center text-center p-4 relative overflow-hidden border border-zinc-700"
                                                style={{ backgroundColor: option.backgroundColor || '#000' }}
                                             >
                                                 {/* Aurora Mock */}
                                                 {(option.auroraElements || []).map((el, i) => (
                                                     <div key={i} className="absolute w-20 h-20 rounded-full blur-2xl opacity-40" style={{ background: el.color, top: Math.random()*100+'%', left: Math.random()*100+'%' }}></div>
                                                 ))}
                                                 
                                                 <h5 className="relative z-10 font-bold text-sm mb-1 whitespace-pre-line" style={{ color: option.titleColor || '#fff' }}>{option.title}</h5>
                                                 <div className="relative z-10 flex justify-center gap-1 mt-2">
                                                     {(option.carouselItems || []).slice(0,3).map((item, i) => (
                                                         <img key={i} src={item.src} className="w-8 h-8 object-contain" onError={e => e.currentTarget.style.display='none'}/>
                                                     ))}
                                                 </div>
                                             </div>
                                             
                                             {/* Details */}
                                             <div className="flex-1 space-y-2">
                                                 <div className="flex justify-between">
                                                     <span className="text-purple-400 font-bold text-xs uppercase tracking-wider">Opção {String.fromCharCode(65 + idx)}</span>
                                                     {selectedOptionIndex === idx && <CheckCircle size={20} className="text-purple-500" />}
                                                 </div>
                                                 {/* Display title with \n for preview if needed, or plain text */}
                                                 <h4 className="font-bold text-white text-lg whitespace-pre-line">{option.title}</h4>
                                                 <p className="text-sm text-gray-400 italic">"{(option.phrases || [])[0]}"</p>
                                                 
                                                 <div className="flex gap-2 mt-3">
                                                     <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 border border-zinc-700 flex items-center gap-1"><ImageIcon size={10}/> {option.carouselItems.length} Imagens</span>
                                                     <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 border border-zinc-700">Btn: {option.buttonPrimary}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>

                             <div className="flex justify-between items-center pt-4">
                                <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white font-semibold px-4">Voltar e Editar Prompt</button>
                                <button 
                                    onClick={handleConfirm}
                                    disabled={selectedOptionIndex === null}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Aplicar Hero Selecionado
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};

export default AIHeroWizard;
