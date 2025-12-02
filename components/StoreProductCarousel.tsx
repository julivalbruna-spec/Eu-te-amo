import React, { useState, useEffect, useRef } from 'react';
import { CarouselItem, HeroInfo } from '../types';

interface ProductCarouselProps {
    items: CarouselItem[];
    uniqueId: string;
    animationType?: HeroInfo['carouselAnimationType'];
    heightMobile?: number;
    heightDesktop?: number;
    imageSizeMobile?: number;
    imageSizeDesktop?: number;
    itemSpreadMobile?: number;
    itemSpreadDesktop?: number;
    animationDuration?: number;

    // New specific props
    focusLoopInterval?: number;
    focusLoopTransitionDuration?: number;
    crossfadeInterval?: number;
    crossfadeDuration?: number;
    motionBlurInterval?: number;
    motionBlurDuration?: number;
    motionBlurAmount?: number;
    floatingDuration?: number;
    floatingHeight?: number;

    carouselImageOffsetXMobile?: number;
    carouselImageOffsetYMobile?: number;
    carouselImageOffsetXDesktop?: number;
    carouselImageOffsetYDesktop?: number;
}

const StoreProductCarousel: React.FC<ProductCarouselProps> = (props) => { 
    const { 
        items, uniqueId, animationType = 'roleta',
        heightMobile = 240, heightDesktop = 300, 
        imageSizeMobile = 74, imageSizeDesktop = 80, 
        itemSpreadMobile = 110, itemSpreadDesktop = 280, 
        animationDuration = 24,
        focusLoopInterval = 3500, focusLoopTransitionDuration = 700,
        crossfadeInterval = 3500, crossfadeDuration = 1.2,
        motionBlurInterval = 3500, motionBlurDuration = 0.7, motionBlurAmount = 12,
        floatingDuration = 4, floatingHeight = -12,
        carouselImageOffsetXMobile,
        carouselImageOffsetYMobile,
        carouselImageOffsetXDesktop,
        carouselImageOffsetYDesktop
    } = props;

    // --- State & Refs for multiple animations ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // --- Effect for Interval-based Animations ---
    useEffect(() => {
        const intervalBasedAnims = ['focus_loop', 'crossfade', 'motion_blur'];
        if (!intervalBasedAnims.includes(animationType!) || items.length <= 1) return;

        let intervalTime = 3500;
        if (animationType === 'focus_loop') intervalTime = focusLoopInterval;
        if (animationType === 'crossfade') intervalTime = crossfadeInterval;
        if (animationType === 'motion_blur') intervalTime = motionBlurInterval;

        const interval = setInterval(() => {
            setPreviousIndex(currentIndex);
            setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
        }, intervalTime);

        return () => clearInterval(interval);
    }, [items.length, currentIndex, animationType, focusLoopInterval, crossfadeInterval, motionBlurInterval]);

    // --- Effect for Parallax 3D ---
    useEffect(() => {
        if (animationType !== 'parallax_3d') return;

        const container = containerRef.current;
        const img = imgRef.current;

        if (!container || !img) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            img.style.transform = `perspective(1000px) rotateX(${y * -12}deg) rotateY(${x * 18}deg) scale(1.05)`;
        };
        const handleMouseLeave = () => { img.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`; };
        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width - 0.5;
            const y = (touch.clientY - rect.top) / rect.height - 0.5;
            img.style.transform = `perspective(1000px) rotateX(${y * -12}deg) rotateY(${x * 18}deg) scale(1.05)`;
        };
        const handleTouchEnd = () => { img.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`; };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('touchmove', handleTouchMove);
        container.addEventListener('touchend', handleTouchEnd);
        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [animationType]);

    // --- Effect for Scroll Reveal ---
     useEffect(() => {
        if (animationType !== 'scroll_reveal') return;

        const container = containerRef.current;
        const img = imgRef.current;
        if (!container || !img) return;

        const handleScroll = () => {
            const rect = container.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            let progress = (viewportHeight - rect.top) / viewportHeight;
            progress = Math.min(Math.max(progress, 0), 1.2);

            if (rect.top > viewportHeight || rect.bottom < 0) return;
            
            const scale = 0.8 + progress * 0.2;
            const translateY = (1 - progress) * 40;
            const rotate = (1 - progress) * 8;

            img.style.transform = `scale(${scale}) translateY(${translateY}px) rotate(${rotate}deg)`;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);

    }, [animationType, uniqueId]);


    // --- RENDER LOGIC ---
    
    const containerStyle = {
        '--roleta-height-mobile': `${heightMobile}px`,
        '--roleta-height-desktop': `${heightDesktop}px`,
    } as React.CSSProperties;

    const positionableStyle = {
        '--carousel-offset-x-mobile': `${carouselImageOffsetXMobile ?? 0}px`,
        '--carousel-offset-y-mobile': `${carouselImageOffsetYMobile ?? 0}px`,
        '--carousel-offset-x-desktop': `${carouselImageOffsetXDesktop ?? 0}px`,
        '--carousel-offset-y-desktop': `${carouselImageOffsetYDesktop ?? 0}px`,
    } as React.CSSProperties;

    const renderContent = () => {
        if (animationType === 'floating' || animationType === 'scroll_reveal') {
            const firstItem = items?.[0];
            if (!firstItem) return null;
            const isScroll = animationType === 'scroll_reveal';

            const dynamicImgStyle: React.CSSProperties = {
                width: `${imageSizeDesktop}%`,
                height: `${imageSizeDesktop}%`,
            };
            if (animationType === 'floating') {
                dynamicImgStyle['--float-duration'] = `${floatingDuration}s`;
                dynamicImgStyle['--float-height'] = `${floatingHeight}px`;
            }


            return (
                 <div 
                    ref={containerRef}
                    className="roleta-container flex justify-center items-center"
                    style={containerStyle}
                >
                    <img
                        ref={imgRef}
                        src={firstItem.src}
                        alt={firstItem.alt}
                        className={`object-contain ${isScroll ? 'scroll-reveal-img' : 'floating-img'}`}
                        style={dynamicImgStyle}
                    />
                </div>
            )
        }

        if (animationType === 'crossfade') {
            const dynamicContainerStyle = {
                ...containerStyle,
                '--crossfade-duration': `${crossfadeDuration}s`
            } as React.CSSProperties;

            return (
                <div className="roleta-container" style={dynamicContainerStyle}>
                    {items.map((item, index) => (
                        <div
                            key={`${uniqueId}-${index}`}
                            className={`crossfade-slide ${index === currentIndex ? 'active-slide' : ''}`}
                        >
                            <img src={item.src} alt={item.alt}/>
                        </div>
                    ))}
                </div>
            );
        }

        if (animationType === 'motion_blur') {
            const dynamicContainerStyle = {
                ...containerStyle,
                '--motion-blur-duration': `${motionBlurDuration}s`,
                '--motion-blur-amount': `${motionBlurAmount}px`
            } as React.CSSProperties;

            return (
                <div className="roleta-container overflow-hidden" style={dynamicContainerStyle}>
                    {items.map((item, index) => (
                        <div
                            key={`${uniqueId}-${index}`}
                            className={`motion-blur-slide ${index === currentIndex ? 'active-slide' : ''} ${index === previousIndex ? 'exiting-slide' : ''}`}
                        >
                             <img src={item.src} alt={item.alt}/>
                        </div>
                    ))}
                </div>
            );
        }
        
        if (animationType === 'parallax_3d') {
            const firstItem = items?.[0];
            if (!firstItem) return null;
            const imgStyle: React.CSSProperties = {
                transition: 'transform 0.15s ease-out',
                willChange: 'transform',
                transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
            };
            return (
                <div 
                    className="roleta-container flex justify-center items-center"
                    style={{ ...containerStyle, perspective: '1000px' }}
                    ref={containerRef}
                >
                    <img ref={imgRef} src={firstItem.src} alt={firstItem.alt} className="object-contain"
                        style={{ ...imgStyle, width: `${imageSizeDesktop}%`, height: `${imageSizeDesktop}%` }}
                    />
                </div>
            );
        }

        if (animationType === 'focus_loop') {
            if (!items || items.length === 0) return null;
            const transitionStyle: React.CSSProperties = { transitionDuration: `${focusLoopTransitionDuration / 1000}s` };
            const exitingTransitionStyle: React.CSSProperties = {
                ...transitionStyle,
                transition: `opacity ${transitionStyle.transitionDuration} ease-in-out, transform ${transitionStyle.transitionDuration} ease-in-out, visibility 0s ${transitionStyle.transitionDuration}`,
            };
            return (
                <div className="flex flex-col items-center">
                    <div className="focus-loop-container" style={containerStyle}>
                        {items.map((item, index) => (
                            <div key={`${uniqueId}-${index}`}
                                className={`focus-loop-slide ${index === currentIndex ? 'active-slide' : ''} ${index === previousIndex ? 'exiting-slide' : ''}`}
                                style={index === previousIndex ? exitingTransitionStyle : transitionStyle} >
                                <img src={item.src} alt={item.alt} className="object-contain" style={{ width: `${imageSizeMobile}%`, height: `${imageSizeMobile}%` }}/>
                            </div>
                        ))}
                    </div>
                    <div className="focus-loop-text-container">
                        {items.map((item, index) => (
                            <p key={`${uniqueId}-text-${index}`} className={`focus-loop-text font-semibold text-white ${index === currentIndex ? 'active-text' : ''}`}>
                                {item.alt}
                            </p>
                        ))}
                    </div>
                </div>
            );
        }

        if (animationType === 'static') {
             return (
                <div className="roleta-container flex justify-center items-center gap-4" style={containerStyle}>
                    {items.slice(0, 3).map((item, index) => (
                        <div key={`${uniqueId}-${index}`} className="h-full flex items-center justify-center p-2" style={{ width: `${100/Math.min(items.length, 3)}%` }}>
                            <img src={item.src} alt={item.alt} className={`object-contain transition-transform duration-300 hover:scale-110`} style={{maxHeight: '80%', maxWidth: '100%'}} />
                        </div>
                    ))}
                </div>
            )
        }

        // Default: 'roleta' animation
        const mobileSize = heightMobile * (imageSizeMobile / 100);
        const desktopSize = heightDesktop * (imageSizeDesktop / 100);
        const effectiveAnimationDuration = animationDuration;
        const delayBetweenItems = items.length > 0 ? effectiveAnimationDuration / items.length : 0;
        
        const dynamicRoletaStyles = `
            @keyframes roleta-flow-store-${uniqueId}-mobile {
              0% { transform: translateX(-${itemSpreadMobile}px) scale(0.7); opacity: 1; z-index: 10; }
              25% { transform: translateX(0) scale(1); opacity: 1; z-index: 20; }
              50% { transform: translateX(${itemSpreadMobile}px) scale(0.7); opacity: 1; z-index: 10; }
              75% { transform: translateX(0) scale(0.4); opacity: 0; z-index: 5; }
              100% { transform: translateX(-${itemSpreadMobile}px) scale(0.7); opacity: 1; z-index: 10; }
            }
            @keyframes roleta-flow-store-${uniqueId}-desktop {
              0% { transform: translateX(-${itemSpreadDesktop}px) scale(0.7); opacity: 1; z-index: 10; }
              25% { transform: translateX(0) scale(1); opacity: 1; z-index: 20; }
              50% { transform: translateX(${itemSpreadDesktop}px) scale(0.7); opacity: 1; z-index: 10; }
              75% { transform: translateX(0) scale(0.4); opacity: 0; z-index: 5; }
              100% { transform: translateX(-${itemSpreadDesktop}px) scale(0.7); opacity: 1; z-index: 10; }
            }
            .roleta-item-${uniqueId} {
                width: ${mobileSize}px; height: ${mobileSize}px; margin-left: -${mobileSize / 2}px; margin-top: -${mobileSize / 2}px;
                animation: roleta-flow-store-${uniqueId}-mobile ${effectiveAnimationDuration}s linear infinite;
            }
            @media (min-width: 768px) {
                .roleta-item-${uniqueId} {
                    width: ${desktopSize}px; height: ${desktopSize}px; margin-left: -${desktopSize / 2}px; margin-top: -${desktopSize / 2}px;
                    animation-name: roleta-flow-store-${uniqueId}-desktop;
                }
            }
        `;

        return (
            <>
                <style>{dynamicRoletaStyles}</style>
                <div className="roleta-container" style={containerStyle}>
                    {items.map((item, index) => (
                        <div key={index} className={`roleta-item-${uniqueId} absolute left-1/2 top-1/2`} style={{ animationDelay: `-${index * delayBetweenItems}s` }}>
                            <img src={item.src} alt={item.alt} className={`w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-110 ${item.className || ''}`} />
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div className="positionable-carousel-container" style={positionableStyle}>
            {renderContent()}
        </div>
    );
};

export default StoreProductCarousel;
