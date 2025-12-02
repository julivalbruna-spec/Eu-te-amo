
import React, { useState } from 'react';
import { SiteInfo, Category, ThemeColors } from '../../../types';
import { Trash2, Plus } from 'react-feather';

interface CustomTextsPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    categories: Category[];
}

// Shared simple components defined locally to avoid import issues
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

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (value: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-yellow-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
        <span className="text-xs font-semibold text-gray-300">{label}</span>
    </label>
);

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4 text-gray-100">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

const CustomTextsPanel: React.FC<CustomTextsPanelProps> = ({ siteInfo, updateSiteInfo, categories }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, section: 'customTexts', key: string) => {
        const { value } = e.target;
        updateSiteInfo(prev => ({
            ...prev,
            [section]: {
                ...prev.customTexts,
                [key]: value
            }
        }));
    };

    // Marquee Handlers
    const handleMarqueeToggle = (checked: boolean) => {
        updateSiteInfo(prev => ({
            ...prev,
            storeLayout: {
                ...(prev.storeLayout || {}),
                showMarquee: checked
            }
        }));
    };

    const handleMarqueeTextChange = (index: number, value: string) => {
        const newTexts = [...siteInfo.marqueeTexts];
        newTexts[index] = value;
        updateSiteInfo(prev => ({ ...prev, marqueeTexts: newTexts }));
    };

    const addMarqueeText = () => {
        updateSiteInfo(prev => ({ ...prev, marqueeTexts: [...prev.marqueeTexts, 'Nova frase...'] }));
    };

    const removeMarqueeText = (index: number) => {
        const newTexts = siteInfo.marqueeTexts.filter((_, i) => i !== index);
        updateSiteInfo(prev => ({ ...prev, marqueeTexts: newTexts }));
    };

    const handleMarqueeColorChange = (key: keyof ThemeColors, value: string) => {
        updateSiteInfo(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                [key]: value
            }
        }));
    };

    return (
        <div>
            <p className="text-sm text-gray-400 -mt-2 mb-4">Personalize os textos que aparecem em botões, placeholders e outras áreas do site.</p>
            
            <SubSection title="Produtos e Filtros">
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Placeholder da Busca de Produtos</label>
                    <input type="text" value={siteInfo.customTexts.productSearchPlaceholder} onChange={e => handleInputChange(e, 'customTexts', 'productSearchPlaceholder')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Label da Lista de Categorias ("Todos")</label>
                    <input type="text" value={siteInfo.customTexts.categorySelectLabel} onChange={e => handleInputChange(e, 'customTexts', 'categorySelectLabel')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" placeholder="Selecione a categoria" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Opção de Ordenação (Menor Preço)</label>
                    <input type="text" value={siteInfo.customTexts.sortOptionLowToHigh} onChange={e => handleInputChange(e, 'customTexts', 'sortOptionLowToHigh')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Opção de Ordenação (Maior Preço)</label>
                    <input type="text" value={siteInfo.customTexts.sortOptionHighToLow} onChange={e => handleInputChange(e, 'customTexts', 'sortOptionHighToLow')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Label Geral de Ordenação (Acessibilidade)</label>
                    <input type="text" value={siteInfo.customTexts.productSortLabel} onChange={e => handleInputChange(e, 'customTexts', 'productSortLabel')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                <div/>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Texto do Botão "Comprar"</label>
                    <input type="text" value={siteInfo.customTexts.productCardBuy} onChange={e => handleInputChange(e, 'customTexts', 'productCardBuy')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Texto do Botão "Contratar" (Serviços)</label>
                    <input type="text" value={siteInfo.customTexts.productCardHire} onChange={e => handleInputChange(e, 'customTexts', 'productCardHire')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Texto do Botão "Consultar" (Preço 0)</label>
                    <input type="text" value={siteInfo.customTexts.productCardConsult} onChange={e => handleInputChange(e, 'customTexts', 'productCardConsult')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                 <div />
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Texto "Ver detalhes"</label>
                    <input type="text" value={siteInfo.customTexts.productCardDetails} onChange={e => handleInputChange(e, 'customTexts', 'productCardDetails')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                 <div>
                    <label className="text-sm text-gray-400 block mb-1">Texto "Ocultar detalhes"</label>
                    <input type="text" value={siteInfo.customTexts.productCardHideDetails} onChange={e => handleInputChange(e, 'customTexts', 'productCardHideDetails')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
            </SubSection>

            <SubSection title="Faixa de Avisos (Marquee)">
                <div className="col-span-full space-y-4 bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-300">Exibir Faixa Deslizante</span>
                         <ToggleSwitch checked={siteInfo.storeLayout?.showMarquee !== false} onChange={handleMarqueeToggle} label={siteInfo.storeLayout?.showMarquee !== false ? 'Ativado' : 'Desativado'} />
                     </div>

                     {siteInfo.storeLayout?.showMarquee !== false && (
                         <div className="space-y-4 animate-fade-in">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-black/50 rounded-lg">
                                 <ColorInput label="Cor de Fundo" value={siteInfo.theme.marqueeBackground || '#ffffff'} onChange={v => handleMarqueeColorChange('marqueeBackground', v)} />
                                 <ColorInput label="Cor do Texto" value={siteInfo.theme.marqueeText || '#000000'} onChange={v => handleMarqueeColorChange('marqueeText', v)} />
                             </div>

                             <div className="space-y-2">
                                 <label className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Frases em Exibição</label>
                                 {siteInfo.marqueeTexts.map((text, index) => (
                                     <div key={index} className="flex gap-2">
                                         <input 
                                             type="text" 
                                             value={text} 
                                             onChange={(e) => handleMarqueeTextChange(index, e.target.value)}
                                             className="flex-1 bg-black border border-[#27272a] rounded-lg p-2 text-sm"
                                             placeholder="Digite o aviso..."
                                         />
                                         <button onClick={() => removeMarqueeText(index)} className="p-2 text-red-500 hover:bg-zinc-900 rounded transition-colors"><Trash2 size={16}/></button>
                                     </div>
                                 ))}
                                 <button onClick={addMarqueeText} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 mt-2 font-bold p-2 rounded hover:bg-blue-900/20 transition-colors">
                                     <Plus size={14}/> Adicionar Frase
                                 </button>
                             </div>
                         </div>
                     )}
                </div>
            </SubSection>

            <SubSection title="Seção de Contato">
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Título da Seção de Contato</label>
                    <input type="text" value={siteInfo.customTexts.contactTitle} onChange={e => handleInputChange(e, 'customTexts', 'contactTitle')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                 <div>
                    <label className="text-sm text-gray-400 block mb-1">Subtítulo da Seção de Contato</label>
                    <input type="text" value={siteInfo.customTexts.contactSubtitle} onChange={e => handleInputChange(e, 'customTexts', 'contactSubtitle')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
            </SubSection>
            
            <SubSection title="Rodapé Fixo (Promoção)">
                 <div>
                    <label className="text-sm text-gray-400 block mb-1">Texto do Rodapé de Promoção</label>
                    <input type="text" value={siteInfo.customTexts.promoFooterText} onChange={e => handleInputChange(e, 'customTexts', 'promoFooterText')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Botão do Rodapé de Promoção</label>
                    <input type="text" value={siteInfo.customTexts.promoFooterButton} onChange={e => handleInputChange(e, 'customTexts', 'promoFooterButton')} className="w-full bg-black border border-[#27272A] rounded-lg p-2" />
                </div>
                 <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Categoria do Botão do Rodapé</label>
                    <select
                        value={siteInfo.customTexts.promoFooterButtonCategory}
                        onChange={(e) => handleInputChange(e, 'customTexts', 'promoFooterButtonCategory')}
                        className="w-full bg-black border border-[#27272A] rounded-lg p-2"
                    >
                        {categories.map(cat => (
                            <option key={cat.docId || cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </SubSection>

            <SubSection title="Assistente de IA / Chatbot">
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Nome do Assistente (Chatbot)</label>
                    <input 
                        type="text" 
                        value={siteInfo.customTexts.aiAssistantName || ''} 
                        onChange={e => handleInputChange(e, 'customTexts', 'aiAssistantName')} 
                        className="w-full bg-black border border-[#27272a] rounded-lg p-2"
                        placeholder="Ex: Rios"
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Tom de Voz da Marca (para IA)</label>
                    <input 
                        type="text" 
                        value={siteInfo.customTexts.brandVoice || ''} 
                        onChange={e => handleInputChange(e, 'customTexts', 'brandVoice')} 
                        className="w-full bg-black border border-[#27272a] rounded-lg p-2"
                        placeholder="Ex: amigável, jovem e profissional, usando emojis"
                    />
                </div>
            </SubSection>
        </div>
    );
};

export default CustomTextsPanel;
