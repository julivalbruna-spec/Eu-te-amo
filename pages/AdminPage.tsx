
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, getDocRef, getCollectionRef } from '../firebase';
import { SITE_INFO as defaultSiteInfo } from '../constants';
import { SiteInfo, Product, Category, Cliente, Employee } from '../types';
import { LogOut, Box, Settings, Tag, Cpu, RefreshCw, ExternalLink, User, Droplet, Image, Film, Type, ChevronDown, Briefcase, CreditCard, Tool, Activity, Shield, Zap, MessageSquare, BookOpen, HelpCircle, PieChart, Users, DollarSign, TrendingDown, Menu, X, Home, Grid, BarChart2, Gift, Layout, Database, Server, MessageCircle } from 'react-feather';
import CustomizationPanel from '../components/admin/CustomizationPanel';
import { ProductManager } from '../components/admin/ProductManager';
import CategoryManager from '../components/admin/CategoryManager';
import AIAssistantPanel from '../components/admin/AIAssistantPanel';
import DashboardPanel from '../components/admin/DashboardPanel';
import CrmClientesPanel from '../components/admin/CrmClientesPanel';
import Logo from '../components/Logo';
import SettingsPanel from '../components/admin/SettingsPanel';
import { PdvPanel } from '../components/admin/PdvPanel';
import HistoricoVendasPanel from '../components/admin/HistoricoVendasPanel';
import ServicosPanel from '../components/admin/ServicosPanel';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import AuditLogPanel from '../components/admin/AuditLogPanel';
import SmartDashboardPanel from '../components/admin/SmartDashboardPanel';
import ChatbotConfigPanel from '../components/admin/chatbot/ChatbotConfigPanel';
import KbManagerPanel from '../components/admin/chatbot/KbManagerPanel';
import FaqManagerPanel from '../components/admin/chatbot/FaqManagerPanel';
import ChatAnalysisPanel from '../components/admin/chatbot/ChatAnalysisPanel';
import CostsPanel from '../components/admin/finance/CostsPanel';
import EmployeesPanel from '../components/admin/hr/EmployeesPanel';
import MarketingPanel from '../components/admin/MarketingPanel';
import SorteiosPanel from '../components/admin/SorteiosPanel';
import MigrationWizard from '../components/admin/MigrationWizard';
import SuperAdminPanel from '../components/admin/SuperAdminPanel';
import PendingSalesPanel from '../components/admin/PendingSalesPanel';
import { useStore } from '../contexts/StoreContext';
import AdminSidebar from '../components/admin/AdminSidebar';


interface AdminPageProps {
  storeId: string;
}

type AdminView = 'dashboard' | 'smart_dashboard' | 'analytics' | 'ponto_de_venda' | 'historico_vendas' | 'vendas_pendentes' | 'produtos' | 'categorias' | 'clientes' | 'marketing' | 'sorteios' | 'ordens_de_servico' | 'funcionarios' | 'custos' | 'ai_assistant' | 'chatbot_analysis' | 'chatbot_config' | 'chatbot_kb' | 'chatbot_faq' | 'chatbot_aparencia' | 'identidade' | 'hero' | 'story' | 'textos_seo' | 'layout_loja' | 'informacoes' | 'taxas' | 'auditoria' | 'migracao' | 'super_admin_stores';

