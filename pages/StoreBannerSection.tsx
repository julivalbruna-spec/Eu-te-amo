
import React, { useState, useEffect } from 'react';
import { BannerInfo, CategoryId } from '../types';
import { useTypingEffect } from '../hooks/useTypingEffect';
import StoreProductCarousel from './StoreProductCarousel';


// --- SUB-COMPONENTS for BannerSection ---

interface FocusLoopAnimatorProps {
    banner: BannerInfo;
}

const FocusLoopAnimator: React.FC<FocusLoopAnimatorProps> = ({ banner }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(-1);

    const items = banner.carouselItems || [];
    const intervalDuration = banner.focusLoopInterval || 4000;
    const transitionDuration = (banner.focusLoopTransitionDuration || 700) / 1000;

    useEffect(() => {
        if (items.length <= 1) return;

        const interval = setInterval(() => {
            setPreviousIndex(currentIndex);
            setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
        }, intervalDuration);

        return () => clearInterval(interval);
    }, [items.length, intervalDuration, currentIndex]);

    if (items.length === 0) return null;

    const transitionStyle: React.CSSProperties = {
        transitionDuration: `${transitionDuration}s`,
    };
    const exitingTransitionStyle: React.CSSProperties = {
        ...transitionStyle,
        transition: `opacity ${transitionDuration}s ease-in-out, transform ${transitionDuration}s ease-in-out, visibility 0s ${transitionDuration}s`,
    };

    return (
        <div className="flex flex-col items-center">
            <div
                className="focus-loop-container"
                style={{
                    '--roleta-height-mobile': `${banner.carouselHeightMobile ?? 240}px`,
                    '--roleta-height-desktop': `${banner.carouselHeightDesktop ?? 300}px`
                } as React.CSSProperties}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`focus-loop-slide ${index === currentIndex ? 'active-slide' : ''} ${index === previousIndex ? 'exiting-slide' : ''}`}
                        style={index === previousIndex ? exitingTransitionStyle : transitionStyle}
                    >
                        <img src={item.src} alt={item.alt} className="object-contain" />
                    </div>
                ))}
            </div>
            <div className="focus-loop-text-container">
                {items.map((item, index) => (
                    <p key={index} className={`focus-loop-text font-semibold text-white ${index === currentIndex ? 'active-text' : ''}`}>
                        {item.alt}
                    </p>
                ))}
            </div>
        </div>
    );
};


