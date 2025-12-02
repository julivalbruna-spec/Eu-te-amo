
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, getDocRef, getCollectionRef } from '../firebase';
import { Product, SiteInfo, HeroInfo, CarouselItem, CategoryId, CheckoutStorySettings, BuyButtonConfig } from '../types';
import { SITE_INFO as defaultSiteInfo } from '../constants';
import Preloader from '../components/Preloader';
import AuroraBackground from '../components/AuroraBackground';
import Logo from '../components/Logo';
import { useTypingEffect } from '../hooks/useTypingEffect';
import StorePurchaseModal from '../components/StorePurchaseModal';
import { ArrowLeft, X } from 'react-feather';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'Consulte';
    if (value === 0) return 'Consulte';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const isObject = (item: any): item is object => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (sourceValue === null || sourceValue === undefined) {
        return;
      }
      
      if (Array.isArray(targetValue)) {
        if (Array.isArray(sourceValue)) {
          output[key] = sourceValue;
        }
      } else if (isObject(targetValue) && isObject(sourceValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    });
  }

  return output;
};

const generateCheckoutButtonCss = (config: BuyButtonConfig | undefined) => {
    if (!config || config.stylePreset === 'standard') return '';

    const c = (val: string | undefined, fallback: string = 'transparent') => val || fallback;
    const btn = config;
    const className = `checkout-story-button-advanced`;

    let buttonCss = '';

    if (btn.stylePreset === 'shiny') {
        buttonCss = `
            @property --gradient-angle-checkout {
                syntax: "<angle>";
                initial-value: 0deg;
                inherits: false;
            }
            @property --gradient-angle-offset-checkout {
                syntax: "<angle>";
                initial-value: 0deg;
                inherits: false;
            }
            @property --gradient-percent-checkout {
                syntax: "<percentage>";
                initial-value: 5%;
                inherits: false;
            }
            @property --gradient-shine-checkout {
                syntax: "<color>";
                initial-value: white;
                inherits: false;
            }
            .${className} {
                --shiny-cta-bg: ${c(btn.primaryColor)} !important;
                --shiny-cta-bg-subtle: ${c(btn.secondaryColor)} !important;
                --shiny-cta-fg: ${c(btn.textColor)} !important;
                --shiny-cta-highlight: ${c(btn.highlightColor)} !important;
                --shiny-cta-highlight-subtle: #ffffff !important;
                
                --animation: gradient-angle-checkout linear infinite !important;
                --duration: 3s !important;
                --shadow-size: 2px !important;
                isolation: isolate !important;
                position: relative !important;
                overflow: hidden !important;
                cursor: pointer !important;
                
                border: 1px solid transparent !important;
                background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
                    conic-gradient(
                        from calc(var(--gradient-angle-checkout) - var(--gradient-angle-offset-checkout)),
                        transparent,
                        var(--shiny-cta-highlight) var(--gradient-percent-checkout),
                        var(--gradient-shine-checkout) calc(var(--gradient-percent-checkout) * 2),
                        var(--shiny-cta-highlight) calc(var(--gradient-percent-checkout) * 3),
                        transparent calc(var(--gradient-percent-checkout) * 4)
                    ) border-box !important;
                box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle) !important;
                transition: 800ms cubic-bezier(0.25, 1, 0.5, 1) !important;
                transition-property: --gradient-angle-offset-checkout, --gradient-percent-checkout, --gradient-shine-checkout !important;
            }
            .${className}::before,
            .${className}::after,
            .${className} span::before {
                content: "" !important;
                pointer-events: none !important;
                position: absolute !important;
                inset-inline-start: 50% !important;
                inset-block-start: 50% !important;
                translate: -50% -50% !important;
                z-index: -1 !important;
            }
            .${className}:hover {
                --gradient-percent-checkout: 20% !important;
                --gradient-angle-offset-checkout: 95deg !important;
                --gradient-shine-checkout: var(--shiny-cta-highlight-subtle) !important;
                transform: scale(1.05);
            }
            @keyframes gradient-angle-checkout {
                to { --gradient-angle-checkout: 360deg; }
            }
        `;
    } else if (btn.stylePreset === 'neon') {
        buttonCss = `
            .${className} {
                background-image: linear-gradient(150deg, ${c(btn.primaryColor)}, ${c(btn.secondaryColor)});
                border: 2px solid ${c(btn.highlightColor)};
                border-radius: 6px;
                box-shadow: 0px 4px 15px -5px ${c(btn.highlightColor)};
                color: ${c(btn.textColor)};
                transition: 0.5s all;
                position: relative;
                z-index: 1;
                overflow: hidden;
            }
            .${className}:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0px 10px 25px -5px ${c(btn.highlightColor)};
            }
        `;
    } else if (btn.stylePreset === 'cyber') {
        buttonCss = `
            .${className} {
                background: transparent !important;
                color: ${c(btn.textColor)};
                position: relative;
                z-index: 1;
                border-radius: 8px;
                transition: 0.5s;
                border: 1px solid ${c(btn.highlightColor)}40;
            }
            /* BG */
            .${className}::before {
                position: absolute;
                content: "";
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(90deg, ${c(btn.primaryColor)}, ${c(btn.secondaryColor)});
                z-index: -1;
                width: 100%;
                height: 100%;
                border-radius: 8px;
                transition: 0.3s;
                opacity: 0.9;
            }
            /* Hover Overlay */
            .${className}::after {
                position: absolute;
                content: "";
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(90deg, ${c(btn.secondaryColor)}, ${c(btn.primaryColor)});
                z-index: -1;
                width: 100%;
                height: 100%;
                border-radius: 8px;
                transition: 0.5s;
                opacity: 0;
            }
            .${className}:hover::after {
                opacity: 1;
                box-shadow: 0px 0px 15px 0px ${c(btn.highlightColor)};
            }
            .${className}:hover {
                transform: scale(1.05);
            }
        `;
    } else if (btn.stylePreset === 'pulse') {
        buttonCss = `
            .${className} {
                background: linear-gradient(90deg, ${c(btn.primaryColor)}, ${c(btn.secondaryColor)}, ${c(btn.primaryColor)});
                background-size: 200% auto;
                color: ${c(btn.textColor)};
                border-radius: 30px;
                transition: all 0.3s ease;
                border: none;
                box-shadow: 0 0 10px ${c(btn.highlightColor)}40;
            }
            .${className}:hover {
                background-position: right center;
                box-shadow: 0 0 20px ${c(btn.highlightColor)}80;
                transform: scale(1.05);
            }
        `;
    }

    return buttonCss;
};

