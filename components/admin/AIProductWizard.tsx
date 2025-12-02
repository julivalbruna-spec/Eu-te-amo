
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { Product, Category } from '../../types';
import { db } from '../../firebase';
import { Upload, X, Cpu, ArrowLeft, Loader, Check, FileText } from 'react-feather';
import ImageProcessingModal from './ImageProcessingModal';

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

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

interface AIProductWizardProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    categories: Category[];
}

interface TempProduct extends Omit<Product, 'id' | 'image'> {
    image?: string;
    imageFile?: File;
    imageUrl?: string;
    imagePreview?: string;
    isNewCategory?: boolean;
    newCategoryName?: string;
    imageAction?: 'undecided' | 'use_as_is' | 'processed';
    // Explicitly added to handle the wizard flow
    specifications?: any; // Flexible type to handle API array response before conversion
}


const AIProductWizard: React.FC<AIProductWizardProps> = ({ isOpen, onClose, showToast, uploadImage, categories }) => {
    const [step, setStep] = useState(1);
    const [inputText, setInputText] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [contextFiles, setContextFiles] = useState<File[]>([]); // New state for PDF/Doc files
    const [parsedProducts, setParsedProducts] = useState<TempProduct[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [productIndexToProcess, setProductIndexToProcess] = useState<number | null>(null);


    const imagePreviews = useMemo(() => {
        return imageFiles.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));
    }, [imageFiles]);
    
    useEffect(() => {
        // Cleanup object URLs
        return () => {
            imagePreviews.forEach(img => URL.revokeObjectURL(img.url));
            parsedProducts.forEach(p => {
                if (p.imagePreview && p.imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(p.imagePreview);
                }
            });
        };
    }, [imagePreviews, parsedProducts]);

    const resetWizard = () => {
        setStep(1);
        setInputText('');
        setImageFiles([]);
        setContextFiles([]);
        setParsedProducts([]);
        setIsProcessing(false);
        onClose();
    };

    const normalizeForMatch = (str: string): string[] => {
        return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(Boolean);
    };
    
    const handleGenerate = async () => {
        if (!inputText.trim() && contextFiles.length === 0) {
            showToast('Por favor, insira a lista de produtos ou anexe um arquivo.', 'error');
            return;
        }
        setIsProcessing(true);
        
        const categoryList = categories.map(c => `${c.name} (id: ${c.id})`).join('; ');

        // Construct parts for Gemini
        const parts: any[] = [];
        
        // 1. Text Context from Input
        let combinedText = inputText;

        // 2. Process Files
        for (const file of contextFiles) {
            if (file.type === 'application/pdf') {
                const b64 = await blobToBase64(file);
                parts.push({ inlineData: { mimeType: 'application/pdf', data: b64 } });
            } else if (
                file.type === 'text/plain' || 
                file.type === 'text/csv' || 
                file.name.endsWith('.csv') || 
                file.name.endsWith('.json') ||
                file.name.endsWith('.xml')
            ) {
                const textContent = await readFileAsText(file);
                combinedText += `\n\n--- CONTEÚDO DO ARQUIVO ${file.name} ---\n${textContent}\n--- FIM DO ARQUIVO ---\n`;
            } else {
                console.warn("Unsupported file type for direct reading, skipping:", file.type);
            }
        }

        const prompt = `
            Analise os dados fornecidos (texto e arquivos anexos). Eles contêm uma lista de produtos, seus preços e detalhes. Extraia cada produto e retorne um array JSON.

            Cada objeto no array deve ter: "name", "price", "originalPrice" (opcional), "category", "image" (opcional) e PRINCIPALMENTE "specifications".

            Regras Essenciais:
            1.  **Categoria**: Associe cada produto a um ID da lista a seguir: ${categoryList}. Escolha o mais relevante. Se um produto não se encaixar em nenhuma, crie um novo ID descritivo (ex: "fones_de_ouvido"), adicione "isNewCategory": true, e "newCategoryName" com o nome da nova categoria.
            2.  **Especificações (CRUCIAL)**: Extraia TODAS as características técnicas (Armazenamento, Cor, Condição, Bateria, etc) para o campo "specifications".
                IMPORTANTE: O campo "specifications" deve ser uma LISTA de objetos, onde cada objeto tem "key" (nome do atributo) e "value" (valor).
                Exemplo: "specifications": [{ "key": "Armazenamento", "value": "128GB" }, { "key": "Cor", "value": "Preto" }]
            3.  **Preço Original**: Preencha o campo "originalPrice" somente se houver uma clara indicação de preço "de/por".
            4.  **Imagem**: Se houver um URL de imagem, coloque-o no campo "image".

            Texto de Entrada:
            ---
            ${combinedText}
            ---
        `;
        
        parts.push({ text: prompt });
        
        // FIX: Changed specifications from OBJECT to ARRAY of OBJECTS to satisfy Schema validation
        const productSchema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                originalPrice: { type: Type.NUMBER },
                specifications: { 
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            key: { type: Type.STRING },
                            value: { type: Type.STRING }
                        }
                    },
                    description: "Lista de especificações técnicas"
                },
                category: { type: Type.STRING },
                image: { type: Type.STRING },
                isNewCategory: { type: Type.BOOLEAN },
                newCategoryName: { type: Type.STRING }
            },
            required: ['name', 'price', 'category']
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: productSchema }
                }
            });

            // Robust JSON Parsing
            let rawText = response.text || "[]";
            // Clean markdown code blocks if present
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            let generatedProducts: any[] = [];
            
            try {
                 generatedProducts = JSON.parse(rawText);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                // Try to find array in text if direct parse fails
                const arrayMatch = rawText.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    try {
                        generatedProducts = JSON.parse(arrayMatch[0]);
                    } catch (e) {
                         throw new Error("Formato de resposta inválido da IA.");
                    }
                } else {
                    throw new Error("Formato de resposta inválido da IA.");
                }
            }

            if (!Array.isArray(generatedProducts)) {
                 throw new Error("A IA não retornou uma lista válida.");
            }

            const availableImages = [...imageFiles];
            
            // FIX: Convert the array of specs back to an object for the App's internal structure
            const processedProducts: TempProduct[] = generatedProducts.map(product => {
                const specObject: { [key: string]: string } = {};
                
                if (Array.isArray(product.specifications)) {
                    product.specifications.forEach((spec: any) => {
                        if (spec.key && spec.value) {
                            specObject[spec.key] = spec.value;
                        }
                    });
                } else if (typeof product.specifications === 'object' && product.specifications !== null) {
                    // Fallback if IA returns object despite schema
                    Object.assign(specObject, product.specifications);
                }

                return {
                    ...product,
                    specifications: specObject,
                    // Fallback for legacy details field
                    details: Object.entries(specObject).map(([k,v]) => `${k}: ${v}`).join(' | ')
                };
            });

            processedProducts.forEach(product => {
                const productWords = normalizeForMatch(product.name);
                
                let bestMatchIndex = -1;
                let bestMatchScore = 0;

                availableImages.forEach((file, index) => {
                    const fileName = file.name.split('.').slice(0, -1).join(' ');
                    const fileWords = normalizeForMatch(fileName);
                    const intersection = productWords.filter(word => fileWords.includes(word));
                    
                    if (intersection.length > bestMatchScore) {
                        bestMatchScore = intersection.length;
                        bestMatchIndex = index;
                    }
                });

                if (bestMatchIndex !== -1) {
                    const bestMatch = availableImages[bestMatchIndex];
                    product.imageFile = bestMatch;
                    product.imagePreview = URL.createObjectURL(bestMatch);
                    product.imageAction = 'undecided';
                    availableImages.splice(bestMatchIndex, 1);
                } else if (product.image) {
                    product.imagePreview = product.image;
                }
            });


            setParsedProducts(processedProducts);
            setStep(2);
        } catch (error: any) {
            console.error("AI processing error:", error);
            showToast(`Erro ao processar: ${error.message || 'Tente simplificar o texto.'}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const updatedProducts = [...parsedProducts];
            const productToUpdate = updatedProducts[index];
    
            if (productToUpdate.imagePreview && productToUpdate.imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(productToUpdate.imagePreview);
            }
    
            productToUpdate.imageFile = file;
            productToUpdate.imagePreview = URL.createObjectURL(file);
            productToUpdate.imageAction = 'undecided';
    
            setParsedProducts(updatedProducts);
        }
    };
    
    const handleEditImage = (index: number) => {
        const product = parsedProducts[index];
        if (product.imageFile) {
            setProductIndexToProcess(index);
            setIsProcessingModalOpen(true);
        } else {
            showToast("Anexe um arquivo de imagem para poder editar.", 'error');
        }
    };
    
    const handleSetImageAction = (index: number, action: 'use_as_is' | 'processed') => {
        const updatedProducts = [...parsedProducts];
        updatedProducts[index].imageAction = action;
        setParsedProducts(updatedProducts);
    };

    const handleImageProcessed = (processedFile: File) => {
        if (productIndexToProcess === null) return;

        const updatedProducts = [...parsedProducts];
        const productToUpdate = updatedProducts[productIndexToProcess];

        if (productToUpdate.imagePreview && productToUpdate.imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(productToUpdate.imagePreview);
        }

        productToUpdate.imageFile = processedFile;
        productToUpdate.imagePreview = URL.createObjectURL(processedFile);
        
        setParsedProducts(updatedProducts);
        handleSetImageAction(productIndexToProcess, 'processed');
        setIsProcessingModalOpen(false);
        setProductIndexToProcess(null);
    };

    const handleUpdateProduct = (index: number, field: keyof TempProduct, value: any) => {
        const updatedProducts = [...parsedProducts];
        (updatedProducts[index] as any)[field] = value;
        setParsedProducts(updatedProducts);
    };

    const handleSaveAll = async () => {
        setIsProcessing(true);
        try {
            const newCategoryMap = new Map<string, string>(); 
            parsedProducts.forEach(p => {
                if (p.isNewCategory && p.newCategoryName && p.category) {
                    newCategoryMap.set(p.category, p.newCategoryName);
                }
            });
    
            if (newCategoryMap.size > 0) {
                const createCategoryBatch = db.batch();
                const q = db.collection('categories').orderBy('order', 'desc').limit(1);
                const existingCategoriesSnapshot = await q.get();
                let lastOrder = existingCategoriesSnapshot.empty ? -1 : (existingCategoriesSnapshot.docs[0].data().order || 0);
                
                for (const [id, name] of newCategoryMap.entries()) {
                    lastOrder++;
                    const newCategoryDocRef = db.collection('categories').doc();
                    createCategoryBatch.set(newCategoryDocRef, { id, name, order: lastOrder });
                }
                await createCategoryBatch.commit();
                showToast(`${newCategoryMap.size} nova(s) categoria(s) criada(s)!`, 'success');
            }
    
            const productsWithImageUrls = await Promise.all(parsedProducts.map(async (product) => {
                if (product.imageFile) {
                    const uploadedUrl = await uploadImage(product.imageFile);
                    return { ...product, imageUrl: uploadedUrl };
                }
                return { ...product, imageUrl: product.image || '' };
            }));
    
            const batch = db.batch();
            productsWithImageUrls.forEach(p => {
                const docRef = db.collection('products').doc();
                const productData: Omit<Product, 'id'> = {
                    name: p.name,
                    price: Number(p.price) || 0,
                    originalPrice: Number(p.originalPrice) || undefined,
                    specifications: p.specifications,
                    // Also save legacy details as a fallback
                    details: p.details || Object.entries(p.specifications || {}).map(([k,v]) => `${k}: ${v}`).join(' | '),
                    category: p.category,
                    image: p.imageUrl || '',
                };
                if (!productData.originalPrice) delete productData.originalPrice;
                batch.set(docRef, productData);
            });
            await batch.commit();
    
            showToast(`${productsWithImageUrls.length} produtos adicionados com sucesso!`, 'success');
            resetWizard();
        } catch (error) {
            console.error("Error saving all products:", error);
            showToast('Ocorreu um erro ao salvar os produtos.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const allImagesDecided = useMemo(() => {
        return parsedProducts.every(p => !p.imageFile || p.imageAction !== 'undecided');
    }, [parsedProducts]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
             <ImageProcessingModal
                isOpen={isProcessingModalOpen}
                onClose={() => setIsProcessingModalOpen(false)}
                imageFile={productIndexToProcess !== null ? parsedProducts[productIndexToProcess].imageFile || null : null}
                onConfirm={handleImageProcessed}
                showToast={showToast}
            />
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <Cpu className="text-blue-400" />
                        Assistente IA para Adicionar Produtos
                    </h3>
                    <button onClick={resetWizard}><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="font-semibold mb-2 block">1. Cole a lista de produtos (Texto)</label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Ex: iPhone 15 Pro 256GB - R$ 6.500,00 - seminovo, bateria 95% - https://site.com/img.png"
                                    rows={6}
                                    className="w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="font-semibold mb-2 block">2. Documentos de Contexto (Opcional)</label>
                                <p className="text-sm text-gray-400 mb-2">Envie PDFs, CSVs ou TXTs com a lista de preços. A IA irá ler o arquivo.</p>
                                <div className="border-2 border-dashed border-[#27272a] rounded-lg p-4 text-center">
                                    <FileText className="mx-auto text-gray-500 mb-2" />
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept=".pdf,.csv,.txt,.json,.xml" 
                                        onChange={(e) => setContextFiles(Array.from(e.target.files || []))} 
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" 
                                    />
                                    {contextFiles.length > 0 && (
                                        <div className="mt-2 text-sm text-blue-400">{contextFiles.length} arquivos selecionados</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold mb-2 block">3. Envie imagens de produtos (Opcional)</label>
                                <p className="text-sm text-gray-400 mb-2">A IA tentará associar as imagens aos produtos pelo nome do arquivo.</p>
                                <div className="border-2 border-dashed border-[#27272a] rounded-lg p-6 text-center">
                                    <Upload className="mx-auto text-gray-500 mb-2" />
                                    <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500" />
                                </div>
                                {imagePreviews.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {imagePreviews.map(img => <img key={img.name} src={img.url} alt={img.name} className="h-16 w-16 object-cover rounded" />)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                   {step === 2 && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-lg mb-2">2. Revise os produtos e confirme</h4>
                            <p className="text-sm text-gray-400 mb-4">Ajuste os campos gerados (Especificações e Categoria) antes de salvar.</p>
                            {parsedProducts.map((product, index) => (
                                <div key={index} className="bg-black border border-[#27272a] rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            {product.imagePreview ? 
                                                <img src={product.imagePreview} alt="preview" className="h-28 w-28 object-contain rounded" /> : 
                                                <div className="h-28 w-28 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500 p-2 text-center">Sem Imagem Associada</div>
                                            }
                                            {product.imageFile && product.imageAction === 'undecided' ? (
                                                <div className="p-2 bg-gray-900 rounded-md text-center w-full">
                                                    <p className="text-xs font-semibold mb-2">Processar Imagem?</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleSetImageAction(index, 'use_as_is')} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md flex-1">
                                                            Usar como está
                                                        </button>
                                                        <button onClick={() => handleEditImage(index)} className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-md flex-1">
                                                            Editar com IA
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 text-center">
                                                    <label className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md cursor-pointer flex-1">
                                                        {product.imageFile ? 'Trocar' : 'Anexar'}
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductFileChange(e, index)} />
                                                    </label>
                                                    {product.imageAction !== 'undecided' &&
                                                        <button onClick={() => handleEditImage(index)} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md">
                                                            Editar
                                                        </button>
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 block mb-1">Nome do Produto</label>
                                                <input type="text" value={product.name} onChange={e => handleUpdateProduct(index, 'name', e.target.value)} className="w-full bg-gray-800 p-2 rounded text-sm border border-transparent focus:border-blue-500 focus:ring-0" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-400 block mb-1">Preço (Promoção)</label>
                                                    <input type="number" value={product.price} onChange={e => handleUpdateProduct(index, 'price', e.target.value)} className="w-full bg-gray-800 p-2 rounded text-sm border border-transparent focus:border-blue-500 focus:ring-0" placeholder="Preço" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-400 block mb-1">Preço Original (De:)</label>
                                                    <input type="number" value={product.originalPrice || ''} onChange={e => handleUpdateProduct(index, 'originalPrice', e.target.value)} className="w-full bg-gray-800 p-2 rounded text-sm border border-transparent focus:border-blue-500 focus:ring-0" placeholder="Opcional" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 block mb-1">Especificações Detectadas</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.specifications && Object.entries(product.specifications).map(([k, v], i) => (
                                                        <span key={i} className="text-xs bg-blue-900/30 border border-blue-500/30 px-2 py-1 rounded-md text-blue-200">
                                                            <strong>{k}:</strong> {v as string}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 block mb-1">Categoria</label>
                                                {product.isNewCategory ? (
                                                    <div className="flex items-center gap-2">
                                                        <input type="text" value={product.newCategoryName} readOnly className="w-full bg-blue-900/50 p-2 rounded text-sm italic" title={`ID gerado: ${product.category}`}/>
                                                        <span className="text-xs font-bold text-blue-400 whitespace-nowrap bg-blue-900/50 px-2 py-1 rounded-md">NOVA</span>
                                                    </div>
                                                ) : (
                                                    <select value={product.category} onChange={e => handleUpdateProduct(index, 'category', e.target.value)} className="w-full bg-gray-800 p-2 rounded text-sm border border-transparent focus:border-blue-500 focus:ring-0">
                                                        <option value="">Selecione</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 mt-auto border-t border-[#27272a] flex justify-between items-center">
                    {step === 1 ? (
                        <div/> 
                    ) : (
                         <button onClick={() => setStep(1)} className="flex items-center gap-2 font-semibold text-gray-300 hover:text-white">
                            <ArrowLeft size={18} /> Voltar
                        </button>
                    )}

                    {step === 1 ? (
                        <button onClick={handleGenerate} disabled={isProcessing} className="flex items-center bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50">
                            {isProcessing ? 'Analisando...' : 'Analisar com IA'}
                        </button>
                    ) : (
                        <button onClick={handleSaveAll} disabled={isProcessing || !allImagesDecided} className="flex items-center bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={!allImagesDecided ? "Decida o que fazer com todas as imagens antes de salvar." : ""}>
                            {isProcessing ? 'Salvando...' : `Salvar ${parsedProducts.length} Produtos`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIProductWizard;
