
import React, { useState, useEffect } from 'react';
import { db, getDocRef } from '../../firebase';
import { Product, Category } from '../../types';
import { GoogleGenAI, Modality } from '@google/genai';
import { X, Loader, Save, Cpu, Image as ImageIcon } from 'react-feather';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const mimeType = 'image/png';
    const res = await fetch(`data:${mimeType};base64,${base64}`);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
};

interface ProcessedItem {
    originalItem: Product | Category;
    suggestion?: string; // For details/specs (JSON string)
    base64Image?: string; // For images
}

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    items: (Product | Category)[];
    title: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    categories?: Category[]; // Added categories context
    storeId: string;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, type, items, title, showToast, uploadImage, categories = [], storeId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isOpen && items.length > 0) {
            const generateSuggestions = async () => {
                setIsLoading(true);
                try {
                    let newProcessedItems: ProcessedItem[] = [];
                    
                    if (type === 'details') {
                        // Advanced Spec Generation with Google Search & Context Awareness
                        const promises = items.map(item => {
                            const product = item as Product;
                            
                            // 1. Find existing pattern for this category
                            let existingPattern = "";
                            if (categories && product.category) {
                                const cat = categories.find(c => c.id === product.category);
                                if (cat && cat.specTemplates && cat.specTemplates.length > 0) {
                                    existingPattern = `
                                    CONTEXTO IMPORTANTE DO BANCO DE DADOS:
                                    Esta loja já utiliza os seguintes campos padrão para a categoria deste produto: ${JSON.stringify(cat.specTemplates)}.
                                    
                                    REGRA DE OURO:
                                    Se a informação encontrada corresponder a um desses campos existentes, USE O NOME EXATO DO CAMPO EXISTENTE como chave no JSON.
                                    Exemplo: Se o banco de dados usa "Saúde da Bateria" e você achar a info de bateria, use "Saúde da Bateria" e não "Bateria" ou "Capacidade".
                                    Apenas crie chaves novas se a informação for crucial e não se encaixar nos padrões existentes.
                                    `;
                                }
                            }

                            // 2. Construct Prompt
                            const prompt = `
                                Você é um gerente de dados de e-commerce.
                                Pesquise na internet as especificações técnicas REAIS e ATUAIS do produto: "${product.name}".
                                
                                ${existingPattern}
                                
                                Retorne EXCLUSIVAMENTE um objeto JSON válido.
                                As chaves do JSON devem ser as especificações em Português.
                                Os valores devem ser os detalhes técnicos curtos e diretos.
                                
                                NÃO inclua markdown, crases ou a palavra 'json'. Apenas o objeto { ... }.
                            `;
                            
                            return ai.models.generateContent({ 
                                model: 'gemini-2.5-flash', 
                                contents: prompt,
                                config: {
                                    tools: [{ googleSearch: {} }] // Enable Grounding
                                }
                            });
                        });

                        const responses = await Promise.all(promises);
                        
                        newProcessedItems = responses.map((res, i) => {
                            let text = res.text.trim();
                            // Cleanup markdown if model ignores instruction
                            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                            
                            // Verify if it's valid JSON, if not, fallback to a basic string structure wrapped in JSON
                            try {
                                JSON.parse(text); 
                            } catch (e) {
                                // Fallback if search/json fails: treat entire text as a single 'Detalhes' field
                                text = JSON.stringify({ "Detalhes Gerais": text });
                            }

                            return {
                                originalItem: items[i],
                                suggestion: text, // This is now a JSON string
                            };
                        });

                    } else if (type === 'images') {
                        const promises = items.map(item => {
                            const product = item as Product;
                            const prompt = `Uma foto de estúdio profissional e minimalista de um "${product.name}" em um fundo branco puro (#FFFFFF), iluminação suave, alta resolução, proporção 1:1.`;
                            return ai.models.generateContent({
                                model: 'gemini-2.5-flash-image',
                                contents: { parts: [{ text: prompt }] },
                                config: { responseModalities: [Modality.IMAGE] }
                            });
                        });
                        const responses = await Promise.all(promises);
                        newProcessedItems = responses.map((res, i) => ({
                            originalItem: items[i],
                            base64Image: res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '',
                        }));
                    } else if (type === 'categories') {
                        newProcessedItems = items.map(item => ({ originalItem: item }));
                    }
                    setProcessedItems(newProcessedItems);
                    setSelectedIndices(new Set(newProcessedItems.map((_, i) => i)));
                } catch (error) {
                    console.error("AI Generation Error:", error);
                    showToast("Erro ao gerar sugestões da IA.", 'error');
                    onClose();
                } finally {
                    setIsLoading(false);
                }
            };
            generateSuggestions();
        } else {
            setProcessedItems([]);
            setSelectedIndices(new Set());
        }
    }, [isOpen, items, type, categories]); // Added categories to dependency array

    const handleToggleSelection = (index: number) => {
        const newSelection = new Set(selectedIndices);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelectedIndices(newSelection);
    };

    const handleToggleSelectAll = () => {
        if (selectedIndices.size === processedItems.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(processedItems.map((_, i) => i)));
        }
    };

    const handleSuggestionChange = (index: number, value: string) => {
        const newItems = [...processedItems];
        newItems[index].suggestion = value;
        setProcessedItems(newItems);
    };
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const batch = db.batch();
            const itemsToProcess = processedItems.filter((_, i) => selectedIndices.has(i));

            if (type === 'details') {
                itemsToProcess.forEach(item => {
                    const product = item.originalItem as Product;
                    if (product.id && item.suggestion) {
                        try {
                            const specsObj = JSON.parse(item.suggestion);
                            
                            // 1. Update the structured specifications map
                            const updates: any = { specifications: specsObj };
                            
                            // 2. Also update the legacy details string for backward compatibility/quick view
                            const legacyDetails = Object.entries(specsObj)
                                .map(([key, val]) => `${key}: ${val}`)
                                .join(' | ');
                            updates.details = legacyDetails;

                            // FIX: Use getDocRef to ensure we write to the correct store path
                            batch.update(getDocRef('products', product.id, storeId), updates);
                            
                        } catch (e) {
                            console.error("Error parsing JSON for product update", e);
                            // Fallback: save as simple details string
                            batch.update(getDocRef('products', product.id, storeId), { details: item.suggestion });
                        }
                    }
                });
            } else if (type === 'categories') {
                itemsToProcess.forEach(item => {
                    const category = item.originalItem as Category;
                    if (category.docId) {
                        // FIX: Use getDocRef
                        batch.delete(getDocRef('categories', category.docId, storeId));
                    }
                });
            } else if (type === 'images') {
                 for (const item of itemsToProcess) {
                    const product = item.originalItem as Product;
                    if (product.id && item.base64Image) {
                        const file = await base64ToFile(item.base64Image, `${product.id}.png`);
                        const imageUrl = await uploadImage(file);
                        // FIX: Use getDocRef
                        batch.update(getDocRef('products', product.id, storeId), { image: imageUrl });
                    }
                }
            }
            await batch.commit();
            showToast(`${selectedIndices.size} itens foram atualizados!`, 'success');
            onClose();

        } catch (error) {
            console.error("Save Error:", error);
            showToast("Erro ao salvar as alterações.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Cpu size={22} className="text-blue-400"/> {title}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <Loader className="animate-spin text-yellow-500 mb-4" size={32} />
                        <p className="text-gray-400 text-center">A IA está pesquisando dados reais na internet e<br/>consultando seus padrões de cadastro...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 overflow-y-auto">
                            <div className="space-y-3">
                                {processedItems.map((item, index) => (
                                    <div key={index} className="flex items-start gap-4 p-3 bg-black rounded-md border border-gray-800">
                                        <input type="checkbox" checked={selectedIndices.has(index)} onChange={() => handleToggleSelection(index)} className="mt-1 h-5 w-5" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-white">{(item.originalItem as Product).name || (item.originalItem as Category).name}</p>
                                            {type === 'details' && (
                                                <textarea
                                                    value={item.suggestion}
                                                    onChange={e => handleSuggestionChange(index, e.target.value)}
                                                    rows={6}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm mt-2 font-mono text-blue-200"
                                                    placeholder='JSON das especificações...'
                                                />
                                            )}
                                            {type === 'categories' && <p className="text-sm text-gray-400">Esta categoria será removida.</p>}
                                        </div>
                                        {type === 'images' && (
                                            <div className="w-24 h-24 bg-gray-900 rounded-md flex items-center justify-center">
                                                {item.base64Image ? (
                                                    <img src={`data:image/png;base64,${item.base64Image}`} alt="Sugestão" className="object-contain w-full h-full" />
                                                ) : <ImageIcon className="text-gray-600" />}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 mt-auto border-t border-[#27272a] flex justify-between items-center">
                            <div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={selectedIndices.size === processedItems.length} onChange={handleToggleSelectAll} />
                                    Selecionar Todos
                                </label>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={onClose} className="bg-gray-600 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isSaving || selectedIndices.size === 0}
                                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                                    {isSaving ? 'Salvando...' : `Salvar ${selectedIndices.size} Alterações`}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActionModal;