interface CheckoutStoryPageProps {
    storeId: string;
}

const CheckoutStoryPage: React.FC<CheckoutStoryPageProps> = ({ storeId }) => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBackButtonVisible, setIsBackButtonVisible] = useState(true);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

    
    useEffect(() => {
        if (!storeId) {
            setError("ID da loja não encontrado.");
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            try {
                // Fetch SiteInfo from localStorage first for faster preview updates
                const storedInfo = localStorage.getItem(`siteInfo_${storeId}`);
                const initialSiteInfo = storedInfo ? JSON.parse(storedInfo) : defaultSiteInfo;
                setSiteInfo(initialSiteInfo);

                // For live preview in admin
                if (productId === '_preview') {
                    setProduct({
                        id: '_preview',
                        name: 'iPhone 17 Pro Max',
                        price: 7999.99,
                        originalPrice: 8999.99,
                        details: '256GB|Seminovo|Bateria 100%',
                        image: 'https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-pro-max-laranja-cosmico-juVtKK3To8n3TPRS.png',
                        category: 'seminovos',
                        variants: [
                            { colorName: 'Laranja Cósmico', colorHex: '#FF7F50', imageUrl: 'https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-pro-max-laranja-cosmico-juVtKK3To8n3TPRS.png' },
                            { colorName: 'Azul Sierra', colorHex: '#A7C7E7', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762586225585_iPhone17-Air_sky-blue_front-back.png?alt=media&token=385e2c71-de14-49a7-a8f1-ab1e9b996bfd'},
                            { colorName: 'Branco', colorHex: '#FFFFFF', imageUrl: 'https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-2-Nnb6dhxiHN9ZQMH8.png' }
                        ]
                    });
                     // Listen for live updates from admin panel
                    const unsub = getDocRef('settings', 'siteInfo', storeId).onSnapshot(doc => {
                        if (doc.exists) {
                            setSiteInfo(prev => deepMerge(prev, doc.data()));
                        }
                    });
                    // Short delay to prevent flash of unstyled content
                    setTimeout(() => setLoading(false), 250);
                    return () => unsub(); // Cleanup listener
                }

                // Fetch SiteInfo from DB for production
                const siteInfoDoc = await getDocRef('settings', 'siteInfo', storeId).get();
                if (siteInfoDoc.exists) {
                    setSiteInfo({ ...defaultSiteInfo, ...siteInfoDoc.data() } as SiteInfo);
                }

                // Fetch Product
                if (!productId) {
                    setError("ID do produto não encontrado.");
                    return;
                }
                const productDoc = await getDocRef('products', productId, storeId).get();
                if (!productDoc.exists) {
                    setError("Produto não encontrado.");
                    return;
                }
                setProduct({ id: productDoc.id, ...productDoc.data() } as Product);
                setSelectedVariantIndex(0);

            } catch (err) {
                 console.error("Error fetching data:", err);
                setError("Erro ao carregar os dados.");
            } finally {
                if (productId !== '_preview') {
                    setTimeout(() => setLoading(false), 500);
                }
            }
        };

        fetchAllData();
    }, [productId, storeId]);

     const handleHideButtonClick = () => {
        setIsBackButtonVisible(false);
        setTimeout(() => {
            setIsBackButtonVisible(true);
        }, 10000); // 10 seconds
    };
    
    const heroTemplate = useMemo(() => {
        return siteInfo.heroes?.find(h => h.enabled !== false) || defaultSiteInfo.heroes[0];
    }, [siteInfo.heroes]);
    
    const finalSettings = useMemo(() => {
        const base = deepMerge(defaultSiteInfo.checkoutStory, siteInfo.checkoutStory);
        const adjustments = siteInfo.checkoutStoryAdjustments || {};

        const isDesktop = window.innerWidth > 768;
        const scaleFactor = isDesktop ? 1.3 : 1;

        const getPos = (basePos: {x: number, y: number} | undefined, adjPos: {x: number, y: number} | undefined) => ({
            x: ((basePos?.x ?? 0) + (adjPos?.x ?? 0)) * scaleFactor,
            y: ((basePos?.y ?? 0) + (adjPos?.y ?? 0)) * scaleFactor,
        });

        const getVal = (baseVal: number | undefined, adjVal: number | undefined, isPercentage: boolean = true) => {
            let value;
            if (isPercentage) {
                const multiplier = 1 + ((adjVal ?? 0) / 100);
                value = (baseVal ?? 0) * multiplier;
            } else {
                value = (baseVal ?? 0) + (adjVal ?? 0);
            }
            return value * scaleFactor;
        };
        
         const getStaticVal = (baseVal: number | undefined) => {
            return (baseVal ?? 0) * scaleFactor;
        };


        const final: CheckoutStorySettings = {
            ...base,
            mainTitlePosition: getPos(base.mainTitlePosition, adjustments.mainTitlePosition),
            mainTitleFontSize: getVal(base.mainTitleFontSize, adjustments.mainTitleFontSize),
            animatedSubtitlePosition: getPos(base.animatedSubtitlePosition, adjustments.animatedSubtitlePosition),
            animatedSubtitleFontSize: getVal(base.animatedSubtitleFontSize, adjustments.animatedSubtitleFontSize),
            productBlockPosition: getPos(base.productBlockPosition, adjustments.productBlockPosition),
            productImageSize: getVal(base.productImageSize, adjustments.productImageSize),
            productNameFontSize: getVal(base.productNameFontSize, adjustments.productNameFontSize),
            productDetailsFontSize: getVal(base.productDetailsFontSize, adjustments.productDetailsFontSize),
            productPriceFontSize: getVal(base.productPriceFontSize, adjustments.productPriceFontSize),
            
            // New Internal Layout Props
            productInnerGap: getVal(base.productInnerGap, adjustments.productInnerGap, false),
            productImageOffsetX: getVal(base.productImageOffsetX, adjustments.productImageOffsetX, false),
            productInfoOffsetX: getVal(base.productInfoOffsetX, adjustments.productInfoOffsetX, false),

            logoPosition: getPos(base.logoPosition, adjustments.logoPosition),
            logoSize: getVal(base.logoSize, adjustments.logoSize),
            buttonPosition: getPos(base.buttonPosition, adjustments.buttonPosition),
            buttonPaddingX: getVal(base.buttonPaddingX, adjustments.buttonPaddingX, false),
            buttonPaddingY: getVal(base.buttonPaddingY, adjustments.buttonPaddingY, false),
            buttonFontSize: getVal(base.buttonFontSize, adjustments.buttonFontSize),
            contentVerticalPadding: getVal(base.contentVerticalPadding, adjustments.contentVerticalPadding, false),
            contentHorizontalPadding: getVal(base.contentHorizontalPadding, adjustments.contentHorizontalPadding, false),
            contentGap: getVal(base.contentGap, adjustments.contentGap, false),
            auroraElements: (base.auroraElements || []).map((el, i) => ({
                ...el,
                sizeMobile: getVal(el.sizeMobile, adjustments.auroraElements?.[i]?.sizeMobile),
                sizeDesktop: getVal(el.sizeDesktop, adjustments.auroraElements?.[i]?.sizeDesktop),
            })),
        };

        return final;
    }, [siteInfo.checkoutStory, siteInfo.checkoutStoryAdjustments]);


    const hasVariants = product?.variants && product.variants.length > 0;
    const activeVariant = hasVariants ? product!.variants![selectedVariantIndex] : null;
    const imageUrl = activeVariant?.imageUrl || product?.image || product?.variants?.[0]?.imageUrl;

    const { storage, condition } = useMemo(() => {
        if (!product?.details) return { storage: null, condition: null };
        const parts = product.details.split('|').map(p => p.trim().toLowerCase());
        const storageRegex = /(\d+\s*(GB|TB))/i;
        let storageInfo: string | null = null;
        let conditionInfo: string | null = null;

        for (const part of parts) {
            const trimmedPart = part.trim();
            const storageMatch = trimmedPart.match(storageRegex);

            if (!storageInfo && storageMatch) {
                storageInfo = storageMatch[0].toUpperCase();
            } else if (!conditionInfo && (trimmedPart === 'novo' || trimmedPart === 'seminovo')) {
                conditionInfo = trimmedPart.charAt(0).toUpperCase() + trimmedPart.slice(1);
            }
        }
        return { storage: storageInfo, condition: conditionInfo };
    }, [product]);

    const { text: typedSubtitle, isWaiting } = useTypingEffect(
        finalSettings?.animatedSubtitlePhrases || [],
        100,
        2000,
        500
    );

    const useCustomButtonStyle = finalSettings.buttonStyleConfig && finalSettings.buttonStyleConfig.stylePreset !== 'standard';
    const advancedBtnClass = `checkout-story-button-advanced`;

    const glowStyle: React.CSSProperties = finalSettings.buttonGlowAnimationEnabled && !useCustomButtonStyle
        ? { '--glow-color': finalSettings.buttonGlowColor || finalSettings.buttonBackgroundColor } as React.CSSProperties
        : {};

    if (loading) return <Preloader />;

    if (error || !product) {
        return (
            <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold mb-4">{error || "Produto não encontrado."}</h2>
                <Link to="/" className="bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-400">
                    Voltar para a Loja
                </Link>
            </div>
        );
    }
    
    const buttonHoverStyle = `
      .checkout-story-button:hover {
        background-color: ${finalSettings.buttonBackgroundColorHover || finalSettings.buttonBackgroundColor} !important;
        color: ${finalSettings.buttonTextColorHover || finalSettings.buttonTextColor} !important;
      }
      ${useCustomButtonStyle ? generateCheckoutButtonCss(finalSettings.buttonStyleConfig) : ''}
    `;

    const adjustments = siteInfo.checkoutStoryAdjustments || {};

    // Default gap is 16px (gap-4) if undefined
    const appliedGap = finalSettings.productInnerGap !== undefined ? finalSettings.productInnerGap : 16;

    return (
        <>
        <style>{buttonHoverStyle}</style>
        <div 
            className="relative h-screen w-screen overflow-auto flex items-center justify-center p-4"
            style={{ backgroundColor: finalSettings.backgroundColor }}
        >
            <AuroraBackground
                elements={(finalSettings.auroraElements && finalSettings.auroraElements.length > 0) ? finalSettings.auroraElements : heroTemplate.auroraElements}
                blurStrength={heroTemplate.blurStrength}
                uniqueId={`story-${product.id}`}
            />

            <div
                className={`relative z-10 w-full max-w-[500px] aspect-[9/16] max-h-[90vh] text-center overflow-hidden`}
            >
                <div className="relative z-10 w-full h-full flex flex-col justify-center items-center" style={{ padding: `${finalSettings.contentVerticalPadding ?? 32}px ${finalSettings.contentHorizontalPadding ?? 32}px` }}>
                    <div className="w-full flex flex-col items-center" style={{ gap: `${finalSettings.contentGap}px`}}>
                        
                        {/* Product Card */}
                        <div style={{ transform: `translate(${finalSettings.productBlockPosition?.x || 0}px, ${finalSettings.productBlockPosition?.y || 0}px) scale(${1 + ((adjustments.productBlockScale ?? 0) / 100)})` }}>
                            <div 
                                className="w-full flex items-center px-2" 
                                style={{ gap: `${appliedGap}px` }}
                            >
                                {finalSettings.showProductImage !== false && (
                                    <div className="w-1/2 flex-shrink-0" style={{ transform: `translateX(${finalSettings.productImageOffsetX ?? 0}px)` }}>
                                        <div 
                                            className="relative w-full aspect-square bg-black/50 rounded-2xl p-2 flex items-center justify-center border border-white/10 transition-transform duration-300"
                                            style={{ width: `${finalSettings.productImageSize}px`, height: `${finalSettings.productImageSize}px` }}
                                        >
                                            <img
                                                src={imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/0a0a0a/FFFFFF?text=Imagem'; }}
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <div 
                                    className={`${finalSettings.showProductImage !== false ? 'w-1/2 text-left' : 'w-full text-center'}`}
                                    style={{ transform: `translateX(${finalSettings.productInfoOffsetX ?? 0}px)` }}
                                >
                                    <p className="font-bold leading-tight" style={{ fontSize: `${finalSettings.productNameFontSize}px`, color: finalSettings.productInfoTextColor, fontWeight: finalSettings.productNameFontWeight }}>
                                        {product.name}
                                    </p>
                                    <div className={`flex items-baseline gap-2 -mt-1 ${finalSettings.showProductImage !== false ? '' : 'justify-center'}`} style={{ fontSize: `${finalSettings.productDetailsFontSize}px`, color: finalSettings.productInfoTextColor, fontWeight: finalSettings.productDetailsFontWeight }}>
                                        {storage && ( <p className="font-medium">{storage}</p> )}
                                        {product.name.toLowerCase().includes('iphone') && condition && ( <p className="font-light opacity-80">({condition})</p> )}
                                    </div>
                                    <p className="font-bold pt-2" style={{ fontSize: `${finalSettings.productPriceFontSize}px`, color: finalSettings.priceColor, fontWeight: finalSettings.productPriceFontWeight }}>
                                        {formatCurrency(product.price)}
                                    </p>
                                     {hasVariants && (
                                        <div className={`flex items-center gap-1.5 mt-2 ${finalSettings.showProductImage !== false ? '' : 'justify-center'}`}>
                                            {product.variants!.map((variant, index) => (
                                                <button
                                                    key={index}
                                                    title={variant.colorName}
                                                    onClick={() => setSelectedVariantIndex(index)}
                                                    className={`w-5 h-5 rounded-full border-2 transition-transform duration-200 ${index === selectedVariantIndex ? 'border-white scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: variant.colorHex }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Title Block */}
                        <div className="w-full text-center" style={{ transform: `translate(${finalSettings.mainTitlePosition?.x || 0}px, ${finalSettings.mainTitlePosition?.y || 0}px)` }}>
                            <h1 className="font-bold mb-2 whitespace-pre-line" style={{ fontSize: `${finalSettings.mainTitleFontSize}px`, color: finalSettings.mainTitleColor, fontWeight: finalSettings.mainTitleFontWeight }}>
                                {finalSettings.mainTitleText}
                            </h1>
                            <p className="min-h-[1.5rem]" style={{ 
                                transform: `translate(${finalSettings.animatedSubtitlePosition?.x || 0}px, ${finalSettings.animatedSubtitlePosition?.y || 0}px)`,
                                fontSize: `${finalSettings.animatedSubtitleFontSize}px`, 
                                color: finalSettings.animatedSubtitleColor, 
                                fontWeight: finalSettings.animatedSubtitleFontWeight 
                            }}>
                                <span className={`hero-subtitle-text ${isWaiting ? 'fading' : ''}`}>{typedSubtitle}</span>
                                {!isWaiting && <span className="typing-cursor"></span>}
                            </p>
                        </div>
                        
                        {/* Button Block */}
                        {finalSettings.buttonText && (
                             <div style={{ transform: `translate(${finalSettings.buttonPosition?.x || 0}px, ${finalSettings.buttonPosition?.y || 0}px)` }}>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className={useCustomButtonStyle ? advancedBtnClass : `checkout-story-button rounded-full font-bold transition-all hover:scale-105 ${finalSettings.buttonGlowAnimationEnabled ? 'animate-pulse-glow' : ''}`}
                                    style={useCustomButtonStyle ? {
                                        padding: `${finalSettings.buttonPaddingY}px ${finalSettings.buttonPaddingX}px`,
                                        fontSize: `${finalSettings.buttonFontSize}px`,
                                        fontWeight: finalSettings.buttonFontWeight
                                    } : {
                                        backgroundColor: finalSettings.buttonBackgroundColor,
                                        color: finalSettings.buttonTextColor,
                                        padding: `${finalSettings.buttonPaddingY}px ${finalSettings.buttonPaddingX}px`,
                                        fontSize: `${finalSettings.buttonFontSize}px`,
                                        fontWeight: finalSettings.buttonFontWeight,
                                        ...glowStyle
                                    }}
                                >
                                    {finalSettings.buttonText}
                                </button>
                            </div>
                        )}

                        {/* Optional Logo */}
                        {finalSettings.logoUrl && (
                            <div className="mt-auto pt-4" style={{ transform: `translate(${finalSettings.logoPosition?.x || 0}px, ${finalSettings.logoPosition?.y || 0}px)` }}>
                                <img 
                                  src={finalSettings.logoUrl} 
                                  alt="Logo da Loja" 
                                  className="mx-auto" 
                                  style={{ height: `${finalSettings.logoSize}px`, width: 'auto' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isBackButtonVisible && (
                <div className="fixed top-6 left-6 z-20 flex items-center gap-2">
                    <Link
                        to="/"
                        className="flex items-center gap-2 bg-black/50 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-md hover:bg-black/70 transition-all duration-300"
                        aria-label="Voltar para a página inicial da loja"
                    >
                        <ArrowLeft size={16} />
                        Voltar para o site
                    </Link>
                    <button
                        onClick={handleHideButtonClick}
                        className="bg-black/50 text-gray-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                        aria-label="Ocultar botão 'Voltar' por 10 segundos"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

        </div>
        <StorePurchaseModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
            siteInfo={siteInfo}
        />
        </>
    );
};

export default CheckoutStoryPage;
