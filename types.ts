
import firebase from 'firebase/compat/app';

export type CategoryId = string;

export interface Category {
  id: string;
  name: string;
  docId?: string;
  order?: number;
  specTemplates?: string[];
}

export interface ProductVariant {
  colorName: string;
  colorHex: string;
  imageUrl: string;
  imageFile?: File; // Used for UI uploads, not persisted
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  category: string;
  image: string;
  variants?: ProductVariant[];
  details?: string;
  specifications?: { [key: string]: string };
  stock?: number;
  imageClassName?: string;
  currency?: 'BRL' | 'USD' | 'EUR';
}

export interface StoreCartItem {
    product: Product;
    quantity: number;
    selectedVariantIndex: number;
}

export interface PendingSale {
    id: string;
    customerName?: string;
    products: {
        productName: string;
        productId: string;
        quantity: number;
        variantName?: string;
    }[];
    totalValue: number;
    createdAt: any; // Timestamp
    status: 'pending' | 'completed' | 'cancelled';
    origin: 'whatsapp_click';
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  endereco?: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
  };
  dataCadastro?: firebase.firestore.Timestamp;
  totalGasto?: number;
  purchaseCount?: number;
  ultimaCompra?: firebase.firestore.Timestamp;
  tags?: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  active: boolean;
  createdAt?: any;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentDetails: string;
  saleDate: any; // Firestore Timestamp
  tags?: string[];
  installments?: number;
}

export interface ServiceOrder {
  id: string;
  osNumber: number;
  customerId: string;
  customerName: string;
  device: string;
  issueDescription: string;
  status: 'Aguardando avaliação' | 'Em reparo' | 'Aguardando peça' | 'Pronto para retirada' | 'Finalizado' | 'Cancelado';
  price: number;
  notes: string;
  creationDate: any; // Firestore Timestamp
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  createdAt: any;
}

export interface VariableCost {
  id: string;
  name: string;
  amount: number;
  date: any; // Firestore Timestamp
  createdAt: any;
}

export interface Sorteio {
  id: string; // Firestore doc ID
  titulo: string;
  premio: string;
  premioImageUrl?: string;
  tipo: "automatico_por_venda" | "manual_por_cliente";
  dataInicio: any; // Firestore Timestamp
  dataFim: any; // Firestore Timestamp
  status: "ativo" | "finalizado";
  vendaPremiadaNumero?: number;
  vendaPremiadaId?: string;
  clientePremiadoId?: string;
  clientePremiadoNome?: string;
  createdAt: any;
}

export interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    active: boolean;
    usageCount: number;
    createdAt: any;
}

export interface CarouselItem {
  src: string;
  alt: string;
  className?: string;
}

export interface AuroraElement {
  color: string;
  sizeMobile: number;
  sizeDesktop: number;
}

export interface BuyButtonConfig {
    stylePreset: 'standard' | 'shiny' | 'neon' | 'cyber' | 'pulse';
    primaryColor?: string;
    secondaryColor?: string;
    highlightColor?: string;
    textColor?: string;
}

export interface StoreLayoutSettings {
    mobileColumns: 1 | 2;
    productListStyle?: 'grid' | 'horizontal_scroll';
    cardBorderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    cardContentAlign: 'left' | 'center';
    showOriginalPrice: boolean;
    showInstallments: boolean;
    showDiscountBadge: boolean;
    showBuyButton: boolean;
    showAuroraBackground?: boolean;
    auroraBlurStrength?: number;
    auroraElements?: AuroraElement[];
    productModalScale?: number;
    secondaryPriceType?: 'debit' | 'credit' | 'none';
    productTitleFontSize?: number;
    productPriceFontSize?: number;
    secondaryPriceFontSize?: number;
    searchBackgroundColor?: string;
    searchTextColor?: string;
    searchPlaceholderColor?: string;
    categoryTitleColor?: string;
    categoryLinkColor?: string; // New field
    cardBorderStyle?: 'none' | 'modern_clean' | 'glow_hover' | 'glass_prism' | 'cyber_frame' | 'retro_arcade' | 'spin' | 'neon' | 'gradient';
    cardBorderColors?: { primary: string; secondary: string };
    discountBadgeColors?: { background: string; text: string };
    showMarquee?: boolean;
    cartButtonColor?: string;
    cartIconColor?: string;
    cartPositionBottom?: number;
    cartPositionRight?: number;
    cartBadgeBackgroundColor?: string;
    cartBadgeTextColor?: string;
    buyButtonConfig?: BuyButtonConfig; // New button config within layout
}

