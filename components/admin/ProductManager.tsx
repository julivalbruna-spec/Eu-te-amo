
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import firebase from 'firebase/compat/app';
import { Product, Category, ProductVariant, SiteInfo } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Cpu, Tag, Loader, ChevronDown, Box, Image as ImageIcon, Layers, Instagram, Copy, Check, Star, Search, ArrowLeft, ArrowRight, Database, AlertCircle, Download, Upload, Zap } from 'react-feather';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import ImageProcessingModal from './ImageProcessingModal';
import AIProductWizard from './AIProductWizard';
import { seedDatabase } from '../../seed';

const currencySymbols = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
};

interface ProductManagerProps {
    storeId: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
}

const SubSection: React.FC<{ title: string, children: React.ReactNode, action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="mb-5 bg-zinc-900/30 border border-white/5 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Box size={14} className="text-yellow-500" />
                {title}
            </h4>
            {action}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

export const ProductManager: React.FC<ProductManagerProps> = ({ storeId, showToast, uploadImage }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [specifications, setSpecifications] = useState<{key: string; value: string; example?: string}[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [loading, setLoading] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isGeneratingSpecs, setIsGeneratingSpecs] = useState(false);
    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [imageToProcess, setImageToProcess] = useState<File | null>(null);
    
    const [isAIWizardOpen, setIsAIWizardOpen] = useState(false);
    
    const [marketingCopy, setMarketingCopy] = useState('');
    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'marketing'>('editor');
    const [isSeeding, setIsSeeding] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    useEffect(() => {
        if (!storeId) return;
        setLoading(true);
        
        const productsQuery = getCollectionRef('products', storeId).orderBy('name');
        const unsubProducts = productsQuery.onSnapshot((snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
            setLoading(false);
        }, (error) => {
            showToast("Erro ao carregar produtos.", 'error');
            setLoading(false);
        });

        const categoriesQuery = getCollectionRef('categories', storeId).orderBy('order');
        const unsubCategories = categoriesQuery.onSnapshot((snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })) as Category[]);
        });

        const unsubSiteInfo = getDocRef('settings', 'siteInfo', storeId).onSnapshot(doc => {
            if (doc.exists) setSiteInfo(doc.data() as SiteInfo);
        });

        return () => {
            unsubProducts();
            unsubCategories();
            unsubSiteInfo();
        };
    }, [storeId]);

    const handleSeed = async () => {
        if (!window.confirm("Deseja adicionar todos os produtos padrão ao banco de dados? Isso pode criar duplicatas se eles já existirem.")) return;
        setIsSeeding(true);
        const result = await seedDatabase(storeId); 
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'error');
        }
        setIsSeeding(false);
    };

    const handleExportXML = () => {
        if (products.length === 0) {
            showToast("Nenhum produto para exportar.", 'error');
            return;
        }
        let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<products>\n`;
        products.forEach(p => {
            xmlContent += `  <product>\n    <name>${(p.name || '').replace(/&/g, '&amp;')}</name>\n    <price>${p.price || 0}</price>\n    <category>${p.category || ''}</category>\n  </product>\n`;
        });
        xmlContent += `</products>`;
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `produtos.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Lista exportada!", 'success');
    };

    const handleDeleteAllProducts = async () => {
        if (!window.confirm("ATENÇÃO: Isso apagará TODOS os produtos. Tem certeza?")) return;
        const confirmation = window.prompt("Digite 'DELETAR' para confirmar:");
        if (confirmation !== 'DELETAR') return;

        setLoading(true);
        try {
            const snapshot = await getCollectionRef('products', storeId).get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            showToast("Todos os produtos foram excluídos!", 'success');
        } catch (error) {
            showToast("Erro ao excluir produtos.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProductModal = (product: Partial<Product> | null = null) => {
        const initialProduct = product || { name: '', price: 0, costPrice: 0, specifications: {}, variants: [], currency: 'BRL', stock: undefined };
        setCurrentProduct(initialProduct);
        const specArray = initialProduct.specifications 
            ? Object.entries(initialProduct.specifications).map(([key, value]) => ({ key, value: String(value) }))
            : [];
        setSpecifications(specArray);
        setImageFile(null);
        setIsCreatingCategory(false);
        setNewCategoryName('');
        setUploadProgress(null);
        setMarketingCopy('');
        setActiveTab('editor');
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async () => {
        if (!currentProduct.name || !currentProduct.category) {
            showToast('Nome e categoria são obrigatórios.', 'error');
            return;
        }
        if (currentProduct.stock === undefined || currentProduct.stock === null || String(currentProduct.stock).trim() === '') {
            showToast('Estoque é obrigatório.', 'error');
            return;
        }

        const specsObject = specifications.reduce((acc, { key, value }) => {
            if (key.trim()) acc[key.trim()] = value;
            return acc;
        }, {} as { [key: string]: string });

        let productData: Partial<Product> = { ...currentProduct, specifications: specsObject };
        
        if (imageFile) {
            setUploadProgress(0);
            try {
                const imageUrl = await uploadImage(imageFile, setUploadProgress);
                productData.image = imageUrl;
                if (!productData.variants || productData.variants.length === 0) {
                     productData.variants = [{ colorName: 'Padrão', colorHex: '#cccccc', imageUrl }];
                } else {
                    // Se já tem variantes, atualiza a primeira imagem ou adiciona se quiser
                    productData.variants[0].imageUrl = imageUrl;
                }
            } catch (error) {
                showToast('Erro ao enviar imagem.', 'error');
                return;
            }
        }
        
        // Sanitize variants
        const sanitizedVariants = (productData.variants || []).map(v => ({
            colorName: v.colorName || 'Padrão',
            colorHex: v.colorHex || '#000000',
            imageUrl: v.imageUrl || ''
        }));

        const dataToSave: any = {
            name: productData.name,
            price: Number(productData.price) || 0,
            originalPrice: Number(productData.originalPrice) || 0,
            costPrice: Number(productData.costPrice) || 0,
            specifications: productData.specifications || {},
            category: productData.category,
            image: productData.image || '',
            variants: sanitizedVariants,
            stock: Number(productData.stock),
            currency: productData.currency || 'BRL'
        };

        if (dataToSave.originalPrice === 0) delete dataToSave.originalPrice;

        try {
            if (productData.id) {
                await getDocRef('products', productData.id, storeId).update(dataToSave);
                showToast('Produto atualizado!', 'success');
            } else {
                await getCollectionRef('products', storeId).add(dataToSave);
                showToast('Produto criado!', 'success');
            }
            setIsProductModalOpen(false);
        } catch (error) {
            showToast('Erro ao salvar.', 'error');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm('Excluir este produto?')) {
            await getDocRef('products', id, storeId).delete();
            showToast('Produto excluído.', 'success');
        }
    };

    const handleAddCategory = async (name: string, fromModal = false) => {
        if (!name.trim()) return;
        try {
             const newCat = {
                id: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                name: name.trim(),
                order: categories.length
            };
            await getCollectionRef('categories', storeId).add(newCat);
            showToast('Categoria criada!', 'success');
            if (fromModal) {
                setCurrentProduct(p => ({ ...p, category: newCat.id }));
                setIsCreatingCategory(false);
                setNewCategoryName('');
            }
        } catch (e) {
            showToast("Erro ao criar categoria.", 'error');
        }
    };
    
    const handleProcessingConfirmation = async (processedFile: File | null, variants?: Array<{ colorName: string; colorHex: string; imageFile: File }>) => {
        setIsProcessingModalOpen(false);
        setImageToProcess(null);

        if (variants && variants.length > 0) {
            setUploadProgress(0);
            try {
                 const uploadedVariants = await Promise.all(variants.map(async (v, i) => {
                    const imageUrl = await uploadImage(v.imageFile, (progress) => {
                        const totalProgress = ((i + (progress / 100)) / variants.length) * 100;
                        setUploadProgress(totalProgress);
                    });
                    return { colorName: v.colorName, colorHex: v.colorHex, imageUrl };
                }));
                
                setCurrentProduct(prev => {
                    const existingVariants = prev.variants || [];
                    const newVariants = [...existingVariants, ...uploadedVariants];
                    const newImage = prev.image || newVariants[0]?.imageUrl || '';
                    return { ...prev, variants: newVariants, image: newImage };
                });

                showToast(`${variants.length} variações adicionadas!`, 'success');

            } catch (error) {
                 console.error("Upload Error:", error);
                 showToast('Erro ao enviar imagens das variações.', 'error');
            } finally {
                setUploadProgress(null);
            }
        } else if (processedFile) {
            setImageFile(processedFile);
        }
    };

    const handleGenerateSpecifications = async () => {
        if (!currentProduct.name) return;
        setIsGeneratingSpecs(true);
        try {
            const prompt = `Gere especificações técnicas para: ${currentProduct.name}. Retorne JSON array [{key: "Tela", example: "6.1"}]`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const newSpecs = JSON.parse(response.text);
            setSpecifications(prev => [...prev, ...newSpecs.map((s: any) => ({ key: s.key, value: '', example: s.example }))]);
        } catch(e) { showToast("Erro na IA", 'error'); }
        setIsGeneratingSpecs(false);
    };

    const handleGenerateMarketingCopy = async () => {
        if (!currentProduct.name) return;
        setIsGeneratingCopy(true);
        try {
            const prompt = `Crie um post de venda para Instagram do produto: ${currentProduct.name}. Preço: ${currentProduct.price}.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setMarketingCopy(response.text || '');
        } catch(e) { showToast("Erro na IA", 'error'); }
        setIsGeneratingCopy(false);
    };
    
    const handleAddVariant = () => {
        setCurrentProduct(prev => ({
            ...prev,
            variants: [...(prev.variants || []), { colorName: 'Nova Cor', colorHex: '#000000', imageUrl: '' }]
        }));
    };
    
    const handleVariantChange = (index: number, field: keyof ProductVariant, value: string) => {
        setCurrentProduct(prev => {
             const newVariants = [...(prev.variants || [])];
             if (newVariants[index]) {
                 (newVariants[index] as any)[field] = value;
             }
             return { ...prev, variants: newVariants };
        });
    };
    
    const handleRemoveVariant = (index: number) => {
         setCurrentProduct(prev => ({
            ...prev,
            variants: (prev.variants || []).filter((_, i) => i !== index)
        }));
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            {isAIWizardOpen && createPortal(<AIProductWizard isOpen={isAIWizardOpen} onClose={() => setIsAIWizardOpen(false)} showToast={showToast} uploadImage={uploadImage} categories={categories} />, document.body)}
            
             {isProcessingModalOpen && createPortal(
                <ImageProcessingModal
                    isOpen={isProcessingModalOpen}
                    onClose={() => setIsProcessingModalOpen(false)}
                    imageFile={imageToProcess}
                    onConfirm={handleProcessingConfirmation}
                    showToast={showToast}
                />,
                document.body
            )}

            <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar produtos..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full bg-black border border-zinc-800 rounded-lg pl-10 p-2 text-white focus:border-yellow-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsAIWizardOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-500"><Cpu size={16}/> IA Wizard</button>
                    <button onClick={() => handleOpenProductModal(null)} className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400"><Plus size={16}/> Novo Produto</button>
                    <button onClick={handleSeed} disabled={isSeeding} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50"><Database size={16}/></button>
                    <button onClick={handleExportXML} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-lg hover:bg-zinc-700"><Download size={16}/></button>
                    <button onClick={handleDeleteAllProducts} className="bg-red-900/30 text-red-400 px-3 py-2 rounded-lg hover:bg-red-900/50"><Trash2 size={16}/></button>
                </div>
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader className="animate-spin text-yellow-500"/></div> : (
                <div className="grid grid-cols-1 gap-2">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-zinc-900/50 p-3 rounded-lg flex justify-between items-center border border-zinc-800 hover:border-zinc-600 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {product.image || (product.variants && product.variants[0]?.imageUrl) ? 
                                    <img src={product.image || product.variants?.[0]?.imageUrl} className="w-10 h-10 rounded object-cover bg-black" /> 
                                    : <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center"><Box size={16} className="text-zinc-600"/></div>
                                }
                                <div>
                                    <p className="font-bold text-white truncate">{product.name}</p>
                                    <p className="text-xs text-zinc-500">Estoque: {product.stock} | {product.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenProductModal(product)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"><Edit2 size={16}/></button>
                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && <p className="text-center text-zinc-500 py-8">Nenhum produto encontrado.</p>}
                </div>
            )}

            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                            <h3 className="text-xl font-bold text-white">{currentProduct.id ? 'Editar' : 'Criar'} Produto</h3>
                            <button onClick={() => setIsProductModalOpen(false)}><X className="text-zinc-500 hover:text-white"/></button>
                        </div>
                        
                        <div className="flex border-b border-zinc-800">
                            <button onClick={() => setActiveTab('editor')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'editor' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-zinc-500'}`}>Editor</button>
                            <button onClick={() => setActiveTab('marketing')} disabled={!currentProduct.name} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'marketing' ? 'border-b-2 border-purple-500 text-purple-500' : 'text-zinc-500 disabled:opacity-30'}`}>Marketing IA</button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {activeTab === 'editor' ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                             <SubSection title="Detalhes Principais">
                                                <input value={currentProduct.name || ''} onChange={e => setCurrentProduct(p => ({...p, name: e.target.value}))} placeholder="Nome do Produto" className="w-full admin-input" />
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="number" value={currentProduct.price || ''} onChange={e => setCurrentProduct(p => ({...p, price: parseFloat(e.target.value)}))} placeholder="Preço Venda" className="admin-input" />
                                                    <input type="number" value={currentProduct.originalPrice || ''} onChange={e => setCurrentProduct(p => ({...p, originalPrice: parseFloat(e.target.value)}))} placeholder="Preço Original (De)" className="admin-input" />
                                                    <input type="number" value={currentProduct.costPrice || ''} onChange={e => setCurrentProduct(p => ({...p, costPrice: parseFloat(e.target.value)}))} placeholder="Preço Custo" className="admin-input" />
                                                    <input type="number" value={currentProduct.stock === undefined ? '' : currentProduct.stock} onChange={e => setCurrentProduct(p => ({...p, stock: parseInt(e.target.value)}))} placeholder="Estoque" className="admin-input" />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
                                                    {isCreatingCategory ? (
                                                        <div className="flex gap-2">
                                                            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nova Categoria" className="flex-1 admin-input"/>
                                                            <button onClick={() => handleAddCategory(newCategoryName, true)} className="bg-green-600 p-2 rounded"><Check size={18} color="white"/></button>
                                                            <button onClick={() => setIsCreatingCategory(false)} className="bg-zinc-700 p-2 rounded"><X size={18} color="white"/></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <select value={currentProduct.category || ''} onChange={e => setCurrentProduct(p => ({...p, category: e.target.value}))} className="flex-1 admin-input">
                                                                <option value="">Selecione...</option>
                                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                            <button onClick={() => setIsCreatingCategory(true)} className="bg-zinc-800 p-2 rounded hover:bg-zinc-700"><Plus size={18} color="white"/></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </SubSection>
                                            
                                            <SubSection title="Variações de Cor e Imagem">
                                                 {(currentProduct.variants || []).map((variant, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 mb-2 bg-black p-2 rounded border border-zinc-800">
                                                        <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                                            {variant.imageUrl && <img src={variant.imageUrl} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <input value={variant.colorName} onChange={e => handleVariantChange(idx, 'colorName', e.target.value)} placeholder="Nome da Cor" className="admin-input flex-1 text-sm" />
                                                        <input type="color" value={variant.colorHex} onChange={e => handleVariantChange(idx, 'colorHex', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                                                        <input value={variant.imageUrl} onChange={e => handleVariantChange(idx, 'imageUrl', e.target.value)} placeholder="URL Imagem" className="admin-input flex-1 text-sm" />
                                                        <button onClick={() => handleRemoveVariant(idx)} className="text-red-500 p-1"><Trash2 size={14}/></button>
                                                    </div>
                                                 ))}
                                                 <button onClick={handleAddVariant} className="text-xs flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded hover:bg-zinc-700"><Plus size={12}/> Adicionar Variação</button>
                                            </SubSection>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-center">
                                                {currentProduct.image ? <img src={currentProduct.image} className="h-32 mx-auto object-contain mb-3 rounded" /> : <div className="h-32 flex items-center justify-center text-zinc-600"><ImageIcon size={48}/></div>}
                                                <div className="flex justify-center gap-2">
                                                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm inline-block hover:bg-blue-500">
                                                        {uploadProgress !== null ? 'Enviando...' : 'Imagem Principal'}
                                                        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
                                                    </label>
                                                    <button onClick={() => {
                                                        if(imageFile) {
                                                            setImageToProcess(imageFile);
                                                            setIsProcessingModalOpen(true);
                                                        } else {
                                                            showToast("Selecione um arquivo primeiro.", 'error');
                                                        }
                                                    }} className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-500"><Cpu size={16}/></button>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-sm font-bold text-zinc-400">Especificações</h4>
                                                    <button onClick={handleGenerateSpecifications} disabled={isGeneratingSpecs} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                        {isGeneratingSpecs ? <Loader size={12} className="animate-spin"/> : <Cpu size={12}/>} Gerar com IA
                                                    </button>
                                                </div>
                                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                    {specifications.map((spec, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input value={spec.key} onChange={e => { const n = [...specifications]; n[i].key = e.target.value; setSpecifications(n); }} placeholder="Chave" className="w-1/3 admin-input text-xs" />
                                                            <input value={spec.value} onChange={e => { const n = [...specifications]; n[i].value = e.target.value; setSpecifications(n); }} placeholder={spec.example || "Valor"} className="flex-1 admin-input text-xs" />
                                                            <button onClick={() => setSpecifications(p => p.filter((_, idx) => idx !== i))} className="text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => setSpecifications(p => [...p, { key: '', value: '' }])} className="text-xs text-green-500 hover:text-green-400 font-bold">+ Adicionar Campo</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-white">Copy para Instagram</h4>
                                        <button onClick={handleGenerateMarketingCopy} disabled={isGeneratingCopy} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                                            {isGeneratingCopy ? <Loader size={14} className="animate-spin"/> : <Zap size={14}/>} Gerar Copy
                                        </button>
                                    </div>
                                    <textarea value={marketingCopy} onChange={e => setMarketingCopy(e.target.value)} className="w-full h-64 bg-black border border-zinc-800 rounded-lg p-4 text-zinc-300 font-mono text-sm leading-relaxed resize-none focus:border-purple-500 outline-none" placeholder="A IA vai escrever seu post aqui..." />
                                    <button onClick={() => { navigator.clipboard.writeText(marketingCopy); showToast('Copiado!', 'success'); }} className="w-full bg-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-700 flex items-center justify-center gap-2"><Copy size={16}/> Copiar Texto</button>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
                            <button onClick={() => setIsProductModalOpen(false)} className="px-6 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 font-bold">Cancelar</button>
                            <button onClick={handleSaveProduct} className="px-6 py-2 rounded-lg bg-yellow-500 text-black hover:bg-yellow-400 font-bold flex items-center gap-2">
                                <Save size={18}/> Salvar Produto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
