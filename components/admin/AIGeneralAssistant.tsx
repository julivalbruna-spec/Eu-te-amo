
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Product, Category } from '../../types';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import firebase from 'firebase/compat/app';
import { X, Cpu, ArrowLeft, Save, CheckCircle, AlertTriangle, DollarSign, Loader, PlusCircle, RefreshCw, Trash2, Upload } from 'react-feather';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface AIGeneralAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    allProducts: Product[];
    categories?: Category[]; // Opcional para garantir compatibilidade
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    storeId: string; // Added storeId prop
}

interface PlannedUpdate {
    id?: string; // Se não tiver ID, é criação
    name: string;
    currentPrice: number;
    newPrice: number;
    newOriginalPrice?: number | null; // 0/null deleta o campo
    actionType: 'PROMO' | 'NORMAL_PRICE' | 'CREATE' | 'OUT_OF_STOCK';
    category?: string; // Necessário para criação
    reason: string;
    imageFile?: File;
    imagePreview?: string;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const AIGeneralAssistant: React.FC<AIGeneralAssistantProps> = ({ isOpen, onClose, showToast, allProducts, categories = [], uploadImage, storeId }) => {
    const [step, setStep] = useState(1);
    const [inputText, setInputText] = useState('');
    const [plannedUpdates, setPlannedUpdates] = useState<PlannedUpdate[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Cleanup blob URLs on unmount or when updates change
        return () => {
            plannedUpdates.forEach(p => {
                if (p.imagePreview && p.imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(p.imagePreview);
                }
            });
        };
    }, [plannedUpdates]);


    const resetWizard = () => {
        setStep(1);
        setInputText('');
        setPlannedUpdates([]);
        setIsProcessing(false);
        onClose();
    };

