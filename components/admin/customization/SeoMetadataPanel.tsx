
import React, { useState } from 'react';
import { SiteInfo, SeoInfo, Category } from '../../../types';
import { Cpu, Loader, Zap, Shield } from 'react-feather';
import { GoogleGenAI, Type } from '@google/genai';

interface SeoMetadataPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    showToast: (message: string, type: 'success' | 'error') => void;
    categories: Category[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4"><span className="bg-zinc-800 text-white px-3 py-1 rounded-md">{title}</span></h4>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);


const SeoMetadataPanel: React.FC<SeoMetadataPanelProps> = ({ siteInfo, updateSiteInfo, uploadImage, showToast, categories }) => {
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number | null }>({});
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
    const [recommendations, setRecommendations] = useState<{ tecnicas: string[]; gerais: string[] } | null>(null);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section: 'seo', field: string) => {
        const value = e.target.value;
        updateSiteInfo(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleOgImageUpload = async (file: File) => {
        try {
            setUploadProgress(prev => ({...prev, ogImage: 0}));
            const url = await uploadImage(file, (progress) => {
                setUploadProgress(prev => ({...prev, ogImage: progress}));
            });
            updateSiteInfo(prev => ({
                ...prev,
                seo: { ...prev.seo, ogImage: url }
            }));
            showToast('Imagem enviada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar imagem.', 'error');
        } finally {
            setUploadProgress(prev => ({...prev, ogImage: null}));
        }
    };
    
    const handleGenerateAllSeo = async () => {
        if (!process.env.API_KEY) {
            showToast('A chave de API do Google AI não está configurada.', 'error');
            return;
        }

        setIsGeneratingSeo(true);
        setRecommendations(null);
        try {
            // Safe access to properties to prevent crashes on new stores
            const storeName = siteInfo.storeName || 'Loja';
            const address = siteInfo.address ? siteInfo.address.replace(/<br \/>/g, ', ') : 'Endereço não configurado';
            const phone = siteInfo.links?.whatsappSales || 'N/A';
            const currentDesc = siteInfo.seo?.metaDescription || 'Loja de eletrônicos.';
            const catList = categories ? categories.map(c => c.name).join(', ') : '';

            const context = `
                - Nome da Loja: "${storeName}"
                - Endereço: "${address}"
                - Telefone de Vendas: "${phone}"
                - Descrição Atual: "${currentDesc}"
                - Categorias de Produtos: "${catList}"
            `;
            
            const prompt = `Você é um especialista em SEO de classe mundial para e-commerce. Analise o contexto da loja fornecido e gere uma configuração de SEO completa e de alta performance.

A sua resposta DEVE ser um único objeto JSON estruturado.

**CONTEXTO FORNECIDO:**
\`\`\`
${context}
\`\`\`

Com base no contexto acima, gere o objeto JSON com a seguinte estrutura:

1.  **\`metaTitle\` (string):** Um título para a tag \`<title>\` com 50-60 caracteres. Deve ser atraente, incluir a palavra-chave principal (ex: "iPhones em [Cidade]" ou o nome da loja) e o nome da loja.
2.  **\`metaDescription\` (string):** Uma descrição para a meta tag com 150-160 caracteres. Deve ser persuasiva, incluir um call-to-action e palavras-chave secundárias.
3.  **\`metaKeywords\` (string):** Uma string com 5 a 7 palavras-chave e termos de cauda longa relevantes, separados por vírgula.
4.  **\`schemaOrg\` (object):** Um objeto JSON-LD para Schema.org do tipo 'LocalBusiness'. Preencha 'name', 'description', 'telephone' e 'address' (com '@type': 'PostalAddress', 'streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'). Use os dados do contexto.
5.  **\`melhoriasTecnicas\` (array of strings):** Uma lista de 3 sugestões de melhorias técnicas de SEO on-page. Ex: "Otimizar imagens com nomes de arquivo descritivos e alt tags".
6.  **\`recomendacoesGerais\` (array of strings):** Uma lista de 2 recomendações estratégicas de SEO off-page. Ex: "Criar um artigo de blog sobre as vantagens de comprar seminovos".

A resposta final deve ser APENAS o JSON.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    metaTitle: { type: Type.STRING },
                    metaDescription: { type: Type.STRING },
                    metaKeywords: { type: Type.STRING },
                    schemaOrg: { 
                        type: Type.OBJECT, 
                        properties: {
                            "@context": { type: Type.STRING },
                            "@type": { type: Type.STRING },
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            telephone: { type: Type.STRING },
                            address: {
                                type: Type.OBJECT,
                                properties: {
                                    "@type": { type: Type.STRING },
                                    streetAddress: { type: Type.STRING },
                                    addressLocality: { type: Type.STRING },
                                    addressRegion: { type: Type.STRING },
                                    postalCode: { type: Type.STRING },
                                    addressCountry: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    melhoriasTecnicas: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recomendacoesGerais: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['metaTitle', 'metaDescription', 'metaKeywords', 'schemaOrg', 'melhoriasTecnicas', 'recomendacoesGerais']
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema
                }
            });

            const result = JSON.parse(response.text);

            if (result.metaTitle && result.metaDescription && result.metaKeywords) {
                updateSiteInfo(prev => ({
                    ...prev,
                    seo: {
                        ...prev.seo,
                        metaTitle: result.metaTitle,
                        metaDescription: result.metaDescription,
                        metaKeywords: result.metaKeywords,
                        schemaOrg: result.schemaOrg,
                    }
                }));
                setRecommendations({
                    tecnicas: result.melhoriasTecnicas,
                    gerais: result.recomendacoesGerais
                });
                showToast(`SEO completo gerado com sucesso!`, 'success');
            } else {
                throw new Error('A IA não retornou todos os campos esperados.');
            }

        } catch (error: any) {
            console.error("Error generating SEO:", error);
            if (error.message && (error.message.includes('API key not valid') || error.message.includes('API_KEY'))) {
                 showToast('A chave de API do Google AI não está configurada ou é inválida.', 'error');
            } else {
                showToast(`Erro ao gerar conteúdo com IA: ${error.message}`, 'error');
            }
        } finally {
            setIsGeneratingSeo(false);
        }
    };

    return (
        <div className="space-y-4">
             <p className="text-sm text-gray-400 -mt-2 mb-4">Otimize como sua loja aparece em resultados de busca e ao ser compartilhada em redes sociais.</p>
            
             <button onClick={handleGenerateAllSeo} disabled={isGeneratingSeo} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors">
                {isGeneratingSeo ? <Loader size={20} className="animate-spin" /> : <Cpu size={20} />}
                {isGeneratingSeo ? 'Analisando e Gerando...' : 'Gerar SEO Completo com IA'}
            </button>

            {recommendations && (
                <div className="mt-6 space-y-4 animate-fade-in">
                    <div className="p-4 bg-black/50 border border-gray-700 rounded-lg">
                        <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2"><Shield size={18} /> Recomendações Técnicas</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                            {recommendations.tecnicas.map((rec, i) => <li key={i}>{rec}</li>)}
                        </ul>
                    </div>
                     <div className="p-4 bg-black/50 border border-gray-700 rounded-lg">
                        <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2"><Zap size={18} /> Recomendações Estratégicas</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                            {recommendations.gerais.map((rec, i) => <li key={i}>{rec}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            <SubSection title="Conteúdo para Buscadores (Google, etc.)">
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Meta Título</label>
                    <div className="relative">
                        <input type="text" value={siteInfo.seo.metaTitle} onChange={e => handleInputChange(e, 'seo', 'metaTitle')} placeholder="iPhone Rios | iPhones Novos e Usados" className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">O título principal nos resultados de busca e na aba do navegador. Ideal: até 60 caracteres.</p>
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Meta Descrição</label>
                     <div className="relative">
                        <textarea value={siteInfo.seo.metaDescription} onChange={e => handleInputChange(e, 'seo', 'metaDescription')} rows={3} placeholder="Encontre os melhores iPhones com garantia e o melhor preço..." className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Resumo que aparece abaixo do título no Google, crucial para atrair cliques. Ideal: até 160 caracteres.</p>
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Palavras-chave</label>
                     <div className="relative">
                        <input type="text" value={siteInfo.seo.metaKeywords} onChange={e => handleInputChange(e, 'seo', 'metaKeywords')} placeholder="iPhone, Apple, comprar celular..." className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Termos de busca relevantes, separados por vírgula.</p>
                </div>
            </SubSection>

            <SubSection title="Imagem de Compartilhamento (Redes Sociais)">
                <div>
                     {siteInfo.seo.ogImage && 
                        <div className="mb-4 p-2 border border-gray-800 rounded-md bg-black/30 inline-block">
                            <img src={siteInfo.seo.ogImage} alt="Preview Open Graph" className="h-24 object-contain"/>
                        </div>
                     }
                    <input type="file" accept="image/*" onChange={(e) => e.target.files && handleOgImageUpload(e.target.files[0])} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                    {uploadProgress['ogImage'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['ogImage']}%`}}></div></div>}
                    <input type="text" value={siteInfo.seo.ogImage} onChange={(e) => handleInputChange(e, 'seo', 'ogImage')} className="mt-2 w-full bg-black border border-[#27272a] rounded-lg p-2" placeholder="Ou cole a URL da imagem aqui" />
                    <p className="text-xs text-gray-500 mt-1">A imagem que aparecerá ao compartilhar o link no WhatsApp, Facebook, etc. Ideal: 1200x630 pixels.</p>
                </div>
            </SubSection>
        </div>
    );
};

export default SeoMetadataPanel;
