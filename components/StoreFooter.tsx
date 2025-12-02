
import React from 'react';
import { SiteInfo } from '../types';

interface FooterProps {
    onVerProdutosClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    siteInfo: SiteInfo;
}

const StoreFooter: React.FC<FooterProps> = ({ onVerProdutosClick, siteInfo }) => {
    const footerOpacity = siteInfo.theme.footerOpacity ?? 70;
    const hexOpacity = Math.round((footerOpacity / 100) * 255).toString(16).padStart(2, '0');
    const backgroundColor = `${siteInfo.theme.footerBackground}${hexOpacity}`;
    
    const animationClass = siteInfo.theme.footerButtonAnimation && siteInfo.theme.footerButtonAnimation !== 'none' 
        ? `animate-${siteInfo.theme.footerButtonAnimation}` 
        : '';
    
    return (
        <footer 
            className="fixed-footer fixed bottom-0 left-0 right-0 z-30 p-3 md:p-4 border-t transition-colors duration-300 backdrop-blur-sm"
            style={{ 
                backgroundColor: backgroundColor,
                borderColor: 'var(--border-color)'
            }}
        >
            <div className="container mx-auto flex justify-between items-center max-w-7xl">
                <div>
                     <h2 className="text-sm md:text-base font-bold" style={{ color: 'var(--footer-text)' }}>{siteInfo.customTexts.promoFooterText}</h2>
                </div>
                <div className="pl-2">
                     <button 
                        onClick={onVerProdutosClick} 
                        className={`theme-footer-button inline-block font-bold py-2 px-5 md:py-3 md:px-8 rounded-full transition-all duration-300 hover:scale-105 text-sm md:text-base whitespace-nowrap ${animationClass}`}
                        style={{
                            backgroundColor: 'var(--footer-button-background)',
                            color: 'var(--footer-button-text)'
                        }}
                     >
                        {siteInfo.customTexts.promoFooterButton}
                     </button>
                </div>
            </div>
        </footer>
    );
};

export default StoreFooter;
