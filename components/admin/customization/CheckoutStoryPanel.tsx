
import React, { useState } from 'react';
import { SiteInfo, CheckoutStorySettings, AuroraElement, CheckoutStoryAdjustments, BuyButtonConfig } from '../../../types';
import SliderInput from '../SliderInput';
import { ChevronDown, ChevronUp, Plus, Trash2, Box, Sun, Zap, Layout, Activity } from 'react-feather';

interface CheckoutStoryPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const AdvancedOptionsToggle: React.FC<{ title?: string; children: React.ReactNode }> = ({ title = "Opções Avançadas", children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mt-6 pt-6 border-t border-gray-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm font-semibold text-gray-400 hover:text-yellow-500 flex items-center gap-2"
            >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {isOpen ? 'Ocultar' : 'Mostrar'} {title}
            </button>
            <div className={`advanced-options-content ${isOpen ? 'visible' : ''}`}>
                <div className="pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-black border border-[#27272a]/50 rounded-lg mt-4 first:mt-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 font-semibold text-md bg-gray-900/50 rounded-t-lg">
                {title}
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && <div className="p-4 border-t border-[#27272a]/50">{children}</div>}
        </div>
    );
};

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-4 mt-4 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-base mb-3"><span className="bg-zinc-800 text-white px-3 py-1 rounded-md">{title}</span></h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
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
                placeholder="Vazio = Remover"
                className="w-full bg-transparent text-sm focus:outline-none placeholder-zinc-700" 
            />
        </div>
    </div>
);