const menuConfig = {
  'Análise e Inteligência': {
    icon: <Zap size={18} />,
    items: {
      'smart_dashboard': { title: 'Smart Dashboard', icon: <Cpu size={18} /> },
      'dashboard': { title: 'Dashboard Geral', icon: <Activity size={18} /> },
      'analytics': { title: 'Análise de Vendas', icon: <PieChart size={18} /> },
    }
  },
  'Operações da Loja': {
    icon: <Briefcase size={18} />,
    items: {
      'ponto_de_venda': { title: 'PDV (Caixa)', icon: <CreditCard size={18} /> },
      'historico_vendas': { title: 'Histórico de Vendas', icon: <Briefcase size={18} /> },
      'vendas_pendentes': { title: 'Confirmar Vendas (Zap)', icon: <MessageCircle size={18} /> },
      'produtos': { title: 'Produtos', icon: <Box size={18} /> },
      'categorias': { title: 'Categorias', icon: <Tag size={18} /> },
      'ordens_de_servico': { title: 'Ordens de Serviço', icon: <Tool size={18} /> },
    }
  },
  'Marketing e CRM': {
    icon: <Zap size={18} />,
    items: {
        'clientes': { title: 'Clientes (CRM)', icon: <User size={18} /> },
        'marketing': { title: 'Segmentação & Campanhas', icon: <BarChart2 size={18} /> },
        'sorteios': { title: 'Sorteios', icon: <Gift size={18} /> },
    }
  },
  'Gestão Interna': {
    icon: <Users size={18} />,
    items: {
        'funcionarios': { title: 'Funcionários', icon: <Users size={18} /> },
        'custos': { title: 'Custos e Despesas', icon: <TrendingDown size={18} /> },
    }
  },
  '🤖 Chatbot IA': {
    icon: <Cpu size={18} />,
    items: {
      'ai_assistant': { title: 'Assistente Geral', icon: <MessageSquare size={18} /> },
      'chatbot_analysis': { title: 'Análise de Conversas', icon: <PieChart size={18} /> },
      'chatbot_config': { title: 'Treinamento da IA', icon: <Settings size={18} /> },
      'chatbot_kb': { title: 'Base de Conhecimento', icon: <BookOpen size={18} /> },
      'chatbot_faq': { title: 'FAQ & Sugestões', icon: <HelpCircle size={18} /> },
    }
  },
  'Visual da Loja': {
    icon: <Image size={18} />,
    items: {
      'layout_loja': { title: 'Layout da Loja', icon: <Layout size={18} /> },
      'identidade': { title: 'Identidade Visual', icon: <User size={18} /> },
      'hero': { title: 'Banners (Hero)', icon: <Image size={18} /> },
      'story': { title: 'Story Checkout', icon: <Film size={18} /> },
      'textos_seo': { title: 'SEO e Textos', icon: <Type size={18} /> },
      'chatbot_aparencia': { title: 'Widget Chatbot', icon: <Droplet size={18} /> },
    }
  },
  'Ferramentas Avançadas': {
    icon: <Tool size={18} />,
    items: {
      'migracao': { title: 'Migração Multi-Loja', icon: <Database size={18} /> },
    }
  },
  'Configurações': {
    icon: <Settings size={18} />,
    items: {
      'informacoes': { title: 'Dados da Loja', icon: <Briefcase size={18} /> },
      'taxas': { title: 'Taxas e Pagamento', icon: <CreditCard size={18} /> },
      'auditoria': { title: 'Logs de Auditoria', icon: <Shield size={18} /> },
    }
  }
};

const superAdminMenu = {
  '👑 Super Admin': {
    icon: <Server size={18} />,
    items: {
      'super_admin_stores': { title: 'Gerenciar Lojas', icon: <Grid size={18} /> },
    }
  }
};

const findViewConfig = (view: AdminView, isSuperAdmin: boolean): { title: string; icon: React.ReactNode } | null => {
    const combinedConfig = isSuperAdmin ? {...superAdminMenu, ...menuConfig} : menuConfig;
    for (const menu of Object.values(combinedConfig)) {
        // @ts-ignore
        if (menu.items[view]) {
            // @ts-ignore
            return menu.items[view];
        }
    }
    return null;
};

const VISUAL_VIEWS: AdminView[] = ['identidade', 'hero', 'story', 'textos_seo', 'chatbot_aparencia', 'layout_loja'];


// --- MOBILE NAVIGATION COMPONENTS ---

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  handleLogout: () => void;
  siteInfo: SiteInfo;
  isSuperAdmin: boolean;
}

