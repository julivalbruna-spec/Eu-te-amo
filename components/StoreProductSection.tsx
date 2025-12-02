
import React, { useState, useEffect } from 'react';
import { Product, Category, CategoryId, SiteInfo } from '../types';
import StoreProductCard from './StoreProductCard';
import StorePurchaseModal from './StorePurchaseModal';
import ProductDetailsModal from './ProductDetailsModal';
import { Search, X, ArrowRight, ChevronRight } from 'react-feather';
import Skeleton from './Skeleton';

interface ProductSectionProps {
    siteInfo: SiteInfo;
    allProducts: Product[];
    categories: Category[];
    activeTab: CategoryId;
    handleCategorySelect: (id: CategoryId) => void;
    sortOrder: string;
    setSortOrder: (order: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    productsLoading: boolean;
    filteredAndSortedProducts: Product[];
    specFilters: { [key: string]: string };
    setSpecFilters: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    onAddToCart: (product: Product, variantIndex: number) => void;
    onBuyClick: (product: Product) => void;
}

const StoreProductSection: React.FC<ProductSectionProps> = ({
    siteInfo,
    allProducts,
    categories,
    activeTab,
    handleCategorySelect,
    sortOrder,
    setSortOrder,
    searchTerm,
    setSearchTerm,
    productsLoading,
    filteredAndSortedProducts,
    specFilters,
    setSpecFilters,
    onAddToCart,
    onBuyClick
}) => {
    const [purchaseModalProduct, setPurchaseModalProduct] = useState<Product | null>(null);
    const [detailsModalProduct, setDetailsModalProduct] = useState<Product | null>(null);
    const [availableFilters, setAvailableFilters] = useState<{ specKey: string; options: string[] }[]>([]);

     useEffect(() => {
        if (activeTab === 'todos') {
            setAvailableFilters([]);
            return;
        }

        const category = categories.find(c => c.id === activeTab);
        const templates = category?.specTemplates;

        if (templates && templates.length > 0) {
            const productsInCategory = allProducts.filter(p => p.category === activeTab);
            
            const newFilters = templates.map(specKey => {
                const options = new Set<string>();
                productsInCategory.forEach(p => {
                    if (p.specifications && p.specifications[specKey]) {
                        options.add(p.specifications[specKey]);
                    }
                });
                return { specKey, options: Array.from(options).sort() };
            }).filter(f => f.options.length > 1);

            setAvailableFilters(newFilters);
        } else {
            setAvailableFilters([]);
        }
    }, [activeTab, categories, allProducts]);

    const mobileCols = siteInfo.storeLayout?.mobileColumns === 2 ? 'grid-cols-2' : 'grid-cols-1';
    
    const inputStyle = {
        backgroundColor: siteInfo.storeLayout?.searchBackgroundColor || 'var(--surface)',
        borderColor: siteInfo.storeLayout?.searchBackgroundColor ? 'transparent' : 'var(--border-color)',
    };

    const categoryTitleColor = siteInfo.storeLayout?.categoryTitleColor || 'var(--primary-text)';
    const categoryLinkColor = siteInfo.storeLayout?.categoryLinkColor || 'var(--brand-yellow)';
    
    // Check for Horizontal Scroll Mode (Netflix Style)
    const isHorizontalScroll = siteInfo.storeLayout?.productListStyle === 'horizontal_scroll';

    return (
        <>
            <section id="produtos" className="py-16 md:py-24 px-4 bg-transparent" style={{ position: 'relative', zIndex: 2 }}>
                <div className="container mx-auto max-w-7xl">
                    
                    {/* Filter Controls */}
                     <div className="flex flex-col gap-4 mb-8 md:mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div>
                                <select
                                    id="category-select"
                                    value={activeTab}
                                    onChange={(e) => handleCategorySelect(e.target.value as CategoryId)}
                                    className="custom-search-select w-full rounded-lg p-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--brand-yellow)] border"
                                    style={inputStyle}
                                    aria-label={siteInfo.customTexts.categorySelectLabel || "Selecione a categoria"}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <select 
                                    id="sort" 
                                    value={sortOrder} 
                                    onChange={e => setSortOrder(e.target.value)} 
                                    className="custom-search-select w-full rounded-lg p-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--brand-yellow)] border" 
                                    style={inputStyle}
                                    aria-label={siteInfo.customTexts.productSortLabel}
                                >
                                    <option value="menor-maior">{siteInfo.customTexts.sortOptionLowToHigh || "Menor Preço"}</option>
                                    <option value="maior-menor">{siteInfo.customTexts.sortOptionHighToLow || "Maior Preço"}</option>
                                </select>
                            </div>

                            <div className="relative md:col-span-1">
                                <input
                                    type="text"
                                    placeholder={siteInfo.customTexts.productSearchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="custom-search-input w-full rounded-lg py-2.5 !pl-12 !pr-12 text-base focus:outline-none focus:ring-1 focus:ring-[var(--brand-yellow)] border"
                                    style={inputStyle}
                                />
                                <Search size={18} className="custom-search-icon absolute left-3 top-1/2 -translate-y-1/2" />
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="custom-search-icon absolute right-3 top-1/2 -translate-y-1/2 hover:text-[var(--primary-text)]"><X size={18} /></button>}
                            </div>
                        </div>
                        {availableFilters.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-color)]">
                                {availableFilters.map(({ specKey, options }) => (
                                    <div key={specKey}>
                                        <select
                                            value={specFilters[specKey] || ''}
                                            onChange={(e) => setSpecFilters(prev => ({...prev, [specKey]: e.target.value}))}
                                            className="custom-search-select w-full rounded-lg p-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--brand-yellow)] capitalize border"
                                            style={inputStyle}
                                            aria-label={`Filtrar por ${specKey}`}
                                        >
                                            <option value="">{`Todos ${specKey}`}</option>
                                            {options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Product Listing by Category */}
                    <div className="space-y-16">
                        {productsLoading ? (
                            <div className={`grid ${mobileCols} md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-[var(--surface)] border border-[var(--border-color)] rounded-lg p-3 h-[400px] flex flex-col">
                                        <Skeleton className="w-full h-64 rounded-md mb-4" />
                                        <div className="space-y-3 p-2">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-10 w-full mt-4 rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredAndSortedProducts.length > 0 ? (
                            categories.map(category => {
                                // Ignora categoria 'todos' ou 'black_friday' na iteração principal para evitar duplicação visual se o usuário estiver vendo "tudo"
                                // Se o usuário filtrou explicitamente por "black_friday", o array filteredAndSortedProducts já cuida disso
                                if (category.id === 'todos') return null;

                                // Filtra os produtos que pertencem a esta categoria
                                const categoryProducts = filteredAndSortedProducts.filter(p => p.category === category.id);

                                if (categoryProducts.length === 0) return null;

                                return (
                                    <div key={category.id} className="category-section">
                                        {/* Header da Categoria */}
                                        <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-4">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl md:text-3xl font-bold" style={{ color: categoryTitleColor }}>
                                                    {category.name}
                                                </h2>
                                                <span className="text-sm font-medium text-[var(--secondary-text)] bg-[var(--surface)] px-2 py-1 rounded-full border border-[var(--border-color)]">
                                                    {categoryProducts.length}
                                                </span>
                                            </div>
                                            
                                            {/* Botão Ver Todos */}
                                            {isHorizontalScroll && categoryProducts.length > 2 && (
                                                <button 
                                                    onClick={() => handleCategorySelect(category.id)}
                                                    className="flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity group"
                                                    style={{ color: categoryLinkColor }}
                                                >
                                                    Ver todos <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                        
                                        {isHorizontalScroll ? (
                                            /* Horizontal Scrolling Layout (Netflix Style) */
                                            <div className="relative group/scroll">
                                                {/* Added py-6 (padding-y) to create vertical space for hover scaling without clipping */}
                                                <div className="flex gap-4 overflow-x-auto py-6 snap-x snap-mandatory scroll-smooth no-scrollbar relative z-10 pr-12">
                                                    {categoryProducts.map((product) => (
                                                        <div key={product.id} className="snap-start flex-shrink-0 w-[70vw] sm:w-[40vw] md:w-[260px] lg:w-[280px] xl:w-[300px]">
                                                            <StoreProductCard 
                                                                product={product} 
                                                                siteInfo={siteInfo} 
                                                                onBuyClick={setPurchaseModalProduct}
                                                                onDetailsClick={setDetailsModalProduct} 
                                                                onAddToCart={onAddToCart}
                                                            />
                                                        </div>
                                                    ))}
                                                    
                                                    {/* "See More" Card at the end of scroll */}
                                                    <div className="snap-start flex-shrink-0 w-[150px] flex items-center justify-center">
                                                        <button 
                                                            onClick={() => handleCategorySelect(category.id)}
                                                            className="flex flex-col items-center justify-center gap-2 text-[var(--secondary-text)] hover:opacity-100 transition-opacity group"
                                                            style={{ color: categoryLinkColor }}
                                                        >
                                                            <div className="w-12 h-12 rounded-full border-2 border-[var(--border-color)] group-hover:border-current flex items-center justify-center transition-colors">
                                                                <ArrowRight size={24} />
                                                            </div>
                                                            <span className="text-sm font-bold">Ver todos</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Gradient Fade & Arrow Hint - Improved to use var(--background) correctly */}
                                                <div 
                                                    className="absolute right-0 top-0 bottom-0 w-24 md:w-32 pointer-events-none z-20 flex items-center justify-end pr-2 md:pr-4"
                                                    style={{ background: 'linear-gradient(to left, var(--background) 10%, transparent)' }}
                                                >
                                                    <ChevronRight size={32} className="text-[var(--primary-text)] opacity-50 animate-pulse hidden md:block" />
                                                </div>
                                            </div>
                                        ) : (
                                            /* Standard Grid Layout */
                                            <div className={`grid ${mobileCols} md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`}>
                                                {categoryProducts.map((product) => (
                                                    <StoreProductCard 
                                                        key={product.id} 
                                                        product={product} 
                                                        siteInfo={siteInfo} 
                                                        onBuyClick={setPurchaseModalProduct}
                                                        onDetailsClick={setDetailsModalProduct}
                                                        onAddToCart={onAddToCart} 
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-16">
                                <p className="text-xl font-semibold text-[var(--secondary-text)]">Nenhum produto encontrado</p>
                                <p className="text--[var(--secondary-text)] mt-2">Tente ajustar sua busca ou filtro de categoria.</p>
                            </div>
                        )}
                        
                        {/* Fallback para produtos sem categoria definida ou em categorias deletadas */}
                        {!productsLoading && filteredAndSortedProducts.length > 0 && filteredAndSortedProducts.some(p => !categories.find(c => c.id === p.category)) && (
                             <div className="category-section">
                                <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
                                    <h2 className="text-2xl md:text-3xl font-bold" style={{ color: categoryTitleColor }}>
                                        Outros
                                    </h2>
                                </div>
                                <div className={`grid ${mobileCols} md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`}>
                                    {filteredAndSortedProducts.filter(p => !categories.find(c => c.id === p.category)).map((product) => (
                                        <StoreProductCard 
                                            key={product.id} 
                                            product={product} 
                                            siteInfo={siteInfo} 
                                            onBuyClick={setPurchaseModalProduct}
                                            onDetailsClick={setDetailsModalProduct}
                                            onAddToCart={onAddToCart} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            <StorePurchaseModal 
                isOpen={!!purchaseModalProduct}
                onClose={() => setPurchaseModalProduct(null)}
                product={purchaseModalProduct}
                siteInfo={siteInfo}
            />
            <ProductDetailsModal
                isOpen={!!detailsModalProduct}
                onClose={() => setDetailsModalProduct(null)}
                product={detailsModalProduct}
                siteInfo={siteInfo}
                onBuyClick={(product) => {
                    setDetailsModalProduct(null);
                    setTimeout(() => setPurchaseModalProduct(product), 200);
                }}
            />
        </>
    );
};

export default StoreProductSection;
