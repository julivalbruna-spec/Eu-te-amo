import React from 'react';

const Preloader: React.FC = () => (
    <div id="preloader" className="fixed inset-0 z-[9999] bg-[var(--background)] flex items-center justify-center">
        <div className="preloader-spinner"></div>
    </div>
);

export default Preloader;
