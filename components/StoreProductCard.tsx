
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product, SiteInfo } from '../types';
import { logEvent } from '../utils/analytics';
import { ShoppingBag, ArrowRight, ChevronRight, AlertCircle, Plus } from 'react-feather';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface ProductCardProps { 
    product: Product;
    siteInfo: SiteInfo;
    onBuyClick: (product: Product) => void;
    onDetailsClick: (product: Product) => void;
    onAddToCart?: (product: Product, variantIndex: number) => void;
}

const StoreProductCard: React.FC<ProductCardProps> = ({ product, siteInfo, onBuyClick, onDetailsClick, onAddToCart }) => {
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [activeVariantIndex, setActiveVariantIndex] = useState(0);
    const { customTexts, rates, storeLayout } = siteInfo;

    const layout = storeLayout || {
        mobileColumns: 1,
        cardBorderRadius: 'lg',
        cardContentAlign: 'left',
        showOriginalPrice: true,
        showInstallments: true,
        showDiscountBadge: true,
        showBuyButton: true,
        secondaryPriceType: 'debit',
        cardBorderStyle: 'none',
        buyButtonConfig: { stylePreset: 'standard' }
    };

    // Stock Logic
    const isSoldOut = product.stock === 0;
    const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;

    // If mobileColumns is 1, we use "List View" (Horizontal) everywhere.
    // If mobileColumns is 2, we use "Grid View" (Vertical) everywhere.
    const isListView = layout.mobileColumns === 1;
    
    // Style Mappings
    const radiusClass = {
        'none': 'rounded-none',
        'sm': 'rounded-sm',
        'md': 'rounded-md',
        'lg': 'rounded-lg',
        'full': 'rounded-[2rem]'
    }[layout.cardBorderRadius || 'lg'];

    const alignClass = layout.cardContentAlign === 'center' ? 'text-center' : 'text-left';
    
    // Dynamic Layout Classes
    const containerFlexClass = isListView ? 'flex-row' : 'flex-col';
    
    // AUMENTO SIGNIFICATIVO DE FOTO NO DESKTOP
    const imageContainerClass = isListView 
        ? 'w-4/12 md:w-5/12 aspect-square md:aspect-auto h-full self-center' 
        : 'w-full h-40 md:h-[700px]';
    
    const contentContainerClass = isListView 
        ? 'w-8/12 md:w-7/12 py-2 px-1 md:pl-10 flex flex-col justify-center' 
        : 'w-full pt-2';

    const hasVariants = product.variants && product.variants.length > 1;
    const activeVariant = hasVariants ? product.variants![activeVariantIndex] : null;

    const imageUrl = activeVariant?.imageUrl || product.image || product.variants?.[0]?.imageUrl;

    const isService = product.category === 'assistencia';
    const isConsultPrice = !isService && product.price === 0.00;
    
    // Determine button text based on state
    let buttonText = customTexts.productCardBuy;
    if (isSoldOut) buttonText = "Esgotado";
    else if (isService) buttonText = customTexts.productCardHire;
    else if (isConsultPrice) buttonText = customTexts.productCardConsult;

    const displayDetails = useMemo(() => {
        if (product.specifications && Object.keys(product.specifications).length > 0) {
            return Object.entries(product.specifications)
                .map(([key, value]) => value ? `${key}: ${value}` : null)
                .filter(Boolean)
                .join(' | ');
        }
        return product.details || '';
    }, [product.specifications, product.details]);

    const showDetailsInModal = displayDetails.length > 30;

    const { storage, remainingDetails } = useMemo(() => {
        const detailsParts = displayDetails.split('|');
        const storageRegex = /\d+\s*(GB|TB)/i;
        let storageInfo = '';
        const otherDetailsParts: string[] = [];

        detailsParts.forEach(part => {
            if (storageRegex.test(part) && !storageInfo) {
                storageInfo = part.trim();
            } else {
                otherDetailsParts.push(part.trim());
            }
        });
        
        return { storage: storageInfo, remainingDetails: otherDetailsParts.join('<br>') };
    }, [displayDetails]);
    
    const discountPercentage = useMemo(() => {
        const price = Number(product.price);
        const originalPrice = Number(product.originalPrice);

        if (!isNaN(originalPrice) && !isNaN(price) && originalPrice > price) {
            const pct = ((originalPrice - price) / originalPrice) * 100;
            return Math.round(pct) || (pct > 0 ? 1 : 0);
        }
        return 0;
    }, [product.originalPrice, product.price]);

    const secondaryPriceText = useMemo(() => {
        if (isService || isConsultPrice || isSoldOut) return null;
        if (!layout.showInstallments) return null; 
        
        if (layout.secondaryPriceType === 'none') return null;

        if (layout.secondaryPriceType === 'credit') {
            const installments = 12;
            const rate = rates.credit[installments] || 0;
            const totalWithRate = Number(product.price) * (1 + rate);
            const installmentValue = totalWithRate / installments;
            return `ou ${installments}x de ${formatCurrency(installmentValue)}`;
        }

        const debitTotal = Number(product.price) * (1 + rates.debit);
        return `ou ${formatCurrency(debitTotal)} no débito`;

    }, [product.price, isService, isConsultPrice, layout.showInstallments, layout.secondaryPriceType, rates, isSoldOut]);


    const handleBuyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSoldOut) return;
        logEvent('buy_click', { productId: product.id, productName: product.name });
        onBuyClick(product);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSoldOut || !onAddToCart) return;
        logEvent('add_to_cart', { productId: product.id, productName: product.name });
        onAddToCart(product, activeVariantIndex);
    };

    const handleDetailsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        logEvent('details_click', { productId: product.id, productName: product.name });
        if (showDetailsInModal) {
            onDetailsClick(product);
        } else {
            setDetailsVisible(!detailsVisible);
        }
    };
    
    const handleCardClick = (e: React.MouseEvent) => {
        if(isSoldOut) e.preventDefault();
        logEvent('product_click', { productId: product.id, productName: product.name });
    };

    const buttonIcon = layout.buyButtonConfig?.stylePreset === 'neon' ? <ArrowRight className="btn-icon" size={16} /> : null;
    const borderStyleClass = layout.cardBorderStyle && layout.cardBorderStyle !== 'none' 
        ? `card-border-${layout.cardBorderStyle}` 
        : '';

    return (
        <Link 
            to={`/checkout-story/${product.id}`} 
            onClick={handleCardClick}
            className={`product-card-container bg-[var(--product-card-bg)] border border-[var(--border-color)] ${radiusClass} ${borderStyleClass} flex flex-col h-full items-stretch no-underline relative overflow-hidden ${isSoldOut ? 'opacity-70 grayscale' : ''}`}
        >
            {/* Badges */}
            <div className="absolute top-2 left-2 z-[60] flex flex-col gap-1 items-start">
                {layout.showDiscountBadge && discountPercentage > 0 && !isSoldOut && (
                    <div 
                        className="text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md shadow-lg"
                        style={{ backgroundColor: 'var(--discount-badge-bg)', color: 'var(--discount-badge-text)' }}
                    >
                        -{discountPercentage}%
                    </div>
                )}
                {isSoldOut && (
                    <div className="bg-zinc-700 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md shadow-lg uppercase tracking-wider">
                        Esgotado
                    </div>
                )}
                {isLowStock && !isSoldOut && (
                    <div className="bg-orange-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1 animate-pulse">
                        <AlertCircle size={10} /> Restam {product.stock}
                    </div>
                )}
            </div>

            <div className={`flex ${containerFlexClass} p-3 items-stretch space-x-3 md:space-x-0 flex-grow relative z-10`}>
                {/* Image Container */}
                <div className={`relative overflow-hidden flex-shrink-0 rounded-md flex items-center justify-center bg-black ${imageContainerClass}`}>
                    <img loading="lazy" src={imageUrl} alt={product.name} className={`w-full h-full object-contain ${product.imageClassName || ''} ${isSoldOut ? 'opacity-50' : ''}`} onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/0a0a0a/FFFFFF?text=Imagem'; }} />
                </div>

                {/* Content Container */}
                <div className={`flex flex-col ${contentContainerClass} ${alignClass}`}>
                    <div>
                        <h3 className="font-bold mb-1 leading-tight text-white" style={{ fontSize: layout.productTitleFontSize ? `${layout.productTitleFontSize}px` : undefined }}>
                            {product.name}
                        </h3>
                        {storage && (
                            <p className="text-xs md:text-sm font-semibold text-gray-400 -mt-1 mb-1">{storage}</p>
                        )}
                        
                        {/* Variants (Moved inside content for list view) */}
                        {hasVariants && (
                            <div className={`flex flex-wrap items-center gap-1.5 mb-2 ${alignClass === 'text-center' ? 'justify-center' : 'justify-start'}`}>
                                {product.variants!.map((variant, index) => (
                                    <button
                                        key={index}
                                        title={variant.colorName}
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveVariantIndex(index); }}
                                        className={`w-4 h-4 md:w-5 md:h-5 rounded-full border transition-transform duration-200 shadow-sm ${index === activeVariantIndex ? 'border-white scale-110 ring-1 ring-white/50' : 'border-zinc-600/50 hover:border-zinc-600'}`}
                                        style={{ backgroundColor: variant.colorHex || '#000' }}
                                        aria-label={`Selecionar cor ${variant.colorName}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div>
                            {layout.showOriginalPrice && product.originalPrice && <p className="text-[10px] md:text-xs text-[var(--secondary-text)] line-through">{formatCurrency(Number(product.originalPrice))}</p>}
                            <p className={`font-extrabold text-[var(--primary-text)]`} style={{ fontSize: layout.productPriceFontSize ? `${layout.productPriceFontSize}px` : undefined }}>
                                {isConsultPrice ? 'Consulte' : formatCurrency(Number(product.price))}
                            </p>
                            {secondaryPriceText && (
                                <p className="text-[var(--secondary-text)]" style={{ fontSize: layout.secondaryPriceFontSize ? `${layout.secondaryPriceFontSize}px` : undefined }}>
                                    {secondaryPriceText}
                                </p>
                            )}
                        </div>

                        {/* Details Button - Now positioned between price and content */}
                        <button 
                            onClick={handleDetailsClick} 
                            className={`product-card-details-button text-xs font-semibold py-1 mt-1 transition-colors hover:underline flex items-center gap-1 ${alignClass === 'text-center' ? 'justify-center' : 'justify-start'}`}
                        >
                            {detailsVisible ? customTexts.productCardHideDetails : customTexts.productCardDetails}
                            {!detailsVisible && <ChevronRight size={12} />}
                        </button>

                        <div className={`details-content text-xs md:text-sm text-[var(--secondary-text)] mt-2 ${detailsVisible ? 'visible' : ''}`}>
                            {remainingDetails && <p dangerouslySetInnerHTML={{ __html: remainingDetails }}></p>}
                        </div>
                        
                    </div>
                </div>
            </div>
            
            {/* Actions Footer (Buy + Add Cart) */}
            {layout.showBuyButton && (
                <div className="mt-auto pt-0 p-3 relative z-10 flex flex-col gap-2">
                    <button 
                        onClick={handleBuyClick}
                        disabled={isSoldOut}
                        className={`custom-buy-button w-full font-bold py-2.5 px-3 text-sm ${layout.cardBorderRadius === 'full' ? 'rounded-full' : 'rounded-md'} transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${isSoldOut ? '!bg-zinc-700 !text-zinc-400 !border-transparent cursor-not-allowed' : ''}`}
                    >
                        <span>{buttonText}</span>
                        {!isSoldOut && buttonIcon}
                    </button>
                    
                    {!isSoldOut && !isService && !isConsultPrice && onAddToCart && (
                        <button
                            onClick={handleAddToCart}
                            className={`custom-add-to-cart-button w-full py-2.5 flex items-center justify-center gap-2 ${layout.cardBorderRadius === 'full' ? 'rounded-full' : 'rounded-md'} text-xs font-semibold`}
                        >
                            <Plus size={14} />
                            <span>Adicionar ao Carrinho</span>
                        </button>
                    )}
                </div>
            )}
        </Link>
    );
};

export default StoreProductCard;
