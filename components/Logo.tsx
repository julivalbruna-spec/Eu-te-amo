import React from 'react';

interface LogoProps {
    logoUrl: string;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ logoUrl, className }) => {
    if (!logoUrl) {
        return null;
    }
    return <img src={logoUrl} alt="iPhone Rios Logo" className={className} />;
};

export default Logo;
