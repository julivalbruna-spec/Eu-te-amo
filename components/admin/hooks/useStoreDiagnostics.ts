
import { useMemo } from 'react';
import { Product, Category, SiteInfo } from '../../../types';

export interface StoreDiagnostics {
  productsWithoutImage: { count: number; items: Product[] };
  productsWithoutDetails: { count: number; items: Product[] };
  emptyCategories: { count: number; items: Category[] };
  uncategorizedProducts: { count: number; items: Product[] };
  seoHealth: { score: number; issues: string[] };
  // FIX: Added `isSeoConfigured` to the StoreDiagnostics interface to resolve a type error.
  isSeoConfigured: boolean;
  heroContrastWarning: { hasWarning: boolean; message: string };
  overallHealthScore: number;
  productsWithoutCostPrice: { count: number; items: Product[] };
}

export const useStoreDiagnostics = (
    allProducts: Product[],
    categories: Category[],
    siteInfo: SiteInfo
): StoreDiagnostics => {

    const diagnostics = useMemo<StoreDiagnostics>(() => {
        const productCount = allProducts.length;
        const categoryIds = new Set(categories.map(c => c.id));

        // 1. Products without image
        // FIX: Updated logic to check for an image in both the top-level `image` property and the nested `variants` array.
        const productsWithoutImageItems = allProducts.filter(p => !p.image && (!p.variants || p.variants.length === 0 || !p.variants[0].imageUrl));
        const productsWithoutImage = {
            count: productsWithoutImageItems.length,
            items: productsWithoutImageItems,
        };

        // 2. Products without details
        // UPDATE: Simplified check. Any non-empty string in details OR any key in specifications is considered valid.
        const productsWithoutDetailsItems = allProducts.filter(p => {
            const hasLegacyDetails = p.details && p.details.trim().length > 0;
            const hasSpecs = p.specifications && Object.keys(p.specifications).length > 0;
            return !hasLegacyDetails && !hasSpecs;
        });
        
        const productsWithoutDetails = {
            count: productsWithoutDetailsItems.length,
            items: productsWithoutDetailsItems,
        };

        // 3. Empty Categories
        const productCategoryIds = new Set(allProducts.map(p => p.category));
        const emptyCategoriesItems = categories.filter(cat => 
            cat.id !== 'todos' && cat.id !== 'black_friday' && !productCategoryIds.has(cat.id)
        );
        const emptyCategories = {
            count: emptyCategoriesItems.length,
            items: emptyCategoriesItems,
        };

        // 4. Uncategorized Products
        const uncategorizedProductsItems = allProducts.filter(p => !categoryIds.has(p.category));
        const uncategorizedProducts = {
            count: uncategorizedProductsItems.length,
            items: uncategorizedProductsItems,
        };

        // 5. SEO Health
        const seo = siteInfo.seo;
        const isSeoConfigured = !!(seo.metaTitle && seo.metaDescription);
        let seoScore = 0;
        const seoIssues: string[] = [];
        if (seo.metaTitle && seo.metaTitle.length > 15 && seo.metaTitle.length < 60) {
            seoScore += 40;
        } else {
            seoIssues.push('O Meta Título deve ter entre 15 e 60 caracteres.');
        }
        if (seo.metaDescription && seo.metaDescription.length > 70 && seo.metaDescription.length < 160) {
            seoScore += 40;
        } else {
            seoIssues.push('A Meta Descrição deve ter entre 70 e 160 caracteres.');
        }
        if (seo.metaKeywords && seo.metaKeywords.split(',').filter(k => k.trim()).length >= 3) {
            seoScore += 20;
        } else {
            seoIssues.push('Adicione pelo menos 3 palavras-chave.');
        }
        const seoHealth = { score: seoScore, issues: seoIssues };

        // 6. Hero Contrast Warning
        const activeHero = siteInfo.heroes.find(h => h.enabled !== false) || siteInfo.heroes[0];
        let heroContrastWarning = { hasWarning: false, message: '' };
        if (activeHero) {
            const isTitleDefault = !activeHero.titleColor || activeHero.titleColor.toUpperCase() === '#FFFFFF';
            const isSubtitleDefault = !activeHero.subtitleColor || activeHero.subtitleColor.toUpperCase() === '#A1A1AA';
            if (isTitleDefault || isSubtitleDefault) {
                heroContrastWarning = {
                    hasWarning: true,
                    message: 'As cores do título ou subtítulo no Hero principal não foram personalizadas, o que pode causar problemas de contraste com o fundo.',
                };
            }
        }

        // 7. Products without Cost Price
        const productsWithoutCostPriceItems = allProducts.filter(p => !p.costPrice || p.costPrice === 0);
        const productsWithoutCostPrice = {
            count: productsWithoutCostPriceItems.length,
            items: productsWithoutCostPriceItems,
        };
        
        // 8. Overall Health Score
        const imageHealth = productCount > 0 ? 1 - (productsWithoutImage.count / productCount) : 1;
        const detailsHealth = productCount > 0 ? 1 - (productsWithoutDetails.count / productCount) : 1;
        const categorizationHealth = productCount > 0 ? 1 - (uncategorizedProducts.count / productCount) : 1;
        const costHealth = productCount > 0 ? 1 - (productsWithoutCostPrice.count / productCount) : 1;
        const seoHealthScore = seoHealth.score / 100;
        const overallHealthScore = Math.round(((imageHealth + detailsHealth + categorizationHealth + seoHealthScore + costHealth) / 5) * 100);

        return {
            productsWithoutImage,
            productsWithoutDetails,
            emptyCategories,
            uncategorizedProducts,
            seoHealth,
            isSeoConfigured,
            heroContrastWarning,
            overallHealthScore,
            productsWithoutCostPrice
        };

    }, [allProducts, categories, siteInfo]);
    
    return diagnostics;
};
