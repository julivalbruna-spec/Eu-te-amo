
import React, { useState, useEffect } from 'react';
import { SiteInfo } from '../types';
import { Menu } from 'react-feather';
import Logo from './Logo';

const StoreHeader: React.FC<{ onToggleSidebar: () => void; siteInfo: SiteInfo }> = ({ onToggleSidebar, siteInfo }) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { theme, logos } = siteInfo;

    // Determine current styles based on scroll state
    const currentBg = isScrolled ? (theme.headerScrolledBackground || theme.headerBackground) : theme.headerBackground;
    const currentOpacity = isScrolled ? (theme.headerScrolledOpacity ?? 100) : (theme.headerOpacity ?? 100);
    const currentTextColor = isScrolled ? (theme.headerScrolledTextColor || '#000000') : (theme.headerTextColor || '#000000');
    const currentLogo = isScrolled ? (logos.headerScrolled || logos.header || logos.main) : (logos.header || logos.main);

    // Calculate final background color with opacity
    const hexOpacity = Math.round((currentOpacity / 100) * 255).toString(16).padStart(2, '0');
    const finalBgColor = `${currentBg}${hexOpacity}`;

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300`}
            style={{
                backgroundColor: finalBgColor,
                backdropFilter: isScrolled ? 'blur(8px)' : 'none',
            }}
        >
            <div className={`container mx-auto flex justify-between items-center transition-all duration-300 px-4 ${isScrolled ? 'py-2 md:py-3' : 'py-4 md:py-5'}`}>
                <button 
                    onClick={onToggleSidebar} 
                    className="p-2 transition-colors" 
                    aria-label="Abrir menu"
                    style={{ color: currentTextColor }}
                >
                    <Menu size={28} />
                </button>
                <a href="/#" className="flex-shrink-0">
                    <Logo
                        logoUrl={currentLogo}
                        className={`transition-all duration-300 ${isScrolled ? 'h-10 md:h-12' : 'h-12 md:h-14'}`}
                    />
                </a>
                <div className="w-10"></div> {/* Spacer to keep logo centered */}
            </div>
        </header>
    );
};

export default StoreHeader;
