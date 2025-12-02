
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { SiteInfo } from '../../types';
import { db, getDocRef } from '../../firebase';
import { X, Cpu, Check, AlertTriangle, Loader, Edit, Save } from 'react-feather';
import { SITE_INFO as defaultSiteInfo } from '../../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface AIOnboardingWizardProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string; // Added storeId prop
}

const AIOnboardingWizard: React.FC<AIOnboardingWizardProps> = ({ showToast, storeId }) => {
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestedChanges, setSuggestedChanges] = useState<Partial<SiteInfo> | null>(null);
    const [missingInfo, setMissingInfo] = useState<string[]>([]);

    const handleAnalyze = async () => {
        if (!userInput.trim()) {
            showToast('Por favor, descreva sua loja no campo de texto.', 'error');
            return;
        }
        setIsProcessing(true);

        const prompt = `
            Você é um assistente especialista em configurar sites de e-commerce, especialmente lojas de eletrônicos como iPhones e acessórios. Analise o texto fornecido pelo usuário e extraia todas as informações possíveis para preencher um objeto de configuração do site.

            Texto do Usuário:
            ---
            ${userInput}
            ---

            Sua tarefa é preencher o máximo de campos possível no JSON abaixo. Se uma informação não for encontrada, deixe o campo de fora do objeto.
            - Para 'theme', extraia cores mencionadas (ex: "minha marca é amarela e preta"). Se não houver cores, sugira uma paleta com base no nome ou tipo de negócio. Use cores hexadecimais.
            - Para 'links', extraia números de WhatsApp e links de Instagram.
            - Para 'logos', se o usuário mencionar um link de logo, use-o para 'main'.
            - Para 'customTexts', crie textos curtos e apropriados para um e-commerce de iPhones com base no nome e no que a loja vende. O 'heroTitle' deve ser impactante e o 'heroPhrases' deve conter 2 ou 3 frases curtas sobre tecnologia, qualidade ou estilo.
            
            Além de preencher o JSON, crie um array de strings chamado "missingInfo" listando as informações importantes que você NÃO conseguiu encontrar no texto (ex: "Horário de funcionamento no sábado", "URL da logo", "Frases para o topo do site").

            O formato da sua resposta DEVE ser um objeto JSON com duas chaves: "changes" (contendo o objeto de configuração do site) e "missingInfo" (o array de strings).
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                changes: {
                    type: Type.OBJECT,
                    properties: {
                        // This is a simplified version of SiteInfo for the schema
                        copyrightText: { type: Type.STRING },
                        address: { type: Type.STRING },
                        hoursWeek: { type: Type.STRING },
                        hoursSaturday: { type: Type.STRING },
                        links: {
                            type: Type.OBJECT,
                            properties: {
                                whatsappSales: { type: Type.STRING },
                                instagram: { type: Type.STRING },
                                instagramHandle: { type: Type.STRING },
                            }
                        },
                        theme: {
                            type: Type.OBJECT,
                            properties: {
                                brand: { type: Type.STRING },
                                background: { type: Type.STRING },
                                surface: { type: Type.STRING },
                                primaryText: { type: Type.STRING },
                                buttonPrimaryBackground: { type: Type.STRING },
                                buttonPrimaryText: { type: Type.STRING },
                            }
                        },
                         customTexts: {
                            type: Type.OBJECT,
                            properties: {
                                heroTitle: { type: Type.STRING },
                                heroPhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
                            }
                        },
                    }
                },
                missingInfo: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json', responseSchema }
            });
            const result = JSON.parse(response.text);
            setSuggestedChanges(result.changes);
            setMissingInfo(result.missingInfo);
        } catch (error) {
            console.error(error);
            showToast('Ocorreu um erro ao analisar as informações.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyChanges = async () => {
        if (!suggestedChanges) return;
        setIsProcessing(true);
        try {
            // FIX: Use getDocRef with storeId
            await getDocRef('settings', 'siteInfo', storeId).set(suggestedChanges, { merge: true });
            showToast('Configurações aplicadas com sucesso!', 'success');
            setSuggestedChanges(null);
            setMissingInfo([]);
            setUserInput('');
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar as configurações.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFieldChange = (section: keyof SiteInfo, field: string, value: any) => {
        setSuggestedChanges(prev => {
            if (!prev) return null;
            const newChanges = { ...prev };
            (newChanges as any)[section] = { ...(newChanges as any)[section], [field]: value };
            return newChanges;
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Assistente de Configuração IA</h2>
            <p className="text-gray-400 mb-6">Descreva sua loja abaixo e a IA irá preencher as configurações do site para você.</p>

            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg p-6 space-y-4">
                <textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="Ex: Minha loja se chama 'iPhone Rios' e fica em Entre Rios, Bahia. Vendemos iPhones e acessórios. Nosso WhatsApp é 75999998888 e o Instagram é @iphone.rios. A cor principal da marca é um amarelo vibrante..."
                    rows={8}
                    className="w-full bg-black border border-[#27272a] rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isProcessing}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isProcessing}
                    className="flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 w-full"
                >
                    {isProcessing ? <Loader className="animate-spin" /> : <><Cpu size={20} className="mr-2" /> Analisar com IA</>}
                </button>
            </div>

            {suggestedChanges && (
                <div className="mt-8 bg-[#0a0a0a] border border-[#27272a] rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Revisar Alterações Sugeridas</h3>
                        <button onClick={() => setSuggestedChanges(null)} className="text-gray-400 hover:text-white"><X /></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Editable changes */}
                        <div className="space-y-4">
                            {Object.entries(suggestedChanges).map(([section, fields]) => (
                                <div key={section}>
                                    <h4 className="font-semibold capitalize text-lg mb-2 pb-1 border-b border-gray-700">{section}</h4>
                                    {typeof fields === 'object' && fields !== null && Object.entries(fields).map(([field, value]) => (
                                        <div key={field} className="mb-2">
                                            <label className="text-sm text-gray-400 block capitalize">{field}</label>
                                            <input 
                                                type="text"
                                                value={Array.isArray(value) ? value.join(', ') : String(value)}
                                                onChange={e => handleFieldChange(section as keyof SiteInfo, field, e.target.value)}
                                                className="w-full bg-black border border-[#27272a] rounded p-2 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Missing info */}
                        <div>
                             <h4 className="font-semibold text-lg mb-2 text-yellow-400 flex items-center gap-2"><AlertTriangle size={20} /> Informações Faltando</h4>
                             {missingInfo.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 text-gray-300 bg-yellow-900/30 p-4 rounded-lg">
                                    {missingInfo.map((info, i) => <li key={i}>{info}</li>)}
                                </ul>
                             ) : (
                                <p className="text-green-400 bg-green-900/30 p-4 rounded-lg flex items-center gap-2"><Check size={20}/> Ótimo! Parece que a IA encontrou todas as informações essenciais.</p>
                             )}
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                        <button
                            onClick={handleApplyChanges}
                            disabled={isProcessing}
                            className="flex items-center justify-center bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                             {isProcessing ? <Loader className="animate-spin" /> : <><Save size={20} className="mr-2" /> Aplicar Alterações</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIOnboardingWizard;