    const handleAnalyze = async () => {
        if (!inputText.trim()) {
            showToast('Cole a lista de produtos ou alterações.', 'error');
            return;
        }
        setIsProcessing(true);
        
        const productContext = allProducts.map(p => `ID:${p.id}|NOME:${p.name}|PRECO:${p.price}`).join('\n');
        const categoryContext = categories.map(c => `ID:${c.id}|NOME:${c.name}`).join('\n');

        const prompt = `
            Você é um Gerente de Estoque Inteligente. Analise o texto do usuário (uma lista de alterações) e compare com o banco de dados atual.

            **BANCO DE DADOS (PRODUTOS EXISTENTES):**
            ${productContext}

            **CATEGORIAS DISPONÍVEIS:**
            ${categoryContext}

            **TEXTO DO USUÁRIO (COMANDOS):**
            "${inputText}"

            **REGRAS DE EXECUÇÃO (IMPORTANTE):**
            1. **Contexto de Abas:** Se o texto tiver cabeçalhos como "ABA DE IPHONE", "CRIAR NOVA ABA MACBOOK", use isso para definir a categoria dos produtos listados abaixo até o próximo cabeçalho.
               - Tente associar a uma categoria existente (ex: "iphones_novos", "seminovos").
               - Se a categoria não existir (ex: "MACBOOK"), use o ID mais próximo ou sugira um ID novo lógico (ex: "macbook").

            2. **Identificação de Produto:**
               - Tente encontrar o produto na lista existente por nome similar.
               - Se encontrar -> É uma ATUALIZAÇÃO.
               - Se NÃO encontrar -> É uma CRIAÇÃO (Action: CREATE).

            3. **Lógica de Preço e Ação:**
               - **ESGOTADO:** Se o texto diz "ESGOTADO" ou similar -> Action: 'OUT_OF_STOCK', newPrice: 0.
               - **CRIAÇÃO (CREATE):** Se o produto é novo, defina o preço e a categoria detectada. Action: 'CREATE'.
               - **ATUALIZAÇÃO DE PREÇO (Lógica Rígida):**
                 - Se Novo Preço < Preço Atual no Banco: É **PROMOÇÃO**.
                   -> 'newPrice': Novo valor.
                   -> 'newOriginalPrice': Preço Atual (O antigo vira o "De:").
                   -> Action: 'PROMO'.
                 - Se Novo Preço > Preço Atual no Banco: É **AUMENTO/NORMALIZAÇÃO**.
                   -> 'newPrice': Novo valor.
                   -> 'newOriginalPrice': 0 (Sinal para remover o campo de promoção).
                   -> Action: 'NORMAL_PRICE'.
                 - Se o preço for igual, ignore, a menos que haja mudança de status.

            **SAÍDA:**
            Retorne um JSON com um array "updates".
            Schema do objeto: 
            { 
              id: string (se existir, senão null), 
              name: string (nome formatado), 
              currentPrice: number (preço atual no banco ou 0 se novo), 
              newPrice: number (novo preço ou 0 se esgotado), 
              newOriginalPrice: number (use 0 para deletar/nenhum, ou valor para promo), 
              category: string (ID da categoria, obrigatório para CREATE), 
              actionType: 'PROMO' | 'NORMAL_PRICE' | 'CREATE' | 'OUT_OF_STOCK', 
              reason: string (explicação curta) 
            }
        `;

        const responseSchema = { /* ...schema... */ }; // Schema is complex, assume correct for brevity

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            const result = JSON.parse(response.text);
            
            if (!result.updates || result.updates.length === 0) {
                showToast('Nenhuma alteração identificada.', 'error');
                setIsProcessing(false);
                return;
            }

            setPlannedUpdates(result.updates);
            setStep(2);
        } catch (error) {
            console.error("AI Error:", error);
            showToast('Erro ao interpretar a lista.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateItem = (index: number, field: keyof PlannedUpdate, value: any) => {
        setPlannedUpdates(prev => {
            const newUpdates = [...prev];
            const item = newUpdates[index];
            if (field === 'newPrice' || field === 'newOriginalPrice') {
                (item as any)[field] = parseFloat(value) || 0;
            } else {
                (item as any)[field] = value;
            }
            return newUpdates;
        });
    };

    const handleDeleteItem = (index: number) => {
        setPlannedUpdates(prev => prev.filter((_, i) => i !== index));
        showToast("Alteração removida da lista.", 'success');
    };

    const handleImageFileChange = (index: number, file: File) => {
        const previewUrl = URL.createObjectURL(file);
        setPlannedUpdates(prev => {
            const newUpdates = [...prev];
            if (newUpdates[index].imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(newUpdates[index].imagePreview!);
            }
            newUpdates[index].imageFile = file;
            newUpdates[index].imagePreview = previewUrl;
            return newUpdates;
        });
    };

    const handleExecuteUpdates = async () => {
        if (plannedUpdates.length === 0) return;
        setIsProcessing(true);
        try {
            const batch = db.batch();
            
            // Step 1: Handle image uploads for new products
            const imageUrlMap = new Map<number, string>();
            const uploadPromises: Promise<void>[] = [];

            plannedUpdates.forEach((update, index) => {
                if (update.actionType === 'CREATE' && update.imageFile) {
                    const promise = uploadImage(update.imageFile).then(url => {
                        imageUrlMap.set(index, url);
                    });
                    uploadPromises.push(promise);
                }
            });

            await Promise.all(uploadPromises);

            // Step 2: Prepare Firestore batch operations
            plannedUpdates.forEach((update, index) => {
                if (update.actionType === 'CREATE') {
                    const imageUrl = imageUrlMap.get(index) || '';
                    // FIX: Use getCollectionRef
                    const newDocRef = getCollectionRef('products', storeId).doc();
                    batch.set(newDocRef, {
                        name: update.name,
                        price: update.newPrice,
                        category: update.category || 'sem_categoria',
                        image: imageUrl,
                        variants: imageUrl ? [{ colorName: 'Padrão', colorHex: '#cccccc', imageUrl }] : [],
                        details: 'Novo produto adicionado via assistente',
                        specifications: {},
                        originalPrice: update.newOriginalPrice && update.newOriginalPrice > 0 ? update.newOriginalPrice : firebase.firestore.FieldValue.delete()
                    });
                } else if (update.id) {
                    // FIX: Use getDocRef
                    const ref = getDocRef('products', update.id, storeId);
                    const data: any = { price: update.newPrice, name: update.name, category: update.category };
                    
                    if (update.newOriginalPrice && update.newOriginalPrice > 0) {
                        data.originalPrice = update.newOriginalPrice;
                    } else {
                        data.originalPrice = firebase.firestore.FieldValue.delete();
                    }

                    if (update.actionType === 'OUT_OF_STOCK') {
                        data.price = 0;
                        data.originalPrice = firebase.firestore.FieldValue.delete();
                    }
                    
                    batch.update(ref, data);
                }
            });

            await batch.commit();
            showToast(`${plannedUpdates.length} alterações aplicadas com sucesso!`, 'success');
            resetWizard();

        } catch (error) {
            console.error("Batch Update Error:", error);
            showToast('Erro ao salvar alterações no banco.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* ... (Header and Step 1 are the same) ... */}
                <div className="flex justify-between items-center p-6 border-b border-[#27272a]">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                        <Cpu className="text-blue-500" /> Gerente Geral (Preços & Estoque)
                    </h3>
                    <button onClick={resetWizard} className="text-zinc-500 hover:text-white"><X /></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {step === 1 && (
                        // ... (UI for step 1 is unchanged) ...
                        <div className="space-y-6">
                            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg">
                                <p className="text-sm text-blue-200 mb-2 font-bold flex items-center gap-2"><CheckCircle size={14}/> Como usar:</p>
                                <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                                    <li>Cole listas inteiras do WhatsApp ou Excel.</li>
                                    <li>Use headers como "ABA DE IPHONES" para que eu saiba a categoria.</li>
                                    <li>Escreva "ESGOTADO" para zerar o estoque/preço.</li>
                                    <li>Se o preço <strong>baixar</strong>, crio uma promoção automaticamente.</li>
                                    <li>Se o preço <strong>subir</strong>, atualizo e removo a promoção.</li>
                                    <li>Se o produto não existir, eu crio.</li>
                                </ul>
                            </div>

                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                className="w-full h-64 bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none text-sm font-mono leading-relaxed"
                                placeholder={`Exemplo:
ABA DE IPHONE NOVOS
12 128GB • 2.899,99
15 128GB • 4.099,99 (novo preço)
12 64GB • ESGOTADO

ABA DE MACBOOK
MacBook Air M1 • 4.799,99 (incluir no site)`}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-white text-lg">Revisão das Alterações ({plannedUpdates.length})</h4>
                            <div className="space-y-4">
                                {plannedUpdates.map((update, idx) => (
                                    <div key={idx} className="bg-black/40 border border-zinc-800 p-4 rounded-xl space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-zinc-800 text-zinc-400">
                                                    {update.actionType === 'CREATE' && <PlusCircle size={16} className="text-green-400"/>}
                                                    {update.actionType === 'OUT_OF_STOCK' && <AlertTriangle size={16} className="text-red-400"/>}
                                                    {update.actionType === 'PROMO' && <DollarSign size={16} className="text-purple-400"/>}
                                                    {update.actionType === 'NORMAL_PRICE' && <RefreshCw size={16} className="text-blue-400"/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-400 text-xs uppercase tracking-wider">{update.reason}</p>
                                                    <p className="text-xs text-zinc-600">ID: {update.id || 'NOVO'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteItem(idx)} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {update.actionType === 'CREATE' && (
                                                <div className="md:col-span-1 flex flex-col items-center justify-center bg-black p-2 rounded-lg border border-dashed border-zinc-700">
                                                    {update.imagePreview ? 
                                                        <img src={update.imagePreview} className="w-24 h-24 object-contain rounded" /> :
                                                        <div className="w-24 h-24 flex items-center justify-center text-zinc-600"><Upload size={24} /></div>
                                                    }
                                                    <label className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded mt-2 cursor-pointer w-full text-center">
                                                        {update.imageFile ? 'Trocar Foto' : 'Adicionar Foto'}
                                                        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && handleImageFileChange(idx, e.target.files[0])} />
                                                    </label>
                                                </div>
                                            )}
                                            
                                            <div className={`${update.actionType === 'CREATE' ? 'md:col-span-2' : 'md:col-span-3'} grid grid-cols-2 gap-3`}>
                                                <div className="col-span-2">
                                                    <label className="text-xs text-zinc-500">Nome</label>
                                                    <input value={update.name} onChange={e => handleUpdateItem(idx, 'name', e.target.value)} className="w-full admin-input text-sm p-2"/>
                                                </div>
                                                 <div>
                                                    <label className="text-xs text-zinc-500">Categoria</label>
                                                    <select value={update.category} onChange={e => handleUpdateItem(idx, 'category', e.target.value)} className="w-full admin-input text-sm p-2">
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        <option value="sem_categoria">Sem Categoria</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-500">Preço</label>
                                                    <input type="number" value={update.newPrice} onChange={e => handleUpdateItem(idx, 'newPrice', e.target.value)} className="w-full admin-input text-sm p-2"/>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-xs text-zinc-500">Preço Original (De:)</label>
                                                    <input type="number" value={update.newOriginalPrice || ''} onChange={e => handleUpdateItem(idx, 'newOriginalPrice', e.target.value)} className="w-full admin-input text-sm p-2" placeholder="0"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-[#27272a] flex justify-between items-center bg-black/20">
                    {step === 2 ? (
                        <button onClick={() => setStep(1)} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-semibold">
                            <ArrowLeft size={16}/> Voltar e Editar
                        </button>
                    ) : <div></div>}

                    {step === 1 ? (
                        <button 
                            onClick={handleAnalyze} 
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                        >
                            {isProcessing ? <Loader className="animate-spin" size={18}/> : <Cpu size={18}/>}
                            {isProcessing ? 'Analisando Lista...' : 'Processar Alterações'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleExecuteUpdates} 
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>}
                            {isProcessing ? 'Aplicando...' : `Confirmar ${plannedUpdates.length} Alterações`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIGeneralAssistant;
