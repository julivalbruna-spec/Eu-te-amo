
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { SiteInfo, Store } from '../../types';
import { LogOut, ChevronDown } from 'react-feather';
import Logo from '../Logo';
import { useStore } from '../../contexts/StoreContext';
import { auth } from '../../firebase';

type AdminView = 'dashboard' | 'smart_dashboard' | 'analytics' | 'ponto_de_venda' | 'historico_vendas' | 'produtos' | 'categorias' | 'clientes' | 'marketing' | 'sorteios' | 'ordens_de_servico' | 'funcionarios' | 'custos' | 'ai_assistant' | 'chatbot_analysis' | 'chatbot_config' | 'chatbot_kb' | 'chatbot_faq' | 'chatbot_aparencia' | 'identidade' | 'hero' | 'story' | 'textos_seo' | 'layout_loja' | 'informacoes' | 'taxas' | 'auditoria' | 'migracao' | 'super_admin_stores';

interface AdminSidebarProps {
  siteInfo: SiteInfo;
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  handleLogout: () => void;
  isSuperAdmin: boolean;
  adminTheme?: 'midnight' | 'intelli' | 'crypto';
  menuConfig: any; // Simplified for this component
  superAdminMenu: any; // Simplified for this component
}

const StoreSwitcher: React.FC = () => {
    const { storeId, setStoreIdForSuperAdmin } = useStore();
    const [allStores, setAllStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = db.collection('stores').orderBy('name').onSnapshot(snapshot => {
            const storesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
            setAllStores(storesData);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) {
        return <div className="p-4 text-center text-xs text-zinc-500">Carregando lojas...</div>;
    }

    return (
        <div className="px-4 mb-4">
            <div className="relative">
                <select
                    value={storeId || ''}
                    onChange={(e) => setStoreIdForSuperAdmin(e.target.value)}
                    className="w-full appearance-none bg-zinc-900/50 border border-white/5 rounded-lg p-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    aria-label="Selecionar loja para gerenciar"
                >
                    {allStores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
        </div>
    );
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({ siteInfo, activeView, setActiveView, handleLogout, isSuperAdmin, adminTheme = 'midnight', menuConfig, superAdminMenu }) => {
    const finalMenuConfig = isSuperAdmin ? {...superAdminMenu, ...menuConfig} : menuConfig;
    
    const [expandedMenu, setExpandedMenu] = useState<Record<string, boolean>>({
        'Análise e Inteligência': true,
        'Operações da Loja': true,
        'Marketing e CRM': true,
        'Gestão Interna': true,
        '🤖 Chatbot IA': false,
        'Visual da Loja': true,
        'Ferramentas Avançadas': true,
        'Configurações': false,
        '👑 Super Admin': true,
    });

    const toggleMenu = (menuTitle: string) => {
        setExpandedMenu(prev => ({ ...prev, [menuTitle]: !prev[menuTitle] }));
    };
    
    useEffect(() => {
        for (const [menuTitle, menu] of Object.entries(finalMenuConfig)) {
            // FIX: Cast `menu` to a more specific type to resolve 'items' not existing on 'unknown'.
            if (Object.keys((menu as { items: object }).items).includes(activeView)) {
                setExpandedMenu(prev => ({ ...prev, [menuTitle]: true }));
                break;
            }
        }
    }, [activeView, finalMenuConfig]);

    const safeLogout = () => {
        // Limpa parâmetros de URL que podem travar o contexto na loja errada
        if (window.location.hash.includes('?')) {
            const cleanPath = window.location.hash.split('?')[0];
            // Remove storeId from URL specifically if present
            window.history.replaceState(null, '', cleanPath);
        }
        
        handleLogout();
    };

    return (
        <div className={`hidden md:flex flex-col admin-sidebar-container sticky top-0 z-20 transition-all duration-300 ${adminTheme === 'intelli' || adminTheme === 'crypto' ? 'shadow-xl' : ''}`} style={{ width: 'var(--admin-sidebar-width, 280px)' }}>
            <div className="p-6 pt-8 mb-2 flex justify-center">
                <div className="opacity-100 transform transition-transform hover:scale-105">
                   <Logo logoUrl={siteInfo.logos.sidebar || siteInfo.logos.main} className="h-12 object-contain" />
                </div>
            </div>
            
            {isSuperAdmin && <StoreSwitcher />}
            
            <nav className="flex-1 px-4 pb-6 space-y-6 overflow-y-auto admin-content-area">
                {Object.entries(finalMenuConfig).map(([menuTitle, menu]) => (
                    <div key={menuTitle} className="group">
                         <button 
                            onClick={() => toggleMenu(menuTitle)}
                            className="w-full flex items-center justify-between px-2 py-1 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <span>{menuTitle}</span>
                            <ChevronDown size={12} className={`transition-transform duration-300 flex-shrink-0 ${expandedMenu[menuTitle] ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${expandedMenu[menuTitle] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {/* FIX: Cast `menu` to a more specific type to resolve 'items' not existing on 'unknown'. */}
                            {Object.entries((menu as { items: object }).items).map(([key, item]: [string, any]) => {
                                const isActive = activeView === key;
                                return (
                                    <button 
                                        key={key}
                                        onClick={() => setActiveView(key as AdminView)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group/item ${
                                            isActive 
                                            ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/5' 
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                                        }`}
                                    >
                                        <span className={`transition-colors flex-shrink-0 ${isActive ? 'text-[var(--admin-accent)]' : 'text-zinc-500 group-hover/item:text-zinc-300'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="truncate">{item.title}</span>
                                        {isActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[var(--admin-accent)]"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            
            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--admin-accent)] to-orange-600 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                            {isSuperAdmin ? 'SA' : 'ADM'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{isSuperAdmin ? 'Super Admin' : 'Administrador'}</span>
                            <span className="text-[10px] text-zinc-500">Online</span>
                        </div>
                    </div>
                    <button onClick={safeLogout} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0" title="Sair">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;