const FontWeightSelector: React.FC<{ label: string, value: number | undefined, onChange: (value: number | undefined) => void }> = ({ label, value, onChange }) => {
    const weights = [
        { label: 'Fino (100)', value: 100 },
        { label: 'Extra Leve (200)', value: 200 },
        { label: 'Leve (300)', value: 300 },
        { label: 'Normal (400)', value: 400 },
        { label: 'Médio (500)', value: 500 },
        { label: 'Semi-negrito (600)', value: 600 },
        { label: 'Negrito (700)', value: 700 },
        { label: 'Extra Negrito (800)', value: 800 },
        { label: 'Preto (900)', value: 900 },
    ];
    return (
        <div>
            <label className="text-sm text-gray-400 block mb-1">{label}</label>
            <select
                value={value || ''}
                onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"
            >
                <option value="">Padrão</option>
                {weights.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
        </div>
    );
};

const RadioCard: React.FC<{ 
    selected: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string;
}> = ({ selected, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all w-full ${selected ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'}`}
    >
        <div className={`mb-2 ${selected ? 'text-blue-400' : 'text-zinc-500'}`}>
            {icon}
        </div>
        <span className="text-xs font-bold">{label}</span>
    </button>
);

const ActivityIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

const CheckoutStoryPanel: React.FC<CheckoutStoryPanelProps> = ({ siteInfo, updateSiteInfo, uploadImage, showToast }) => {
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const settings = siteInfo.checkoutStory || {};
    const adjustments = siteInfo.checkoutStoryAdjustments || {};
    
    // Ensure defaults
    const buyButtonConfig = settings.buttonStyleConfig || {
        stylePreset: 'standard',
        primaryColor: settings.buttonBackgroundColor || '#ffae00',
        secondaryColor: '#e69c00',
        highlightColor: '#ffffff',
        textColor: settings.buttonTextColor || '#000000'
    };

    const updateSetting = (key: keyof CheckoutStorySettings, value: any) => {
        updateSiteInfo(prev => ({
            ...prev,
            checkoutStory: {
                ...(prev.checkoutStory || {}),
                [key]: value
            }
        }));
    };
    
    const updateButtonConfig = (key: keyof BuyButtonConfig, value: any) => {
        const newConfig = { ...buyButtonConfig, [key]: value };
        updateSiteInfo(prev => ({
            ...prev,
            checkoutStory: {
                ...(prev.checkoutStory || {}),
                buttonStyleConfig: newConfig
            }
        }));
    };
    
    const updateAdjustment = (key: keyof CheckoutStoryAdjustments, subkey: 'x' | 'y' | undefined, value: number | undefined) => {
         updateSiteInfo(prev => {
            const newAdjustments = { ...(prev.checkoutStoryAdjustments || {}) };
            if (subkey) {
                const currentPos = (newAdjustments[key] as {x: number, y: number} | undefined) || { x: 0, y: 0 };
                const newPos = { ...currentPos, [subkey]: value ?? 0 };
                (newAdjustments as any)[key] = newPos;
            } else {
                 if (value === undefined || value === 0) {
                    delete (newAdjustments as any)[key];
                } else {
                    (newAdjustments as any)[key] = value;
                }
            }
            return { ...prev, checkoutStoryAdjustments: newAdjustments };
        });
    };

    const handleLogoUpload = async (file: File) => {
        try {
            setUploadProgress(0);
            const url = await uploadImage(file, setUploadProgress);
            updateSetting('logoUrl', url);
            showToast('Logo enviada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar logo.', 'error');
        } finally {
            setUploadProgress(null);
        }
    };
    
    const updateAuroraElementColor = (elementIndex: number, value: string) => {
        const newElements = [...(settings.auroraElements || [])];
        if(newElements[elementIndex]) {
            newElements[elementIndex].color = value;
            updateSetting('auroraElements', newElements);
        }
    };
    
    const updateAuroraElementSize = (elementIndex: number, field: 'sizeMobile' | 'sizeDesktop', value: number | undefined) => {
         updateSiteInfo(prev => {
            const newAdjustments = { ...(prev.checkoutStoryAdjustments || {}) };
            const auroraAdjustments = [...(newAdjustments.auroraElements || [])];
            while (auroraAdjustments.length <= elementIndex) {
                auroraAdjustments.push({ sizeMobile: 0, sizeDesktop: 0 });
            }
            (auroraAdjustments[elementIndex] as any)[field] = value ?? 0;
            newAdjustments.auroraElements = auroraAdjustments;
            return { ...prev, checkoutStoryAdjustments: newAdjustments };
        });
    };
    
    const addAuroraElement = () => {
        const newElement: AuroraElement = { color: '#ffae00', sizeMobile: 400, sizeDesktop: 500 };
        const newElements = [...(settings.auroraElements || []), newElement];
        updateSetting('auroraElements', newElements);
    };
    
    const removeAuroraElement = (elementIndex: number) => {
        const newBaseElements = (settings.auroraElements || []).filter((_, i) => i !== elementIndex);
        updateSetting('auroraElements', newBaseElements);
        
        updateSiteInfo(prev => {
             const newAdjustments = { ...(prev.checkoutStoryAdjustments || {}) };
             if (newAdjustments.auroraElements) {
                 newAdjustments.auroraElements = newAdjustments.auroraElements.filter((_, i) => i !== elementIndex);
             }
             return { ...prev, checkoutStoryAdjustments: newAdjustments };
        });
    };


    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400 -mt-2 mb-4">Personalize a página de "story" que aparece ao clicar em um produto, otimizada para compartilhamento.</p>
            
            <SubSection title="Conteúdo Essencial">
                 <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Texto do Título</label>
                    <input value={settings.mainTitleText} onChange={e => updateSetting('mainTitleText', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2" placeholder="Black Friday" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Frases do Subtítulo Animado</label>
                    <textarea
                        value={(settings.animatedSubtitlePhrases || []).join('\n')}
                        onChange={e => updateSetting('animatedSubtitlePhrases', e.target.value.split('\n'))}
                        rows={3}
                        className="w-full bg-black border border-[#27272a] rounded-lg p-2"
                        placeholder="Oferta imperdível.&#10;Qualidade garantida."
                    />
                    <p className="text-xs text-gray-500 mt-1">Coloque uma frase por linha.</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Texto do Botão</label>
                        <input type="text" value={settings.buttonText} onChange={e => updateSetting('buttonText', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2" placeholder="Comprar Agora" />
                    </div>
                    <div>
                        <ColorInput label="Cor de Fundo da Página" value={settings.backgroundColor || '#000000'} onChange={v => updateSetting('backgroundColor', v)} />
                    </div>
                </div>
                 <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Logo (Opcional)</label>
                    {settings.logoUrl && <img src={settings.logoUrl} alt="Preview Logo" className="h-16 mb-2 bg-gray-800 p-1 rounded-md object-contain"/>}
                    <input type="file" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                    {uploadProgress != null && <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
                    <input type="text" value={settings.logoUrl} onChange={(e) => updateSetting('logoUrl', e.target.value)} className="mt-2 w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-yellow-500" placeholder="Ou cole a URL da logo aqui" />
                </div>
            </SubSection>

            <AdvancedOptionsToggle title="Opções Avançadas de Layout e Estilo">
                <div className="space-y-4">
                    <Accordion title="Layout Geral">
                        <SubSection title="Espaçamento">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SliderInput label="Ajuste Espaçamento Vertical" value={adjustments.contentVerticalPadding ?? 0} onChange={v => updateAdjustment('contentVerticalPadding', undefined, v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('contentVerticalPadding', undefined, undefined)} />
                                <SliderInput label="Ajuste Espaçamento Horizontal" value={adjustments.contentHorizontalPadding ?? 0} onChange={v => updateAdjustment('contentHorizontalPadding', undefined, v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('contentHorizontalPadding', undefined, undefined)} />
                                <div className="md:col-span-2">
                                    <SliderInput label="Ajuste Espaço entre Blocos" value={adjustments.contentGap ?? 0} onChange={v => updateAdjustment('contentGap', undefined, v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('contentGap', undefined, undefined)}/>
                                </div>
                            </div>
                        </SubSection>
                    </Accordion>
                    
                    <Accordion title="Bloco do Título">
                        <SubSection title="Posição e Estilo do Título">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SliderInput label="Posição X" value={adjustments.mainTitlePosition?.x ?? 0} onChange={v => updateAdjustment('mainTitlePosition', 'x', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('mainTitlePosition', 'x', undefined)}/>
                                <SliderInput label="Posição Y" value={adjustments.mainTitlePosition?.y ?? 0} onChange={v => updateAdjustment('mainTitlePosition', 'y', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('mainTitlePosition', 'y', undefined)} />
                                <SliderInput label="Tamanho Fonte (%)" value={adjustments.mainTitleFontSize ?? 0} onChange={v => updateAdjustment('mainTitleFontSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('mainTitleFontSize', undefined, undefined)}/>
                                <FontWeightSelector label="Grossura da Fonte" value={settings.mainTitleFontWeight} onChange={v => updateSetting('mainTitleFontWeight', v)} />
                            </div>
                            <ColorInput label="Cor do Título" value={settings.mainTitleColor || '#FFFFFF'} onChange={v => updateSetting('mainTitleColor', v)} />
                        </SubSection>
                        <SubSection title="Estilo do Subtítulo Animado">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SliderInput label="Posição X (Subtítulo)" value={adjustments.animatedSubtitlePosition?.x ?? 0} onChange={v => updateAdjustment('animatedSubtitlePosition', 'x', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('animatedSubtitlePosition', 'x', undefined)}/>
                                <SliderInput label="Posição Y (Subtítulo)" value={adjustments.animatedSubtitlePosition?.y ?? 0} onChange={v => updateAdjustment('animatedSubtitlePosition', 'y', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('animatedSubtitlePosition', 'y', undefined)} />
                                <SliderInput label="Tamanho Fonte (%)" value={adjustments.animatedSubtitleFontSize ?? 0} onChange={v => updateAdjustment('animatedSubtitleFontSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('animatedSubtitleFontSize', undefined, undefined)} />
                                 <FontWeightSelector label="Grossura da Fonte" value={settings.animatedSubtitleFontWeight} onChange={v => updateSetting('animatedSubtitleFontWeight', v)} />
                            </div>
                             <ColorInput label="Cor do Subtítulo" value={settings.animatedSubtitleColor || '#A1A1AA'} onChange={v => updateSetting('animatedSubtitleColor', v)} />
                        </SubSection>
                    </Accordion>

                    <Accordion title="Bloco do Produto">
                        <div className="p-4 border-b border-zinc-800">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm font-medium text-gray-300">Mostrar Foto do Aparelho</span>
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={settings.showProductImage !== false} 
                                        onChange={e => updateSetting('showProductImage', e.target.checked)} 
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.showProductImage !== false ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showProductImage !== false ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                        <SubSection title="Posição e Imagem">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SliderInput label="Posição X" value={adjustments.productBlockPosition?.x ?? 0} onChange={v => updateAdjustment('productBlockPosition', 'x', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('productBlockPosition', 'x', undefined)} />
                                <SliderInput label="Posição Y" value={adjustments.productBlockPosition?.y ?? 0} onChange={v => updateAdjustment('productBlockPosition', 'y', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('productBlockPosition', 'y', undefined)} />
                            </div>
                            <SliderInput label="Tamanho do Bloco (%)" value={adjustments.productBlockScale ?? 0} onChange={v => updateAdjustment('productBlockScale', undefined, v)} min={-50} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('productBlockScale', undefined, undefined)} />
                            <SliderInput label="Tamanho da Imagem (%)" value={adjustments.productImageSize ?? 0} onChange={v => updateAdjustment('productImageSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('productImageSize', undefined, undefined)} />
                        </SubSection>
                        
                        <SubSection title="Espaçamento Interno e Posição">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <SliderInput 
                                        label="Distância entre Imagem e Texto (Gap)" 
                                        value={adjustments.productInnerGap ?? 0} 
                                        onChange={v => updateAdjustment('productInnerGap', undefined, v)} 
                                        min={-50} 
                                        max={200} 
                                        unit="px" 
                                        placeholder="0" 
                                        onReset={() => updateAdjustment('productInnerGap', undefined, undefined)} 
                                    />
                                </div>
                                <SliderInput 
                                    label="Deslocar Imagem (Horiz.)" 
                                    value={adjustments.productImageOffsetX ?? 0} 
                                    onChange={v => updateAdjustment('productImageOffsetX', undefined, v)} 
                                    min={-200} 
                                    max={200} 
                                    unit="px" 
                                    placeholder="0" 
                                    onReset={() => updateAdjustment('productImageOffsetX', undefined, undefined)} 
                                />
                                <SliderInput 
                                    label="Deslocar Texto (Horiz.)" 
                                    value={adjustments.productInfoOffsetX ?? 0} 
                                    onChange={v => updateAdjustment('productInfoOffsetX', undefined, v)} 
                                    min={-200} 
                                    max={200} 
                                    unit="px" 
                                    placeholder="0" 
                                    onReset={() => updateAdjustment('productInfoOffsetX', undefined, undefined)} 
                                />
                            </div>
                        </SubSection>

                        <SubSection title="Estilo dos Textos">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <SliderInput label="Tamanho Nome (%)" value={adjustments.productNameFontSize ?? 0} onChange={v => updateAdjustment('productNameFontSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('productNameFontSize', undefined, undefined)} />
                                 <FontWeightSelector label="Grossura Nome" value={settings.productNameFontWeight} onChange={v => updateSetting('productNameFontWeight', v)} />
                                 <SliderInput label="Tamanho Detalhes (%)" value={adjustments.productDetailsFontSize ?? 0} onChange={v => updateAdjustment('productDetailsFontSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('productDetailsFontSize', undefined, undefined)} />
                                 <FontWeightSelector label="Grossura Detalhes" value={settings.productDetailsFontWeight} onChange={v => updateSetting('productDetailsFontWeight', v)} />
                                 <SliderInput label="Tamanho Preço (%)" value={adjustments.productPriceFontSize ?? 0} onChange={v => updateAdjustment('productPriceFontSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('productPriceFontSize', undefined, undefined)} />
                                 <FontWeightSelector label="Grossura Preço" value={settings.productPriceFontWeight} onChange={v => updateSetting('productPriceFontWeight', v)} />
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <ColorInput label="Cor Textos Gerais" value={settings.productInfoTextColor || '#FFFFFF'} onChange={v => updateSetting('productInfoTextColor', v)} />
                                <ColorInput label="Cor do Preço" value={settings.priceColor || '#FFFFFF'} onChange={v => updateSetting('priceColor', v)} />
                            </div>
                        </SubSection>
                    </Accordion>
                    
                     <Accordion title="Botão de Ação (Comprar)">
                        <SubSection title="Estilo Visual (Independente da Loja)">
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                                <RadioCard selected={buyButtonConfig.stylePreset === 'standard'} onClick={() => updateButtonConfig('stylePreset', 'standard')} icon={<Box size={16} />} label="Padrão" />
                                <RadioCard selected={buyButtonConfig.stylePreset === 'shiny'} onClick={() => updateButtonConfig('stylePreset', 'shiny')} icon={<Sun size={16} />} label="Brilho" />
                                <RadioCard selected={buyButtonConfig.stylePreset === 'neon'} onClick={() => updateButtonConfig('stylePreset', 'neon')} icon={<Zap size={16} />} label="Neon" />
                                <RadioCard selected={buyButtonConfig.stylePreset === 'cyber'} onClick={() => updateButtonConfig('stylePreset', 'cyber')} icon={<Layout size={16} />} label="Cyber" />
                                <RadioCard selected={buyButtonConfig.stylePreset === 'pulse'} onClick={() => updateButtonConfig('stylePreset', 'pulse')} icon={<ActivityIcon />} label="Pulse" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-3 rounded-lg">
                                <ColorInput label="Cor Principal" value={buyButtonConfig.primaryColor || '#ffae00'} onChange={v => updateButtonConfig('primaryColor', v)} />
                                <ColorInput label="Cor Secundária" value={buyButtonConfig.secondaryColor || '#e69c00'} onChange={v => updateButtonConfig('secondaryColor', v)} />
                                <ColorInput label="Destaque/Borda" value={buyButtonConfig.highlightColor || '#ffffff'} onChange={v => updateButtonConfig('highlightColor', v)} />
                                <ColorInput label="Cor do Texto" value={buyButtonConfig.textColor || '#000000'} onChange={v => updateButtonConfig('textColor', v)} />
                            </div>
                        </SubSection>
                        <SubSection title="Posição e Tamanho">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SliderInput label="Posição X" value={adjustments.buttonPosition?.x ?? 0} onChange={v => updateAdjustment('buttonPosition', 'x', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('buttonPosition', 'x', undefined)} />
                                <SliderInput label="Posição Y" value={adjustments.buttonPosition?.y ?? 0} onChange={v => updateAdjustment('buttonPosition', 'y', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('buttonPosition', 'y', undefined)} />
                                <SliderInput label="Ajuste Largura (Padding X)" value={adjustments.buttonPaddingX ?? 0} onChange={v => updateAdjustment('buttonPaddingX', undefined, v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('buttonPaddingX', undefined, undefined)} />
                                <SliderInput label="Ajuste Altura (Padding Y)" value={adjustments.buttonPaddingY ?? 0} onChange={v => updateAdjustment('buttonPaddingY', undefined, v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('buttonPaddingY', undefined, undefined)} />
                                <SliderInput label="Tamanho Fonte (%)" value={adjustments.buttonFontSize ?? 0} onChange={v => updateAdjustment('buttonFontSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('buttonFontSize', undefined, undefined)} />
                                <FontWeightSelector label="Grossura da Fonte" value={settings.buttonFontWeight} onChange={v => updateSetting('buttonFontWeight', v)} />
                            </div>
                        </SubSection>
                        <SubSection title="Animação de Brilho (Antiga)">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.buttonGlowAnimationEnabled === true} onChange={(e) => updateSetting('buttonGlowAnimationEnabled', e.target.checked)} className="w-4 h-4" />
                                    <span className="ml-2 text-sm">Ativar brilho pulsante simples (Overlay)</span>
                                </label>
                                {settings.buttonGlowAnimationEnabled && (
                                    <div className="flex-grow">
                                        <ColorInput label="Cor do Brilho" value={settings.buttonGlowColor || '#ffae00'} onChange={v => updateSetting('buttonGlowColor', v)} />
                                    </div>
                                )}
                            </div>
                        </SubSection>
                    </Accordion>

                    <Accordion title="Logo">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <SliderInput label="Posição X" value={adjustments.logoPosition?.x ?? 0} onChange={v => updateAdjustment('logoPosition', 'x', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('logoPosition', 'x', undefined)} />
                            <SliderInput label="Posição Y" value={adjustments.logoPosition?.y ?? 0} onChange={v => updateAdjustment('logoPosition', 'y', v)} min={-100} max={100} unit="px" placeholder="0" onReset={() => updateAdjustment('logoPosition', 'y', undefined)} />
                        </div>
                        <SliderInput label="Tamanho da Logo (%)" value={adjustments.logoSize ?? 0} onChange={v => updateAdjustment('logoSize', undefined, v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAdjustment('logoSize', undefined, undefined)} />
                    </Accordion>
                    
                    <Accordion title="Fundo Aurora">
                         <SubSection title="Cores da Aurora">
                            {(settings.auroraElements || []).map((el, elIndex) => (
                                 <div key={elIndex} className="p-2 bg-black rounded-md border border-[#27272a] space-y-2">
                                    <div className="flex items-center gap-2">
                                        <ColorInput label="Cor" value={el.color} onChange={v => updateAuroraElementColor(elIndex, v)} />
                                        <button onClick={() => removeAuroraElement(elIndex)} className="text-red-500 mt-5"><Trash2 size={16}/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <SliderInput label="Tamanho (Mobile) (%)" value={adjustments.auroraElements?.[elIndex]?.sizeMobile ?? 0} onChange={v => updateAuroraElementSize(elIndex, 'sizeMobile', v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAuroraElementSize(elIndex, 'sizeMobile', undefined)} />
                                        <SliderInput label="Tamanho (Desktop) (%)" value={adjustments.auroraElements?.[elIndex]?.sizeDesktop ?? 0} onChange={v => updateAuroraElementSize(elIndex, 'sizeDesktop', v)} min={-100} max={100} unit="%" placeholder="0" onReset={() => updateAuroraElementSize(elIndex, 'sizeDesktop', undefined)} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={addAuroraElement} className="text-xs flex items-center gap-1 bg-gray-700 px-2 py-1 rounded"><Plus size={14}/> Adicionar Cor</button>
                        </SubSection>
                    </Accordion>
                </div>
            </AdvancedOptionsToggle>
        </div>
    );
};

export default CheckoutStoryPanel;