export interface CheckoutStorySettings {
    backgroundColor?: string;
    
    mainTitleText?: string;
    mainTitlePosition?: { x: number, y: number };
    mainTitleFontSize?: number;
    mainTitleFontWeight?: number;
    mainTitleColor?: string;
    
    animatedSubtitlePosition?: { x: number, y: number };
    animatedSubtitleFontSize?: number;
    animatedSubtitleFontWeight?: number;
    animatedSubtitleColor?: string;
    animatedSubtitlePhrases?: string[];
    
    showProductImage?: boolean;
    productBlockPosition?: { x: number, y: number };
    productImageSize?: number;
    
    // New layout props
    productInnerGap?: number;
    productImageOffsetX?: number;
    productInfoOffsetX?: number;

    productNameFontSize?: number;
    productNameFontWeight?: number;
    productDetailsFontSize?: number;
    productDetailsFontWeight?: number;
    productPriceFontSize?: number;
    productPriceFontWeight?: number;
    productInfoTextColor?: string;
    priceColor?: string;
    
    logoUrl?: string;
    logoSize?: number;
    logoPosition?: { x: number, y: number };
    
    buttonText?: string;
    buttonPosition?: { x: number, y: number };
    buttonPaddingX?: number;
    buttonPaddingY?: number;
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    buttonBackgroundColorHover?: string;
    buttonTextColorHover?: string;
    buttonFontSize?: number;
    buttonFontWeight?: number;
    buttonGlowAnimationEnabled?: boolean;
    buttonGlowColor?: string;
    buttonStyleConfig?: BuyButtonConfig;
    
    contentVerticalPadding?: number;
    contentHorizontalPadding?: number;
    contentGap?: number;
    
    auroraElements?: AuroraElement[];
}

export interface CheckoutStoryAdjustments {
    mainTitlePosition?: { x: number, y: number };
    mainTitleFontSize?: number; // percentage
    animatedSubtitlePosition?: { x: number, y: number };
    animatedSubtitleFontSize?: number; // percentage
    productBlockPosition?: { x: number, y: number };
    productBlockScale?: number; // percentage
    productImageSize?: number; // percentage
    
    // New layout adjustments
    productInnerGap?: number;
    productImageOffsetX?: number;
    productInfoOffsetX?: number;

    productNameFontSize?: number; // percentage
    productDetailsFontSize?: number; // percentage
    productPriceFontSize?: number; // percentage
    logoPosition?: { x: number, y: number };
    logoSize?: number; // percentage
    buttonPosition?: { x: number, y: number };
    buttonPaddingX?: number;
    buttonPaddingY?: number;
    buttonFontSize?: number; // percentage
    contentVerticalPadding?: number;
    contentHorizontalPadding?: number;
    contentGap?: number;
    auroraElements?: { sizeMobile: number; sizeDesktop: number }[]; // Adjustments for each element
}

export interface ChatWidgetSettings {
    bubbleColor?: string;
    iconUrl?: string;
    positionBottom?: number;
    positionRight?: number;
    size?: number;
    headerBackgroundColor?: string;
    headerTextColor?: string;
    backgroundColor?: string;
    userBubbleColor?: string;
    userTextColor?: string;
    botBubbleColor?: string;
    botTextColor?: string;
    inputBackgroundColor?: string;
    inputTextColor?: string;
    sendButtonColor?: string;
    actionButtonBackground?: string;
    actionButtonTextColor?: string;
    actionButtonBorderColor?: string;
    sendSoundUrl?: string;
    receiveSoundUrl?: string;
}

