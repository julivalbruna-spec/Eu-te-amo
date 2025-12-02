import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { ThemeColors } from '../../types';
import { X, Cpu, Loader, Upload, Save, ArrowLeft, ArrowRight } from 'react-feather';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

interface AIThemeWizardProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    onSave: (theme: Partial<ThemeColors>) => void;
}

const themeKeyLabels: { [key in keyof ThemeColors]?: string } = {
    background: 'Fundo Principal',
    surface: 'Fundo de Superfície (Cards)',
    primaryText: 'Texto Principal',
    secondaryText: 'Texto Secundário',
    brand: 'Cor da Marca (Destaque)',
    border: 'Cor da Borda',
    headerBackground: 'Fundo do Cabeçalho',
    sidebarBackground: 'Fundo do Menu Lateral',
    sidebarText: 'Texto do Menu Lateral',
    buttonPrimaryBackground: 'Botão Principal (Fundo)',
    buttonPrimaryText: 'Botão Principal (Texto)',
    buttonSecondaryBackground: 'Botão Secundário (Fundo)',
    buttonSecondaryText: 'Botão Secundário (Texto)',
    buttonSecondaryBorder: 'Botão Secundário (Borda)',
    buttonSecondaryBackgroundHover: 'Botão Secundário (Fundo Hover)',
    buttonSecondaryTextHover: 'Botão Secundário (Texto Hover)',
    buttonSecondaryBorderHover: 'Botão Secundário (Borda Hover)',
    productCardDetailsText: 'Texto "Ver Detalhes"',
    productCardDetailsTextHover: 'Texto "Ver Detalhes" (Hover)',
    productCardHoverGlow: 'Brilho do Card (Hover)',
    footerBackground: 'Fundo do Rodapé',
    footerText: 'Texto do Rodapé',
    footerButtonBackground: 'Botão do Rodapé (Fundo)',
    footerButtonText: 'Botão do Rodapé (Texto)',
};

const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; }> = ({ label, value, onChange }) => (
    <div>
        <label className="text-sm text-gray-400 block mb-1">{label}</label>
        <div className="flex items-center gap-2 bg-black border border-[#27272a] rounded-lg p-1">
            <input 
                type="color" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-8 h-8 bg-transparent border-none cursor-pointer" 
            />
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-full bg-transparent text-sm focus:outline-none" 
            />
        </div>
    </div>
);


