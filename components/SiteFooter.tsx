import React from 'react';
import { SiteInfo } from '../types';

const SiteFooter: React.FC<{siteInfo: SiteInfo}> = ({ siteInfo }) => (
    <footer className="bg-black py-8 px-4 text-center">
        <div className="container mx-auto max-w-7xl">
            <a href="/#/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
                Painel do ADM
            </a>
            <p className="text-xs text-gray-500 mt-4">
                {siteInfo.copyrightText}
            </p>
             <p className="text-xs text-gray-500 mt-1">
                Site desenvolvido por Luicarho Bitencourt.
            </p>
        </div>
    </footer>
);

export default SiteFooter;
