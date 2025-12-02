
import React from 'react';
import { ThemeColors } from '../types';

interface StoreMarqueeProps {
    texts: string[];
    theme?: ThemeColors;
}

const StoreMarquee: React.FC<StoreMarqueeProps> = ({ texts, theme }) => {
    if (!texts || texts.length === 0) return null;
    const duplicatedTexts = [...texts, ...texts]; // For seamless loop
    
    const style = {
        backgroundColor: theme?.marqueeBackground || '#ffffff',
        color: theme?.marqueeText || '#000000'
    };

    return (
        <div className="py-2 marquee flex items-center" style={style}>
            <div className="marquee-content">
                {duplicatedTexts.map((text, index) => (
                    <span key={index}>{text}</span>
                ))}
            </div>
        </div>
    );
};

export default StoreMarquee;
