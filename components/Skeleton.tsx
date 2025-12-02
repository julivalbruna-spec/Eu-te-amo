
import React from 'react';

interface SkeletonProps {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div 
            className={`animate-pulse bg-white/10 rounded ${className}`}
        />
    );
};

export default Skeleton;
