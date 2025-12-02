





import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HeroInfo, CategoryId, BuyButtonConfig } from '../types';
import { useTypingEffect } from '../hooks/useTypingEffect';
import StoreProductCarousel from './StoreProductCarousel';
import AuroraBackground from './AuroraBackground';
import { ChevronUp, X, Maximize2, ArrowRight } from 'react-feather';

// --- CSS Generator for Hero Buttons ---
// This logic replicates the structure in ThemeStyle.tsx but scoped to a specific hero class
const generateHeroButtonCss = (heroId: string, config: BuyButtonConfig | undefined) => {
    if (!config || config.stylePreset === 'standard') return '';

    const c = (val: string | undefined, fallback: string = 'transparent') => val || fallback;
    const btn = config;
    const className = `hero-btn-primary-${heroId}`;

    let buttonCss = '';

    if (btn.stylePreset === 'shiny') {
        buttonCss = `
            @property --gradient-angle-${heroId} {
                syntax: "<angle>";
                initial-value: 0deg;
                inherits: false;
            }
            @property --gradient-angle-offset-${heroId} {
                syntax: "<angle>";
                initial-value: 0deg;
                inherits: false;
            }
            @property --gradient-percent-${heroId} {
                syntax: "<percentage>";
                initial-value: 5%;
                inherits: false;
            }
            @property --gradient-shine-${heroId} {
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
                
                --animation: gradient-angle-${heroId} linear infinite !important;
                --duration: 3s !important;
                --shadow-size: 2px !important;
                isolation: isolate !important;
                position: relative !important;
                overflow: hidden !important;
                cursor: pointer !important;
                padding: 0.75rem 1rem !important;
                font-family: inherit !important;
                line-height: 1.2 !important;
                border: 1px solid transparent !important;
                color: var(--shiny-cta-fg) !important;
                background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
                    conic-gradient(
                        from calc(var(--gradient-angle-${heroId}) - var(--gradient-angle-offset-${heroId})),
                        transparent,
                        var(--shiny-cta-highlight) var(--gradient-percent-${heroId}),
                        var(--gradient-shine-${heroId}) calc(var(--gradient-percent-${heroId}) * 2),
                        var(--shiny-cta-highlight) calc(var(--gradient-percent-${heroId}) * 3),
                        transparent calc(var(--gradient-percent-${heroId}) * 4)
                    ) border-box !important;
                box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle) !important;
                transition: 800ms cubic-bezier(0.25, 1, 0.5, 1) !important;
                transition-property: --gradient-angle-offset-${heroId}, --gradient-percent-${heroId}, --gradient-shine-${heroId} !important;
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
                --gradient-percent-${heroId}: 20% !important;
                --gradient-angle-offset-${heroId}: 95deg !important;
                --gradient-shine-${heroId}: var(--shiny-cta-highlight-subtle) !important;
                transform: scale(1.05);
            }
            @keyframes gradient-angle-${heroId} {
                to { --gradient-angle-${heroId}: 360deg; }
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
            .${className} .btn-icon {
                margin-left: 5px;
                display: inline-block;
            }
            .${className}:hover .btn-icon {
                animation: moveIcon-${heroId} 1s infinite alternate;
            }
            @keyframes moveIcon-${heroId} {
                0% { transform: translateX(0); }
                100% { transform: translateX(5px); }
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


// --- FULLSCREEN MODAL COMPONENT ---
interface HeroFullscreenModalProps {
    hero: HeroInfo;
    onClose: () => void;
    onCategoryLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, categoryId: CategoryId) => void;
}

const HeroFullscreenModal: React.FC<HeroFullscreenModalProps> = ({ hero, onClose, onCategoryLinkClick }) => {
    const { 
        title, phrases, typingEffectTarget,
        buttonPrimary, buttonSecondary,
        buttonPrimaryCategory, buttonSecondaryCategory,
        carouselItems, carouselTitle,
        carouselAnimationType,
        carouselHeightDesktop, carouselHeightMobile,
        carouselImageSizeDesktop, carouselImageSizeMobile,
        carouselItemSpreadDesktop, carouselItemSpreadMobile,
        carouselAnimationDuration,
        auroraElements, blurStrength,
        auroraAnimationDurationMobile, auroraAnimationDurationDesktop
    } = hero;

    // Typing Effect for Modal
    const phrasesToType = typingEffectTarget === 'title' ? (title || '').split('\n') : phrases || [];
    const { text: typedText, isWaiting } = useTypingEffect(
        phrasesToType,
        100, 2000, 500
    );

    // Hint Visibility Logic
    const [showHint, setShowHint] = useState(true);

    useEffect(() => {
        // Check if hint was dismissed recently (within 60 seconds)
        const hiddenUntil = localStorage.getItem('hero_hint_hidden_until');
        if (hiddenUntil && Date.now() < parseInt(hiddenUntil)) {
            setShowHint(false);
        }
    }, []);

    const handleDismissHint = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent closing the modal when clicking X
        const hideDuration = 60 * 1000; // 60 seconds
        localStorage.setItem('hero_hint_hidden_until', (Date.now() + hideDuration).toString());
        setShowHint(false);
    };

    // Swipe Logic
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientY);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isUpSwipe = distance > 50; // Drag up to close
        if (isUpSwipe) {
            onClose();
        }
    };

    // Lock Body Scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; }
    }, []);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, catId: CategoryId) => {
        onClose();
        onCategoryLinkClick(e, catId);
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center animate-fade-in select-none"
            style={{ backgroundColor: hero.backgroundColor || '#000000' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Close Button (Top Right) */}
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 z-50 text-white/50 hover:text-white p-3 rounded-full bg-black/20 backdrop-blur-md transition-colors"
            >
                <X size={32} />
            </button>

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <AuroraBackground 
                    elements={auroraElements}
                    blurStrength={blurStrength}
                    animationDurationMobile={auroraAnimationDurationMobile}
                    animationDurationDesktop={auroraAnimationDurationDesktop}
                    uniqueId={`modal-${hero.id}`}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center justify-center h-full max-w-4xl">
                 {/* Title */}
                 <h1 className="font-bold mb-6 leading-tight" style={{ 
                     color: hero.titleColor || '#ffffff',
                     fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' 
                 }}>
                    {typingEffectTarget === 'title' ? (
                        <>
                            <span style={{ opacity: isWaiting ? 0 : 1, transition: 'opacity 0.5s' }}>{typedText}</span>
                            {!isWaiting && <span className="typing-cursor"></span>}
                        </>
                    ) : (
                        (title || '').split('\n').map((line, i) => <React.Fragment key={i}>{line}{i < (title || '').split('\n').length - 1 && <br />}</React.Fragment>)
                    )}
                </h1>

                {/* Subtitle */}
                <p className="mb-10 font-medium" style={{ 
                    color: hero.subtitleColor || '#cccccc',
                    fontSize: 'clamp(1.1rem, 3vw, 1.5rem)'
                }}>
                     {typingEffectTarget === 'subtitle' ? (
                        <>
                            <span style={{ opacity: isWaiting ? 0 : 1, transition: 'opacity 0.5s' }}>{typedText}</span>
                            {!isWaiting && <span className="typing-cursor"></span>}
                        </>
                    ) : (
                       (phrases || []).join(' ')
                    )}
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap justify-center items-center gap-4 mb-10 scale-110">
                    {buttonPrimary && (
                        <a href="#produtos"
                           onClick={(e) => handleLinkClick(e, buttonPrimaryCategory)}
                           className="inline-block font-bold py-3 px-8 rounded-full transition-transform duration-300 hover:scale-105 border-2"
                           style={{
                                backgroundColor: hero.buttonPrimaryBackgroundColor || '#ffae00',
                                color: hero.buttonPrimaryTextColor || '#000000',
                                borderColor: hero.buttonPrimaryBackgroundColor || '#ffae00'
                           }}
                        >
                            {buttonPrimary}
                        </a>
                    )}
                    {buttonSecondary && (
                        <a href="#produtos" 
                           onClick={(e) => handleLinkClick(e, buttonSecondaryCategory)} 
                           className="inline-block font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 border-2"
                           style={{
                                backgroundColor: hero.buttonSecondaryBackgroundColor || 'transparent',
                                color: hero.buttonSecondaryTextColor || '#ffffff',
                                borderColor: hero.buttonSecondaryBorderColor || '#ffffff'
                           }}
                        >
                            {buttonSecondary}
                        </a>
                    )}
                </div>

                {/* Carousel - Slightly Larger for Fullscreen */}
                <div style={{ width: '100%', transform: 'scale(1.1)' }}>
                     <StoreProductCarousel 
                        items={carouselItems} 
                        uniqueId={`modal-carousel-${hero.id}`}
                        animationType={carouselAnimationType}
                        heightMobile={carouselHeightMobile}
                        heightDesktop={carouselHeightDesktop}
                        imageSizeMobile={carouselImageSizeMobile}
                        imageSizeDesktop={carouselImageSizeDesktop}
                        itemSpreadMobile={carouselItemSpreadMobile}
                        itemSpreadDesktop={carouselItemSpreadDesktop}
                        animationDuration={carouselAnimationDuration}
                    />
                </div>
                
                {carouselTitle && carouselAnimationType !== 'focus_loop' && (
                    <p className="text-white font-semibold mt-8 text-xl relative">
                        {carouselTitle}
                    </p>
                )}
            </div>

            {/* Swipe/Click Hint */}
            {showHint && (
                <div 
                    onClick={onClose} // Clicking the pill closes the modal
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 cursor-pointer z-50 animate-fade-in transition-all hover:bg-black/60 group"
                >
                    <div className="flex flex-col items-center justify-center">
                        <ChevronUp size={18} className="text-white animate-bounce mb-0.5" />
                        <span className="text-[10px] text-white uppercase tracking-widest font-bold leading-none">
                            Clique aqui ou arraste pra cima
                        </span>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                    <button 
                        onClick={handleDismissHint}
                        className="p-1 text-white/30 hover:text-white/90 hover:bg-white/10 rounded-full transition-colors"
                        title="Ocultar dica por 60s"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>,
        document.body
    );
};


// --- MAIN HERO SLIDE COMPONENT ---
interface HeroSlideProps {
    hero: HeroInfo;
    isActive: boolean;
    onCategoryLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, categoryId: CategoryId) => void;
    onTypingCycleComplete: () => void;
    onOpenModal: () => void;
}

const HeroSlide: React.FC<HeroSlideProps> = ({ hero, isActive, onCategoryLinkClick, onTypingCycleComplete, onOpenModal }) => {
     const { 
        backgroundColor,
        typingEffectTarget,
        title,
        phrases,
        buttonPrimary,
        buttonSecondary,
        buttonPrimaryCategory,
        buttonSecondaryCategory,
        carouselTitle,
        carouselItems,
        carouselAnimationType,
        titleColor,
        subtitleColor,
        titleFontSizeMobile,
        titleFontSizeDesktop,
        subtitleFontSizeMobile,
        subtitleFontSizeDesktop,
        titleLineHeightMobile,
        titleLineHeightDesktop,
        subtitleLineHeightMobile,
        subtitleLineHeightDesktop,
        carouselHeightMobile,
        carouselHeightDesktop,
        carouselImageSizeMobile,
        carouselImageSizeDesktop,
        carouselItemSpreadMobile,
        carouselItemSpreadDesktop,
        auroraElements,
        blurStrength,
        carouselAnimationDuration,
        bonusMinutesEnabled,
        auroraAnimationDurationMobile,
        auroraAnimationDurationDesktop,
        paddingTopMobile,
        paddingBottomMobile,
        paddingTopDesktop,
        paddingBottomDesktop,
        buttonsVerticalOffsetMobile,
        buttonsVerticalOffsetDesktop,
        buttonStyleConfig
    } = hero;

    const onCycleComplete = useCallback(() => {
        if (isActive) {
            const phrasesToType = typingEffectTarget === 'title' ? (title || '').split('\n') : phrases || [];
            if (phrasesToType.length > 0 && phrasesToType[0]) {
                onTypingCycleComplete();
            }
        }
    }, [isActive, onTypingCycleComplete, typingEffectTarget, phrases, title]);

    const { text: typedText, isWaiting } = useTypingEffect(
        isActive && (typingEffectTarget === 'title' || typingEffectTarget === 'subtitle')
            ? (typingEffectTarget === 'title' ? (title || '').split('\n') : phrases || [])
            : [],
        100, 2000, 500, onCycleComplete
    );

    const handleHeroClick = (e: React.MouseEvent) => {
        // Prevent opening modal if clicking on buttons
        if ((e.target as HTMLElement).closest('a')) return;
        onOpenModal();
    };

    const useCustomButtonStyle = buttonStyleConfig && buttonStyleConfig.stylePreset !== 'standard';
    const heroBtnClass = `hero-btn-primary-${hero.id}`;
    const buttonIcon = buttonStyleConfig?.stylePreset === 'neon' ? <ArrowRight className="btn-icon" size={16} /> : null;

    // Dynamic CSS Injection
    const dynamicStyles = `
        .hero-dynamic-style-${hero.id} {
            padding-top: ${paddingTopMobile ?? 112}px !important;
            padding-bottom: ${paddingBottomMobile ?? 40}px !important;
        }
        .hero-dynamic-style-${hero.id} .hero-title {
            font-size: ${titleFontSizeMobile ?? 40}px;
            color: ${titleColor || 'var(--primary-text)'};
            line-height: ${titleLineHeightMobile ?? 1.2};
        }
        .hero-dynamic-style-${hero.id} .hero-subtitle {
            font-size: ${subtitleFontSizeMobile ?? 20}px;
            color: ${subtitleColor || 'var(--secondary-text)'};
            line-height: ${subtitleLineHeightMobile ?? 1.4};
        }
        .hero-dynamic-style-${hero.id} .hero-buttons-container {
            transform: translateY(${buttonsVerticalOffsetMobile ?? 0}px);
        }
        
        /* Standard Primary Button (Fallback if no custom config) */
        .hero-dynamic-style-${hero.id} .hero-button-primary-standard {
            background-color: ${hero.buttonPrimaryBackgroundColor || 'var(--button-primary-background)'};
            color: ${hero.buttonPrimaryTextColor || 'var(--button-primary-text)'};
            border-color: ${hero.buttonPrimaryBackgroundColor || 'var(--button-primary-background)'};
        }
        .hero-dynamic-style-${hero.id} .hero-button-primary-standard:hover {
            background-color: ${hero.buttonPrimaryBackgroundColorHover || hero.buttonPrimaryBackgroundColor || 'var(--button-primary-background)'};
            color: ${hero.buttonPrimaryTextColorHover || hero.buttonPrimaryTextColor || 'var(--button-primary-text)'};
        }

        /* Secondary Button */
        .hero-dynamic-style-${hero.id} .hero-button-secondary {
            background-color: ${hero.buttonSecondaryBackgroundColor || 'var(--button-secondary-background)'};
            color: ${hero.buttonSecondaryTextColor || 'var(--button-secondary-text)'};
            border-color: ${hero.buttonSecondaryBorderColor || 'var(--button-secondary-border)'};
            border-style: solid; /* Ensure solid */
            border-width: 2px;   /* Keep 2px width */
        }
        .hero-dynamic-style-${hero.id} .hero-button-secondary:hover {
            background-color: ${hero.buttonSecondaryBackgroundColorHover || 'var(--button-secondary-background-hover)'};
            color: ${hero.buttonSecondaryTextColorHover || 'var(--button-secondary-text-hover)'};
            border-color: ${hero.buttonSecondaryBorderColorHover || 'var(--button-secondary-border-hover)'};
        }

        /* Inject Complex Button Styles for this Hero */
        ${useCustomButtonStyle ? generateHeroButtonCss(hero.id, buttonStyleConfig) : ''}

        @media (min-width: 768px) {
            .hero-dynamic-style-${hero.id} {
                padding-top: ${paddingTopDesktop ?? 144}px !important;
                padding-bottom: ${paddingBottomDesktop ?? 48}px !important;
            }
            .hero-dynamic-style-${hero.id} .hero-title {
                font-size: ${titleFontSizeDesktop ?? 56}px;
                line-height: ${titleLineHeightDesktop ?? 1.2};
            }
            .hero-dynamic-style-${hero.id} .hero-subtitle {
                font-size: ${subtitleFontSizeDesktop ?? 24}px;
                line-height: ${subtitleLineHeightDesktop ?? 1.4};
            }
            .hero-dynamic-style-${hero.id} .hero-buttons-container {
                transform: translateY(${buttonsVerticalOffsetDesktop ?? 0}px);
            }
        }
    `;

    return (
        <>
            <style>{dynamicStyles}</style>
            <div
                onClick={handleHeroClick}
                className={`hero-dynamic-style-${hero.id} relative text-center px-4 overflow-hidden cursor-pointer group`}
                style={{ backgroundColor: backgroundColor || 'var(--background)' }}
            >
                <div className="absolute inset-0 z-0">
                    <AuroraBackground 
                        elements={auroraElements}
                        blurStrength={blurStrength}
                        animationDurationMobile={auroraAnimationDurationMobile}
                        animationDurationDesktop={auroraAnimationDurationDesktop}
                        uniqueId={`hero-${hero.id}`}
                    />
                </div>
                
                {/* Expand Icon */}
                <div className="absolute top-6 right-6 z-20 text-white/30 group-hover:text-white transition-colors pointer-events-none">
                     <Maximize2 size={20} />
                </div>

                <div className="relative z-10 container mx-auto max-w-5xl">
                    <h1 className="hero-title font-bold mb-3 min-h-[3.5rem] md:min-h-[4rem]">
                        {typingEffectTarget === 'title' ? (
                            <>
                                <span className={`hero-title-text ${isWaiting ? 'fading' : ''}`}>
                                    {typedText}
                                </span>
                                {!isWaiting && <span className="typing-cursor"></span>}
                            </>
                        ) : (
                            (title || '').split('\n').map((line, i) => <React.Fragment key={i}>{line}{i < (title || '').split('\n').length - 1 && <br />}</React.Fragment>)
                        )}
                    </h1>
                    <p className="hero-subtitle mb-6 min-h-[3.5rem] md:min-h-[2rem]">
                         {typingEffectTarget === 'subtitle' ? (
                            <>
                                <span className={`hero-subtitle-text ${isWaiting ? 'fading' : ''}`}>
                                    {typedText}
                                </span>
                                {!isWaiting && <span className="typing-cursor"></span>}
                            </>
                        ) : (
                           (phrases || []).join(' ')
                        )}
                    </p>
                    <div className="hero-buttons-container flex justify-center items-center gap-4 mb-2 md:mb-4">
                        {buttonPrimary && buttonPrimary.trim() && (
                            <a href="#produtos"
                               onClick={(e) => onCategoryLinkClick(e, buttonPrimaryCategory)}
                               className={`inline-flex items-center justify-center font-semibold text-sm md:text-base py-3 px-6 md:py-3 md:px-8 rounded-full transition-transform duration-300 hover:scale-105 border ${useCustomButtonStyle ? heroBtnClass : 'hero-button-primary-standard'}`}
                            >
                                <span className="relative z-10">{buttonPrimary}</span>
                                {buttonIcon}
                            </a>
                        )}
                        {buttonSecondary && buttonSecondary.trim() && (
                            <a href="#produtos" onClick={(e) => onCategoryLinkClick(e, buttonSecondaryCategory)} className="hero-button-secondary inline-block font-semibold text-sm md:text-base py-3 px-6 md:py-3 md:px-8 rounded-full transition-all duration-300 hover:scale-105">
                                {buttonSecondary}
                            </a>
                        )}
                    </div>
                     {bonusMinutesEnabled && (
                        <div className="my-4 p-2 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-300 text-sm font-semibold inline-block">
                            O dobro de minutos bônus ativado!
                        </div>
                    )}
                    <StoreProductCarousel 
                        items={carouselItems} 
                        uniqueId={`hero-${hero.id}`}
                        animationType={carouselAnimationType}
                        heightMobile={carouselHeightMobile}
                        heightDesktop={carouselHeightDesktop}
                        imageSizeMobile={carouselImageSizeMobile}
                        imageSizeDesktop={carouselImageSizeDesktop}
                        itemSpreadMobile={carouselItemSpreadMobile}
                        itemSpreadDesktop={carouselItemSpreadDesktop}
                        animationDuration={carouselAnimationDuration}
                        carouselImageOffsetXMobile={hero.carouselImageOffsetXMobile}
                        carouselImageOffsetYMobile={hero.carouselImageOffsetYMobile}
                        carouselImageOffsetXDesktop={hero.carouselImageOffsetXDesktop}
                        carouselImageOffsetYDesktop={hero.carouselImageOffsetYDesktop}
                    />
                    {carouselAnimationType !== 'focus_loop' && (
                        <p className="text-white text-lg font-semibold mt-0 md:mt-4 h-8 flex justify-center items-center relative">
                            {carouselTitle}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};


interface HeroSectionProps {
    heroes: HeroInfo[];
    onCategoryLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, categoryId: CategoryId) => void;
}

const StoreHero: React.FC<HeroSectionProps> = ({ heroes, onCategoryLinkClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState<number | null>(null);
    const [isInitial, setIsInitial] = useState(true);
    const [selectedHero, setSelectedHero] = useState<HeroInfo | null>(null);
    
    const activeHeroes = heroes ? heroes.filter(h => h.enabled !== false) : [];

    const goToNext = useCallback(() => {
        if (activeHeroes.length <= 1) return;
        setPreviousIndex(currentIndex);
        setCurrentIndex(prevIndex => (prevIndex + 1) % activeHeroes.length);
    }, [currentIndex, activeHeroes.length]);

    useEffect(() => {
        const t = setTimeout(() => setIsInitial(false), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (activeHeroes.length <= 1) return;
        // If modal is open, pause rotation logic to avoid background shifts, 
        // although rotation logic continues, the modal covers it. 
        // If strict pausing is needed, check selectedHero here.

        const currentHero = activeHeroes[currentIndex];
        if (!currentHero) return;

        const phrasesToType = currentHero.typingEffectTarget === 'title' ? (currentHero.title || '').split('\n') : currentHero.phrases || [];
        const hasTypingEffect = currentHero.typingEffectTarget !== 'none' && phrasesToType.length > 0 && phrasesToType[0] !== '';

        if (!hasTypingEffect) {
            const intervalTime = (currentHero.rotationInterval ?? 8) * 1000;
            const timer = setTimeout(goToNext, intervalTime);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, activeHeroes, goToNext]);


    if (activeHeroes.length === 0) {
        return null;
    }

    return (
        <>
            <section className={`hero-carousel-container ${isInitial ? 'initial-load' : ''}`}>
                {activeHeroes.map((hero, index) => {
                     let className = '';
                     if (index === currentIndex) {
                         className = 'active-hero';
                     } else if (index === previousIndex) {
                         className = 'exiting-hero';
                     }
                    return(
                        <div
                            key={hero.id}
                            className={`hero-slide ${className} ${index === currentIndex ? 'z-20' : 'z-0'}`}
                        >
                            <HeroSlide 
                                hero={hero} 
                                isActive={index === currentIndex} 
                                onCategoryLinkClick={onCategoryLinkClick} 
                                onTypingCycleComplete={goToNext}
                                onOpenModal={() => setSelectedHero(hero)}
                            />
                        </div>
                    );
                })}
            </section>

            {/* Render Modal Outside the main flow */}
            {selectedHero && (
                <HeroFullscreenModal 
                    hero={selectedHero}
                    onClose={() => setSelectedHero(null)}
                    onCategoryLinkClick={onCategoryLinkClick}
                />
            )}
        </>
    );
};

export default StoreHero;