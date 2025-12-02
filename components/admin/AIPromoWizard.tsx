
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Product } from '../../types';
import { db, getDocRef } from '../../firebase';
import { X, Cpu, ArrowLeft, Tag, ArrowRight } from 'react-feather';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

interface AIPromoWizardProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    allProducts: Product[];
    storeId: string; // Added storeId prop
}

interface PromoUpdate {
    id: string;
    name: string;
    newPrice: number;
    newOriginalPrice: number;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const AIPromoWizard: React.FC<AIPromoWizardProps> = ({ isOpen, onClose, showToast, allProducts, storeId }) => {
    const [step, setStep] = useState(1);
    const [inputText, setInputText] = useState('');
    const [promoUpdates, setPromoUpdates] = useState<PromoUpdate[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const resetWizard = () => {
        setStep(1);
        setInputText('');
        setPromoUpdates([]);
        setIsProcessing(false);
        onClose();
    };

    const handleAnalyze = async () => {
        if (!inputText.trim() || allProducts.length === 0) {
            showToast('Por favor, insira o texto e certifique-se de que há produtos cadastrados.', 'error');
            return;
        }
        setIsProcessing(true);
        
        const productContextString = allProducts.map(p => 
            `ID: ${p.id}, NAME: ${p.name}, CURRENT_PRICE: ${p.price}`
        ).join('\n');

        const prompt = `
            Você é um assistente especialista em e-commerce. Sua tarefa é analisar uma solicitação de um usuário para atualizar preços de produtos para uma promoção e gerar uma saída JSON estruturada com as atualizações necessárias.

            Esta é a lista de todos os produtos disponíveis na loja com seus preços atuais:
            --- PRODUTOS DISPONÍVEIS ---
            ${productContextString}
            --- FIM DOS PRODUTOS DISPONÍVEIS ---

            Esta é a solicitação do usuário para as atualizações promocionais:
            --- SOLICITAÇÃO DO USUÁRIO ---
            ${inputText}
            --- FIM DA SOLICITAÇÃO DO USUÁRIO ---

            Sua tarefa é:
            1. Identificar quais produtos o usuário deseja atualizar com base na solicitação. Use correspondência aproximada para os nomes dos produtos (ex: "15 pro max 256" deve corresponder a "iPhone 15 Pro Max 256GB").
            2. Determinar o novo preço promocional para cada produto. O preço pode ser informado diretamente ou como um cálculo (ex: "tire 30 reais de desconto").
            3. Para cada produto identificado, criar um objeto JSON.

            A saída final DEVE SER um array JSON de objetos, onde cada objeto tem os seguintes campos:
            - "id": O ID exato do produto da lista "PRODUTOS DISPONÍVEIS".
            - "name": O nome exato do produto da lista "PRODUTOS DISPONÍVEIS".
            - "newPrice": O novo preço promocional (como um número).
            - "newOriginalPrice": O preço atual do produto, que se tornará o preço "original" (como um número).

            REGRAS IMPORTANTES:
            - Se a solicitação do usuário para um produto não puder ser correspondida com confiança a um produto na lista, ou se o preço for ambíguo, OMITE-O do array JSON final.
            - O novo preço promocional DEVE ser menor que o preço atual.
            - Se o usuário der um comando como "X reais de desconto", calcule 'newPrice = current_price - X'.
        `;
        
        const promoUpdateSchema = {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                newPrice: { type: Type.NUMBER },
                newOriginalPrice: { type: Type.NUMBER },
            },
            required: ['id', 'name', 'newPrice', 'newOriginalPrice']
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: promoUpdateSchema }
                }
            });

            const updates: PromoUpdate[] = JSON.parse(response.text);
            if (updates.length === 0) {
                showToast('A IA não conseguiu identificar nenhuma atualização de produto no texto fornecido.', 'error');
            } else {
                setPromoUpdates(updates);
                setStep(2);
            }
        } catch (error) {
            console.error("AI processing error:", error);
            showToast('Erro ao processar a lista com a IA. Verifique o texto e tente novamente.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveChanges = async () => {
        if (promoUpdates.length === 0) {
            showToast('Nenhuma atualização para salvar.', 'error');
            return;
        }
        setIsProcessing(true);
        try {
            const batch = db.batch();
            promoUpdates.forEach(update => {
                // FIX: Use getDocRef with storeId
                const docRef = getDocRef('products', update.id, storeId);
                batch.update(docRef, {
                    price: update.newPrice,
                    originalPrice: update.newOriginalPrice
                });
            });
            await batch.commit();
    
            showToast(`${promoUpdates.length} produtos atualizados para promoção!`, 'success');
            resetWizard();
        } catch (error) {
            console.error("Error saving promo updates:", error);
            showToast('Ocorreu um erro ao salvar as atualizações.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <Tag className="text-green-400" />
                        Assistente de Promoções com IA
                    </h3>
                    <button onClick={resetWizard}><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="font-semibold mb-2 block">1. Cole a lista de produtos ou descreva a promoção</label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Ex: Boombox 3 1.899,99&#10;iPhone 14 128gb 2.449,99&#10;ou&#10;Coloque todos os iPhone 17 com 30 reais de desconto."
                                    rows={12}
                                    className="w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                                <p className="text-xs text-gray-400 mt-2">A IA irá ler o texto, encontrar os produtos na sua loja e preparar a alteração de preço para a promoção.</p>
                            </div>
                        </div>
                    )}
                    
                    {step === 2 && (
                        <div>
                            <h4 className="font-bold text-lg mb-4">Confirme as alterações de preço:</h4>
                            <div className="bg-black border border-[#27272a] rounded-lg overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#1a1a1a]">
                                        <tr>
                                            <th className="p-3">Produto</th>
                                            <th className="p-3 text-right">Preço Original</th>
                                            <th className="p-3 text-right">Novo Preço (Promoção)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {promoUpdates.map(update => (
                                            <tr key={update.id} className="border-t border-[#27272a]">
                                                <td className="p-3 font-medium">{update.name}</td>
                                                <td className="p-3 text-right text-gray-400 line-through">{formatCurrency(update.newOriginalPrice)}</td>
                                                <td className="p-3 text-right font-bold text-green-400">{formatCurrency(update.newPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                        <button onClick={handleAnalyze} disabled={isProcessing} className="flex items-center bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50">
                            {isProcessing ? 'Analisando...' : 'Analisar com IA'}
                            {!isProcessing && <ArrowRight size={18} className="ml-2"/>}
                        </button>
                    ) : (
                        <button onClick={handleSaveChanges} disabled={isProcessing} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50">
                            {isProcessing ? 'Salvando...' : `Confirmar e Salvar ${promoUpdates.length} Alterações`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIPromoWizard;