const AIThemeWizard: React.FC<AIThemeWizardProps> = ({ isOpen, onClose, showToast, onSave }) => {
    const [step, setStep] = useState(1);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [suggestedTheme, setSuggestedTheme] = useState<Partial<ThemeColors> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const resetWizard = () => {
        setStep(1);
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setSuggestedTheme(null);
        setIsProcessing(false);
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleGenerateTheme = async () => {
        if (!imageFile) {
            showToast('Por favor, envie uma imagem.', 'error');
            return;
        }
        setIsProcessing(true);

        try {
            const base64Data = await blobToBase64(imageFile);
            
             const prompt = `
                Você é um UI/UX designer. Analise a imagem e extraia 5 cores chave para um tema de site escuro.
                Gere um objeto JSON com as seguintes chaves, usando cores hexadecimais:
                - "brand": A cor de destaque principal da imagem.
                - "background": Um tom muito escuro (ex: #0a0a0a).
                - "surface": Um tom escuro, mas mais claro que o background (ex: #1a1a1a).
                - "primaryText": Uma cor de texto clara com alto contraste (ex: #FFFFFF).
                - "secondaryText": Uma cor de texto secundária (ex: #A1A1AA).
            `;
            
            const themeSchema = {
                type: Type.OBJECT,
                properties: {
                    brand: { type: Type.STRING },
                    background: { type: Type.STRING },
                    surface: { type: Type.STRING },
                    primaryText: { type: Type.STRING },
                    secondaryText: { type: Type.STRING },
                },
                required: ['brand', 'background', 'surface', 'primaryText', 'secondaryText']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ inlineData: { data: base64Data, mimeType: imageFile.type } }, { text: prompt }] },
                config: { responseMimeType: 'application/json', responseSchema: themeSchema }
            });
            
            const baseTheme = JSON.parse(response.text) as { brand: string, background: string, surface: string, primaryText: string, secondaryText: string };

            const getContrastColor = (hex: string) => {
                if (!hex || hex.length < 4) return '#000000';
                const hexVal = hex.replace("#", "");
                const r = parseInt(hexVal.substr(0, 2), 16);
                const g = parseInt(hexVal.substr(2, 2), 16);
                const b = parseInt(hexVal.substr(4, 2), 16);
                const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                return (yiq >= 128) ? '#000000' : '#FFFFFF';
            };

            const adjustColor = (color: string, amount: number) => {
                 if (!color || color.length < 4) return '#000000';
                 return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
            };

            const fullTheme: Partial<ThemeColors> = {
                ...baseTheme,
                border: adjustColor(baseTheme.surface, 20),
                headerBackground: '#FFFFFF',
                sidebarBackground: baseTheme.surface,
                sidebarText: baseTheme.primaryText,
                buttonPrimaryBackground: baseTheme.brand,
                buttonPrimaryText: getContrastColor(baseTheme.brand),
                buttonSecondaryBackground: 'transparent',
                buttonSecondaryText: baseTheme.primaryText,
                buttonSecondaryBorder: baseTheme.primaryText,
                buttonSecondaryBackgroundHover: baseTheme.primaryText,
                buttonSecondaryTextHover: getContrastColor(baseTheme.primaryText),
                buttonSecondaryBorderHover: baseTheme.primaryText,
                productCardDetailsText: baseTheme.secondaryText,
                productCardDetailsTextHover: baseTheme.primaryText,
                productCardHoverGlow: baseTheme.brand,
                footerBackground: baseTheme.background,
                footerText: baseTheme.primaryText,
                footerButtonBackground: baseTheme.brand,
                footerButtonText: getContrastColor(baseTheme.brand),
            };

            setSuggestedTheme(fullTheme);
            setStep(2);
            
        } catch (error) {
            console.error("AI theme generation error:", error);
            showToast('Erro ao gerar tema com a IA. Tente novamente.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleColorChange = (key: keyof ThemeColors, value: string) => {
        setSuggestedTheme(prev => prev ? { ...prev, [key]: value } : null);
    };

    const handleApplyTheme = () => {
        if (suggestedTheme) {
            onSave(suggestedTheme);
            resetWizard();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <Cpu className="text-pink-400" /> Assistente de Tema com IA
                    </h3>
                    <button onClick={resetWizard}><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                         <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2 block text-lg">1. Envie uma imagem da sua marca (logo, banner, etc)</h3>
                                <div className="border-2 border-dashed border-[#27272a] rounded-lg p-6 text-center flex items-center justify-center gap-4">
                                    <label className="bg-pink-600 text-white font-semibold py-2 px-5 rounded-full hover:bg-pink-500 transition-colors cursor-pointer inline-flex items-center">
                                        <Upload size={20} className="mr-2" />
                                        Escolher arquivo
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                    {imageFile && <span className="text-sm text-gray-400">{imageFile.name}</span>}
                                </div>
                                {imagePreview && (
                                    <div className="mt-4 text-center">
                                        <p className="text-sm mb-2 text-gray-300">Pré-visualização:</p>
                                        <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-md bg-black p-2" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {step === 2 && suggestedTheme && (
                         <div>
                            <h4 className="font-bold text-lg mb-4">2. Revise e aplique o tema sugerido</h4>
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Object.entries(themeKeyLabels).map(([key, label]) => {
                                    const themeKey = key as keyof ThemeColors;
                                    const colorValue = suggestedTheme[themeKey];
                                    if (!colorValue) return null;
                                    if (typeof colorValue !== 'string') return null;
                                    return (
                                        <ColorInput
                                            key={key}
                                            label={label}
                                            value={colorValue}
                                            onChange={(v) => handleColorChange(themeKey, v)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                
                 <div className="p-4 mt-auto border-t border-[#27272a] flex justify-between items-center">
                     {step === 2 ? (
                         <button onClick={() => setStep(1)} disabled={isProcessing} className="flex items-center gap-2 font-semibold text-gray-300 hover:text-white disabled:opacity-50">
                            <ArrowLeft size={18} /> Voltar
                        </button>
                    ) : <div />}
                    
                     {step === 1 ? (
                        <button onClick={handleGenerateTheme} disabled={isProcessing || !imageFile} className="flex items-center bg-pink-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-pink-500 transition-colors disabled:opacity-50">
                            {isProcessing ? <><Loader size={18} className="animate-spin mr-2" /> Gerando...</> : <>Gerar Tema <ArrowRight size={18} className="ml-2"/></>}
                        </button>
                    ) : (
                        <button onClick={handleApplyTheme} className="flex items-center bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-500 transition-colors">
                            <Save size={18} className="mr-2" /> Aplicar Tema
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIThemeWizard;