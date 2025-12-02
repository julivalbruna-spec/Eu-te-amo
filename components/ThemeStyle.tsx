
import React from 'react';
import { SiteInfo, ThemeColors, BuyButtonConfig, StoreLayoutSettings, ChatWidgetSettings } from '../types';

interface ThemeStyleProps {
    theme: ThemeColors;
    bannerTransitionDuration?: number;
    buyButtonConfig?: BuyButtonConfig;
    storeLayout?: StoreLayoutSettings; // Add storeLayout prop
    chatWidget?: ChatWidgetSettings;
}

const ThemeStyle: React.FC<ThemeStyleProps> = ({ theme, bannerTransitionDuration, buyButtonConfig, storeLayout, chatWidget }) => {
    // Função auxiliar: Se o valor existir, usa ele. Se for uma string vazia, usa 'transparent'. Se for undefined, usa o fallback.
    const c = (val: string | undefined, fallback: string = 'transparent') => {
        if (val === '') return 'transparent';
        return val || fallback;
    };

    // Use storeLayout buyButtonConfig if available (priority), otherwise fallback to props or default
    const btn = storeLayout?.buyButtonConfig || buyButtonConfig || {
        stylePreset: 'standard',
        primaryColor: theme.buttonPrimaryBackground,
        secondaryColor: theme.buttonPrimaryBackgroundHover || theme.buttonPrimaryBackground,
        highlightColor: '#ffffff',
        textColor: theme.buttonPrimaryText
    };

    // Generate Button CSS based on preset
    let buttonCss = '';

    if (btn.stylePreset === 'shiny') {
        buttonCss = `
            @property --gradient-angle {
                syntax: "<angle>";
                initial-value: 0deg;
                inherits: false;
            }
            @property --gradient-angle-offset {
                syntax: "<angle>";
                initial-value: 0deg;
                inherits: false;
            }
            @property --gradient-percent {
                syntax: "<percentage>";
                initial-value: 5%;
                inherits: false;
            }
            @property --gradient-shine {
                syntax: "<color>";
                initial-value: white;
                inherits: false;
            }
            .custom-buy-button {
                --shiny-cta-bg: ${c(btn.primaryColor)} !important;
                --shiny-cta-bg-subtle: ${c(btn.secondaryColor)} !important;
                --shiny-cta-fg: ${c(btn.textColor)} !important;
                --shiny-cta-highlight: ${c(btn.highlightColor)} !important;
                --shiny-cta-highlight-subtle: #ffffff !important;
                
                --animation: gradient-angle linear infinite !important;
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
                        from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
                        transparent,
                        var(--shiny-cta-highlight) var(--gradient-percent),
                        var(--gradient-shine) calc(var(--gradient-percent) * 2),
                        var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
                        transparent calc(var(--gradient-percent) * 4)
                    ) border-box !important;
                box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle) !important;
                transition: 800ms cubic-bezier(0.25, 1, 0.5, 1) !important;
                transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine !important;
            }
            .custom-buy-button::before,
            .custom-buy-button::after,
            .custom-buy-button span::before {
                content: "" !important;
                pointer-events: none !important;
                position: absolute !important;
                inset-inline-start: 50% !important;
                inset-block-start: 50% !important;
                translate: -50% -50% !important;
                z-index: -1 !important;
            }
            .custom-buy-button:hover {
                --gradient-percent: 20% !important;
                --gradient-angle-offset: 95deg !important;
                --gradient-shine: var(--shiny-cta-highlight-subtle) !important;
                transform: scale(1.02);
            }
            @keyframes gradient-angle {
                to { --gradient-angle: 360deg; }
            }
        `;
    } else if (btn.stylePreset === 'neon') {
        buttonCss = `
            .custom-buy-button {
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
            .custom-buy-button:hover {
                transform: translateY(-3px);
                box-shadow: 0px 10px 25px -5px ${c(btn.highlightColor)};
            }
            .custom-buy-button .btn-icon {
                margin-left: 5px;
                display: inline-block;
            }
            .custom-buy-button:hover .btn-icon {
                animation: moveIcon 1s infinite alternate;
            }
            @keyframes moveIcon {
                0% { transform: translateX(0); }
                100% { transform: translateX(5px); }
            }
        `;
    } else if (btn.stylePreset === 'cyber') {
        buttonCss = `
            .custom-buy-button {
                background: transparent !important;
                color: ${c(btn.textColor)};
                position: relative;
                z-index: 1;
                border-radius: 8px;
                transition: 0.5s;
                border: 1px solid ${c(btn.highlightColor)}40;
            }
            /* BG */
            .custom-buy-button::before {
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
            .custom-buy-button::after {
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
            .custom-buy-button:hover::after {
                opacity: 1;
                box-shadow: 0px 0px 15px 0px ${c(btn.highlightColor)};
            }
        `;
    } else if (btn.stylePreset === 'pulse') {
        buttonCss = `
            .custom-buy-button {
                background: linear-gradient(90deg, ${c(btn.primaryColor)}, ${c(btn.secondaryColor)}, ${c(btn.primaryColor)});
                background-size: 200% auto;
                color: ${c(btn.textColor)};
                border-radius: 30px;
                transition: all 0.3s ease;
                border: none;
                box-shadow: 0 0 10px ${c(btn.highlightColor)}40;
            }
            .custom-buy-button:hover {
                background-position: right center;
                box-shadow: 0 0 20px ${c(btn.highlightColor)}80;
                transform: scale(1.02);
            }
        `;
    } else {
        // Standard - UPDATED to use specific config colors
        buttonCss = `
            .custom-buy-button {
                background-color: ${c(btn.primaryColor)};
                color: ${c(btn.textColor)};
                border: ${theme.buttonPrimaryBorderEnabled ? `2px solid ${c(btn.highlightColor, btn.primaryColor)}` : 'none'};
                transition: all 0.3s ease;
            }
            .custom-buy-button:hover {
                background-color: ${c(btn.secondaryColor)};
                color: ${c(btn.textColor)};
                border-color: ${theme.buttonPrimaryBorderEnabled ? c(btn.highlightColor, btn.secondaryColor) : 'transparent'};
            }
        `;
    }

    // --- CARD BORDER STYLES ---
    let cardBorderCss = '';
    const borderStyle = storeLayout?.cardBorderStyle || 'none';
    const borderColors = storeLayout?.cardBorderColors || { primary: '#6121ff', secondary: '#4c0de2' };
    
    // FIX: Logic to determine card background. 
    // 1. theme.productCardBackground (from AI or manual color picker)
    // 2. theme.surface (fallback)
    const cardBg = c(theme.productCardBackground) !== 'transparent' ? c(theme.productCardBackground) : c(theme.surface, '#0a0a0a');
    
    const cardC1 = c(borderColors.primary, '#6121ff');
    const cardC2 = c(borderColors.secondary, '#4c0de2');

    if (borderStyle === 'modern_clean') {
        // Style 1 from prompt: Simple border with top/left highlight
        cardBorderCss = `
            .card-border-modern_clean {
                position: relative;
                z-index: 5;
                background: ${cardBg} !important;
                border-radius: 20px;
            }
            .card-border-modern_clean::after {
                content: "";
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: ${cardBg};
                z-index: -1;
                border-radius: inherit;
            }
            .card-border-modern_clean::before {
                content: "";
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: calc(100% + 2px);
                height: calc(100% + 2px);
                background: linear-gradient(to top, ${cardC1} 15%, transparent 100%);
                z-index: -2;
                border-radius: inherit;
            }
        `;
    } else if (borderStyle === 'glow_hover') {
        // Style 2 from prompt: Outer glow gradient
        cardBorderCss = `
            .card-border-glow_hover {
                border-radius: 20px;
                position: relative;
                z-index: 5;
                background: ${cardBg} !important;
            }
            .card-border-glow_hover::before {
                content: "";
                background: linear-gradient(to right, ${cardC1}, ${cardC2});
                position: absolute;
                border-radius: inherit;
                top: 50%; left: 50%;
                transform: translate(-50%,-50%);
                z-index: -3;
                width: calc(100% + 4px);
                height: calc(100% + 4px);
            }
            .card-border-glow_hover::after {
                content: "";
                background: ${cardBg}; /* Card Background */
                border-radius: inherit;
                z-index: -2;
                width: 100%; height: 100%;
                position: absolute;
                transform: translate(-50%,-50%);
                top: 50%; left: 50%;
            }
        `;
    } else if (borderStyle === 'glass_prism') {
        // Style 3 from prompt: Top border gradient image
        cardBorderCss = `
            .card-border-glass_prism {
                background: ${cardBg} !important;
                border-radius: 20px;
                border-top: 3px solid;
                border-image: linear-gradient(to right, transparent, ${cardC1}, transparent) 1;
                overflow: hidden;
            }
        `;
    } else if (borderStyle === 'cyber_frame') {
        // Style 4 from prompt: Angled gradient border using mask
        cardBorderCss = `
            .card-border-cyber_frame {
                z-index: 1;
                position: relative;
                background: ${cardBg} !important;
            }
            .card-border-cyber_frame::before {
                content: "";
                position: absolute;
                z-index: 2;
                border-radius: inherit;
                top: 0; left: 0; right: 0; bottom: 0;
                padding: 3px;
                background: linear-gradient(-35deg, ${cardC1}, transparent, transparent, ${cardC2});
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                pointer-events: none;
            }
        `;
    } else if (borderStyle === 'retro_arcade') {
        // Style 5 from prompt: Top-down fade gradient
        cardBorderCss = `
            .card-border-retro_arcade {
                z-index: 1;
                position: relative;
                background: ${cardBg} !important;
            }
            .card-border-retro_arcade::before {
                content: "";
                position: absolute;
                z-index: 2;
                border-radius: inherit;
                top: 0; left: 0; right: 0; bottom: 0;
                padding: 3px;
                background: linear-gradient(to bottom, ${cardC1}, transparent);
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                pointer-events: none;
            }
        `;
    } else if (borderStyle === 'spin') {
        // Style 7 & 8 from prompt: Spinning Conic Gradient
        cardBorderCss = `
            @property --angle-spin {
              syntax: "<angle>"; 
              inherits: true;
              initial-value: 0turn; 
            }
            @keyframes spin-border {
              to { --angle-spin: 1turn; }
            }
            .card-border-spin {
                position: relative;
                isolation: isolate;
                z-index: 1;
                background: ${cardBg} !important;
                border-radius: 24px; /* Forced radius for effect */
                overflow: hidden;
            }
            .card-border-spin::before {
                content: "";
                position: absolute;
                inset: -2px;
                z-index: -1;
                background-image: conic-gradient(from var(--angle-spin), ${cardC1}, ${cardC2}, ${cardC1});
                animation: spin-border 4s linear infinite;
                padding: 2px;
            }
            /* Inner mask to show content */
            .card-border-spin::after {
                content: "";
                position: absolute;
                inset: 2px;
                background: ${cardBg};
                border-radius: inherit;
                z-index: -1;
            }
        `;
    } else if (borderStyle === 'neon') {
        // Style 9 from prompt: Rotating glow behind
        cardBorderCss = `
            @keyframes borda-animada {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
            .card-border-neon {
                position: relative;
                z-index: 1;
                overflow: hidden;
                background: ${cardBg} !important;
                transform: translateZ(0); /* Force hardware accel */
            }
            .card-border-neon::before {
                content: "";
                position: absolute;
                top: 50%; left: 50%;
                width: 150%; height: 150%;
                background: conic-gradient(transparent, ${cardC1}, transparent 30%);
                transform: translate(-50%, -50%);
                animation: borda-animada 4s linear infinite;
                z-index: -2;
            }
            .card-border-neon::after {
                content: "";
                position: absolute;
                inset: 2px;
                background: ${cardBg};
                border-radius: inherit;
                z-index: -1;
            }
        `;
    } else if (borderStyle === 'gradient') {
        // Standard Gradient Border
        cardBorderCss = `
            .card-border-gradient {
                position: relative;
                z-index: 1;
                background: ${cardBg} !important;
            }
            .card-border-gradient::before {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: inherit;
                padding: 2px; 
                background: linear-gradient(45deg, ${cardC1}, ${cardC2});
                -webkit-mask: 
                    linear-gradient(#fff 0 0) content-box, 
                    linear-gradient(#fff 0 0);
                mask: 
                    linear-gradient(#fff 0 0) content-box, 
                    linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                pointer-events: none;
                z-index: 2;
            }
        `;
    }

    // --- FOOTER ANIMATION STYLES ---
    let footerAnimCss = '';
    const footerAnim = theme.footerButtonAnimation;
    if (footerAnim === 'pulse') {
        footerAnimCss = `
            @keyframes footer-btn-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--footer-btn-rgb), 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(var(--footer-btn-rgb), 0); } }
            .theme-footer-button.animate-pulse { animation: footer-btn-pulse 2s infinite; }
        `;
    } else if (footerAnim === 'bounce') {
        footerAnimCss = `
            @keyframes footer-btn-bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } 60% { transform: translateY(-3px); } }
            .theme-footer-button.animate-bounce { animation: footer-btn-bounce 2s infinite; }
        `;
    } else if (footerAnim === 'scale') {
        footerAnimCss = `
            @keyframes footer-btn-scale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
            .theme-footer-button.animate-scale { animation: footer-btn-scale 1.5s infinite ease-in-out; }
        `;
    } else if (footerAnim === 'shine') {
        footerAnimCss = `
            .theme-footer-button.animate-shine { position: relative; overflow: hidden; }
            .theme-footer-button.animate-shine::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: footer-btn-shine 3s infinite; }
            @keyframes footer-btn-shine { 0% { left: -100%; } 20% { left: 100%; } 100% { left: 100%; } }
        `;
    }

    // Helper to get RGB for pulse effect
    const getRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 174, 0';
    };
    const footerBtnRgb = getRgb(c(theme.footerButtonBackground, '#ffae00'));


    const css = `
    :root {
      --banner-transition-duration: ${bannerTransitionDuration ?? 1.2}s;
      --background: ${c(theme.background, '#000000')};
      --surface: ${c(theme.surface, '#0a0a0a')};
      --primary-text: ${c(theme.primaryText, '#FFFFFF')};
      --secondary-text: ${c(theme.secondaryText, '#A1A1AA')};
      --brand-yellow: ${c(theme.brand, '#ffae00')};
      --border-color: ${c(theme.border, '#27272A')};
      
      --button-primary-background: ${c(theme.buttonPrimaryBackground, '#ffae00')};
      --button-primary-text: ${c(theme.buttonPrimaryText, '#000000')};
      
      --header-background: ${c(theme.headerBackground, '#FFFFFF')};
      --sidebar-background: ${c(theme.sidebarBackground, '#0a0a0a')};
      --sidebar-text: ${c(theme.sidebarText, '#e5e7eb')};

      --button-secondary-background: ${c(theme.buttonSecondaryBackground, 'transparent')};
      --button-secondary-text: ${c(theme.buttonSecondaryText, '#FFFFFF')};
      --button-secondary-border: ${c(theme.buttonSecondaryBorder, 'transparent')};
      --button-secondary-background-hover: ${c(theme.buttonSecondaryBackgroundHover, 'transparent')};
      --button-secondary-text-hover: ${c(theme.buttonSecondaryTextHover, '#000000')};
      --button-secondary-border-hover: ${c(theme.buttonSecondaryBorderHover, 'transparent')};

      /* Use theme.productCardBackground if set (from AI), otherwise fallback to surface */
      --product-card-bg: ${cardBg};
      
      --product-card-details-text: ${c(theme.productCardDetailsText, '#A1A1AA')};
      --product-card-details-text-hover: ${c(theme.productCardDetailsTextHover, '#FFFFFF')};
      --product-card-hover-glow: ${c(theme.productCardHoverGlow, theme.brand)};
      
      --discount-badge-bg: ${c(storeLayout?.discountBadgeColors?.background, '#dc2626')};
      --discount-badge-text: ${c(storeLayout?.discountBadgeColors?.text, '#ffffff')};

      --footer-background: ${c(theme.footerBackground, '#000000')};
      --footer-text: ${c(theme.footerText, '#FFFFFF')};
      --footer-button-background: ${c(theme.footerButtonBackground, '#ffae00')};
      --footer-button-text: ${c(theme.footerButtonText, '#000000')};
      --footer-button-background-hover: ${c(theme.footerButtonBackgroundHover, theme.footerButtonBackground)};
      --footer-button-text-hover: ${c(theme.footerButtonTextHover, theme.footerButtonText)};
      --footer-btn-rgb: ${footerBtnRgb};

      --search-text-color: ${c(storeLayout?.searchTextColor, theme.primaryText)};
      --search-placeholder-color: ${c(storeLayout?.searchPlaceholderColor, theme.secondaryText)};
      --category-title-color: ${c(storeLayout?.categoryTitleColor, theme.primaryText)};

      --modal-background: ${c(theme.modalBackground, c(theme.surface, '#0a0a0a'))};
      
      /* Contact Section Colors */
      --contact-bg: ${c(theme.contactSectionBackground, c(theme.surface, '#0a0a0a'))};
      --contact-text: ${c(theme.contactSectionText, c(theme.primaryText, '#FFFFFF'))};
      --contact-card-bg: ${c(theme.contactCardsBackground, '#000000')};
      --contact-card-border: ${c(theme.contactCardsBorder, c(theme.border, '#27272A'))};
      --contact-icon-color: ${c(theme.contactIconsColor, c(theme.brand, '#ffae00'))};

      /* Cart Drawer Customization */
      --cart-bg: ${c(theme.cartBackground, c(chatWidget?.backgroundColor, '#121212'))};
      --cart-text: ${c(theme.cartTextColor, c(theme.primaryText, '#ffffff'))};
      --cart-border: ${c(theme.cartBorderColor, 'rgba(255,255,255,0.1)')};
      
      --cart-header-bg: ${c(theme.cartHeaderBackground, c(chatWidget?.headerBackgroundColor, c(chatWidget?.bubbleColor, theme.brand)))};
      --cart-header-text: ${c(theme.cartHeaderTextColor, c(chatWidget?.headerTextColor, '#ffffff'))};
      
      --cart-checkout-bg: ${c(theme.cartCheckoutButtonBackground, c(theme.buttonPrimaryBackground, '#ffae00'))};
      --cart-checkout-text: ${c(theme.cartCheckoutButtonText, c(theme.buttonPrimaryText, '#000000'))};

      /* Add to Cart Button */
      --add-to-cart-bg: ${c(theme.addToCartButtonBackground, c(theme.surface, '#0a0a0a'))};
      --add-to-cart-text: ${c(theme.addToCartButtonText, c(theme.primaryText, '#ffffff'))};
      --add-to-cart-border: ${c(theme.addToCartButtonBorder, c(theme.border, '#27272a'))};
      --add-to-cart-hover-bg: ${c(theme.addToCartButtonHoverBackground, c(theme.background, '#000000'))};
      --add-to-cart-hover-text: ${c(theme.addToCartButtonHoverText, c(theme.primaryText, '#ffffff'))};
      --add-to-cart-hover-border: ${c(theme.addToCartButtonHoverBorder, c(theme.border, '#27272a'))};
    }

    /* BUY BUTTON STYLES */
    ${buttonCss}

    /* CARD BORDER STYLES */
    ${cardBorderCss}
    
    /* FOOTER ANIMATION STYLES */
    ${footerAnimCss}

    /* SEARCH INPUT STYLES */
    .custom-search-input {
        color: var(--search-text-color) !important;
    }
    .custom-search-input::placeholder {
        color: var(--search-placeholder-color) !important;
        opacity: 1; /* Firefox needs opacity override */
    }
    .custom-search-select {
        color: var(--search-text-color) !important;
    }
    .custom-search-icon {
        color: var(--search-placeholder-color) !important;
    }

    /* CUSTOM ADD TO CART BUTTON */
    .custom-add-to-cart-button {
        background-color: var(--add-to-cart-bg);
        color: var(--add-to-cart-text);
        border: 1px solid var(--add-to-cart-border);
        transition: all 0.2s ease-in-out;
    }
    .custom-add-to-cart-button:hover {
        background-color: var(--add-to-cart-hover-bg);
        color: var(--add-to-cart-hover-text);
        border-color: var(--add-to-cart-hover-border);
    }
    .custom-add-to-cart-button svg {
        color: var(--add-to-cart-text);
    }
    .custom-add-to-cart-button:hover svg {
        color: var(--add-to-cart-hover-text);
    }
  `;

    return <style>{css}</style>;
};

export default ThemeStyle;
