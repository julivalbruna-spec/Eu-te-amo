
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleGenAI, Type } from '@google/genai';
import { ThemeColors, BuyButtonConfig, SiteInfo, StoreLayoutSettings } from '../../../types';
import { X, Cpu, Loader, Layers, Zap } from 'react-feather';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface GeneratedTheme {
    name: string;
    description: string;
    colors: Partial<ThemeColors>;
    buyButtonConfig: BuyButtonConfig;
    cardBorderStyle: StoreLayoutSettings['cardBorderStyle'];
    cardBorderColors: { primary: string; secondary: string };
    discountBadgeColors: { background: string; text: string };
}

interface AIThemeGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    siteInfo: SiteInfo;
    onApply: (themes: GeneratedTheme[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const AIThemeGeneratorModal: React.FC<AIThemeGeneratorModalProps> = ({ isOpen, onClose, siteInfo, onApply, showToast }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            const currentColors = JSON.stringify(siteInfo.theme, null, 2);

            const prompt = `
                Você é um Diretor de Arte e UI Designer Sênior.
                
                **CONTEXTO:**
                Nome da Loja: "${siteInfo.storeName}"
                Cores Atuais do Banco de Dados (Referência):
                ${currentColors}
                
                **TAREFA:**
                Gere 4 propostas de Identidade Visual (Temas) COMPLETAMENTE DIFERENTES para este e-commerce. Use as cores atuais apenas para entender o estilo atual, mas crie variações distintas (ex: uma mais escura, uma mais clara, uma colorida, uma minimalista).
                
                **REGRA CRÍTICA DE CONTRASTE E LEITURA:**
                Você DEVE alterar as cores dos textos para garantir leitura perfeita em todo o site.
                - Se o 'background' ou 'surface' for escuro -> 'primaryText' e 'secondaryText' DEVEM ser claros (ex: #FFFFFF, #E0E0E0).
                - Se o 'background' ou 'surface' for claro -> 'primaryText' e 'secondaryText' DEVEM ser escuros (ex: #000000, #333333).
                - Isso se aplica também a 'headerTextColor', 'footerText', e cores de botões.
                
                Para cada tema, defina no JSON:
                1. **Paleta Completa:** Fundo, Texto (Principal e Secundário), Marca, Superfícies. 
                   *Atenção:* Defina 'productCardBackground' explicitamente.
                2. **Botão de Compra:** Configuração visual completa (presets, gradientes, cores de texto legíveis sobre o botão).
                3. **Bordas dos Cards:** Estilo ('cardBorderStyle') e cores da borda. Opções válidas: 'modern_clean', 'glow_hover', 'glass_prism', 'cyber_frame', 'retro_arcade', 'spin', 'neon', 'gradient' ou 'none'.
                
                As 4 opções devem ser variadas em estilo (ex: Dark Mode, Light Mode, Colorido, Monocromático).

                Retorne um ARRAY JSON com 4 objetos.
            `;

            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        colors: {
                            type: Type.OBJECT,
                            properties: {
                                background: { type: Type.STRING },
                                surface: { type: Type.STRING },
                                primaryText: { type: Type.STRING },
                                secondaryText: { type: Type.STRING },
                                brand: { type: Type.STRING },
                                border: { type: Type.STRING },
                                headerBackground: { type: Type.STRING },
                                headerTextColor: { type: Type.STRING },
                                sidebarBackground: { type: Type.STRING },
                                sidebarText: { type: Type.STRING },
                                productCardBackground: { type: Type.STRING },
                                productCardDetailsText: { type: Type.STRING },
                                footerBackground: { type: Type.STRING },
                                footerText: { type: Type.STRING },
                            },
                            required: ['background', 'surface', 'primaryText', 'secondaryText', 'brand', 'headerBackground', 'headerTextColor', 'productCardBackground']
                        },
                        buyButtonConfig: {
                            type: Type.OBJECT,
                            properties: {
                                stylePreset: { type: Type.STRING, enum: ['standard', 'shiny', 'neon', 'cyber', 'pulse'] },
                                primaryColor: { type: Type.STRING },
                                secondaryColor: { type: Type.STRING },
                                highlightColor: { type: Type.STRING },
                                textColor: { type: Type.STRING },
                            },
                            required: ['stylePreset', 'primaryColor', 'secondaryColor', 'textColor']
                        },
                        cardBorderStyle: { type: Type.STRING, enum: ['modern_clean', 'glow_hover', 'glass_prism', 'cyber_frame', 'retro_arcade', 'spin', 'neon', 'gradient', 'none'] },
                        cardBorderColors: {
                            type: Type.OBJECT,
                            properties: {
                                primary: { type: Type.STRING },
                                secondary: { type: Type.STRING },
                            },
                            required: ['primary', 'secondary']
                        },
                        discountBadgeColors: {
                            type: Type.OBJECT,
                            properties: {
                                background: { type: Type.STRING },
                                text: { type: Type.STRING },
                            },
                            required: ['background', 'text']
                        }
                    },
                    required: ['name', 'description', 'colors', 'buyButtonConfig', 'cardBorderStyle', 'cardBorderColors']
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema
                }
            });

            const themes = JSON.parse(response.text) as GeneratedTheme[];
            
            // Post-processing to ensure complete color objects (filling missing fields with defaults/inferred)
            const processedThemes = themes.map(t => {
                const c = t.colors;
                const brand = c.brand || '#ffffff';
                const bg = c.background || '#000000';
                const text = c.primaryText || '#ffffff';
                
                return {
                    ...t,
                    colors: {
                        ...c,
                        // Fill critical fallbacks if AI missed them
                        headerScrolledBackground: c.headerBackground,
                        headerScrolledTextColor: c.headerTextColor,
                        headerOpacity: 95,
                        headerScrolledOpacity: 95,
                        buttonPrimaryBackground: t.buyButtonConfig.primaryColor,
                        buttonPrimaryText: t.buyButtonConfig.textColor,
                        buttonPrimaryBackgroundHover: t.buyButtonConfig.secondaryColor,
                        buttonPrimaryTextHover: t.buyButtonConfig.textColor,
                        buttonSecondaryBackground: 'transparent',
                        buttonSecondaryText: text,
                        buttonSecondaryBorder: text,
                        buttonSecondaryBackgroundHover: text,
                        buttonSecondaryTextHover: bg,
                        buttonSecondaryBorderHover: text,
                        footerButtonBackground: brand,
                        footerButtonText: bg === '#000000' ? '#000000' : '#ffffff',
                        productCardHoverGlow: brand,
                        productCardDetailsTextHover: brand
                    }
                };
            });

            onApply(processedThemes);
            onClose();

        } catch (error) {
            console.error(error);
            showToast("Erro ao gerar temas. Tente novamente.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-lg p-8 flex flex-col items-center text-center shadow-2xl">
                
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full"></div>
                    <Cpu size={64} className="text-purple-400 relative z-10" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Gerador de Temas IA</h3>
                <p className="text-gray-400 mb-8">
                    A IA analisará sua <strong>paleta de cores atual</strong> e criará 4 variações completas, garantindo contraste perfeito e legibilidade em todo o site.
                </p>

                <div className="w-full flex gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors w-1/3">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 w-2/3 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader size={20} className="animate-spin"/> : <Zap size={20} />}
                        {isGenerating ? 'Criando Designs...' : 'Gerar 4 Temas Agora'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AIThemeGeneratorModal;
