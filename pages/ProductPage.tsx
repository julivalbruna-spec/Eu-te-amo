

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCollectionRef, getDocRef } from '../firebase';
import { Product, SiteInfo, Category, HeroInfo } from '../types';
import { SITE_INFO as defaultSiteInfo } from '../constants';
import { ArrowLeft } from 'react-feather';

import Logo from '../components/Logo';
import AuroraBackground from '../components/AuroraBackground';
import { PaymentSimulator } from '../components/PaymentSimulator';
import Preloader from '../components/Preloader';

const deepMerge = (target: any, source: any): any => {
    // A simple merge utility to combine default and fetched site info
    const output = { ...target };
    if (target && typeof target === 'object' && source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
};

interface ProductPageProps {
    storeId: string;
}

const ProductPage: React.FC<ProductPageProps> = ({ storeId }) => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            setError("ID da loja não especificado.");
            return;
        }

        // Fetch Site Info
        const siteInfoRef = getDocRef('settings', 'siteInfo', storeId);
        const unsubscribeSiteInfo = siteInfoRef.onSnapshot(
            (doc) => {
                if (doc.exists) {
                    const fetchedData = doc.data();
                    const mergedInfo = deepMerge(defaultSiteInfo, fetchedData);
                    setSiteInfo(mergedInfo);
                }
            },
            (err) => console.error("Error fetching site info:", err)
        );

        // Fetch Product and Category
        const fetchProductData = async () => {
            if (!productId) {
                setError("ID do produto não encontrado.");
                setLoading(false);
                return;
            }

            try {
                const productDoc = await getDocRef('products', productId, storeId).get();
                if (!productDoc.exists) {
                    setError("Produto não encontrado.");
                    setLoading(false);
                    return;
                }

                const productData = { id: productDoc.id, ...productDoc.data() } as Product;
                setProduct(productData);
                setSelectedVariantIndex(0);

                if (productData.category) {
                    const categoriesQuery = getCollectionRef('categories', storeId).where('id', '==', productData.category);
                    const categorySnapshot = await categoriesQuery.get();
                    if (!categorySnapshot.empty) {
                        setCategory(categorySnapshot.docs[0].data() as Category);
                    }
                }
            } catch (err) {
                console.error("Error fetching product data:", err);
                setError("Erro ao carregar os dados do produto.");
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();

        return () => unsubscribeSiteInfo();
    }, [productId, storeId]);

    const heroSettings: Partial<HeroInfo> = useMemo(() => {
        return siteInfo.heroes.find(h => h.enabled !== false) || siteInfo.heroes[0] || {};
    }, [siteInfo]);
    
    const hasVariants = product?.variants && product.variants.length > 1;
    const activeVariant = hasVariants ? product.variants![selectedVariantIndex] : null;
    const imageUrl = activeVariant?.imageUrl || product?.image || product?.variants?.[0]?.imageUrl;

    const { storage, remainingDetails } = useMemo(() => {
        const detailsSource = (product?.specifications && Object.keys(product.specifications).length > 0)
            ? Object.entries(product.specifications).map(([key, value]) => `${key}: ${value}`).join('|')
            : product?.details || '';

        if (!detailsSource) return { storage: null, remainingDetails: [] };
        
        const parts = detailsSource.split('|').map(p => p.trim());
        const storageRegex = /\d+\s*(GB|TB)/i;
        let storageInfo: string | null = null;
        const otherDetails: string[] = [];

        parts.forEach(part => {
            if (!storageInfo && storageRegex.test(part)) {
                storageInfo = part;
            } else {
                otherDetails.push(part);
            }
        });
        return { storage: storageInfo, remainingDetails: otherDetails };
    }, [product]);

    if (loading) {
        return <Preloader />;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">{error || "Produto não encontrado."}</h2>
                <Link to="/" className="text-yellow-500 hover:text-yellow-400 font-semibold">
                    Voltar para a Loja
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-yellow-500/50 selection:text-black">
            <AuroraBackground
                elements={heroSettings.auroraElements}
                blurStrength={heroSettings.blurStrength}
                animationDurationMobile={heroSettings.auroraAnimationDurationMobile}
                animationDurationDesktop={heroSettings.auroraAnimationDurationDesktop}
                uniqueId="product-page"
            />
            <header className="fixed top-0 left-0 right-0 z-20 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        Voltar para a Loja
                    </Link>
                    <Logo logoUrl={siteInfo.logos.header || siteInfo.logos.main} className="h-10" />
                </div>
            </header>

            <main className="relative z-10 pt-24 pb-12 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image Column */}
                        <div className="flex items-center justify-center">
                            <div className="w-full max-w-md bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-auto object-contain aspect-square"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/0a0a0a/FFFFFF?text=Imagem+Indisponível'; }}
                                />
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="flex flex-col justify-center">
                            {category && <p className="font-semibold text-yellow-400 mb-1 uppercase tracking-wider text-sm">{category.name}</p>}
                            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{product.name}</h1>
                            {storage && <p className="text-lg text-gray-300 mt-1">{storage}</p>}
                            
                            {hasVariants && (
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-sm font-semibold text-gray-300">Cor:</span>
                                    {product.variants!.map((variant, index) => (
                                        <button
                                            key={index}
                                            title={variant.colorName}
                                            onClick={() => setSelectedVariantIndex(index)}
                                            className={`w-7 h-7 rounded-full border-2 transition-transform duration-200 ${index === selectedVariantIndex ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: variant.colorHex }}
                                            aria-label={`Selecionar cor ${variant.colorName}`}
                                        />
                                    ))}
                                </div>
                            )}

                            {remainingDetails.length > 0 && (
                                <ul className="mt-4 space-y-1 text-gray-400">
                                    {remainingDetails.map((detail, i) => (
                                        <li key={i} className="flex items-center">
                                            <span className="text-yellow-500 mr-2">✓</span> {detail}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            <div className="my-6">
                                <PaymentSimulator product={product} siteInfo={siteInfo} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductPage;
