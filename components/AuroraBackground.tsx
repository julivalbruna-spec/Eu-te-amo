
import React from 'react';
import { AuroraElement } from '../types';

interface AuroraBackgroundProps {
    elements?: AuroraElement[];
    blurStrength?: number;
    animationDurationMobile?: number;
    animationDurationDesktop?: number;
    uniqueId: string;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
    elements = [],
    blurStrength,
    animationDurationMobile,
    animationDurationDesktop,
    uniqueId
}) => {
    if (!elements || elements.length === 0) {
        return null;
    }

    const dynamicStyles = `
        ${elements.map((el, i) => {
            const mobileDuration = (animationDurationMobile || 30) * (1 + (i % 5 - 2) * 0.1);
            const desktopDuration = (animationDurationDesktop || 35) * (1 + (i % 5 - 2) * 0.1);
            return `
                .aurora-container-${uniqueId} .aurora-bg-element:nth-child(${i + 1}) {
                    width: ${el.sizeMobile ?? 400}px;
                    height: ${el.sizeMobile ?? 400}px;
                    animation-duration: ${mobileDuration}s;
                }
                 @media (min-width: 768px) {
                     .aurora-container-${uniqueId} .aurora-bg-element:nth-child(${i + 1}) {
                        width: ${el.sizeDesktop ?? 500}px;
                        height: ${el.sizeDesktop ?? 500}px;
                        animation-duration: ${desktopDuration}s;
                    }
                 }
            `;
        }).join('')}
    `;

    return (
        <>
            <style>{dynamicStyles}</style>
            <div className={`aurora-background aurora-container-${uniqueId}`}>
                {elements.map((element, index) => (
                    <div
                        key={index}
                        className="aurora-bg-element"
                        style={{
                            background: element.color,
                            filter: `blur(${blurStrength ?? 100}px)`
                        }}
                    ></div>
                ))}
            </div>
        </>
    );
};

export default AuroraBackground;
