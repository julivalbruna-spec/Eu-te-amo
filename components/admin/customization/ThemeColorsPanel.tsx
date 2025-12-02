
import React, { useState } from 'react';
import { SiteInfo, ThemeColors, ThemePreset } from '../../../types';
import { THEME_PRESETS } from '../../../constants';
import SliderInput from '../SliderInput';
import { ChevronDown, ChevronUp, Layers, Check, Layout, ArrowDown, Anchor, MapPin, ShoppingBag, ShoppingCart } from 'react-feather';

interface ThemeColorsPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
}

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
                placeholder="Vazio = Remover"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-zinc-700" 
            />
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (value: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer gap-3 mt-1">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-yellow-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
        <span className="text-sm text-gray-400 font-medium">{label}</span>
    </label>
);

const SubSection: React.FC<{ title: string, icon?: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
            {icon}
            <span className="bg-zinc-800 px-3 py-1 rounded-md">{title}</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
);

const SubHeading: React.FC<{ title: string }> = ({ title }) => (
    <h5 className="col-span-full font-bold text-sm uppercase tracking-wider mt-4 mb-2 text-zinc-500 border-b border-zinc-800 pb-2">
        {title}
    </h5>
);

const AdvancedOptionsToggle: React.FC<{ title?: string; children: React.ReactNode }> = ({ title = "Opções Avançadas", children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mt-6 pt-6 border-t border-gray-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 rounded-lg text-sm font-semibold text-gray-300 bg-black hover:bg-gray-900/70 transition-colors border border-gray-800"
            >
                <span>{isOpen ? 'Ocultar' : 'Mostrar'} {title}</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <div className={`advanced-options-content ${isOpen ? 'visible' : ''}`}>
                <div className="pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};


const ThemeColorsPanel: React.FC<ThemeColorsPanelProps> = ({ siteInfo, updateSiteInfo }) => {
    
    const handleThemeChange = (key: keyof ThemeColors, value: any) => {
        updateSiteInfo(prev => ({ ...prev, theme: { ...prev.theme, [key]: value } }));
    };
    
    const handleCustomTextChange = (key: string, value: any) => {
        updateSiteInfo(prev => ({ 
            ...prev, 
            customTexts: { ...prev.customTexts, [key]: value } 
        }));
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

    return (
        <div>
            <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Layers size={18} className="text-purple-400"/> Galeria de Temas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            
                            <div className="flex gap-1 h-12 rounded-lg overflow-hidden border border-zinc-700/50 opacity-80 group-hover:opacity-100">
                                <div className="w-1/4 h-full" style={{ backgroundColor: preset.colors.sidebarBackground || '#000' }}></div>
                                <div className="w-3/4 h-full relative" style={{ backgroundColor: preset.colors.background }}>
                                    <div className="absolute top-2 left-2 right-2 h-2 rounded-sm" style={{ backgroundColor: preset.colors.surface }}></div>
                                    <div className="absolute bottom-2 right-2 w-8 h-4 rounded-full" style={{ backgroundColor: preset.colors.brand }}></div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-sm text-gray-400 -mt-2 mb-4 pt-4 border-t border-gray-800">Personalize a aparência da loja.</p>
            
            <SubSection title="Cabeçalho (Header)" icon={<Layout size={18}/>}>
                <SubHeading title="Estado Inicial (Topo)" />
                <ColorInput label="Cor de Fundo" value={siteInfo.theme.headerBackground} onChange={v => handleThemeChange('headerBackground', v)} />
                <ColorInput label="Cor do Texto/Ícones" value={siteInfo.theme.headerTextColor} onChange={v => handleThemeChange('headerTextColor', v)} />
                <div className="col-span-2">
                     <SliderInput label="Opacidade (0 = Transparente)" value={siteInfo.theme.headerOpacity} onChange={v => handleThemeChange('headerOpacity', v)} min={0} max={100} unit="%" />
                </div>

                <SubHeading title="Ao Rolar a Página (Scroll)" />
                <ColorInput label="Cor de Fundo" value={siteInfo.theme.headerScrolledBackground} onChange={v => handleThemeChange('headerScrolledBackground', v)} />
                <ColorInput label="Cor do Texto/Ícones" value={siteInfo.theme.headerScrolledTextColor} onChange={v => handleThemeChange('headerScrolledTextColor', v)} />
                <div className="col-span-2">
                    <SliderInput label="Opacidade (0 = Transparente)" value={siteInfo.theme.headerScrolledOpacity} onChange={v => handleThemeChange('headerScrolledOpacity', v)} min={0} max={100} unit="%" />
                </div>
            </SubSection>

            <SubSection title="Carrinho de Compras" icon={<ShoppingBag size={18}/>}>
                <SubHeading title="Janela do Carrinho" />
                <ColorInput label="Fundo da Janela" value={siteInfo.theme.cartBackground || ''} onChange={v => handleThemeChange('cartBackground', v)} />
                <ColorInput label="Cor do Texto" value={siteInfo.theme.cartTextColor || ''} onChange={v => handleThemeChange('cartTextColor', v)} />
                <ColorInput label="Cor da Borda" value={siteInfo.theme.cartBorderColor || ''} onChange={v => handleThemeChange('cartBorderColor', v)} />
                
                <SubHeading title="Cabeçalho do Carrinho" />
                <ColorInput label="Fundo do Cabeçalho" value={siteInfo.theme.cartHeaderBackground || ''} onChange={v => handleThemeChange('cartHeaderBackground', v)} />
                <ColorInput label="Texto do Cabeçalho" value={siteInfo.theme.cartHeaderTextColor || ''} onChange={v => handleThemeChange('cartHeaderTextColor', v)} />
                
                <SubHeading title="Botão Finalizar Compra" />
                <ColorInput label="Fundo do Botão" value={siteInfo.theme.cartCheckoutButtonBackground || ''} onChange={v => handleThemeChange('cartCheckoutButtonBackground', v)} />
                <ColorInput label="Texto do Botão" value={siteInfo.theme.cartCheckoutButtonText || ''} onChange={v => handleThemeChange('cartCheckoutButtonText', v)} />
            </SubSection>

            <SubSection title="Botão Adicionar ao Carrinho" icon={<ShoppingCart size={18}/>}>
                <div className="col-span-full mb-2 p-3 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-400">
                    Este é o botão secundário que aparece abaixo do botão "Comprar" nos cards de produto.
                </div>
                <SubHeading title="Estado Normal" />
                <ColorInput label="Fundo" value={siteInfo.theme.addToCartButtonBackground || ''} onChange={v => handleThemeChange('addToCartButtonBackground', v)} />
                <ColorInput label="Texto/Ícone" value={siteInfo.theme.addToCartButtonText || ''} onChange={v => handleThemeChange('addToCartButtonText', v)} />
                <ColorInput label="Borda" value={siteInfo.theme.addToCartButtonBorder || ''} onChange={v => handleThemeChange('addToCartButtonBorder', v)} />
                
                <SubHeading title="Estado Hover (Ao passar o mouse)" />
                <ColorInput label="Fundo (Hover)" value={siteInfo.theme.addToCartButtonHoverBackground || ''} onChange={v => handleThemeChange('addToCartButtonHoverBackground', v)} />
                <ColorInput label="Texto/Ícone (Hover)" value={siteInfo.theme.addToCartButtonHoverText || ''} onChange={v => handleThemeChange('addToCartButtonHoverText', v)} />
                <ColorInput label="Borda (Hover)" value={siteInfo.theme.addToCartButtonHoverBorder || ''} onChange={v => handleThemeChange('addToCartButtonHoverBorder', v)} />
            </SubSection>

            <SubSection title="Seção de Contato" icon={<MapPin size={18}/>}>
                <ColorInput label="Fundo da Seção" value={siteInfo.theme.contactSectionBackground || ''} onChange={v => handleThemeChange('contactSectionBackground', v)} />
                <ColorInput label="Cor do Texto Geral" value={siteInfo.theme.contactSectionText || ''} onChange={v => handleThemeChange('contactSectionText', v)} />
                <ColorInput label="Fundo dos Cards" value={siteInfo.theme.contactCardsBackground || ''} onChange={v => handleThemeChange('contactCardsBackground', v)} />
                <ColorInput label="Cor da Borda dos Cards" value={siteInfo.theme.contactCardsBorder || ''} onChange={v => handleThemeChange('contactCardsBorder', v)} />
                <ColorInput label="Cor dos Ícones" value={siteInfo.theme.contactIconsColor || ''} onChange={v => handleThemeChange('contactIconsColor', v)} />
            </SubSection>

            <SubSection title="Rodapé Fixo (Footer)" icon={<Anchor size={18}/>}>
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                    <div className="space-y-4">
                        <h5 className="font-bold text-white border-b border-zinc-700 pb-2 mb-2">Aparência Geral</h5>
                        <ColorInput label="Fundo do Rodapé" value={siteInfo.theme.footerBackground} onChange={v => handleThemeChange('footerBackground', v)} />
                        <SliderInput label="Opacidade do Fundo" value={siteInfo.theme.footerOpacity} onChange={v => handleThemeChange('footerOpacity', v)} min={0} max={100} unit="%" />
                        
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Texto Promocional</label>
                            <input type="text" value={siteInfo.customTexts.promoFooterText} onChange={e => handleCustomTextChange('promoFooterText', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" />
                        </div>
                        <ColorInput label="Cor do Texto Promocional" value={siteInfo.theme.footerText} onChange={v => handleThemeChange('footerText', v)} />
                    </div>

                    <div className="space-y-4">
                        <h5 className="font-bold text-white border-b border-zinc-700 pb-2 mb-2">Botão de Ação</h5>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Texto do Botão</label>
                            <input type="text" value={siteInfo.customTexts.promoFooterButton} onChange={e => handleCustomTextChange('promoFooterButton', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <ColorInput label="Cor do Botão" value={siteInfo.theme.footerButtonBackground} onChange={v => handleThemeChange('footerButtonBackground', v)} />
                            <ColorInput label="Texto do Botão" value={siteInfo.theme.footerButtonText} onChange={v => handleThemeChange('footerButtonText', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <ColorInput label="Botão (Hover)" value={siteInfo.theme.footerButtonBackgroundHover || ''} onChange={v => handleThemeChange('footerButtonBackgroundHover', v)} />
                            <ColorInput label="Texto (Hover)" value={siteInfo.theme.footerButtonTextHover || ''} onChange={v => handleThemeChange('footerButtonTextHover', v)} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Animação de Destaque</label>
                            <select 
                                value={siteInfo.theme.footerButtonAnimation || 'none'} 
                                onChange={e => handleThemeChange('footerButtonAnimation', e.target.value)}
                                className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm text-white"
                            >
                                <option value="none">Nenhuma</option>
                                <option value="pulse">Pulsar (Pulse)</option>
                                <option value="bounce">Saltar (Bounce)</option>
                                <option value="scale">Aumentar (Scale)</option>
                                <option value="shine">Brilho Passante (Shine)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </SubSection>

            <AdvancedOptionsToggle title="Cores Globais e Cards">
                <SubSection title="Paleta Principal">
                   <ColorInput label="Fundo Principal" value={siteInfo.theme.background} onChange={v => handleThemeChange('background', v)} />
                   <ColorInput label="Superfícies (Cards)" value={siteInfo.theme.surface} onChange={v => handleThemeChange('surface', v)} />
                   <ColorInput label="Texto Principal" value={siteInfo.theme.primaryText} onChange={v => handleThemeChange('primaryText', v)} />
                   <ColorInput label="Texto Secundário" value={siteInfo.theme.secondaryText} onChange={v => handleThemeChange('secondaryText', v)} />
                   <ColorInput label="Cor da Marca" value={siteInfo.theme.brand} onChange={v => handleThemeChange('brand', v)} />
                   <ColorInput label="Cor da Borda" value={siteInfo.theme.border} onChange={v => handleThemeChange('border', v)} />
                </SubSection>

                <SubSection title="Botões (Padrão)">
                    <SubHeading title="Botão Primário" />
                    <ColorInput label="Fundo" value={siteInfo.theme.buttonPrimaryBackground} onChange={v => handleThemeChange('buttonPrimaryBackground', v)} />
                    <ColorInput label="Texto" value={siteInfo.theme.buttonPrimaryText} onChange={v => handleThemeChange('buttonPrimaryText', v)} />
                    <ColorInput label="Fundo (Hover)" value={siteInfo.theme.buttonPrimaryBackgroundHover || ''} onChange={v => handleThemeChange('buttonPrimaryBackgroundHover', v)} />
                    <ColorInput label="Texto (Hover)" value={siteInfo.theme.buttonPrimaryTextHover || ''} onChange={v => handleThemeChange('buttonPrimaryTextHover', v)} />
                    
                    <div className="col-span-full mt-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <ToggleSwitch 
                            label="Ativar Borda no Botão Primário" 
                            checked={siteInfo.theme.buttonPrimaryBorderEnabled || false} 
                            onChange={v => handleThemeChange('buttonPrimaryBorderEnabled', v)} 
                        />
                        {siteInfo.theme.buttonPrimaryBorderEnabled && (
                            <div className="grid grid-cols-2 gap-4 mt-3 animate-fade-in">
                                <ColorInput label="Cor da Borda" value={siteInfo.theme.buttonPrimaryBorder || ''} onChange={v => handleThemeChange('buttonPrimaryBorder', v)} />
                                <ColorInput label="Cor da Borda (Hover)" value={siteInfo.theme.buttonPrimaryBorderHover || ''} onChange={v => handleThemeChange('buttonPrimaryBorderHover', v)} />
                            </div>
                        )}
                    </div>
                    
                    <SubHeading title="Botão Secundário" />
                     <ColorInput label="Fundo" value={siteInfo.theme.buttonSecondaryBackground} onChange={v => handleThemeChange('buttonSecondaryBackground', v)} />
                     <ColorInput label="Texto" value={siteInfo.theme.buttonSecondaryText} onChange={v => handleThemeChange('buttonSecondaryText', v)} />
                     <ColorInput label="Borda" value={siteInfo.theme.buttonSecondaryBorder} onChange={v => handleThemeChange('buttonSecondaryBorder', v)} />
                     <ColorInput label="Fundo (Hover)" value={siteInfo.theme.buttonSecondaryBackgroundHover} onChange={v => handleThemeChange('buttonSecondaryBackgroundHover', v)} />
                     <ColorInput label="Texto (Hover)" value={siteInfo.theme.buttonSecondaryTextHover} onChange={v => handleThemeChange('buttonSecondaryTextHover', v)} />
                     <ColorInput label="Borda (Hover)" value={siteInfo.theme.buttonSecondaryBorderHover} onChange={v => handleThemeChange('buttonSecondaryBorderHover', v)} />
                </SubSection>
                
                <SubSection title="Outros Componentes">
                    <ColorInput label="Fundo Menu Lateral" value={siteInfo.theme.sidebarBackground} onChange={v => handleThemeChange('sidebarBackground', v)} />
                    <ColorInput label="Texto Menu Lateral" value={siteInfo.theme.sidebarText} onChange={v => handleThemeChange('sidebarText', v)} />
                     <ColorInput label="Fundo Card de Produto" value={siteInfo.theme.productCardBackground || ''} onChange={v => handleThemeChange('productCardBackground', v)} />
                     <ColorInput label="Fundo do Modal (Pop-up)" value={siteInfo.theme.modalBackground || ''} onChange={v => handleThemeChange('modalBackground', v)} />
                     <ColorInput label="Texto 'Ver Detalhes'" value={siteInfo.theme.productCardDetailsText} onChange={v => handleThemeChange('productCardDetailsText', v)} />
                     <ColorInput label="'Ver Detalhes' (Hover)" value={siteInfo.theme.productCardDetailsTextHover} onChange={v => handleThemeChange('productCardDetailsTextHover', v)} />
                     <ColorInput label="Brilho Card (Hover)" value={siteInfo.theme.productCardHoverGlow || ''} onChange={v => handleThemeChange('productCardHoverGlow', v)} />
                </SubSection>
            </AdvancedOptionsToggle>
        </div>
    );
};

export default ThemeColorsPanel;
