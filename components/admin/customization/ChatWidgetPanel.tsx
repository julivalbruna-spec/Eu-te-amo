
import React, { useState } from 'react';
import { ChatWidgetSettings, SiteInfo } from '../../../types';
import SliderInput from '../SliderInput';
import { GoogleGenAI, Type } from '@google/genai';
import { Cpu, Loader, RefreshCw, Music, Edit, Image } from 'react-feather';
import ImageProcessingModal from '../ImageProcessingModal';

interface ChatWidgetPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4 text-white"><span className="bg-zinc-800 px-3 py-1 rounded-md">{title}</span></h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


const ChatWidgetPanel: React.FC<ChatWidgetPanelProps> = ({ siteInfo, updateSiteInfo, uploadImage, showToast }) => {
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [soundUploadProgress, setSoundUploadProgress] = useState<{send: number|null, receive: number|null}>({ send: null, receive: null });
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Icon Processing State
    const [isProcessingIcon, setIsProcessingIcon] = useState(false);
    const [iconFileToProcess, setIconFileToProcess] = useState<File | null>(null);

    const settings = siteInfo.chatWidget || {};

    const updateSetting = (key: keyof ChatWidgetSettings, value: any) => {
        updateSiteInfo(prev => ({
            ...prev,
            chatWidget: {
                ...(prev.chatWidget || {}),
                [key]: value
            }
        }));
    };

    const updateCustomText = (key: string, value: any) => {
        updateSiteInfo(prev => ({
            ...prev,
            customTexts: {
                ...prev.customTexts,
                [key]: value
            }
        }));
    };

    // Step 1: Select file and open modal
    const handleIconSelect = (file: File) => {
        setIconFileToProcess(file);
        setIsProcessingIcon(true);
    };

    // Step 2: Processed file returned from modal -> Upload
    const handleIconProcessed = async (file: File | null) => {
        setIsProcessingIcon(false);
        setIconFileToProcess(null);
        
        if (!file) return;

        try {
            setUploadProgress(0);
            const url = await uploadImage(file, setUploadProgress);
            updateSetting('iconUrl', url);
            showToast('Ícone atualizado com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar ícone.', 'error');
        } finally {
            setUploadProgress(null);
        }
    };

    const handleSoundUpload = async (file: File, type: 'send' | 'receive') => {
        try {
             setSoundUploadProgress(prev => ({ ...prev, [type]: 0 }));
             const url = await uploadImage(file, (p) => setSoundUploadProgress(prev => ({ ...prev, [type]: p })));
             updateSetting(type === 'send' ? 'sendSoundUrl' : 'receiveSoundUrl', url);
             showToast('Som enviado com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar som.', 'error');
        } finally {
            setSoundUploadProgress(prev => ({ ...prev, [type]: null }));
        }
    }
    
    const handleGenerateAiPalette = async () => {
        setIsGenerating(true);
        try {
            const prompt = `
                Você é um UI Designer especialista em e-commerce.
                Crie uma paleta de cores para um Widget de Chatbot que harmonize com a identidade visual da loja abaixo.
                
                Marca da Loja: ${siteInfo.theme.brand}
                Fundo do Site: ${siteInfo.theme.background}
                Texto Principal: ${siteInfo.theme.primaryText}
                
                Gere um objeto JSON com as seguintes cores (hexadecimal):
                - "headerBackgroundColor": Fundo do cabeçalho da janela do chat (topo onde fica o nome do assistente).
                - "headerTextColor": Texto do cabeçalho (contraste alto com o fundo).
                - "backgroundColor": Fundo da área de mensagens (geralmente neutro escuro ou claro).
                - "userBubbleColor": Fundo do balão de mensagem do USUÁRIO (destaque sutil ou marca).
                - "userTextColor": Texto do balão do usuário.
                - "botBubbleColor": Fundo do balão do BOT (neutro, cinza claro ou escuro).
                - "botTextColor": Texto do balão do bot.
                - "inputBackgroundColor": Fundo da área de digitação.
                - "inputTextColor": Texto do input.
                - "sendButtonColor": Cor do ícone/botão de enviar.
                - "bubbleColor": Cor do botão FLUTUANTE redondo que abre o chat (geralmente a cor vibrante da marca).
                - "actionButtonBackground": Fundo dos botões de ação interativos.
                - "actionButtonTextColor": Texto dos botões de ação.
                - "actionButtonBorderColor": Borda dos botões de ação.
            `;
            
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    headerBackgroundColor: { type: Type.STRING },
                    headerTextColor: { type: Type.STRING },
                    backgroundColor: { type: Type.STRING },
                    userBubbleColor: { type: Type.STRING },
                    userTextColor: { type: Type.STRING },
                    botBubbleColor: { type: Type.STRING },
                    botTextColor: { type: Type.STRING },
                    inputBackgroundColor: { type: Type.STRING },
                    inputTextColor: { type: Type.STRING },
                    sendButtonColor: { type: Type.STRING },
                    bubbleColor: { type: Type.STRING },
                    actionButtonBackground: { type: Type.STRING },
                    actionButtonTextColor: { type: Type.STRING },
                    actionButtonBorderColor: { type: Type.STRING },
                },
                required: ['headerBackgroundColor', 'headerTextColor', 'backgroundColor', 'userBubbleColor', 'userTextColor', 'botBubbleColor', 'botTextColor', 'inputBackgroundColor', 'inputTextColor', 'sendButtonColor', 'bubbleColor', 'actionButtonBackground', 'actionButtonTextColor', 'actionButtonBorderColor']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json', responseSchema }
            });
            
            const palette = JSON.parse(response.text);
            
            updateSiteInfo(prev => ({
                ...prev,
                chatWidget: {
                    ...prev.chatWidget,
                    ...palette
                }
            }));
            
            showToast('Paleta de cores gerada com Gemini 3.0!', 'success');

        } catch (error) {
            console.error(error);
            showToast('Erro ao gerar paleta com IA.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
             <ImageProcessingModal 
                isOpen={isProcessingIcon}
                onClose={() => setIsProcessingIcon(false)}
                imageFile={iconFileToProcess}
                onConfirm={(file) => handleIconProcessed(file)}
                showToast={showToast}
                title="Editar Ícone do Chatbot"
            />

             <div className="flex justify-between items-start bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-lg border border-purple-500/20">
                <div>
                    <h4 className="font-bold text-white flex items-center gap-2"><Cpu size={16} className="text-purple-400"/> Personalização Inteligente</h4>
                    <p className="text-sm text-gray-400 mt-1 max-w-xl">Use a IA para gerar cores que combinam com sua marca ou edite o ícone automaticamente.</p>
                </div>
                 <button 
                    onClick={handleGenerateAiPalette} 
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-purple-900/20"
                >
                    {isGenerating ? <Loader size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                    Gerar Cores (Gemini 3.0)
                </button>
             </div>

            <SubSection title="Identidade do Assistente">
                 <div>
                    <label className="text-sm text-gray-400 block mb-1">Nome do Assistente</label>
                    <input 
                        type="text" 
                        value={siteInfo.customTexts.aiAssistantName || ''} 
                        onChange={e => updateCustomText('aiAssistantName', e.target.value)} 
                        className="w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
                        placeholder={`Ex: Assistente ${siteInfo.storeName}`}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="text-sm text-gray-400 block mb-1">Gênero do Assistente</label>
                        <select
                            value={siteInfo.customTexts.aiAssistantPronoun || 'sua'}
                            onChange={e => updateCustomText('aiAssistantPronoun', e.target.value)}
                            className="w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
                        >
                            <option value="sua">Sua assistente (Feminino)</option>
                            <option value="seu">Seu assistente (Masculino)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Ícone / Avatar</label>
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700 flex-shrink-0">
                                {settings.iconUrl ? <img src={settings.iconUrl} alt="Preview" className="w-full h-full object-cover"/> : <Image size={20} className="text-gray-500"/>}
                            </div>
                            <label className="flex-1 cursor-pointer bg-zinc-900 border border-dashed border-zinc-600 hover:border-purple-500 hover:bg-purple-900/10 rounded-lg p-2 flex flex-col items-center justify-center text-xs text-gray-400 transition-all group h-12">
                                <span className="group-hover:text-purple-400 font-semibold flex items-center gap-1"><Edit size={12}/> {settings.iconUrl ? 'Trocar Ícone' : 'Enviar Foto'}</span>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files && handleIconSelect(e.target.files[0])} className="hidden"/>
                            </label>
                         </div>
                         {uploadProgress != null && <div className="w-full bg-gray-700 rounded-full h-1 mt-2"><div className="bg-yellow-500 h-1 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
                    </div>
                </div>
                <div>
                     <label className="text-sm text-gray-400 block mb-1">Mensagem de Boas-vindas (Opcional)</label>
                     <textarea 
                         value={siteInfo.customTexts.aiInitialMessage || ''} 
                         onChange={e => updateCustomText('aiInitialMessage', e.target.value)} 
                         className="w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm min-h-[80px]"
                         placeholder="Deixe vazio para usar a mensagem padrão."
                     />
                     <p className="text-xs text-gray-500 mt-1">Padrão: "Olá! 👋 Bem-vindo à [Loja]! Sou [Nome], [seu/sua] assistente virtual..."</p>
                 </div>
            </SubSection>
            
            <SubSection title="Cores da Janela e Botão">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                        <h5 className="font-bold text-white text-sm border-b border-zinc-700 pb-2">Janela Aberta</h5>
                        <ColorInput label="Fundo do Cabeçalho (Topo)" value={settings.headerBackgroundColor || settings.bubbleColor || '#ffae00'} onChange={v => updateSetting('headerBackgroundColor', v)} />
                        <ColorInput label="Texto do Cabeçalho" value={settings.headerTextColor || '#ffffff'} onChange={v => updateSetting('headerTextColor', v)} />
                        <ColorInput label="Fundo da Área de Conversa" value={settings.backgroundColor || '#121212'} onChange={v => updateSetting('backgroundColor', v)} />
                    </div>
                    
                    <div className="space-y-4 bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                        <h5 className="font-bold text-white text-sm border-b border-zinc-700 pb-2">Botão Flutuante (Fechado)</h5>
                        <ColorInput label="Cor de Fundo do Botão" value={settings.bubbleColor || '#ffae00'} onChange={v => updateSetting('bubbleColor', v)} />
                        <p className="text-xs text-gray-500 mt-2">Esta é a cor da "bolinha" que fica no canto da tela antes do cliente abrir o chat.</p>
                    </div>
                </div>
            </SubSection>
            
            <SubSection title="Cores das Mensagens">
                <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Fundo Balão (Usuário)" value={settings.userBubbleColor || '#ffffff'} onChange={v => updateSetting('userBubbleColor', v)} />
                    <ColorInput label="Texto Balão (Usuário)" value={settings.userTextColor || '#000000'} onChange={v => updateSetting('userTextColor', v)} />
                    <ColorInput label="Fundo Balão (Bot)" value={settings.botBubbleColor || '#27272a'} onChange={v => updateSetting('botBubbleColor', v)} />
                    <ColorInput label="Texto Balão (Bot)" value={settings.botTextColor || '#e5e5e5'} onChange={v => updateSetting('botTextColor', v)} />
                </div>
            </SubSection>

            <SubSection title="Botões de Ação (Interativos)">
                <p className="text-xs text-gray-400 -mt-2 mb-2">Estes são os botões gerados pelo bot, como "Ver iPhones" ou "Finalizar Compra".</p>
                <div className="grid grid-cols-3 gap-4">
                    <ColorInput label="Fundo do Botão" value={settings.actionButtonBackground || 'transparent'} onChange={v => updateSetting('actionButtonBackground', v)} />
                    <ColorInput label="Texto do Botão" value={settings.actionButtonTextColor || '#e5e5e5'} onChange={v => updateSetting('actionButtonTextColor', v)} />
                    <ColorInput label="Borda do Botão" value={settings.actionButtonBorderColor || '#3f3f46'} onChange={v => updateSetting('actionButtonBorderColor', v)} />
                </div>
            </SubSection>
            
            <SubSection title="Área de Input (Digitação)">
                <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Fundo do Input" value={settings.inputBackgroundColor || '#000000'} onChange={v => updateSetting('inputBackgroundColor', v)} />
                    <ColorInput label="Texto do Input" value={settings.inputTextColor || '#ffffff'} onChange={v => updateSetting('inputTextColor', v)} />
                     <ColorInput label="Cor do Ícone Enviar" value={settings.sendButtonColor || '#ffffff'} onChange={v => updateSetting('sendButtonColor', v)} />
                </div>
            </SubSection>

            <SubSection title="Efeitos Sonoros">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm text-gray-400 block mb-1">Som de Envio (MP3)</label>
                        <div className="flex gap-2 items-center bg-black border border-[#27272a] rounded-lg p-2">
                            <input 
                                type="text" 
                                value={settings.sendSoundUrl || ''} 
                                onChange={e => updateSetting('sendSoundUrl', e.target.value)}
                                className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                                placeholder="URL do MP3"
                            />
                            <label className="cursor-pointer text-gray-400 hover:text-white">
                                <Music size={18} />
                                <input type="file" accept="audio/*" onChange={(e) => e.target.files && handleSoundUpload(e.target.files[0], 'send')} className="hidden"/>
                            </label>
                        </div>
                        {soundUploadProgress.send != null && <div className="w-full bg-gray-700 rounded-full h-1 mt-1"><div className="bg-yellow-500 h-1 rounded-full" style={{width: `${soundUploadProgress.send}%`}}></div></div>}
                     </div>
                     <div>
                        <label className="text-sm text-gray-400 block mb-1">Som de Recebimento (MP3)</label>
                        <div className="flex gap-2 items-center bg-black border border-[#27272a] rounded-lg p-2">
                            <input 
                                type="text" 
                                value={settings.receiveSoundUrl || ''} 
                                onChange={e => updateSetting('receiveSoundUrl', e.target.value)}
                                className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                                placeholder="URL do MP3"
                            />
                            <label className="cursor-pointer text-gray-400 hover:text-white">
                                <Music size={18} />
                                <input type="file" accept="audio/*" onChange={(e) => e.target.files && handleSoundUpload(e.target.files[0], 'receive')} className="hidden"/>
                            </label>
                        </div>
                        {soundUploadProgress.receive != null && <div className="w-full bg-gray-700 rounded-full h-1 mt-1"><div className="bg-yellow-500 h-1 rounded-full" style={{width: `${soundUploadProgress.receive}%`}}></div></div>}
                     </div>
                 </div>
            </SubSection>
            
             <SubSection title="Dimensões e Posição">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <SliderInput 
                        label="Tamanho do Botão"
                        value={settings.size}
                        onChange={v => updateSetting('size', v)}
                        min={40} max={80} unit="px" placeholder="60"
                        onReset={() => updateSetting('size', undefined)}
                     />
                     <SliderInput 
                        label="Posição Vertical"
                        value={settings.positionBottom}
                        onChange={v => updateSetting('positionBottom', v)}
                        min={10} max={200} unit="px" placeholder="24"
                        onReset={() => updateSetting('positionBottom', undefined)}
                     />
                     <SliderInput 
                        label="Posição Horizontal"
                        value={settings.positionRight}
                        onChange={v => updateSetting('positionRight', v)}
                        min={10} max={200} unit="px" placeholder="24"
                        onReset={() => updateSetting('positionRight', undefined)}
                     />
                 </div>
            </SubSection>
        </div>
    );
};

export default ChatWidgetPanel;
