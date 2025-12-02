import React from 'react';
import { SiteInfo, Category, CategoryId } from '../types';
import { X } from 'react-feather';
import Logo from './Logo';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onCategorySelect: (id: CategoryId) => void;
    categories: Category[];
    siteInfo: SiteInfo;
}
const StoreSidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onCategorySelect, categories, siteInfo }) => {
    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} aria-hidden="true"></div>
            <div 
                className={`sidebar-menu fixed top-0 left-0 h-full w-72 border-r p-6 z-50 flex flex-col ${isOpen ? 'open' : 'closed'}`}
                style={{
                    backgroundColor: 'var(--sidebar-background)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--sidebar-text)'
                }}
            >
                <div className="flex justify-between items-center mb-8">
                     <Logo 
                        logoUrl={siteInfo.logos.sidebar || siteInfo.logos.main}
                        className="h-10"
                    />
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Fechar menu">
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex-grow">
                    <ul className="space-y-2 list-none">
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <button onClick={() => onCategorySelect(cat.id)} className="w-full text-left text-lg hover:text-[var(--brand-yellow)] font-medium py-2 px-3 rounded-md transition-colors duration-200" style={{ color: 'var(--sidebar-text)' }}>
                                    {cat.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-auto text-center text-xs text-gray-500">
                     <p>{siteInfo.copyrightText}</p>
                </div>
            </div>
        </>
    );
};

export default StoreSidebar;
