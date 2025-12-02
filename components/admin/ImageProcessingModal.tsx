
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Loader, X, Zap, Cpu, Layers, Check } from 'react-feather';

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

const base64ToFile = (base64: string, filename: string): File => {
    try {
        const arr = base64.split(',');
        // Extract MIME type robustly or default to png
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        
        // Remove header if present
        const b64Data = arr.length > 1 ? arr[1] : base64;
        
        const bstr = atob(b64Data);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.error("Error converting base64 to file", e);
        // Fallback: Return empty file to prevent crash, though upload will likely fail gracefully
        return new File([], filename, { type: 'image/png' });
    }
};

interface ImageProcessingModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File | null;
    onConfirm: (processedFile: File | null, variants?: Array<{ colorName: string; colorHex: string; imageFile: File }>) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    title?: string;
}

const ImageProcessingModal: React.FC<ImageProcessingModalProps> = ({ isOpen, onClose, imageFile, onConfirm, showToast, title = "Processar Imagem" }) => {
    const [step, setStep] = useState<'initial' | 'edit' | 'color_picker' | 'variant_setup' | 'processing' | 'confirm'>('initial');
    const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
    const [processedImagePreview, setProcessedImagePreview] = useState<string | null>(null);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [processingMode, setProcessingMode] = useState<'crop' | 'color' | 'variants' | null>(null);
    const [processingType, setProcessingType] = useState<'ai' | 'simple'>('ai');
    
    // Variants State
    const [variantColorsInput, setVariantColorsInput] = useState('');
    const [generatedVariants, setGeneratedVariants] = useState<Array<{ colorName: string; colorHex: string; imageUrl: string; file?: File }>>([]);

    useEffect(() => {
        if (imageFile) {
            const objectUrl = URL.createObjectURL(imageFile);
            setOriginalImagePreview(objectUrl);
            setStep('initial');
            setProcessedImagePreview(null);
            setBackgroundColor('#ffffff');
            setProcessingMode(null);
            setGeneratedVariants([]);
            setVariantColorsInput('');
            
            return () => {
                URL.revokeObjectURL(objectUrl);
            }
        }
    }, [imageFile]);

    const handleProcessImageAI = async (mode: 'crop' | 'color') => {
        if (!imageFile) return;
        setProcessingMode(mode);
        setProcessingType('ai');
        setStep('processing');
        try {
            const base64Data = await blobToBase64(imageFile);
            const promptText = mode === 'crop'
                ? 'Crop this image to a 1:1 square aspect ratio, focusing on the main subject. Ensure the subject is centered. Do not add any padding or borders. The output should be the cropped image.'
                : `Change the background of this image to a solid color with the hex code ${backgroundColor}. Keep the original subject, aspect ratio, and resolution. The background should be a solid color, not a gradient. If the image has transparency, fill it with the color.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: imageFile.type } },
                        { text: promptText }
                    ]
                },
                config: { responseModalities: [Modality.IMAGE] }
            });

            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                const processedBase64 = part.inlineData.data;
                setProcessedImagePreview(`data:image/png;base64,${processedBase64}`);
                setStep('confirm');
            } else {
                throw new Error("No image data in AI response. Using original.");
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Erro ao processar imagem. Usando original.', 'error');
            if (imageFile) onConfirm(imageFile);
            onClose();
        }
    };
    
    const handleGenerateVariants = async () => {
        if (!imageFile || !variantColorsInput.trim()) return;
        setProcessingMode('variants');
        setStep('processing');
        
        const colorsToGenerate = variantColorsInput.split(',').map(c => c.trim()).filter(Boolean);
        const base64Data = await blobToBase64(imageFile);
        const newVariants: Array<{ colorName: string; colorHex: string; imageUrl: string; file?: File }> = [];

        try {
            for (const colorName of colorsToGenerate) {
                 const prompt = `Change the color of the main object in this image to ${colorName}. Maintain the original background, lighting, and shadows. Just change the product color.`;
                 
                 const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType: imageFile.type } },
                            { text: prompt }
                        ]
                    },
                    config: { responseModalities: [Modality.IMAGE] }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                if (part?.inlineData) {
                    const b64 = part.inlineData.data;
                    const file = base64ToFile(b64, `variant_${colorName}.png`);
                    newVariants.push({
                        colorName: colorName,
                        colorHex: '#000000', // We assume black for now, user can edit later in ProductManager
                        imageUrl: URL.createObjectURL(file),
                        file: file
                    });
                }
            }
            
            setGeneratedVariants(newVariants);
            setStep('confirm');

        } catch (error) {
             console.error(error);
             showToast("Erro ao gerar variantes. Tente novamente.", 'error');
             setStep('variant_setup');
        }
    };

    const handleSimpleBackgroundFill = () => {
        if (!imageFile) return;
        setProcessingMode('color');
        setProcessingType('simple');
        setStep('processing');

        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Fill background
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // Draw image on top
                ctx.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/png');
                setProcessedImagePreview(dataUrl);
                setStep('confirm');
            }
            URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
            showToast('Erro ao carregar imagem para processamento.', 'error');
            setStep('color_picker');
        };

        img.src = url;
    };

    const handleConfirmProcessed = async () => {
        if (processingMode === 'variants') {
             const finalVariants = generatedVariants.map(v => ({
                 colorName: v.colorName,
                 colorHex: v.colorHex,
                 imageFile: v.file!
             }));
             onConfirm(null, finalVariants);
        } else {
            if (!processedImagePreview || !imageFile) return;
            // The preview is already a data URL, so extract base64 part
            const base64Data = processedImagePreview.split(',')[1];
            const suffix = processingType === 'ai' ? '_ai' : '_bg';
            const newFileName = imageFile.name.replace(/\.[^/.]+$/, "") + `${suffix}.png`;
            const newFile = base64ToFile(base64Data, newFileName);
            onConfirm(newFile);
        }
        onClose();
    };

    if (!isOpen || !imageFile) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-xl p-6 text-center shadow-2xl animate-scale-in">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-white">{title}</h3>
                     <button onClick={onClose}><X className="text-gray-400 hover:text-white"/></button>
                </div>
               
                {step === 'initial' && (
                    <>
                        <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 border border-zinc-800">
                             <img src={originalImagePreview || ''} alt="Preview" className="max-h-48 mx-auto rounded-md object-contain" />
                        </div>
                        <p className="text-gray-300 mb-6 text-sm">O que você deseja fazer com esta imagem?</p>
                        <div className="flex flex-col gap-3">
                             <button onClick={() => { if(imageFile) onConfirm(imageFile); onClose(); }} className="w-full px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium border border-gray-700">
                                Apenas Usar (Sem Edição)
                            </button>
                            <button onClick={() => setStep('edit')} className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                                <Zap size={18}/> Editar Fundo / Recortar
                            </button>
                            <button onClick={() => setStep('variant_setup')} className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                                <Layers size={18}/> Gerar Variantes de Cor (IA)
                            </button>
                        </div>
                    </>
                )}
                {step === 'edit' && (
                     <>
                        <div className="bg-zinc-900/50 rounded-lg p-4 mb-6 border border-zinc-800">
                             <img src={originalImagePreview || ''} alt="Preview" className="max-h-48 mx-auto rounded-md object-contain" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleProcessImageAI('crop')} className="w-full px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2">
                                <Cpu size={18}/> Recortar Quadrado (IA)
                            </button>
                            <button onClick={() => setStep('color_picker')} className="w-full px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-2">
                                <Zap size={18}/> Adicionar Cor de Fundo
                            </button>
                        </div>
                        <button onClick={() => setStep('initial')} className="mt-6 text-sm text-gray-400 hover:text-white">Voltar</button>
                    </>
                )}
                 {step === 'variant_setup' && (
                    <>
                        <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 border border-zinc-800">
                             <img src={originalImagePreview || ''} alt="Preview" className="max-h-32 mx-auto rounded-md object-contain" />
                        </div>
                        <div className="text-left mb-6">
                            <label className="text-sm text-gray-400 block mb-2">Quais cores você deseja gerar?</label>
                            <input 
                                type="text" 
                                value={variantColorsInput}
                                onChange={e => setVariantColorsInput(e.target.value)}
                                placeholder="Ex: Vermelho, Azul, Verde Militar"
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">A IA vai criar uma nova imagem para cada cor mantendo o produto original.</p>
                        </div>
                        <button onClick={handleGenerateVariants} disabled={!variantColorsInput.trim()} className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50">
                            <Cpu size={18}/> Gerar Variantes
                        </button>
                        <button onClick={() => setStep('initial')} className="mt-4 text-sm text-gray-400 hover:text-white">Voltar</button>
                    </>
                 )}
                 {step === 'color_picker' && (
                     <>
                        <h3 className="text-lg font-bold mb-4 text-gray-200">Escolha a cor do fundo</h3>
                         <div className="bg-zinc-900/50 rounded-lg p-4 mb-6 border border-zinc-800 flex justify-center">
                             <div className="relative">
                                <img src={originalImagePreview || ''} alt="Preview" className="max-h-48 rounded-md object-contain relative z-10" />
                                <div className="absolute inset-0 z-0 rounded-md" style={{backgroundColor}}></div>
                             </div>
                        </div>
                        <div className="flex justify-center items-center gap-4 my-6">
                            <input 
                                type="color" 
                                value={backgroundColor} 
                                onChange={e => setBackgroundColor(e.target.value)} 
                                className="w-12 h-12 p-1 bg-transparent border border-gray-600 rounded-lg cursor-pointer"
                            />
                            <input 
                                type="text" 
                                value={backgroundColor}
                                onChange={e => setBackgroundColor(e.target.value)}
                                className="bg-black border border-gray-600 rounded px-3 py-2 w-32 text-center text-white font-mono"
                            />
                        </div>
                        
                        <div className="flex flex-col gap-3">
                             <button onClick={handleSimpleBackgroundFill} className="w-full px-6 py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 shadow-lg flex items-center justify-center gap-2">
                                <Zap size={18} className="text-yellow-500"/> Aplicar Preenchimento (Rápido)
                            </button>
                            <button onClick={() => handleProcessImageAI('color')} className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                                <Cpu size={18}/> Fundir com IA (Avançado)
                            </button>
                        </div>
                        
                        <button onClick={() => setStep('edit')} className="mt-4 text-sm text-gray-400 hover:text-white underline">Voltar</button>
                    </>
                )}
                {step === 'processing' && (
                    <div className="py-12">
                        <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
                        <p className="text-lg font-medium text-white">
                            {processingType === 'ai' ? 'IA Trabalhando...' : 'Processando...'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {processingMode === 'variants' ? 'Criando novas variações do produto.' : 'Ajustando a imagem.'}
                        </p>
                    </div>
                )}
                {step === 'confirm' && (
                    <>
                        <h3 className="text-lg font-bold mb-4 text-white">Resultado</h3>
                        
                        {processingMode === 'variants' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                                {generatedVariants.map((v, i) => (
                                    <div key={i} className="bg-zinc-900 p-2 rounded border border-zinc-800">
                                        <img src={v.imageUrl} className="w-full h-24 object-contain rounded mb-2" />
                                        <p className="text-xs text-gray-300 font-bold">{v.colorName}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Original</h4>
                                    <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                                        <img src={originalImagePreview || ''} className="max-h-32 mx-auto rounded object-contain" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-green-500">Novo</h4>
                                    <div className="bg-zinc-900 p-2 rounded border border-zinc-800 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/ps-neutral.png')] opacity-20"></div>
                                        <img src={processedImagePreview || ''} className="max-h-32 mx-auto rounded object-contain relative z-10" style={{backgroundColor: processingMode === 'color' && processingType === 'simple' ? backgroundColor : 'transparent'}}/>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <button onClick={() => { if (imageFile) onConfirm(imageFile); onClose(); }} className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">Cancelar Edição</button>
                            <button onClick={handleConfirmProcessed} className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 shadow-lg shadow-green-900/20 flex items-center gap-2">
                                <Check size={18}/> {processingMode === 'variants' ? 'Adicionar Variantes' : 'Confirmar e Salvar'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageProcessingModal;