interface AiAnimatedBannerProps {
    banner: BannerInfo;
    onCategoryLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, categoryId: CategoryId) => void;
}
const AiAnimatedBanner: React.FC<AiAnimatedBannerProps> = ({ banner, onCategoryLinkClick }) => {
    const typedTitle = useTypingEffect(banner.typingEffectTarget === 'title' && banner.title ? banner.title.split('\n') : [], 80, 50, 5000);
    const typedSubtitle = useTypingEffect(banner.typingEffectTarget === 'subtitle' && banner.subtitle ? banner.subtitle.split('\n') : [], 80, 50, 5000);
    
    const hasImages = banner.carouselItems && banner.carouselItems.length > 0;

    const dynamicStyles = `
      .banner-dynamic-style-${banner.id} .banner-title {
        font-size: ${banner.titleFontSizeMobile ?? 30}px;
        line-height: ${banner.titleLineHeightMobile ?? 1.2};
      }
      .banner-dynamic-style-${banner.id} .banner-subtitle {
        font-size: ${banner.subtitleFontSizeMobile ?? 18}px;
        line-height: ${banner.subtitleLineHeightMobile ?? 1.4};
      }
      .banner-dynamic-style-${banner.id} .banner-button {
        padding: ${banner.buttonPaddingYMobile ?? 12}px ${banner.buttonPaddingXMobile ?? 32}px;
      }
      .banner-dynamic-style-${banner.id} .focus-loop-slide {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .banner-dynamic-style-${banner.id} .focus-loop-slide img {
         width: ${banner.carouselImageSizeMobile ?? 80}%;
         height: ${banner.carouselImageSizeMobile ?? 80}%;
      }
      ${(banner.auroraElements || []).map((el, i) => `
        .banner-dynamic-style-${banner.id} .aurora-bg-element:nth-child(${i + 1}) {
          width: ${el.sizeMobile ?? 400}px;
          height: ${el.sizeMobile ?? 400}px;
        }
      `).join('')}

      @media (min-width: 768px) {
        .banner-dynamic-style-${banner.id} .banner-title {
          font-size: ${banner.titleFontSizeDesktop ?? 48}px;
          line-height: ${banner.titleLineHeightDesktop ?? 1.2};
        }
        .banner-dynamic-style-${banner.id} .banner-subtitle {
          font-size: ${banner.subtitleFontSizeDesktop ?? 24}px;
          line-height: ${banner.subtitleLineHeightDesktop ?? 1.4};
        }
        .banner-dynamic-style-${banner.id} .banner-button {
          padding: ${banner.buttonPaddingYDesktop ?? 16}px ${banner.buttonPaddingXDesktop ?? 48}px;
        }
         .banner-dynamic-style-${banner.id} .focus-loop-slide img {
             width: ${banner.carouselImageSizeDesktop ?? 80}%;
             height: ${banner.carouselImageSizeDesktop ?? 80}%;
        }
        ${(banner.auroraElements || []).map((el, i) => `
          .banner-dynamic-style-${banner.id} .aurora-bg-element:nth-child(${i + 1}) {
            width: ${el.sizeDesktop ?? 500}px;
            height: ${el.sizeDesktop ?? 500}px;
          }
        `).join('')}
      }
    `;

    return (
        <>
        <style>{dynamicStyles}</style>
        <div 
            className={`block relative text-center px-4 overflow-hidden banner-dynamic-style-${banner.id}`}
            style={{ 
                paddingTop: `${banner.verticalPadding ?? 6}rem`, 
                paddingBottom: `${banner.verticalPadding ?? 6}rem`,
                backgroundColor: banner.backgroundColor || 'var(--background)'
            }}
        >
            <div className="aurora-background">
                {(banner.auroraElements || []).map((element, index) => (
                    <div 
                        key={index} 
                        className="aurora-bg-element" 
                        style={{ 
                            background: element.color,
                            filter: `blur(${banner.blurStrength ?? 100}px)`
                        }}
                    ></div>
                ))}
            </div>
            <div className={`relative z-10 container mx-auto max-w-5xl`}>
                <div className="content-wrapper flex flex-col items-center justify-center">
                    <div className="min-h-[3rem] flex items-center justify-center">
                        {banner.title && (
                            <h2 className="banner-title font-bold mb-2 relative" style={{ color: banner.titleColor || 'var(--primary-text)' }}>
                                {/* FIX: useTypingEffect returns an object; render the .text property instead of the object itself. */}
                                {banner.typingEffectTarget === 'title' ? typedTitle.text : (banner.title || '').split('\n').map((line, i) => <React.Fragment key={i}>{line}{i < (banner.title || '').split('\n').length - 1 && <br />}</React.Fragment>)}
                                {banner.typingEffectTarget === 'title' && <span className="typing-cursor"></span>}
                            </h2>
                        )}
                    </div>
                    <div className="min-h-[2rem] flex items-center justify-center">
                        {banner.subtitle && (
                            <p className="banner-subtitle mb-6" style={{ color: banner.subtitleColor || 'var(--secondary-text)' }}>
                                {/* FIX: useTypingEffect returns an object; render the .text property instead of the object itself. */}
                                {banner.typingEffectTarget === 'subtitle' ? typedSubtitle.text : (banner.subtitle || '').split('\n').map((line, i) => <React.Fragment key={i}>{line}{i < (banner.subtitle || '').split('\n').length - 1 && <br />}</React.Fragment>)}
                                {banner.typingEffectTarget === 'subtitle' && <span className="typing-cursor"></span>}
                            </p>
                        )}
                    </div>
                    {hasImages && (
                        <>
                            {banner.animationStyle === 'focus_zoom_loop' ? (
                                <FocusLoopAnimator banner={banner} />
                            ) : (
                                <StoreProductCarousel 
                                    items={banner.carouselItems!} 
                                    uniqueId={banner.id}
                                    heightMobile={banner.carouselHeightMobile}
                                    heightDesktop={banner.carouselHeightDesktop}
                                    imageSizeMobile={banner.carouselImageSizeMobile}
                                    imageSizeDesktop={banner.carouselImageSizeDesktop}
                                    itemSpreadMobile={banner.carouselItemSpreadMobile}
                                    itemSpreadDesktop={banner.carouselItemSpreadDesktop}
                                    animationDuration={banner.carouselAnimationDuration}
                                />
                            )}
                            {banner.carouselTitle && (
                                <p className="text-white text-lg font-semibold mt-0 md:mt-4 h-8 flex justify-center items-center relative">
                                    {banner.carouselTitle}
                                </p>
                            )}
                        </>
                    )}
                     {banner.buttonText && (
                        <a 
                            href="#produtos"
                            onClick={(e) => onCategoryLinkClick(e, banner.buttonCategory || 'todos')}
                            className="banner-button mt-6 inline-block font-bold rounded-full transition-transform hover:scale-105"
                            style={{
                                backgroundColor: banner.buttonBackgroundColor || '#FFFFFF',
                                color: banner.buttonTextColor || '#000000'
                            }}
                        >
                            {banner.buttonText}
                        </a>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};


// --- MAIN COMPONENT ---

interface BannerSectionProps {
    banners: BannerInfo[];
    onCategoryLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, categoryId: CategoryId) => void;
    rotationInterval?: number;
}
const StoreBannerSection: React.FC<BannerSectionProps> = ({ banners, onCategoryLinkClick, rotationInterval }) => {
    const activeBanners = banners.filter(b => b.enabled && (b.imageUrl || b.type === 'animated_carousel'));
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (activeBanners.length <= 1) return;
        
        const intervalTime = (rotationInterval ?? 5) * 1000;

        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % activeBanners.length);
        }, intervalTime); 

        return () => clearInterval(interval);
    }, [activeBanners.length, rotationInterval]);

    if (activeBanners.length === 0) return null;

    return (
        <section className="bg-black w-full overflow-hidden">
            <div className="banner-fade-container">
                {activeBanners.map((banner, index) => (
                    <div key={banner.id} className={`banner-slide ${index === currentIndex ? 'active-banner' : ''}`}>
                        {banner.type === 'animated_carousel' ? (
                            <AiAnimatedBanner banner={banner} onCategoryLinkClick={onCategoryLinkClick} />
                        ) : (
                            <a href={banner.linkUrl || '#produtos'} target="_blank" rel="noopener noreferrer" className="block transition-transform duration-300 hover:scale-[1.01]">
                                {banner.type === 'video' ? (
                                    <video 
                                        src={banner.imageUrl} 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover shadow-lg shadow-yellow-500/10"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <img src={banner.imageUrl} alt="Banner Promocional" className="w-full h-full object-cover shadow-lg shadow-yellow-500/10" />
                                )}
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default StoreBannerSection;