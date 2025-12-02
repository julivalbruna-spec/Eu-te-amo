
import { Category, SiteInfo, CarouselItem, HeroInfo, Rates, ThemePreset } from './types';

const defaultHero: HeroInfo = {
  id: 'default-hero-1',
  enabled: true,
  backgroundColor: '#000000',
  typingEffectTarget: 'subtitle',
  carouselAnimationType: 'roleta',
  carouselAnimationDuration: 24,
  rotationInterval: 8,
  title: "Bem Vindo ao extraordinário.",
  phrases: [
      "O futuro chegou. Mais poder, mais leveza.",
      "Engenharia de ponta. Design incomparável.",
      "A nova geração de velocidade e estilo."
  ],
  buttonPrimary: "Comprar agora",
  buttonSecondary: "Ver Produtos",
  carouselTitle: "iPhone 17 | 17 Pro | 17 Air",
  buttonPrimaryCategory: 'todos',
  buttonSecondaryCategory: 'black_friday',
  carouselItems: [
      { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-2-Nnb6dhxiHN9ZQMH8.png", alt: "iPhone 17" },
      { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-pro-max-laranja-cosmico-juVtKK3To8n3TPRS.png", alt: "iPhone 17 Pro" },
      { src: "https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762586225585_iPhone17-Air_sky-blue_front-back.png?alt=media&token=385e2c71-de14-49a7-a8f1-ab1e9b996bfd", alt: "iPhone 17 Air" },
      { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-2-Nnb6dhxiHN9ZQMH8.png", alt: "iPhone 17" },
      { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-pro-max-laranja-cosmico-juVtKK3To8n3TPRS.png", alt: "iPhone 17 Pro" },
      { src: "https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762586225585_iPhone17-Air_sky-blue_front-back.png?alt=media&token=385e2c71-de14-49a7-a8f1-ab1e9b996bfd", alt: "iPhone 17 Air" },
  ],
  bonusMinutesEnabled: false,
  buttonStyleConfig: {
      stylePreset: 'standard',
      primaryColor: '#ffae00',
      secondaryColor: '#e69c00',
      highlightColor: '#ffffff',
      textColor: '#000000'
  }
};

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'theme-1',
        name: 'Tema 1 (Midnight Yellow)',
        previewColor: '#ffae00',
        colors: {
            background: '#000000',
            surface: '#0a0a0a',
            primaryText: '#FFFFFF',
            secondaryText: '#A1A1AA',
            brand: '#ffae00',
            border: '#27272A',
            headerBackground: '#FFFFFF',
            headerOpacity: 100,
            headerTextColor: '#000000',
            headerScrolledBackground: '#FFFFFF',
            headerScrolledOpacity: 100,
            headerScrolledTextColor: '#000000',
            sidebarBackground: '#0a0a0a',
            sidebarText: '#e5e7eb',
            buttonPrimaryBackground: '#ffae00',
            buttonPrimaryText: '#000000',
            buttonPrimaryBackgroundHover: '#e69c00',
            buttonPrimaryTextHover: '#000000',
            buttonSecondaryBackground: 'transparent',
            buttonSecondaryText: '#FFFFFF',
            buttonSecondaryBorder: '#FFFFFF',
            buttonSecondaryBackgroundHover: '#FFFFFF',
            buttonSecondaryTextHover: '#000000',
            buttonSecondaryBorderHover: '#FFFFFF',
            productCardBackground: '', // Default uses surface
            productCardDetailsText: '#A1A1AA',
            productCardDetailsTextHover: '#FFFFFF',
            productCardHoverGlow: '#ffae00',
            footerBackground: '#000000',
            footerOpacity: 70,
            footerText: '#FFFFFF',
            footerButtonBackground: '#ffae00',
            footerButtonText: '#000000',
            footerButtonBackgroundHover: '#e69c00',
            footerButtonTextHover: '#000000',
        }
    },
    {
        id: 'theme-2',
        name: 'Tema 2 (Intelli Dark)',
        previewColor: '#f97316',
        colors: {
            background: '#09090b',
            surface: '#18181b',
            primaryText: '#fafafa',
            secondaryText: '#a1a1aa',
            brand: '#f97316', // Orange 500
            border: '#27272a',
            headerBackground: '#09090b',
            headerOpacity: 95,
            headerTextColor: '#fafafa',
            headerScrolledBackground: '#09090b',
            headerScrolledOpacity: 95,
            headerScrolledTextColor: '#fafafa',
            sidebarBackground: '#18181b',
            sidebarText: '#e4e4e7',
            buttonPrimaryBackground: '#f97316',
            buttonPrimaryText: '#ffffff',
            buttonPrimaryBackgroundHover: '#ea580c', // Orange 600
            buttonPrimaryTextHover: '#ffffff',
            buttonSecondaryBackground: '#27272a',
            buttonSecondaryText: '#fafafa',
            buttonSecondaryBorder: '#3f3f46',
            buttonSecondaryBackgroundHover: '#3f3f46',
            buttonSecondaryTextHover: '#ffffff',
            buttonSecondaryBorderHover: '#52525b',
            productCardBackground: '#18181b',
            productCardDetailsText: '#71717a',
            productCardDetailsTextHover: '#fb923c',
            productCardHoverGlow: '#f97316',
            footerBackground: '#09090b',
            footerOpacity: 100,
            footerText: '#71717a',
            footerButtonBackground: '#f97316',
            footerButtonText: '#ffffff',
            footerButtonBackgroundHover: '#ea580c',
            footerButtonTextHover: '#ffffff',
        }
    }
];


export const SITE_INFO: SiteInfo = {
  storeName: "iPhone Rios",
  cnpj: "XX.XXX.XXX/0001-XX",
  logos: {
    main: "https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762581268051_iphone-rios-logo.png?alt=media&token=19884066-2faf-4e94-ba4c-b66ddb69b4b3",
    header: "",
    headerScrolled: "",
    sidebar: "",
    login: "",
    bio: "",
  },
  faviconUrl: "https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762581268051_iphone-rios-logo.png?alt=media&token=19884066-2faf-4e94-ba4c-b66ddb69b4b3",
  streetViewUrl: "https://www.google.com/maps/embed?pb=!4v1762584846792!6m8!1m7!1stV2pWLsXh4ek6-EIIohvPA!2m2!1d-11.94426969180581!2d-38.08287882753277!3f243.56383302508937!4f0.5948737445448415!5f0.7820865974627469",
  address: "R. Bom Jesus, 426 - Centro, <br />Entre Rios - BA, 48180-000",
  hoursWeek: "Seg-Sex: 08:00 - 18:00",
  hoursSaturday: "Sábado: 08:00 - 13:00",
  links: {
    whatsappSales: "557999147756",
    whatsappSupport: "5575981703760",
    instagram: "https://www.instagram.com/iphone.rios/",
    instagramHandle: "@iphone.rios",
    showSupport: true
  },
  copyrightText: "© 2025 iPhone Rios. Todos os direitos reservados.",
  marqueeTexts: [
      "FRETE GRÁTIS PARA ENTRE RIOS",
      "GARANTIA DE 3 MESES EM SEMINOVOS",
      "COMPRA 100% SEGURA",
      "ACEITAMOS SEU USADO NA TROCA",
      "PARCELAMENTO EM ATÉ 12X NO CARTÃO",
      "ASSISTÊNCIA TÉCNICA ESPECIALIZADA"
  ],
  heroes: [defaultHero],
  banners: [
      { 
        id: 'default-banner',
        enabled: false,
        type: 'image',
        imageUrl: "https://placehold.co/1200x300/ffae00/000000?text=Banner+Promocional",
        linkUrl: "/#produtos",
        typingEffectTarget: 'none',
        title: '',
        phrases: [],
        buttonPrimary: '',
        buttonSecondary: '',
        buttonPrimaryCategory: 'todos',
        buttonSecondaryCategory: 'todos',
        carouselTitle: '',
        carouselItems: [],
        bonusMinutesEnabled: false
      }
  ],
  customTexts: {
      promoFooterButtonCategory: 'black_friday',

      productSearchPlaceholder: "Pesquisar modelo...",
      productSortLabel: "Ordenar por:",
      categorySelectLabel: "Selecione a categoria",
      sortOptionLowToHigh: "Menor Preço",
      sortOptionHighToLow: "Maior Preço",
      productCardBuy: "Comprar",
      productCardHire: "Contratar",
      productCardConsult: "Consultar",
      productCardDetails: "Ver detalhes",
      productCardHideDetails: "Ocultar detalhes",
      contactTitle: "Contato e Localização",
      contactSubtitle: "Prontos para te atender com a excelência que você merece.",
      promoFooterText: "🔥 A Black Friday já começou!",
      promoFooterButton: "Ver Ofertas",
      aiAssistantName: "",
      aiAssistantPronoun: "sua",
      aiInitialMessage: "",
      brandVoice: "amigável, jovem e profissional, usando emojis",
      
      // Default Modal Texts
      modalCalculatorTitle: "Simule Parcelado",
      modalBtnCash: "Pagar à Vista (WhatsApp)",
      modalBtnInstallments: "Calcular Parcelas",
      modalBtnWhatsApp: "Confirmar no WhatsApp"
  },
  theme: {
    background: '#000000',
    surface: '#0a0a0a',
    primaryText: '#FFFFFF',
    secondaryText: '#A1A1AA',
    brand: '#ffae00',
    border: '#27272A',
    headerBackground: '#FFFFFF',
    headerOpacity: 100,
    headerTextColor: '#000000',
    headerScrolledBackground: '#FFFFFF',
    headerScrolledOpacity: 100,
    headerScrolledTextColor: '#000000',
    sidebarBackground: '#0a0a0a',
    sidebarText: '#e5e7eb',
    buttonPrimaryBackground: '#ffae00',
    buttonPrimaryText: '#000000',
    buttonPrimaryBackgroundHover: '#e69c00',
    buttonPrimaryTextHover: '#000000',
    buttonSecondaryBackground: 'transparent',
    buttonSecondaryText: '#FFFFFF',
    buttonSecondaryBorder: '#FFFFFF',
    buttonSecondaryBackgroundHover: '#FFFFFF',
    buttonSecondaryTextHover: '#000000',
    buttonSecondaryBorderHover: '#FFFFFF',
    productCardBackground: '', // Default empty (uses fallback or surface)
    productCardDetailsText: '#A1A1AA',
    productCardDetailsTextHover: '#FFFFFF',
    productCardHoverGlow: '#ffae00',
    footerBackground: '#000000',
    footerOpacity: 70,
    footerText: '#FFFFFF',
    footerButtonBackground: '#ffae00',
    footerButtonText: '#000000',
    footerButtonBackgroundHover: '#e69c00',
    footerButtonTextHover: '#000000',
  },
  storeLayout: {
    mobileColumns: 1,
    cardBorderRadius: 'lg',
    cardContentAlign: 'left',
    showOriginalPrice: true,
    showInstallments: true,
    showDiscountBadge: true,
    showBuyButton: true,
    showAuroraBackground: false,
    auroraBlurStrength: 150,
    auroraElements: [
        { color: '#ffae00', sizeMobile: 600, sizeDesktop: 900 },
        { color: '#0a0a0a', sizeMobile: 500, sizeDesktop: 800 },
        { color: '#000000', sizeMobile: 400, sizeDesktop: 600 }
    ],
    productModalScale: 100,
    secondaryPriceType: 'debit',
    productTitleFontSize: 16, // Mobile default
    productPriceFontSize: 20, // Mobile default
    secondaryPriceFontSize: 12, // Mobile default
    searchBackgroundColor: '#0a0a0a',
    searchTextColor: '#FFFFFF',
    searchPlaceholderColor: '#A1A1AA',
    categoryTitleColor: '#FFFFFF',
    categoryLinkColor: '#ffae00',
    buyButtonConfig: {
        stylePreset: 'standard',
        primaryColor: '#ffae00',
        secondaryColor: '#e69c00',
        highlightColor: '#ffffff',
        textColor: '#000000'
    }
  },
  purchaseModalSettings: {
      backgroundColor: '#0a0a0a',
      textColor: '#FFFFFF',
      borderRadius: 'xl',
      buttonBorderRadius: 'lg',
      buttonBackgroundColor: '#ffae00',
      buttonTextColor: '#000000'
  },
  rates: {
    debit: 0.025, // 2.5%
    credit: { 
      1: 0.06,   // 6.0%
      2: 0.07,   // 7.0%
      3: 0.085,  // 8.5%
      4: 0.095,  // 9.5%
      5: 0.105,  // 10.5%
      6: 0.11,   // 11.0%
      7: 0.12,   // 12.0%
      8: 0.125,  // 12.5%
      9: 0.13,   // 13.0%
      10: 0.145, // 14.5%
      11: 0.15,  // 15.0%
      12: 0.165  // 16.5%
    }
  },
  seo: {
      metaTitle: 'iPhone Rios - iPhones Novos e Seminovos em Entre Rios, BA',
      metaDescription: 'Compre iPhones novos e seminovos com garantia na iPhone Rios. A melhor loja de Entre Rios, Bahia. Oferecemos assistência técnica e os melhores acessórios.',
      metaKeywords: 'iPhone, Apple, seminovos, Entre Rios, Bahia, assistência técnica, comprar iPhone',
      ogImage: 'https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762581268051_iphone-rios-logo.png?alt=media&token=19884066-2faf-4e94-ba4c-b66ddb69b4b3',
  },
  checkoutStory: {
    backgroundColor: '#000000',
    mainTitleText: 'Black de verdade.',
    mainTitlePosition: { x: 0, y: -83 },
    mainTitleFontSize: 26,
    mainTitleFontWeight: 900,
    mainTitleColor: '#ffffff',
    animatedSubtitlePosition: { x: 0, y: 0 },
    animatedSubtitleFontSize: 13,
    animatedSubtitleFontWeight: 600,
    animatedSubtitleColor: '#8a8a8a',
    animatedSubtitlePhrases: [
      'Ofertas que você nunca viu.',
      'Aproveite antes que acabe.',
      'Qualidade e preço imbatível.'
    ],
    showProductImage: true,
    productBlockPosition: { x: 2, y: -83 },
    productImageSize: 80,
    productNameFontSize: 16,
    productNameFontWeight: 400,
    productDetailsFontSize: 11,
    productDetailsFontWeight: 100,
    productPriceFontSize: 22,
    productPriceFontWeight: 800,
    productInfoTextColor: '#ffffff',
    priceColor: '#ffffff',
    logoUrl: 'https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762581268051_iphone-rios-logo.png?alt=media&token=19884066-2faf-4e94-ba4c-b66ddb69b4b3',
    logoSize: 25,
    logoPosition: { x: 0, y: 22 },
    buttonText: 'Comprar Agora',
    buttonPosition: { x: 0, y: -71 },
    buttonPaddingX: 20,
    buttonPaddingY: 5,
    buttonBackgroundColor: '#ffae00',
    buttonTextColor: '#000000',
    buttonBackgroundColorHover: '#e69c00',
    buttonTextColorHover: '#000000',
    buttonFontSize: 16,
    buttonFontWeight: 900,
    buttonGlowAnimationEnabled: true,
    buttonGlowColor: '#ffae00',
    buttonStyleConfig: {
        stylePreset: 'standard',
        primaryColor: '#ffae00',
        secondaryColor: '#e69c00',
        highlightColor: '#ffffff',
        textColor: '#000000'
    },
    contentVerticalPadding: 0,
    contentHorizontalPadding: 0,
    contentGap: 0,
    auroraElements: [
      { color: '#001b70', sizeMobile: 400, sizeDesktop: 500 },
      { color: '#000000', sizeMobile: 400, sizeDesktop: 500 },
      { color: '#000c47', sizeMobile: 400, sizeDesktop: 500 },
      { color: '#000000', sizeMobile: 400, sizeDesktop: 500 },
      { color: '#ffffff', sizeMobile: 160, sizeDesktop: 500 },
      { color: '#181820', sizeMobile: 400, sizeDesktop: 500 },
    ],
  },
  chatWidget: {
    bubbleColor: '#ffae00',
    iconUrl: '',
    positionBottom: 24,
    positionRight: 24,
    size: 56,
    sendSoundUrl: 'https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2FpLW8eweBMcTKfkAxwXtCGF19yJF2%2F1763568690949_comedy_pop_finger_in_mouth_001.mp3?alt=media&token=b6ba4d77-4e31-4c6b-ab33-26fe5becc194',
    receiveSoundUrl: 'https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2FpLW8eweBMcTKfkAxwXtCGF19yJF2%2F1763568707525_y2mate_rQlfs1Y.mp3?alt=media&token=f2de2ea4-1cd4-408d-ad24-8a88bd270d77',
  },
  checkoutStoryAdjustments: {},
  bannerTransitionDuration: 1.2,
  bannerRotationInterval: 5,
  paymentConfig: {
      pixKey: '',
      pixName: ''
  }
};

// This is a default list for initial setup if the Firestore collection is empty.
// Categories are now managed in the Admin Panel.
export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'black_friday', name: '🔥 BLACK FRIDAY' },
    { id: 'iphones_novos', name: 'iPhones Novos' },
    { id: 'seminovos', name: 'Seminovos' },
    { id: 'smartphones', name: 'Xiaomi e Realme' },
    { id: 'acessorios', name: 'Acessórios' },
    { id: 'jbl', name: 'JBL' },
    { id: 'playstation', name: 'PlayStation' },
    { id: 'macbook', name: 'MacBook' },
    { id: 'smartwatch', name: 'Apple Watch' },
    { id: 'tablets', name: 'Tablets' },
    { id: 'assistencia', name: 'Assistência Técnica' },
    { id: 'todos', name: 'Todos' },
];

export const BIO_CAROUSEL_ITEMS: CarouselItem[] = [
    { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-2-Nnb6dhxiHN9ZQMH8.png", alt: "iPhone 17" },
    { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-pro-max-laranja-cosmico-juVtKK3To8n3TPRS.png", alt: "iPhone 17 Pro" },
    { src: "https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762586225585_iPhone17-Air_sky-blue_front-back.png?alt=media&token=385e2c71-de14-49a7-a8f1-ab1e9b996bfd", alt: "iPhone 17 Air" },
    { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-2-Nnb6dhxiHN9ZQMH8.png", alt: "iPhone 17" },
    { src: "https://assets.zyrosite.com/YX4jqgN93jS66PRg/iphone-17-pro-max-laranja-cosmico-juVtKK3To8n3TPRS.png", alt: "iPhone 17 Pro" },
    { src: "https://firebasestorage.googleapis.com/v0/b/iphone-rios-2025-976d2.firebasestorage.app/o/uploads%2Fn089eHcsNMcSEW7fmTeMLALXXFF2%2F1762586225585_iPhone17-Air_sky-blue_front-back.png?alt=media&token=385e2c71-de14-49a7-a8f1-ab1e9b996bfd", alt: "iPhone 17 Air" },
];
