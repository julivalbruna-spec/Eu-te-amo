
import React, { useMemo, useEffect, useState } from 'react';
import { Product, SiteInfo } from '../types';
import { X, ArrowRight } from 'react-feather';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'Consulte';
    if (value === 0) return 'Consulte';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  siteInfo: SiteInfo;
  onBuyClick: (product: Product) => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, onClose, product, siteInfo, onBuyClick }) => {
    
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setSelectedVariantIndex(0); // Reset on open
        }
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const specifications = useMemo(() => {
        if (product?.specifications && Object.keys(product.specifications).length > 0) {
            return Object.entries(product.specifications).filter(([, value]) => value);
        }
        if (product?.details) {
            return product.details.split('|').map(item => {
                const parts = item.split(':');
                return [parts[0].trim(), parts.slice(1).join(':').trim()];
            });
        }
        return [];
    }, [product]);
    
    const hasVariants = product?.variants && product.variants.length > 1;
    const activeVariant = hasVariants ? product.variants![selectedVariantIndex] : null;
    const imageUrl = activeVariant?.imageUrl || product?.image || product?.variants?.[0]?.imageUrl;

    if (!isOpen || !product) return null;

    const { customTexts, storeLayout } = siteInfo;
    const isService = product.category === 'assistencia';
    const isConsultPrice = !isService && product.price === 0.00;
    const buttonText = isService ? customTexts.productCardHire : isConsultPrice ? customTexts.productCardConsult : customTexts.productCardBuy;
    
    const buttonIcon = storeLayout?.buyButtonConfig?.stylePreset === 'neon' ? <ArrowRight className="btn-icon" size={16} /> : null;
    
    // Calculate Scale Factor
    const scale = (storeLayout?.productModalScale || 100) / 100;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`modal-title-${product.id}`}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="fixed inset-0 bg-black/70 animate-fade-in" aria-hidden="true" />
            
            {/* Scale Wrapper */}
            <div 
                className="w-full max-w-lg relative"
                style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Content with Entrance Animation */}
                <div 
                    className="relative bg-[var(--modal-background)] border border-[var(--border-color)] rounded-lg w-full p-6 animate-scale-in flex flex-col overflow-y-auto custom-scrollbar"
                    style={{ maxHeight: `${90/scale}vh` }}
                >
                    <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors" 
                        aria-label="Fechar modal"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="w-full sm:w-1/3 flex-shrink-0">
                            <img 
                                src={imageUrl} 
                                alt={product.name} 
                                className="w-full object-contain rounded-lg bg-black"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/0a0a0a/FFFFFF?text=Imagem'; }}
                            />
                        </div>
                        <div className="flex-grow">
                            <h3 id={`modal-title-${product.id}`} className="font-bold text-2xl mb-1 text-white">{product.name}</h3>
                            <p className="font-extrabold text-[var(--primary-text)] text-3xl">
                                {formatCurrency(product.price)}
                            </p>
                            {hasVariants && (
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-sm font-semibold text-gray-400">Cor:</span>
                                    {product.variants!.map((variant, index) => (
                                        <button
                                            key={index}
                                            title={variant.colorName}
                                            onClick={() => setSelectedVariantIndex(index)}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform duration-200 ${index === selectedVariantIndex ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: variant.colorHex }}
                                            aria-label={`Selecionar cor ${variant.colorName}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[var(--border-color)] overflow-y-auto custom-scrollbar">
                        <h4 className="font-bold text-lg mb-3 text-white">Especificações</h4>
                        {specifications.length > 0 ? (
                            <ul className="space-y-2">
                                {specifications.map(([key, value]) => (
                                    <li key={key} className="flex justify-between text-sm p-2 bg-black rounded-md">
                                        <span className="font-semibold text-gray-400">{key}:</span>
                                        <span className="text-right text-white">{String(value)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">Nenhum detalhe adicional disponível.</p>
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-[var(--border-color)]">
                        <button 
                            onClick={() => onBuyClick(product)}
                            className="custom-buy-button w-full text-center font-semibold py-3 px-3 text-base rounded-md transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <span>{buttonText}</span>
                            {buttonIcon}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModal;
