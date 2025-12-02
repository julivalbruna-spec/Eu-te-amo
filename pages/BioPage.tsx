

import React, { useEffect, useState } from 'react';
import { useTypingEffect } from '../hooks/useTypingEffect';
import { BIO_CAROUSEL_ITEMS, SITE_INFO as defaultSiteInfo } from '../constants';
import { SiteInfo } from '../types';
import { getDocRef } from '../firebase';
// FIX: Removed v9 firestore imports to use v8 compatible syntax.
// import { doc, onSnapshot } from 'firebase/firestore';
import { Phone, Smartphone, Instagram } from 'react-feather';
import Logo from '../components/Logo';

// --- UTILITY FUNCTIONS ---
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
        // If source has null/undefined, do nothing and keep the target's value.
        return;
      }
      
      if (Array.isArray(targetValue)) {
        // If the target value is an array, we'll only accept an array from the source.
        if (Array.isArray(sourceValue)) {
          output[key] = sourceValue;
        }
        // If sourceValue is not an array, we do nothing, preserving the target's array.
      } else if (isObject(targetValue) && isObject(sourceValue)) {
        // If both are objects (and not arrays), we recurse.
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        // For all other types (string, number, boolean), we just assign the source value.
        output[key] = sourceValue;
      }
    });
  }

  return output;
};


// --- SUB-COMPONENTS ---

const ProductCarouselBio: React.FC = () => {
    useEffect(() => {
        const roletaItems = document.querySelectorAll('.roleta-item-bio');
        const numItems = roletaItems.length;
        if (numItems > 0) {
            const animationDuration = 24;
            const delayBetweenItems = animationDuration / numItems;
            roletaItems.forEach((item, i) => {
                const htmlItem = item as HTMLElement;
                htmlItem.style.animation = `roleta-flow-bio ${animationDuration}s linear infinite`;
                htmlItem.style.animationDelay = `-${i * delayBetweenItems}s`;
                htmlItem.style.animationPlayState = 'running';
            });

            const container = document.querySelector('.roleta-container-bio');
            const pauseAnimation = () => roletaItems.forEach(item => (item as HTMLElement).style.animationPlayState = 'paused');
            const resumeAnimation = () => roletaItems.forEach(item => (item as HTMLElement).style.animationPlayState = 'running');

            container?.addEventListener('mouseenter', pauseAnimation);
            container?.addEventListener('mouseleave', resumeAnimation);
            
            return () => {
              container?.removeEventListener('mouseenter', pauseAnimation);
              container?.removeEventListener('mouseleave', resumeAnimation);
            }
        }
    }, []);

    return (
        <div className="roleta-container-bio relative w-full h-[200px] mt-6 mb-6 overflow-hidden">
            {BIO_CAROUSEL_ITEMS.map((item, index) => (
                <div key={index} className="roleta-item-bio absolute left-1/2 top-1/2 w-[150px] h-[150px] -ml-[75px] -mt-[75px]">
                    <img src={item.src} alt={item.alt} className={`w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-110 ${item.className || ''}`} />
                </div>
            ))}
        </div>
    );
};

// --- MAIN BIO PAGE COMPONENT ---
interface BioPageProps {
    storeId: string;
}

const BioPage: React.FC<BioPageProps> = ({ storeId }) => {
    
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
    const heroPhrases = siteInfo.heroes && siteInfo.heroes.length > 0 ? siteInfo.heroes[0].phrases : [];
    const typedSubtitle = useTypingEffect(heroPhrases, 100, 50, 2000);

    useEffect(() => {
        if (!storeId) return;

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

        return () => unsubscribeSiteInfo();

    }, [storeId]);

    const { links, copyrightText, logos, streetViewUrl } = siteInfo;
    const heroCarouselTitle = siteInfo.heroes && siteInfo.heroes.length > 0 ? siteInfo.heroes[0].carouselTitle : '';

    return (
        <div className="selection:bg-yellow-500/50 selection:text-black">
            <div className="background-lights">
                <div className="light one"></div>
                <div className="light two"></div>
            </div>

            <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center p-4 py-8 bg-black/70 backdrop-blur-md">
                <div className="container mx-auto max-w-md flex flex-col items-center text-center">
                    <header className="py-0 px-4 w-full">
                        <div className="flex items-center justify-center space-x-4 mb-4">
                             <div className="flex-shrink-0 bg-white h-20 w-20 rounded-full flex items-center justify-center p-2 border-2 border-[#27272a] shadow-lg">
                                <Logo 
                                  logoUrl={logos.bio || logos.main}
                                  className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <h1 className="text-2xl font-bold text-white">iPhone Rios</h1>
                                <p className="text-sm text-gray-400">{links.instagramHandle}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto">
                            Especializada em iPhones: assistência, venda de novos e seminovos, e trocas com segurança e confiança.
                        </p>
                    </header>

                    <main className="w-full max-w-xs mx-auto space-y-3 mt-8">
                        <div className="w-full mb-4">
                            <h2 className="text-2xl font-bold text-white mb-2">A nova geração chegou</h2>
                            <p className="text-base text-gray-400 mb-4 min-h-[3rem]">
                                {/* FIX: useTypingEffect returns an object; render the .text property instead of the object itself. */}
                                {typedSubtitle.text}<span className="typing-cursor"></span>
                            </p>
                            <ProductCarouselBio />
                            <p className="text-white text-sm font-semibold -mt-4">
                                {heroCarouselTitle}
                            </p>
                        </div>

                        <a href="/#" className="flex items-center justify-center w-full text-center py-3 px-5 rounded-lg text-base bg-white text-black border border-white font-semibold transition-all duration-300 hover:bg-[var(--brand-yellow)] hover:border-[var(--brand-yellow)] hover:text-black transform hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/30">
                           <Smartphone className="h-5 w-5 mr-2" /> Catálogo de Produtos
                        </a>
                        <a href={`https://wa.me/${links.whatsappSales}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full text-center py-3 px-5 rounded-lg text-base bg-white text-black border border-white font-semibold transition-all duration-300 hover:bg-[var(--brand-yellow)] hover:border-[var(--brand-yellow)] hover:text-black transform hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/30">
                           <Phone className="h-5 w-5 mr-2" /> Vendas
                        </a>
                        {links.showSupport !== false && (
                            <a href={`https://wa.me/${links.whatsappSupport}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full text-center py-3 px-5 rounded-lg text-base bg-white text-black border border-white font-semibold transition-all duration-300 hover:bg-[var(--brand-yellow)] hover:border-[var(--brand-yellow)] hover:text-black transform hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/30">
                               <Phone className="h-5 w-5 mr-2" /> Assistência Técnica
                            </a>
                        )}
                        <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full text-center py-3 px-5 rounded-lg text-base bg-white text-black border border-white font-semibold transition-all duration-300 hover:bg-[var(--brand-yellow)] hover:border-[var(--brand-yellow)] hover:text-black transform hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/30">
                            <Instagram className="h-5 w-5 mr-2" /> Siga nosso Instagram
                        </a>
                    </main>
                    
                    <div className="w-full max-w-xs mx-auto my-8">
                        <div className="w-full h-48 rounded-lg overflow-hidden border border-[#27272a] shadow-md">
                           <iframe src={streetViewUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-lg"></iframe>
                        </div>
                    </div>

                    <footer className="pt-0 pb-4 text-center text-gray-400 text-xs">
                        <p>{copyrightText}</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default BioPage;
