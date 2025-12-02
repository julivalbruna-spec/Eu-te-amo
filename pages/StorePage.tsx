
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCollectionRef, getDocRef } from '../firebase';
import { SITE_INFO as defaultSiteInfo } from '../constants';
import { Product, Category, CategoryId, SiteInfo, StoreCartItem } from '../types';

import StoreHeader from '../components/StoreHeader';
import StoreSidebar from '../components/StoreSidebar';
import StoreHero from '../components/StoreHero';
import StoreBannerSection from '../components/StoreBannerSection';
import StoreMarquee from '../components/StoreMarquee';
import StoreProductSection from '../components/StoreProductSection';
import StoreContactSection from '../components/StoreContactSection';
import StoreFooter from '../components/StoreFooter';
import SiteFooter from '../components/SiteFooter'; 
import Preloader from '../components/Preloader';
import ChatWidget from '../components/ChatWidget';
import AuroraBackground from '../components/AuroraBackground';
import StoreCartDrawer from '../components/StoreCartDrawer';
import StorePurchaseModal from '../components/StorePurchaseModal';
import { ShoppingBag } from 'react-feather';


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


// --- MAIN PAGE COMPONENT ---
interface StorePageProps {
    storeId: string;
}

const StorePage: React.FC<StorePageProps> = ({ storeId }) => {
    const [pageLoading, setPageLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<CategoryId>('todos');
    const [sortOrder, setSortOrder] = useState('menor-maior');
    const [searchTerm, setSearchTerm] = useState('');
    const [specFilters, setSpecFilters] = useState<{ [key: string]: string }>({});
    
    // CART STATE
    const [cart, setCart] = useState<StoreCartItem[]>(() => {
        try {
            const saved = localStorage.getItem(`public_cart_${storeId}`);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    
    // StorePurchaseModal props state
    const [purchaseModalProduct, setPurchaseModalProduct] = useState<Product | null>(null);

    // Persist Cart
    useEffect(() => {
        localStorage.setItem(`public_cart_${storeId}`, JSON.stringify(cart));
    }, [cart, storeId]);

    const addToCart = (product: Product, variantIndex: number) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.product.id === product.id && item.selectedVariantIndex === variantIndex);
            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex].quantity += 1;
                return newCart;
            }
            return [...prev, { product, quantity: 1, selectedVariantIndex: variantIndex }];
        });
        setIsCartOpen(true);
    };

    const updateCartQuantity = (productId: string, variantIndex: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId && item.selectedVariantIndex === variantIndex) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string, variantIndex: number) => {
        setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedVariantIndex === variantIndex)));
    };
    
    const handleBuyClick = (product: Product) => {
        setPurchaseModalProduct(product);
        setIsCheckoutModalOpen(true);
    };


    useEffect(() => {
        if (isSidebarOpen || isCartOpen) {
            document.body.style.overflowY = 'hidden';
        } else {
            document.body.style.overflowY = 'auto';
        }
        return () => {
            document.body.style.overflowY = 'auto';
        };
    }, [isSidebarOpen, isCartOpen]);

    useEffect(() => {
        if (!storeId) {
            setPageLoading(false);
            return;
        }
    
        try {
            const storedInfo = localStorage.getItem(`siteInfo_${storeId}`);
            if (storedInfo) {
                setSiteInfo(JSON.parse(storedInfo));
            }
        } catch (error) {
            console.error("Failed to parse site info from localStorage", error);
        }

        const siteInfoDoc = getDocRef('settings', 'siteInfo', storeId);
        const unsubscribeSiteInfo = siteInfoDoc.onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const newInfo = deepMerge(defaultSiteInfo, docSnap.data());
                setSiteInfo(newInfo);
                localStorage.setItem(`siteInfo_${storeId}`, JSON.stringify(newInfo));
            }
        });

        const productsCollection = getCollectionRef('products', storeId).orderBy('name');
        const unsubscribeProducts = productsCollection.onSnapshot((snapshot) => {
            const productsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];
            setAllProducts(productsList);
            setProductsLoading(false);
        }, (error) => {
            console.error("Error fetching products: ", error);
            setProductsLoading(false);
        });

        const categoriesQuery = getCollectionRef('categories', storeId).orderBy('order');
        const unsubscribeCategories = categoriesQuery.onSnapshot((snapshot) => {
            const cats = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Category));
            setCategories(cats);
        });

        const timer = setTimeout(() => {
            setPageLoading(false);
            const preloader = document.getElementById('preloader');
            if (preloader) preloader.classList.add('hidden');
        }, 1500);

        return () => {
            clearTimeout(timer);
            unsubscribeCategories();
            unsubscribeSiteInfo();
            unsubscribeProducts();
        };
    }, [storeId]);

    // Lista de categorias para o Dropdown (Filtro na página)
    const dropdownCategories = useMemo(() => {
        return [
            { id: 'todos', name: siteInfo.customTexts.categorySelectLabel || 'Selecione a categoria' },
            ...categories
        ];
    }, [categories, siteInfo.customTexts.categorySelectLabel]);

    // Lista de categorias para o Menu Lateral (Sidebar)
    const sidebarCategories = useMemo(() => {
        return [
            { id: 'todos', name: 'Todos' }, // Nome explícito para o menu
            ...categories
        ];
    }, [categories]);

    const filteredAndSortedProducts = useMemo(() => {
        let filteredProducts = allProducts;

        if (searchTerm.trim()) {
            filteredProducts = filteredProducts.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (activeTab !== 'todos') {
            if (activeTab === 'black_friday') {
                filteredProducts = filteredProducts.filter(p => p.originalPrice && Number(p.originalPrice) > Number(p.price));
            } else {
                filteredProducts = filteredProducts.filter(p => p.category === activeTab);
            }
        }

        // New filtering for specifications
        if (Object.keys(specFilters).length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                return Object.entries(specFilters).every(([key, value]) => {
                    if (!value) return true; // Ignore if "All" is selected
                    return product.specifications && product.specifications[key] === value;
                });
            });
        }


        const categoryOrderMap = new Map(categories.map(c => {
            const orderNum = Number(c.order);
            return [c.id, isNaN(orderNum) ? 999 : orderNum];
        }));
        
        return [...filteredProducts].sort((a, b) => {
            if (activeTab === 'todos') {
                const orderA = categoryOrderMap.get(a.category) ?? 999;
                const orderB = categoryOrderMap.get(b.category) ?? 999;
                if (orderA !== orderB) {
                    return Number(orderA) - Number(orderB);
                }
            }
            
            const priceA = Number(a.price) || 0;
            const priceB = Number(b.price) || 0;

            if (sortOrder === 'menor-maior') {
                return priceA - priceB;
            } else {
                return priceB - priceA;
            }
        });
    }, [activeTab, sortOrder, searchTerm, allProducts, categories, specFilters]);

    const handleCategorySelect = (id: CategoryId) => {
        setActiveTab(id);
        setSpecFilters({});
        setIsSidebarOpen(false);
        const productsSection = document.getElementById('produtos');
        if (productsSection) {
            setTimeout(() => {
                 productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };
    
    const handleCategoryLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, categoryId: CategoryId) => {
        e.preventDefault();
        const targetCategory = categoryId || 'todos'; 
        setActiveTab(targetCategory);
        setSpecFilters({});
        
        const productsSection = document.getElementById('produtos');
        if (productsSection) {
            setTimeout(() => {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, []);

    const cartTotalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

    if (pageLoading) {
        return <Preloader />;
    }

    // Determine aurora elements (fallback if missing in storeLayout)
    const auroraElements = siteInfo.storeLayout?.auroraElements || [
        { color: siteInfo.theme.brand, sizeMobile: 600, sizeDesktop: 900 },
        { color: siteInfo.theme.surface, sizeMobile: 500, sizeDesktop: 800 },
        { color: '#000000', sizeMobile: 400, sizeDesktop: 600 }
    ];

    // Cart Button Styles (Only used if cart is NOT open, as the panel replaces it)
    const cartBtnStyle = {
        backgroundColor: siteInfo.storeLayout?.cartButtonColor || siteInfo.theme.brand,
        color: siteInfo.storeLayout?.cartIconColor || siteInfo.theme.buttonPrimaryText,
        bottom: `${siteInfo.storeLayout?.cartPositionBottom || 96}px`, // Default ~96px to be above Chatbot
        right: `${siteInfo.storeLayout?.cartPositionRight || 24}px`
    };

    return (
        <div className="w-full relative z-10 bg-black selection:bg-yellow-500/50 selection:text-black" style={{ backgroundColor: 'var(--background)'}}>
            {siteInfo.storeLayout?.showAuroraBackground && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <AuroraBackground 
                        elements={auroraElements}
                        blurStrength={siteInfo.storeLayout?.auroraBlurStrength || 150}
                        uniqueId="store-global-bg"
                    />
                </div>
            )}
            
            <div className="relative z-10">
                <StoreHeader onToggleSidebar={() => setIsSidebarOpen(true)} siteInfo={siteInfo} />
                <StoreSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onCategorySelect={handleCategorySelect} categories={sidebarCategories} siteInfo={siteInfo}/>
                
                <StoreCartDrawer 
                    isOpen={isCartOpen} 
                    onClose={() => setIsCartOpen(false)} 
                    cart={cart} 
                    onUpdateQuantity={updateCartQuantity}
                    onRemoveItem={removeFromCart}
                    onCheckout={() => {
                        setIsCartOpen(false);
                        setPurchaseModalProduct(null); // Clear specific product
                        setIsCheckoutModalOpen(true);
                    }}
                    siteInfo={siteInfo}
                />
                
                <StorePurchaseModal 
                    isOpen={isCheckoutModalOpen}
                    onClose={() => { setIsCheckoutModalOpen(false); setPurchaseModalProduct(null); }}
                    cart={!purchaseModalProduct ? cart : undefined} // If specific product selected, don't send whole cart
                    product={purchaseModalProduct}
                    siteInfo={siteInfo}
                    storeId={storeId}
                />

                {/* Floating Cart Button (Hidden when cart is open to avoid overlap) */}
                {cartTotalItems > 0 && !isCartOpen && (
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="fixed z-[60] p-3 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center animate-bounce"
                        style={cartBtnStyle}
                    >
                        <ShoppingBag size={24} />
                        <span className="absolute -top-2 -right-2 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-black" style={{ backgroundColor: siteInfo.storeLayout?.cartBadgeBackgroundColor || '#dc2626', color: siteInfo.storeLayout?.cartBadgeTextColor || '#ffffff' }}>
                            {cartTotalItems}
                        </span>
                    </button>
                )}

                <main className="pb-28">
                    <StoreHero 
                        heroes={siteInfo.heroes}
                        onCategoryLinkClick={handleCategoryLinkClick} 
                    />
                    <StoreBannerSection banners={siteInfo.banners} onCategoryLinkClick={handleCategoryLinkClick} rotationInterval={siteInfo.bannerRotationInterval} />
                    
                    {/* Marquee Section - Controlled by storeLayout.showMarquee */}
                    {siteInfo.storeLayout?.showMarquee !== false && (
                        <StoreMarquee texts={siteInfo.marqueeTexts} theme={siteInfo.theme} />
                    )}

                    <StoreProductSection
                        siteInfo={siteInfo}
                        allProducts={allProducts}
                        categories={dropdownCategories}
                        activeTab={activeTab}
                        handleCategorySelect={handleCategorySelect}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        productsLoading={productsLoading}
                        filteredAndSortedProducts={filteredAndSortedProducts}
                        specFilters={specFilters}
                        setSpecFilters={setSpecFilters}
                        onAddToCart={addToCart}
                        onBuyClick={handleBuyClick}
                    />
                    <StoreContactSection siteInfo={siteInfo} />
                    <SiteFooter siteInfo={siteInfo} />
                    <StoreFooter onVerProdutosClick={(e) => handleCategoryLinkClick(e, siteInfo.customTexts.promoFooterButtonCategory)} siteInfo={siteInfo} />
                </main>
                <ChatWidget 
                    storeId={storeId} 
                    siteInfo={siteInfo} 
                    allProducts={allProducts} 
                    categories={dropdownCategories} 
                    onCategorySelect={handleCategorySelect}
                    isCartOpen={isCartOpen}
                />
            </div>
        </div>
    );
};

export default StorePage;