const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose, activeView, setActiveView, handleLogout, siteInfo, isSuperAdmin }) => {
    const [expanded, setExpanded] = useState<string | null>(null);
    const finalMenuConfig = isSuperAdmin ? {...superAdminMenu, ...menuConfig} : menuConfig;

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950/95 backdrop-blur-xl animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                     <Logo logoUrl={siteInfo.logos.sidebar || siteInfo.logos.main} className="h-8" />
                </div>
                <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-zinc-800 border border-zinc-800 flex-shrink-0">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 admin-content-area">
                 {Object.entries(finalMenuConfig).map(([menuTitle, menu]) => (
                    <div key={menuTitle} className="rounded-xl overflow-hidden bg-zinc-900/30 border border-white/5">
                         <button 
                            onClick={() => setExpanded(expanded === menuTitle ? null : menuTitle)}
                            className="w-full flex items-center justify-between p-4 text-left font-bold text-zinc-300"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-[var(--admin-accent)] flex-shrink-0">{(menu as any).icon}</span>
                                {menuTitle}
                            </div>
                            <ChevronDown size={18} className={`transition-transform duration-300 flex-shrink-0 ${expanded === menuTitle ? 'rotate-180' : ''}`} />
                        </button>
                        {expanded === menuTitle && (
                            <div className="bg-black/20 border-t border-white/5 p-2 space-y-1">
                                {Object.entries((menu as any).items).map(([key, item]: [string, any]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setActiveView(key as AdminView);
                                            onClose();
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${activeView === key ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <span className="flex-shrink-0">{item.icon}</span>
                                        {item.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                 ))}
                 <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 mt-8 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 font-bold">
                    <LogOut size={20} className="flex-shrink-0" /> Sair do Painel
                 </button>
            </div>
        </div>
    );
};

interface AdminBottomNavProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
    onOpenMenu: () => void;
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeView, setActiveView, onOpenMenu }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex justify-between items-center z-50 pb-safe shadow-2xl">
            <button 
                onClick={() => setActiveView('smart_dashboard')}
                className={`flex flex-col items-center justify-center w-1/4 transition-colors ${activeView === 'smart_dashboard' ? 'text-[var(--admin-accent)]' : 'text-zinc-500'}`}
            >
                <Home size={22} strokeWidth={activeView === 'smart_dashboard' ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">Início</span>
            </button>
            <button 
                onClick={() => setActiveView('ponto_de_venda')}
                className={`flex flex-col items-center justify-center w-1/4 transition-colors ${activeView === 'ponto_de_venda' ? 'text-[var(--admin-accent)]' : 'text-zinc-500'}`}
            >
                <CreditCard size={22} strokeWidth={activeView === 'ponto_de_venda' ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">PDV</span>
            </button>
            <button 
                onClick={() => setActiveView('produtos')}
                className={`flex flex-col items-center justify-center w-1/4 transition-colors ${activeView === 'produtos' ? 'text-[var(--admin-accent)]' : 'text-zinc-500'}`}
            >
                <Box size={22} strokeWidth={activeView === 'produtos' ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">Produtos</span>
            </button>
            <button 
                onClick={onOpenMenu}
                className={`flex flex-col items-center justify-center w-1/4 text-zinc-500 hover:text-zinc-300`}
            >
                <Grid size={22} />
                <span className="text-[10px] font-medium mt-1">Menu</span>
            </button>
        </nav>
    );
};


interface AdminHeaderProps {
    title: string;
    viewIcon?: React.ReactNode;
    storeName: string;
}
const AdminHeader: React.FC<AdminHeaderProps> = ({ title, viewIcon, storeName }) => (
    <header className="sticky top-0 bg-[var(--admin-bg)]/80 backdrop-blur-xl py-5 z-40 px-6 md:px-10 border-b border-white/5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
            {viewIcon && (
                <div className="p-2.5 bg-zinc-900/50 border border-white/5 rounded-xl text-[var(--admin-accent)] shadow-lg flex-shrink-0">
                    {viewIcon}
                </div>
            )}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate max-w-[200px] md:max-w-none">
                    {title}
                </h1>
                <p className="text-xs text-zinc-500 hidden md:block">Painel Administrativo &bull; {storeName}</p>
            </div>
        </div>
        <a href={`/#/?storeId=${window.location.hash.split('storeId=')[1] || 'iphonerios'}`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white text-sm font-semibold py-2.5 px-4 rounded-lg border border-white/5 transition-all shadow-lg hover:shadow-zinc-900/50 hover:border-white/10">
          <span className="hidden md:inline">Ver Loja Online</span> <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0"/>
        </a>
    </header>
);

// --- MAIN PAGE COMPONENT ---

const AdminPage: React.FC<AdminPageProps> = ({ storeId }) => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
  const [activeView, setActiveView] = useState<AdminView>('smart_dashboard');
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Deep merge utility
  const deepMerge = useCallback((target: any, source: any): any => {
      const output = { ...target };
      if (target && typeof target === 'object' && source && typeof source === 'object') {
          Object.keys(source).forEach(key => {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                  output[key] = deepMerge(target[key], source[key]);
              } else {
                  output[key] = source[key];
              }
          });
      }
      return output;
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!storeId) {
      setDataLoading(false);
      showToast("ID da loja não encontrado. Recarregue a página.", 'error');
      return;
    }
    setDataLoading(true);
    const unsubscribers: (() => void)[] = [];

    const siteInfoRef = getDocRef('settings', 'siteInfo', storeId);
    unsubscribers.push(siteInfoRef.onSnapshot(doc => {
        setSiteInfo(prev => deepMerge(prev, doc.data() || {}));
    }));

    const productsQuery = getCollectionRef('products', storeId).orderBy('name');
    unsubscribers.push(productsQuery.onSnapshot(snapshot => {
        setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    }));

    const categoriesQuery = getCollectionRef('categories', storeId).orderBy('order');
    unsubscribers.push(categoriesQuery.onSnapshot(snapshot => {
        setCategories(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })) as Category[]);
    }));
    
    const clientesQuery = getCollectionRef('clientes', storeId).orderBy('nome');
    unsubscribers.push(clientesQuery.onSnapshot(snapshot => {
        setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Cliente[]);
    }));
    
    const employeesQuery = getCollectionRef('employees', storeId).orderBy('name');
    unsubscribers.push(employeesQuery.onSnapshot(snapshot => {
        setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[]);
    }));

    Promise.all([
        siteInfoRef.get(),
        productsQuery.get(),
        categoriesQuery.get(),
        clientesQuery.get(),
        employeesQuery.get()
    ]).then(() => setDataLoading(false)).catch(() => setDataLoading(false));

    return () => unsubscribers.forEach(unsub => unsub());
  }, [storeId, deepMerge, showToast]);

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/login'));
  };
  
  const refreshPreview = useCallback(() => {
    setPreviewKey(Date.now());
  }, []);

  useEffect(() => {
    if (VISUAL_VIEWS.includes(activeView)) {
        setIsPreviewOpen(true);
        refreshPreview();
    } else {
        setIsPreviewOpen(false);
    }
  }, [activeView, refreshPreview]);


  const renderContent = () => {
    if (dataLoading) {
      return <div className="flex justify-center items-center h-[calc(100vh-100px)]"><div className="preloader-spinner"></div></div>;
    }
    
    switch(activeView) {
      case 'super_admin_stores': return <SuperAdminPanel showToast={showToast} />;
      case 'smart_dashboard': return <SmartDashboardPanel storeId={storeId} allProducts={allProducts} categories={categories} siteInfo={siteInfo} setActiveView={setActiveView} showToast={showToast} uploadImage={window.uploadImage} />;
      case 'dashboard': return <DashboardPanel storeId={storeId} />;
      case 'analytics': return <AnalyticsPanel storeId={storeId} allProducts={allProducts} />;
      case 'ponto_de_venda': return <PdvPanel storeId={storeId} allProducts={allProducts} siteInfo={siteInfo} clientes={clientes} employees={employees} showToast={showToast} />;
      case 'historico_vendas': return <HistoricoVendasPanel storeId={storeId} clientes={clientes} showToast={showToast} />;
      case 'vendas_pendentes': return <PendingSalesPanel storeId={storeId} showToast={showToast} />;
      case 'produtos': return <ProductManager storeId={storeId} showToast={showToast} uploadImage={window.uploadImage} />;
      case 'categorias': return <CategoryManager storeId={storeId} showToast={showToast} />;
      case 'clientes': return <CrmClientesPanel storeId={storeId} showToast={showToast} uploadImage={window.uploadImage} />;
      case 'marketing': return <MarketingPanel storeId={storeId} clientes={clientes} allProducts={allProducts} categories={categories} showToast={showToast} siteInfo={siteInfo} />;
      case 'sorteios': return <SorteiosPanel storeId={storeId} showToast={showToast} clientes={clientes} />;
      case 'ordens_de_servico': return <ServicosPanel storeId={storeId} clientes={clientes} showToast={showToast} />;
      case 'funcionarios': return <EmployeesPanel storeId={storeId} showToast={showToast} />;
      case 'custos': return <CostsPanel storeId={storeId} showToast={showToast} />;
      case 'ai_assistant': return <AIAssistantPanel storeId={storeId} showToast={showToast} uploadImage={window.uploadImage} allProducts={allProducts} categories={categories} siteInfo={siteInfo} setActiveView={setActiveView} />;
      case 'chatbot_config': return <ChatbotConfigPanel storeId={storeId} showToast={showToast} siteInfo={siteInfo} />;
      case 'chatbot_kb': return <KbManagerPanel storeId={storeId} showToast={showToast} />;
      case 'chatbot_faq': return <FaqManagerPanel storeId={storeId} showToast={showToast} />;
      case 'chatbot_analysis': return <ChatAnalysisPanel storeId={storeId} showToast={showToast} />;
      case 'identidade':
      case 'hero':
      case 'story':
      case 'textos_seo':
      case 'chatbot_aparencia':
      case 'layout_loja':
        return <CustomizationPanel key={storeId} storeId={storeId} section={activeView} showToast={showToast} uploadImage={window.uploadImage} />;
      case 'informacoes':
      case 'taxas':
        return <SettingsPanel key={storeId} storeId={storeId} section={activeView} showToast={showToast} />;
      case 'auditoria': return <AuditLogPanel storeId={storeId} siteInfo={siteInfo} />;
      case 'migracao': return <MigrationWizard showToast={showToast} />;
      default: return <div className="p-8 text-gray-400">Selecione uma opção no menu.</div>;
    }
  };
  
  const activeViewConfig = findViewConfig(activeView, isSuperAdmin);

  return (
    <div className="admin-page-background min-h-screen text-zinc-100 flex flex-col md:flex-row overflow-x-hidden font-sans antialiased" data-admin-theme={siteInfo.adminTheme || 'midnight'}>
      
      <AdminSidebar siteInfo={siteInfo} activeView={activeView} setActiveView={setActiveView} handleLogout={handleLogout} isSuperAdmin={isSuperAdmin} adminTheme={siteInfo.adminTheme} menuConfig={menuConfig} superAdminMenu={superAdminMenu} />
      
      <MobileMenuDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          activeView={activeView} 
          setActiveView={setActiveView} 
          handleLogout={handleLogout}
          siteInfo={siteInfo}
          isSuperAdmin={isSuperAdmin}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out ${isPreviewOpen ? 'md:mr-[480px]' : ''}`}>
        <AdminHeader title={activeViewConfig?.title || 'Painel'} viewIcon={activeViewConfig?.icon} storeName={siteInfo.storeName} />
        
        <main className="flex-1 p-6 md:p-10 pb-24 md:pb-12 overflow-y-auto admin-content-area">
            <div className="max-w-7xl mx-auto w-full animate-fade-in">
                {renderContent()}
            </div>
        </main>
      </div>

      <AdminBottomNav activeView={activeView} setActiveView={setActiveView} onOpenMenu={() => setIsMobileMenuOpen(true)} />

      {isPreviewOpen && (
        <aside className="hidden md:flex flex-col fixed right-0 top-0 h-full w-[480px] bg-[#050505] border-l border-white/5 z-30 shadow-2xl transition-all duration-500">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01] backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="relative">
                         <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
                    </div>
                    <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-widest">Live Preview</h3>
                </div>
                <button 
                    onClick={refreshPreview} 
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                    title="Recarregar Preview"
                >
                    <RefreshCw size={16} />
                </button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#000] relative overflow-hidden">
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                      style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                 </div>
                
                <div className="admin-preview-mockup transform scale-[0.85] origin-center transition-all duration-500 shadow-2xl">
                    <iframe
                        key={previewKey}
                        src={activeView === 'story' ? `/#/checkout-story/_preview?storeId=${storeId}` : `/#/?storeId=${storeId}`}
                        className="phone-preview-screen"
                        title="Live Preview"
                    ></iframe>
                </div>
            </div>
        </aside>
      )}

      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-fade-in border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success' 
            ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-100 shadow-emerald-900/30' 
            : 'bg-red-900/80 border-red-500/30 text-red-100 shadow-red-900/30'
        }`}>
          {toast.type === 'success' ? <div className="p-1 bg-emerald-500 rounded-full flex-shrink-0"><span className="text-black block w-2 h-2 rounded-full"></span></div> : <Shield size={18} className="flex-shrink-0"/>}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