export interface HeroInfo {
  id: string;
  enabled?: boolean;
  backgroundColor?: string;
  typingEffectTarget: 'title' | 'subtitle' | 'none'; // Where the typing effect happens
  
  // Content
  title: string;
  phrases: string[]; // For subtitle typing effect
  buttonPrimary: string;
  buttonSecondary: string;
  buttonPrimaryCategory: CategoryId;
  buttonSecondaryCategory: CategoryId;
  
  // Carousel
  carouselTitle: string;
  carouselItems: CarouselItem[];
  carouselAnimationType?: 'roleta' | 'focus_loop' | 'crossfade' | 'motion_blur' | 'static' | 'parallax_3d' | 'floating' | 'scroll_reveal';
  carouselAnimationDuration?: number; // For roleta mostly
  rotationInterval?: number; // Time between full hero slides if we had multiple heroes
  
  // Styles (Overrides Theme if set)
  titleColor?: string;
  subtitleColor?: string;
  buttonPrimaryBackgroundColor?: string;
  buttonPrimaryTextColor?: string;
  buttonPrimaryBackgroundColorHover?: string;
  buttonPrimaryTextColorHover?: string;
  buttonSecondaryBackgroundColor?: string;
  buttonSecondaryTextColor?: string;
  buttonSecondaryBorderColor?: string;
  buttonSecondaryBackgroundColorHover?: string;
  buttonSecondaryTextColorHover?: string;
  buttonSecondaryBorderColorHover?: string;
  buttonStyleConfig?: BuyButtonConfig;

  // Typography Scale
  titleFontSizeMobile?: number;
  titleFontSizeDesktop?: number;
  subtitleFontSizeMobile?: number;
  subtitleFontSizeDesktop?: number;
  titleLineHeightMobile?: number;
  titleLineHeightDesktop?: number;
  subtitleLineHeightMobile?: number;
  subtitleLineHeightDesktop?: number;

  // Carousel Dimensions
  carouselHeightMobile?: number;
  carouselHeightDesktop?: number;
  carouselImageSizeMobile?: number; // Percentage
  carouselImageSizeDesktop?: number; // Percentage
  carouselItemSpreadMobile?: number; // px spread for roleta
  carouselItemSpreadDesktop?: number;

  // Advanced Animation Settings
  focusLoopInterval?: number;
  focusLoopTransitionDuration?: number;
  crossfadeInterval?: number;
  crossfadeDuration?: number;
  motionBlurInterval?: number;
  motionBlurDuration?: number;
  motionBlurAmount?: number;
  floatingDuration?: number;
  floatingHeight?: number;

  // New Positioning Props
  carouselImageOffsetXMobile?: number;
  carouselImageOffsetYMobile?: number;
  carouselImageOffsetXDesktop?: number;
  carouselImageOffsetYDesktop?: number;
  
  // Layout Props
  paddingTopMobile?: number;
  paddingBottomMobile?: number;
  paddingTopDesktop?: number;
  paddingBottomDesktop?: number;
  buttonsVerticalOffsetMobile?: number;
  buttonsVerticalOffsetDesktop?: number;

  // Background Animation
  auroraElements?: AuroraElement[];
  blurStrength?: number;
  auroraAnimationDurationMobile?: number;
  auroraAnimationDurationDesktop?: number;

  bonusMinutesEnabled: boolean;
}

export interface BannerInfo extends HeroInfo {
    // Extends HeroInfo to reuse carousel logic, but adds specific banner fields
    type: 'image' | 'video' | 'animated_carousel';
    imageUrl: string; // For static image or video poster
    linkUrl?: string;
    buttonText?: string;
    buttonCategory?: CategoryId;
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    
    // Banner specific layout
    animationStyle?: 'simple' | 'focus_zoom_loop'; // Simplified options for banners
    verticalPadding?: number; // rem
    
    // Additional styling
    buttonPaddingXMobile?: number;
    buttonPaddingYMobile?: number;
    buttonPaddingXDesktop?: number;
    buttonPaddingYDesktop?: number;
}

export interface Rates {
  debit: number;
  credit: {
    [key: number]: number;
  };
}

