
import React, { useState } from 'react';
import { SiteInfo, StoreLayoutSettings, BuyButtonConfig, ThemeColors, ThemePreset, AuroraElement, PurchaseModalSettings } from '../../../types';
import { Smartphone, Layout, Square, Circle, AlignLeft, AlignCenter, Eye, Zap, Sun, Box, ZoomIn, Disc, Maximize, Command, Layers, Anchor, Tag, Check, Monitor, Cpu, Trash2, Plus, CreditCard, Activity, MapPin, Type, ShoppingBag, Grid, List, DollarSign } from 'react-feather';
import SliderInput from '../SliderInput';
import { THEME_PRESETS } from '../../../constants';
import AIThemeGeneratorModal, { GeneratedTheme } from './AIThemeGeneratorModal';

interface StoreLayoutPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4 text-white"><span className="bg-zinc-800 px-3 py-1 rounded-md">{title}</span></h4>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (value: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
    </label>
);

const RadioCard: React.FC<{ 
    selected: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string;
    description?: string;
}> = ({ selected, onClick, icon, label, description }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all w-full ${selected ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'}`}
    >
        <div className={`mb-2 ${selected ? 'text-blue-400' : 'text-zinc-500'}`}>
            {icon}
        </div>
        <span className="text-sm font-bold">{label}</span>
        {description && <span className="text-xs opacity-70 mt-1">{description}</span>}
    </button>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; }> = ({ label, value, onChange }) => (
    <div>
        <label className="text-sm text-gray-400 block mb-1">{label}</label>
        <div className="flex items-center gap-2 bg-black border border-[#27272a] rounded-lg p-1">
            <input 
                type="color" 
                value={value || '#000000'} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-8 h-8 bg-transparent border-none cursor-pointer" 
            />
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder="Vazio = Padrão"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-zinc-700" 
            />
        </div>
    </div>
);

const StoreLayoutPanel: React.FC<StoreLayoutPanelProps> = ({ siteInfo, updateSiteInfo, showToast }) => {
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiThemes, setAiThemes] = useState<GeneratedTheme[]>([]);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const layout = siteInfo.storeLayout || {
        mobileColumns: 1,
        productListStyle: 'grid',
        cardBorderRadius: 'lg',
        cardContentAlign: 'left',
        showOriginalPrice: true,
        showInstallments: true,
        showDiscountBadge: true,
        showBuyButton: true,
        showAuroraBackground: false,
        auroraBlurStrength: 150,
        auroraElements: [],
        productModalScale: 100,
        secondaryPriceType: 'debit',
        cardBorderStyle: 'none',
        cardBorderColors: { primary: '#6121ff', secondary: '#4c0de2' },
        discountBadgeColors: { background: '#dc2626', text: '#ffffff' },
        buyButtonConfig: { stylePreset: 'standard' },
        categoryLinkColor: ''
    };

    const modalSettings = siteInfo.purchaseModalSettings || {
        backgroundColor: '#0a0a0a',
        textColor: '#FFFFFF',
        borderRadius: 'xl',
        buttonBorderRadius: 'lg',
        buttonBackgroundColor: '#ffae00',
        buttonTextColor: '#000000',
        imageBackgroundColor: 'rgba(255, 255, 255, 0.05)',
        buttonStyle: { stylePreset: 'standard' },
        inputBackgroundColor: '',
        inputTextColor: '',
        inputBorderColor: '',
        customButtonColors: {}
    };
    const customBtnColors = modalSettings.customButtonColors || {};

    const buyButtonConfig = layout.buyButtonConfig || {
        stylePreset: 'standard',
        primaryColor: siteInfo.theme.buttonPrimaryBackground,
        secondaryColor: siteInfo.theme.buttonPrimaryBackgroundHover || siteInfo.theme.buttonPrimaryBackground,
        highlightColor: '#ffffff',
        textColor: siteInfo.theme.buttonPrimaryText
    };
    
    const borderColors = layout.cardBorderColors || { primary: '#6121ff', secondary: '#4c0de2' };
    const discountColors = layout.discountBadgeColors || { background: '#dc2626', text: '#ffffff' };

    const updateLayout = (key: keyof StoreLayoutSettings, value: any) => {
        updateSiteInfo(prev => ({
            ...prev,
            storeLayout: {
                ...(prev.storeLayout || layout),
                [key]: value
            }
        }));
    };
    
    const updateModalSettings = (key: keyof PurchaseModalSettings, value: any) => {
        updateSiteInfo(prev => ({
            ...prev,
            purchaseModalSettings: {
                ...(prev.purchaseModalSettings || modalSettings),
                [key]: value
            }
        }));
    };
    
    const updateCustomButtonColor = (key: string, value: string) => {
        updateSiteInfo(prev => {
             const currentModal = prev.purchaseModalSettings || modalSettings;
             const currentCustom = currentModal.customButtonColors || {};
             return {
                 ...prev,
                 purchaseModalSettings: {
                     ...currentModal,
                     customButtonColors: {
                         ...currentCustom,
                         [key]: value
                     }
                 }
             }
        });
    }

    const handleThemeChange = (key: keyof ThemeColors, value: any) => {
        updateSiteInfo(prev => ({ ...prev, theme: { ...prev.theme, [key]: value } }));
    };

    const handleApplyPreset = (preset: ThemePreset) => {
        updateSiteInfo(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                ...preset.colors
            }
        }));
    };

    const handleAdminThemeChange = (theme: 'midnight' | 'intelli' | 'crypto') => {
        updateSiteInfo(prev => ({ ...prev, adminTheme: theme }));
    }

    const handleAiResult = (themes: GeneratedTheme[]) => {
        setAiThemes(themes);
        // Automatically apply the first one
        if (themes.length > 0) {
            handleApplyAiTheme(themes[0]);
        }
        showToast(`${themes.length} temas gerados! Selecione abaixo para personalizar.`, 'success');
    };

    const handleApplyAiTheme = (generatedTheme: GeneratedTheme) => {
        updateSiteInfo(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                ...generatedTheme.colors
            },
            storeLayout: {
                ...(prev.storeLayout || layout),
                buyButtonConfig: generatedTheme.buyButtonConfig,
                cardBorderStyle: generatedTheme.cardBorderStyle,
                cardBorderColors: generatedTheme.cardBorderColors,
                discountBadgeColors: generatedTheme.discountBadgeColors
            }
        }));
    };
    
    const updateBorderColors = (key: 'primary' | 'secondary', value: string) => {
        updateSiteInfo(prev => ({
            ...prev,
            storeLayout: {
                ...(prev.storeLayout || layout),
                cardBorderColors: {
                    ...borderColors,
                    [key]: value
                }
            }
        }));
    };
    
    const updateDiscountColors = (key: 'background' | 'text', value: string) => {
        updateSiteInfo(prev => ({
            ...prev,
            storeLayout: {
                ...(prev.storeLayout || layout),
                discountBadgeColors: {
                    ...discountColors,
                    [key]: value
                }
            }
        }));
    };

    const updateButtonConfig = (key: keyof BuyButtonConfig, value: any) => {
        const newConfig = { ...buyButtonConfig, [key]: value };
        updateSiteInfo(prev => ({
            ...prev,
            storeLayout: {
                ...(prev.storeLayout || layout),
                buyButtonConfig: newConfig
            }
        }));
    };


    // Aurora Management
    const updateAuroraElement = (index: number, field: keyof AuroraElement, value: any) => {
        const newElements = [...(layout.auroraElements || [])];
        if (newElements[index]) {
            (newElements[index] as any)[field] = value;
            updateLayout('auroraElements', newElements);
        }
    };

    const addAuroraElement = () => {
        const newElement: AuroraElement = { color: '#ffae00', sizeMobile: 400, sizeDesktop: 600 };
        const newElements = [...(layout.auroraElements || []), newElement];
        updateLayout('auroraElements', newElements);
    };

    const removeAuroraElement = (index: number) => {
        const newElements = (layout.auroraElements || []).filter((_, i) => i !== index);
        updateLayout('auroraElements', newElements);
    };

    return (
        <div>
            <AIThemeGeneratorModal 
                isOpen={isAiModalOpen} 
                onClose={() => setIsAiModalOpen(false)} 
                siteInfo={siteInfo}
                onApply={handleAiResult}
                showToast={showToast}
            />

            <p className="text-sm text-gray-400 -mt-2 mb-6">Personalize a aparência completa da loja (cliente) e escolha o estilo do seu painel.</p>

            <SubSection title="Calculadora / Modal de Compra">
                <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800 mb-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h5 className="font-bold text-white flex items-center gap-2"><Maximize size={18}/> Tamanho Geral (Escala)</h5>
                            <p className="text-xs text-gray-400 mt-1">Aumente ou diminua o modal inteiro proporcionalmente.</p>
                        </div>
                        <div className="w-1/2">
                            <SliderInput 
                                label="Zoom %" 
                                value={layout.productModalScale} 
                                onChange={v => updateLayout('productModalScale', v)} 
                                min={50} max={150} unit="%" placeholder="100" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800 pt-6">
                        <div className="space-y-4">
                            <h5 className="font-bold text-sm text-zinc-300 border-b border-zinc-700 pb-2">Cores Gerais</h5>
                            <ColorInput label="Fundo do Modal" value={modalSettings.backgroundColor || '#0a0a0a'} onChange={v => updateModalSettings('backgroundColor', v)} />
                            <ColorInput label="Cor dos Textos Principais" value={modalSettings.textColor || '#ffffff'} onChange={v => updateModalSettings('textColor', v)} />
                            <ColorInput label="Fundo da Área da Imagem" value={modalSettings.imageBackgroundColor || ''} onChange={v => updateModalSettings('imageBackgroundColor', v)} />
                        </div>
                        <div className="space-y-4">
                            <h5 className="font-bold text-sm text-zinc-300 border-b border-zinc-700 pb-2">Campos de Entrada (Inputs)</h5>
                            <ColorInput label="Fundo dos Inputs" value={modalSettings.inputBackgroundColor || ''} onChange={v => updateModalSettings('inputBackgroundColor', v)} />
                            <ColorInput label="Cor do Texto Input" value={modalSettings.inputTextColor || ''} onChange={v => updateModalSettings('inputTextColor', v)} />
                            <ColorInput label="Cor da Borda Input" value={modalSettings.inputBorderColor || ''} onChange={v => updateModalSettings('inputBorderColor', v)} />
                        </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-6">
                        <h5 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2"><DollarSign size={16}/> Cores dos Botões (Individual)</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Botão À Vista */}
                             <div className="bg-black/40 p-3 rounded-lg border border-zinc-700/50">
                                <h6 className="text-xs font-bold text-green-400 mb-2">1. Botão "À Vista" (WhatsApp)</h6>
                                <div className="space-y-2">
                                    <ColorInput label="Fundo" value={customBtnColors.cashBackground || ''} onChange={v => updateCustomButtonColor('cashBackground', v)} />
                                    <ColorInput label="Texto" value={customBtnColors.cashText || ''} onChange={v => updateCustomButtonColor('cashText', v)} />
                                </div>
                            </div>
                            {/* Botão Parcelas */}
                             <div className="bg-black/40 p-3 rounded-lg border border-zinc-700/50">
                                <h6 className="text-xs font-bold text-yellow-400 mb-2">2. Botão "Calcular Parcelas"</h6>
                                <div className="space-y-2">
                                    <ColorInput label="Fundo" value={customBtnColors.installmentsBackground || ''} onChange={v => updateCustomButtonColor('installmentsBackground', v)} />
                                    <ColorInput label="Texto" value={customBtnColors.installmentsText || ''} onChange={v => updateCustomButtonColor('installmentsText', v)} />
                                </div>
                            </div>
                            {/* Botão Confirmar */}
                             <div className="bg-black/40 p-3 rounded-lg border border-zinc-700/50">
                                <h6 className="text-xs font-bold text-blue-400 mb-2">3. Botão "Confirmar" (Final)</h6>
                                <div className="space-y-2">
                                    <ColorInput label="Fundo" value={customBtnColors.whatsappBackground || ''} onChange={v => updateCustomButtonColor('whatsappBackground', v)} />
                                    <ColorInput label="Texto" value={customBtnColors.whatsappText || ''} onChange={v => updateCustomButtonColor('whatsappText', v)} />
                                </div>
                            </div>
                            {/* Toggles Crédito/Débito */}
                             <div className="bg-black/40 p-3 rounded-lg border border-zinc-700/50 col-span-full md:col-span-3">
                                <h6 className="text-xs font-bold text-gray-300 mb-2">Botões de Seleção (Crédito/Débito)</h6>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <ColorInput label="Fundo (Inativo)" value={customBtnColors.toggleButtonBackground || ''} onChange={v => updateCustomButtonColor('toggleButtonBackground', v)} />
                                    <ColorInput label="Texto (Inativo)" value={customBtnColors.toggleButtonText || ''} onChange={v => updateCustomButtonColor('toggleButtonText', v)} />
                                    <ColorInput label="Fundo (Ativo)" value={customBtnColors.toggleButtonActiveBackground || ''} onChange={v => updateCustomButtonColor('toggleButtonActiveBackground', v)} />
                                    <ColorInput label="Texto (Ativo)" value={customBtnColors.toggleButtonActiveText || ''} onChange={v => updateCustomButtonColor('toggleButtonActiveText', v)} />
                                    <ColorInput label="Borda (Geral)" value={customBtnColors.toggleButtonBorder || ''} onChange={v => updateCustomButtonColor('toggleButtonBorder', v)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SubSection>

            <SubSection title="Tema do Painel Administrativo">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                        onClick={() => handleAdminThemeChange('midnight')}
                        className={`p-4 rounded-xl border text-left transition-all flex gap-4 items-center ${(!siteInfo.adminTheme || siteInfo.adminTheme === 'midnight') ? 'bg-yellow-500/10 border-yellow-500 ring-1 ring-yellow-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                    >
                        <div className="w-12 h-12 bg-black border border-zinc-700 rounded flex items-center justify-center text-yellow-500">
                            <Layout />
                        </div>
                        <div>
                            <h5 className="font-bold text-white">Midnight (Padrão)</h5>
                            <p className="text-xs text-zinc-400">Estilo clássico, alto contraste.</p>
                        </div>
                        {(!siteInfo.adminTheme || siteInfo.adminTheme === 'midnight') && <Check className="ml-auto text-yellow-500" />}
                    </button>

                    <button 
                        onClick={() => handleAdminThemeChange('intelli')}
                        className={`p-4 rounded-xl border text-left transition-all flex gap-4 items-center ${siteInfo.adminTheme === 'intelli' ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                    >
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center text-orange-500">
                            <Monitor />
                        </div>
                        <div>
                            <h5 className="font-bold text-white">Intelli Dark</h5>
                            <p className="text-xs text-zinc-400">Moderno, arredondado.</p>
                        </div>
                        {siteInfo.adminTheme === 'intelli' && <Check className="ml-auto text-orange-500" />}
                    </button>

                    <button 
                        onClick={() => handleAdminThemeChange('crypto')}
                        className={`p-4 rounded-xl border text-left transition-all flex gap-4 items-center ${siteInfo.adminTheme === 'crypto' ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                    >
                        <div className="w-12 h-12 bg-[#030014] border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-500 shadow-lg shadow-purple-500/20">
                            <Activity />
                        </div>
                        <div>
                            <h5 className="font-bold text-white">Tema 3 (Crypto Future)</h5>
                            <p className="text-xs text-zinc-400">Glassmorphism, Neon.</p>
                        </div>
                        {siteInfo.adminTheme === 'crypto' && <Check className="ml-auto text-purple-500" />}
                    </button>
                </div>
            </SubSection>

            <SubSection title="Cores e Tema da Loja">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-400">Selecione um preset ou use a IA para gerar algo único.</p>
                    <button 
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:scale-105"
                    >
                        <Cpu size={18} /> Gerar 4 Temas com IA
                    </button>
                </div>

                {aiThemes.length > 0 && (
                    <div className="mb-6 animate-fade-in">
                        <h5 className="font-bold text-sm text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2"><Zap size={14}/> Sugestões Recentes da IA</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {aiThemes.map((theme, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleApplyAiTheme(theme)}
                                    className="group relative bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-xl p-4 text-left transition-all hover:bg-zinc-800"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="font-bold text-white text-sm block">{theme.name}</span>
                                            <span className="text-xs text-zinc-500 block truncate w-32">{theme.description}</span>
                                        </div>
                                        {siteInfo.theme.background === theme.colors.background && siteInfo.theme.brand === theme.colors.brand && (
                                            <Check size={14} className="text-purple-500" />
                                        )}
                                    </div>
                                    <div className="flex gap-1 h-8 rounded overflow-hidden border border-zinc-700/50 opacity-80 group-hover:opacity-100">
                                        <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors.background }}></div>
                                        <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors.surface }}></div>
                                        <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors.brand }}></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {THEME_PRESETS.map(preset => (
                        <button 
                            key={preset.id}
                            onClick={() => handleApplyPreset(preset)}
                            className="group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-all hover:bg-zinc-800"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.previewColor }}></div>
                                    <span className="font-bold text-zinc-200">{preset.name}</span>
                                </div>
                                {siteInfo.theme.background === preset.colors.background && siteInfo.theme.brand === preset.colors.brand && (
                                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <Check size={10} /> Ativo
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1 h-8 rounded overflow-hidden border border-zinc-700/50 opacity-80 group-hover:opacity-100">
                                <div className="w-1/3 h-full" style={{ backgroundColor: preset.colors.background }}></div>
                                <div className="w-1/3 h-full" style={{ backgroundColor: preset.colors.surface }}></div>
                                <div className="w-1/3 h-full" style={{ backgroundColor: preset.colors.brand }}></div>
                            </div>
                        </button>
                    ))}
                </div>
                
                <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                    <h5 className="font-bold text-sm text-zinc-300 mb-4">Editor Manual de Cores</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ColorInput label="Fundo Principal" value={siteInfo.theme.background} onChange={v => handleThemeChange('background', v)} />
                        <ColorInput label="Superfícies (Cards)" value={siteInfo.theme.surface} onChange={v => handleThemeChange('surface', v)} />
                        <ColorInput label="Cor da Marca" value={siteInfo.theme.brand} onChange={v => handleThemeChange('brand', v)} />
                        <ColorInput label="Texto Principal" value={siteInfo.theme.primaryText} onChange={v => handleThemeChange('primaryText', v)} />
                        <ColorInput label="Texto Secundário" value={siteInfo.theme.secondaryText} onChange={v => handleThemeChange('secondaryText', v)} />
                        <ColorInput label="Bordas Gerais" value={siteInfo.theme.border} onChange={v => handleThemeChange('border', v)} />
                        <ColorInput label="Fundo do Card de Produto" value={siteInfo.theme.productCardBackground || ''} onChange={v => handleThemeChange('productCardBackground', v)} />
                    </div>
                </div>
            </SubSection>

            <SubSection title="Estilo de Listagem dos Produtos">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RadioCard 
                        selected={layout.productListStyle !== 'horizontal_scroll'} 
                        onClick={() => updateLayout('productListStyle', 'grid')}
                        icon={<Grid size={24} />}
                        label="Grade (Padrão)"
                        description="Produtos organizados em colunas verticais."
                    />
                    <RadioCard 
                        selected={layout.productListStyle === 'horizontal_scroll'} 
                        onClick={() => updateLayout('productListStyle', 'horizontal_scroll')}
                        icon={<List size={24} className="rotate-90"/>} // Using List icon rotated to represent horizontal scroll
                        label="Linha Deslizante (Estilo Netflix)"
                        description="Produtos em uma linha que desliza para o lado."
                    />
                </div>
            </SubSection>

            {layout.productListStyle !== 'horizontal_scroll' && (
                <SubSection title="Grade de Produtos (Mobile)">
                    <div className="grid grid-cols-2 gap-4">
                        <RadioCard 
                            selected={layout.mobileColumns === 1} 
                            onClick={() => updateLayout('mobileColumns', 1)}
                            icon={<Layout size={24} />}
                            label="Lista (1 Coluna)"
                            description="Ideal para destacar detalhes"
                        />
                        <RadioCard 
                            selected={layout.mobileColumns === 2} 
                            onClick={() => updateLayout('mobileColumns', 2)}
                            icon={<GridIcon />}
                            label="Grade (2 Colunas)"
                            description="Mostra mais produtos"
                        />
                    </div>
                </SubSection>
            )}
            
            <SubSection title="Estilo da Borda dos Cards">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'none' || !layout.cardBorderStyle} 
                        onClick={() => updateLayout('cardBorderStyle', 'none')}
                        icon={<Square size={20} />}
                        label="Padrão"
                        description="Sem borda extra"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'modern_clean'} 
                        onClick={() => updateLayout('cardBorderStyle', 'modern_clean')}
                        icon={<Layout size={20} />}
                        label="Modern Clean"
                        description="Borda suave"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'glow_hover'} 
                        onClick={() => updateLayout('cardBorderStyle', 'glow_hover')}
                        icon={<Sun size={20} />}
                        label="Glow Hover"
                        description="Brilho externo"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'glass_prism'} 
                        onClick={() => updateLayout('cardBorderStyle', 'glass_prism')}
                        icon={<Layers size={20} />}
                        label="Glass Prism"
                        description="Borda superior"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'cyber_frame'} 
                        onClick={() => updateLayout('cardBorderStyle', 'cyber_frame')}
                        icon={<Maximize size={20} />}
                        label="Cyber Frame"
                        description="Borda angular"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'retro_arcade'} 
                        onClick={() => updateLayout('cardBorderStyle', 'retro_arcade')}
                        icon={<Anchor size={20} />}
                        label="Retro Arcade"
                        description="Fade inferior"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'spin'} 
                        onClick={() => updateLayout('cardBorderStyle', 'spin')}
                        icon={<Disc size={20} />}
                        label="Spinning"
                        description="Borda giratória"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'neon'} 
                        onClick={() => updateLayout('cardBorderStyle', 'neon')}
                        icon={<Zap size={20} />}
                        label="Neon Pulse"
                        description="Brilho rotativo"
                    />
                    <RadioCard 
                        selected={layout.cardBorderStyle === 'gradient'} 
                        onClick={() => updateLayout('cardBorderStyle', 'gradient')}
                        icon={<Command size={20} />}
                        label="Gradient Fix"
                        description="Borda fixa degradê"
                    />
                </div>
                
                {layout.cardBorderStyle && layout.cardBorderStyle !== 'none' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 animate-fade-in">
                        <ColorInput 
                            label="Cor 1 / Início do Gradiente" 
                            value={borderColors.primary || '#6121ff'} 
                            onChange={v => updateBorderColors('primary', v)} 
                        />
                        <ColorInput 
                            label="Cor 2 / Fim do Gradiente" 
                            value={borderColors.secondary || '#4c0de2'} 
                            onChange={v => updateBorderColors('secondary', v)} 
                        />
                    </div>
                )}
            </SubSection>

            <SubSection title="Estilo do Botão Comprar (Card)">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <RadioCard 
                        selected={buyButtonConfig.stylePreset === 'standard'} 
                        onClick={() => updateButtonConfig('stylePreset', 'standard')}
                        icon={<Box size={20} />}
                        label="Padrão"
                    />
                    <RadioCard 
                        selected={buyButtonConfig.stylePreset === 'shiny'} 
                        onClick={() => updateButtonConfig('stylePreset', 'shiny')}
                        icon={<Sun size={20} />}
                        label="Brilho Cósmico"
                    />
                    <RadioCard 
                        selected={buyButtonConfig.stylePreset === 'neon'} 
                        onClick={() => updateButtonConfig('stylePreset', 'neon')}
                        icon={<Zap size={20} />}
                        label="Neon Pulse"
                    />
                    <RadioCard 
                        selected={buyButtonConfig.stylePreset === 'cyber'} 
                        onClick={() => updateButtonConfig('stylePreset', 'cyber')}
                        icon={<Layout size={20} />}
                        label="Cyber Borda"
                    />
                     <RadioCard 
                        selected={buyButtonConfig.stylePreset === 'pulse'} 
                        onClick={() => updateButtonConfig('stylePreset', 'pulse')}
                        icon={<ActivityIcon />}
                        label="Degradê Pulsante"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <ColorInput 
                        label="Cor Principal / Início Degradê" 
                        value={buyButtonConfig.primaryColor || '#ffae00'} 
                        onChange={v => updateButtonConfig('primaryColor', v)} 
                    />
                    <ColorInput 
                        label="Cor Secundária / Fim Degradê" 
                        value={buyButtonConfig.secondaryColor || '#e69c00'} 
                        onChange={v => updateButtonConfig('secondaryColor', v)} 
                    />
                    <ColorInput 
                        label="Cor de Destaque (Brilho/Borda)" 
                        value={buyButtonConfig.highlightColor || '#ffffff'} 
                        onChange={v => updateButtonConfig('highlightColor', v)} 
                    />
                    <ColorInput 
                        label="Cor do Texto" 
                        value={buyButtonConfig.textColor || '#000000'} 
                        onChange={v => updateButtonConfig('textColor', v)} 
                    />
                </div>
            </SubSection>

            <SubSection title="Estilo do Card (Geral)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2 font-semibold">Arredondamento das Bordas</label>
                        <div className="grid grid-cols-5 gap-2">
                            {(['none', 'sm', 'md', 'lg', 'full'] as const).map((radius) => (
                                <button
                                    key={radius}
                                    onClick={() => updateLayout('cardBorderRadius', radius)}
                                    className={`h-10 border flex items-center justify-center transition-all ${layout.cardBorderRadius === radius ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                                    style={{ borderRadius: radius === 'none' ? '0' : radius === 'full' ? '9999px' : radius === 'lg' ? '0.75rem' : radius === 'md' ? '0.5rem' : '0.25rem' }}
                                    title={radius}
                                >
                                    <Square size={16} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2 font-semibold">Alinhamento do Texto</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => updateLayout('cardContentAlign', 'left')}
                                className={`h-10 rounded-lg border flex items-center justify-center gap-2 transition-all ${layout.cardContentAlign === 'left' ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                            >
                                <AlignLeft size={16} /> Esquerda
                            </button>
                            <button
                                onClick={() => updateLayout('cardContentAlign', 'center')}
                                className={`h-10 rounded-lg border flex items-center justify-center gap-2 transition-all ${layout.cardContentAlign === 'center' ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                            >
                                <AlignCenter size={16} /> Centro
                            </button>
                        </div>
                    </div>
                </div>
            </SubSection>

            <SubSection title="Selo de Desconto">
                <div className="mb-4">
                    <ToggleSwitch 
                        label="Exibir Selo de Desconto (ex: -10%)" 
                        checked={layout.showDiscountBadge} 
                        onChange={v => updateLayout('showDiscountBadge', v)} 
                    />
                </div>
                {layout.showDiscountBadge && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 animate-fade-in">
                        <ColorInput 
                            label="Cor de Fundo do Selo" 
                            value={discountColors.background} 
                            onChange={v => updateDiscountColors('background', v)} 
                        />
                        <ColorInput 
                            label="Cor do Texto do Selo" 
                            value={discountColors.text} 
                            onChange={v => updateDiscountColors('text', v)} 
                        />
                    </div>
                )}
            </SubSection>

            <SubSection title="Exibição de Preços e Textos">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2 font-semibold">Preço Secundário (abaixo do principal)</label>
                        <select 
                            value={layout.secondaryPriceType || 'debit'} 
                            onChange={e => updateLayout('secondaryPriceType', e.target.value)}
                            className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm text-white"
                        >
                            <option value="debit">Preço no Débito (com taxa)</option>
                            <option value="credit">Parcelado (12x)</option>
                            <option value="none">Ocultar</option>
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <ColorInput
                        label="Texto 'Ver Detalhes'"
                        value={siteInfo.theme.productCardDetailsText || ''}
                        onChange={v => handleThemeChange('productCardDetailsText', v)}
                    />
                    <ColorInput
                        label="Texto 'Ver Detalhes' (Hover)"
                        value={siteInfo.theme.productCardDetailsTextHover || ''}
                        onChange={v => handleThemeChange('productCardDetailsTextHover', v)}
                    />
                    {/* New Input for Category Link Color */}
                    <ColorInput
                        label="Cor do Link da Categoria (Ver todos)"
                        value={layout.categoryLinkColor || ''}
                        onChange={v => updateLayout('categoryLinkColor', v)}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-800">
                    <SliderInput 
                        label="Tamanho Título do Produto" 
                        value={layout.productTitleFontSize} 
                        onChange={v => updateLayout('productTitleFontSize', v)} 
                        min={12} max={30} unit="px" placeholder="16" 
                    />
                    <SliderInput 
                        label="Tamanho Preço Principal" 
                        value={layout.productPriceFontSize} 
                        onChange={v => updateLayout('productPriceFontSize', v)} 
                        min={14} max={40} unit="px" placeholder="20" 
                    />
                    <SliderInput 
                        label="Tamanho Preço Secundário" 
                        value={layout.secondaryPriceFontSize} 
                        onChange={v => updateLayout('secondaryPriceFontSize', v)} 
                        min={10} max={24} unit="px" placeholder="12" 
                    />
                </div>
            </SubSection>

            <SubSection title="Outros Elementos">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleSwitch 
                        label="Preço Original (De: R$...)" 
                        checked={layout.showOriginalPrice} 
                        onChange={v => updateLayout('showOriginalPrice', v)} 
                    />
                    <ToggleSwitch 
                        label="Texto de Parcelamento/Secundário" 
                        checked={layout.showInstallments} 
                        onChange={v => updateLayout('showInstallments', v)} 
                    />
                    <ToggleSwitch 
                        label="Botão Comprar" 
                        checked={layout.showBuyButton} 
                        onChange={v => updateLayout('showBuyButton', v)} 
                    />
                </div>
            </SubSection>
        </div>
    );
};

const GridIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const ActivityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

export default StoreLayoutPanel;