export interface SiteLogos {
    main: string;
    header?: string;
    headerScrolled?: string;
    sidebar?: string;
    login?: string;
    bio?: string;
}

export interface SiteLinks {
    whatsappSales: string;
    whatsappSupport: string;
    instagram: string;
    instagramHandle: string;
    showSupport?: boolean;
}

export interface SeoInfo {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogImage?: string;
    schemaOrg?: object;
}

export interface PaymentConfig {
    pixKey: string;
    pixName: string;
}

export interface SiteInfo {
  storeName: string;
  cnpj?: string;
  logos: SiteLogos;
  faviconUrl?: string;
  streetViewUrl: string;
  address: string;
  hoursWeek: string;
  hoursSaturday: string;
  links: SiteLinks;
  copyrightText: string;
  marqueeTexts: string[];
  heroes: HeroInfo[];
  banners?: BannerInfo[]; // Array of banners
  customTexts: {
      productSearchPlaceholder?: string;
      productSortLabel?: string;
      categorySelectLabel?: string;
      sortOptionLowToHigh?: string;
      sortOptionHighToLow?: string;
      productCardBuy?: string;
      productCardHire?: string;
      productCardConsult?: string;
      productCardDetails?: string;
      productCardHideDetails?: string;
      contactTitle?: string;
      contactSubtitle?: string;
      promoFooterText?: string;
      promoFooterButton?: string;
      promoFooterButtonCategory?: CategoryId;
      aiAssistantName?: string;
      aiAssistantPronoun?: 'sua' | 'seu';
      aiInitialMessage?: string;
      brandVoice?: string;
      
      // Modal Texts
      modalCalculatorTitle?: string;
      modalBtnCash?: string;
      modalBtnInstallments?: string;
      modalBtnWhatsApp?: string;
  };
  theme: ThemeColors;
  storeLayout?: StoreLayoutSettings;
  purchaseModalSettings?: PurchaseModalSettings;
  rates: Rates;
  seo?: SeoInfo;
  checkoutStory?: CheckoutStorySettings;
  checkoutStoryAdjustments?: { [key: string]: CheckoutStoryAdjustments };
  chatWidget?: ChatWidgetSettings;
  
  // Global Animation Settings
  bannerTransitionDuration?: number;
  bannerRotationInterval?: number;
  
  adminTheme?: 'midnight' | 'intelli' | 'crypto';
  
  // Payment
  paymentConfig?: PaymentConfig;
}

export interface ThemeColors {
    background: string;
    surface: string;
    primaryText: string;
    secondaryText: string;
    brand: string;
    border: string;
    
    // Header
    headerBackground: string;
    headerOpacity?: number; // 0-100
    headerTextColor?: string;
    headerScrolledBackground?: string;
    headerScrolledOpacity?: number; // 0-100
    headerScrolledTextColor?: string;

    // Sidebar
    sidebarBackground: string;
    sidebarText: string;

    // Buttons
    buttonPrimaryBackground: string;
    buttonPrimaryText: string;
    buttonPrimaryBackgroundHover?: string;
    buttonPrimaryTextHover?: string;
    buttonPrimaryBorder?: string;
    buttonPrimaryBorderHover?: string;
    buttonPrimaryBorderEnabled?: boolean;

    buttonSecondaryBackground: string;
    buttonSecondaryText: string;
    buttonSecondaryBorder: string;
    buttonSecondaryBackgroundHover: string;
    buttonSecondaryTextHover: string;
    buttonSecondaryBorderHover: string;

    // Cards
    productCardBackground?: string;
    productCardDetailsText?: string;
    productCardDetailsTextHover?: string;
    productCardHoverGlow?: string;
    
    // Footer
    footerBackground: string;
    footerOpacity?: number; // 0-100
    footerText: string;
    footerButtonBackground: string;
    footerButtonText: string;
    footerButtonBackgroundHover?: string;
    footerButtonTextHover?: string;
    footerButtonAnimation?: 'none' | 'pulse' | 'bounce' | 'scale' | 'shine';
    
    // Marquee
    marqueeBackground?: string;
    marqueeText?: string;
    
    // Contact Section
    contactSectionBackground?: string;
    contactSectionText?: string;
    contactCardsBackground?: string;
    contactCardsBorder?: string;
    contactIconsColor?: string;
    
    // Cart
    cartBackground?: string;
    cartTextColor?: string;
    cartBorderColor?: string;
    cartHeaderBackground?: string;
    cartHeaderTextColor?: string;
    cartCheckoutButtonBackground?: string;
    cartCheckoutButtonText?: string;

    // Add To Cart Button
    addToCartButtonBackground?: string;
    addToCartButtonText?: string;
    addToCartButtonBorder?: string;
    addToCartButtonHoverBackground?: string;
    addToCartButtonHoverText?: string;
    addToCartButtonHoverBorder?: string;
    
    // Modal
    modalBackground?: string;
}

export interface PurchaseModalSettings {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    buttonBorderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    imageBackgroundColor?: string;
    buttonStyle?: BuyButtonConfig; // New styling for modal buttons
    
    // Input Fields
    inputBackgroundColor?: string;
    inputTextColor?: string;
    inputBorderColor?: string;
    
    // Optional Elements
    showCouponField?: boolean;
    
    // Specific Button Colors Override
    customButtonColors?: {
        cashBackground?: string;
        cashText?: string;
        installmentsBackground?: string;
        installmentsText?: string;
        whatsappBackground?: string;
        whatsappText?: string;
        toggleButtonBackground?: string;
        toggleButtonText?: string;
        toggleButtonActiveBackground?: string;
        toggleButtonActiveText?: string;
        toggleButtonBorder?: string;
    };
}

export interface ThemePreset {
    id: string;
    name: string;
    previewColor: string;
    colors: Partial<ThemeColors>;
}

export interface Action {
    name: string;
    args: any;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    actions?: Action[];
    actionsUsed?: boolean;
    createdAt?: any;
}

export interface KB_Item {
    docId?: string; // Optional because we might create new ones without ID initially
    titulo: string;
    categoria: 'geral' | 'produto' | 'campanha' | 'politica' | 'tutorial';
    conteudo: string; // Markdown supported
    slugRelacionado?: string; // Ex: 'iphone-15-pro' para linkar produtos
    atualizadoEm?: any;
}

export interface FAQ_Oficial {
    docId?: string;
    pergunta: string;
    resposta: string;
    tags: string[];
    origem: 'manual' | 'sugerido_aprovado';
    atualizadoEm?: any;
}

export interface FAQ_Sugestao {
    docId?: string;
    perguntaRealDoCliente: string;
    respostaSugeridaIA: string;
    frequencia: number;
    status: 'pendente' | 'aprovada' | 'rejeitada';
    createdAt: any;
}

export interface ChatbotConfig {
    id: string;
    systemPrompt: string;
    lastAutoGenerated?: any;
    generationMode?: 'generate' | 'update' | 'improve';
    modelUsed?: string;
    upsellMatrix?: UpsellMatrixItem[];
}

export interface ChatbotLearning {
    id: string;
    type: 'KNOWLEDGE_GAP' | 'TONE_IMPROVEMENT' | 'SALES_OPPORTUNITY';
    description: string;
    correctionPayload: any; // { kbItem: ... } or { faqItem: ... } or { configUpdate: ... }
    sourceConversationId: string;
    status: 'pending' | 'applied' | 'ignored' | 'reverted';
    appliedAt?: any;
    createdDocId?: string; // ID of the created KB or FAQ item
    revertedAt?: any;
}

export interface UpsellMatrixItem {
    triggerProductKeyword: string;
    suggestedProductIds: string[];
    reason: string;
}

export interface ChatbotVersion {
    id: string;
    configId: string;
    systemPrompt: string;
    createdAt: any;
    author: string; // 'AI Architect' or 'User'
    changeNote?: string;
}

export interface Store {
    id: string; // e.g., 'iphonerios', 'loja-do-joao'
    name: string;
    admins: string[]; // List of user emails with access
    createdAt: any;
    status: 'active' | 'blocked';
    customDomain?: string;
}

export interface DomainMapping {
    domain: string;
    storeId: string;
}
