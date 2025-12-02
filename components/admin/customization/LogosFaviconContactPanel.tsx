
import React, { useState } from 'react';
import { SiteInfo, SiteLogos } from '../../../types';
import { Upload, ChevronDown, ChevronUp } from 'react-feather';
import ImageProcessingModal from '../ImageProcessingModal';

interface LogosFaviconContactPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4"><span className="bg-zinc-800 text-white px-3 py-1 rounded-md">{title}</span></h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const AdvancedOptionsToggle: React.FC<{ title?: string; children: React.ReactNode }> = ({ title = "Opções Avançadas", children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 rounded-lg text-sm font-semibold text-gray-300 bg-black hover:bg-gray-900/70 transition-colors border border-gray-800"
            >
                <span>{isOpen ? 'Ocultar' : 'Mostrar'} {title}</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <div className={`advanced-options-content ${isOpen ? 'visible' : ''}`}>
                <div className="pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};


const LogosFaviconContactPanel: React.FC<LogosFaviconContactPanelProps> = ({ siteInfo, updateSiteInfo, uploadImage, showToast }) => {
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number | null }>({});
    
    // State for Favicon Processing
    const [isProcessingFavicon, setIsProcessingFavicon] = useState(false);
    const [faviconFileToProcess, setFaviconFileToProcess] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, section: keyof SiteInfo, field: string) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        updateSiteInfo(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as object),
                [field]: value
            }
        }));
    };

    const handleInstagramHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const handle = e.target.value;
        const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
        const url = cleanHandle ? `https://www.instagram.com/${cleanHandle}/` : '';
        
        updateSiteInfo(prev => ({
            ...prev,
            links: {
                ...prev.links,
                instagramHandle: handle,
                instagram: url,
            }
        }));
    };

    const handleLogoUpload = async (file: File, location: keyof SiteLogos) => {
        try {
            setUploadProgress(prev => ({...prev, [location]: 0}));
            // Use 'hero' type for logos to ensure higher quality and proper transparency handling
            const url = await window.uploadImage(file, (progress) => {
                setUploadProgress(prev => ({...prev, [location]: progress}));
            }, 'hero');
            
            updateSiteInfo(prev => ({
                ...prev,
                logos: { ...prev.logos, [location]: url }
            }));
            showToast('Logo enviada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar logo.', 'error');
        } finally {
            setUploadProgress(prev => ({...prev, [location]: null}));
        }
    };

    const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>, location: keyof SiteLogos) => {
        const { value } = e.target;
        updateSiteInfo(prev => ({
            ...prev,
            logos: { ...prev.logos, [location]: value }
        }));
    };
    
    const handleFaviconSelect = (file: File) => {
        setFaviconFileToProcess(file);
        setIsProcessingFavicon(true);
    };

    const handleFaviconProcessed = async (file: File) => {
        setIsProcessingFavicon(false);
        setFaviconFileToProcess(null);
        try {
            setUploadProgress(prev => ({...prev, favicon: 0}));
            const url = await uploadImage(file, (progress) => {
                setUploadProgress(prev => ({...prev, favicon: progress}));
            });
            updateSiteInfo(prev => ({ ...prev, faviconUrl: url }));
            showToast('Favicon atualizado com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar favicon.', 'error');
        } finally {
            setUploadProgress(prev => ({...prev, favicon: null}));
        }
    };

    return (
        <div className="space-y-4">
            <ImageProcessingModal 
                isOpen={isProcessingFavicon}
                onClose={() => setIsProcessingFavicon(false)}
                imageFile={faviconFileToProcess}
                onConfirm={handleFaviconProcessed}
                showToast={showToast}
                title="Editar Favicon"
            />

            <p className="text-sm text-gray-400 -mt-2 mb-4">Gerencie as imagens da sua marca e as informações essenciais de contato da sua loja.</p>

            <SubSection title="Logos da Marca">
                <div className="space-y-4 bg-black/30 p-4 rounded-md border border-gray-800">
                    <h4 className="font-semibold">Logo Principal (Padrão)</h4>
                    <p className="text-xs text-gray-500 -mt-3 mb-2">Usada como fallback se as outras não forem definidas.</p>
                    {siteInfo.logos.main && <img src={siteInfo.logos.main} alt="Preview Logo Principal" className="h-16 mb-2 bg-gray-800 p-1 rounded-md object-contain"/>}
                     <input type="file" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], 'main')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                    {uploadProgress['main'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['main']}%`}}></div></div>}
                    <input type="text" value={siteInfo.logos.main} onChange={(e) => handleLogoUrlChange(e, 'main')} placeholder="Ou cole a URL da imagem aqui" className="mt-2 w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
                </div>
                
                <AdvancedOptionsToggle title="Logos para contextos específicos">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <div className="space-y-2 bg-black/30 p-4 rounded-md border border-gray-800">
                            <h4 className="font-semibold">Logo do Cabeçalho</h4>
                            <p className="text-xs text-gray-500">Ideal para fundo claro/transparente no topo da página.</p>
                            {siteInfo.logos.header && <img src={siteInfo.logos.header} alt="Preview Logo Cabeçalho" className="h-16 bg-gray-200 p-1 rounded-md object-contain"/>}
                            <input type="file" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], 'header')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                            {uploadProgress['header'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['header']}%`}}></div></div>}
                            <input type="text" value={siteInfo.logos.header} onChange={(e) => handleLogoUrlChange(e, 'header')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" placeholder="Usar logo principal"/>
                        </div>
                        <div className="space-y-2 bg-black/30 p-4 rounded-md border border-gray-800">
                            <h4 className="font-semibold">Logo do Cabeçalho (Rolado)</h4>
                            <p className="text-xs text-gray-500">Logo para usar quando o usuário rola a página.</p>
                            {siteInfo.logos.headerScrolled && <img src={siteInfo.logos.headerScrolled} alt="Preview Logo Cabeçalho Rolado" className="h-16 bg-gray-200 p-1 rounded-md object-contain"/>}
                            <input type="file" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], 'headerScrolled')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                            {uploadProgress['headerScrolled'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['headerScrolled']}%`}}></div></div>}
                            <input type="text" value={siteInfo.logos.headerScrolled} onChange={(e) => handleLogoUrlChange(e, 'headerScrolled')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" placeholder="Usar logo do cabeçalho padrão"/>
                        </div>
                        <div className="space-y-2 bg-black/30 p-4 rounded-md border border-gray-800">
                            <h4 className="font-semibold">Logo do Menu Lateral</h4>
                            <p className="text-xs text-gray-500">Ideal para fundo escuro.</p>
                            {siteInfo.logos.sidebar && <img src={siteInfo.logos.sidebar} alt="Preview Logo Menu" className="h-16 bg-gray-800 p-1 rounded-md object-contain"/>}
                            <input type="file" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], 'sidebar')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                             {uploadProgress['sidebar'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['sidebar']}%`}}></div></div>}
                            <input type="text" value={siteInfo.logos.sidebar} onChange={(e) => handleLogoUrlChange(e, 'sidebar')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" placeholder="Usar logo principal"/>
                        </div>
                         <div className="space-y-2 bg-black/30 p-4 rounded-md border border-gray-800">
                            <h4 className="font-semibold">Página de Login</h4>
                            {siteInfo.logos.login && <img src={siteInfo.logos.login} alt="Preview Logo Login" className="h-16 bg-gray-800 p-1 rounded-md object-contain"/>}
                            <input type="file" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], 'login')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                            {uploadProgress['login'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['login']}%`}}></div></div>}
                            <input type="text" value={siteInfo.logos.login} onChange={(e) => handleLogoUrlChange(e, 'login')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" placeholder="Usar logo principal"/>
                        </div>
                        <div className="space-y-2 bg-black/30 p-4 rounded-md border border-gray-800">
                            <h4 className="font-semibold">Página de Bio</h4>
                            {siteInfo.logos.bio && <img src={siteInfo.logos.bio} alt="Preview Logo Bio" className="h-16 bg-gray-800 p-1 rounded-md object-contain"/>}
                            <input type="file" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], 'bio')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                            {uploadProgress['bio'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['bio']}%`}}></div></div>}
                            <input type="text" value={siteInfo.logos.bio} onChange={(e) => handleLogoUrlChange(e, 'bio')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" placeholder="Usar logo principal"/>
                        </div>
                    </div>
                </AdvancedOptionsToggle>
            </SubSection>
            
            <SubSection title="Favicon">
                 <p className="text-sm text-gray-400 -mt-2 mb-4">O ícone que aparece na aba do navegador. Ao selecionar um arquivo, você poderá escolher entre <strong>Preencher (Rápido)</strong> ou <strong>Fundir com IA</strong> para adicionar um fundo colorido, caso seu ícone seja transparente.</p>
                 <div className="space-y-2 bg-black/30 p-4 rounded-md border border-gray-800">
                     {siteInfo.faviconUrl && <img src={siteInfo.faviconUrl} alt="Preview Favicon" className="h-10 w-10 bg-gray-200 p-1 rounded-md object-contain"/>}
                    <input type="file" onChange={(e) => e.target.files && handleFaviconSelect(e.target.files[0])} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"/>
                    {uploadProgress['favicon'] != null && <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${uploadProgress['favicon']}%`}}></div></div>}
                    <input type="text" value={siteInfo.faviconUrl} onChange={e => updateSiteInfo(p => ({...p, faviconUrl: e.target.value}))} placeholder="Ou cole a URL do ícone aqui" className="mt-2 w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm" />
                </div>
            </SubSection>

            <SubSection title="Informações de Contato">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/30 p-4 rounded-md border border-gray-800">
                     <div>
                        <label className="text-sm text-gray-400 block mb-1">WhatsApp (Vendas)</label>
                        <input type="text" placeholder="5575912345678" value={siteInfo.links.whatsappSales} onChange={(e) => handleInputChange(e, 'links', 'whatsappSales')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"/>
                     </div>
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Usuário do Instagram (@)</label>
                        <input type="text" placeholder="@seuusuario" value={siteInfo.links.instagramHandle} onChange={handleInstagramHandleChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"/>
                     </div>
                      <div className="md:col-span-2">
                        <label className="text-sm text-gray-400 block mb-1">URL do Instagram (gerado automaticamente)</label>
                        <input type="text" placeholder="https://instagram.com/seuusuario" value={siteInfo.links.instagram} onChange={(e) => handleInputChange(e, 'links', 'instagram')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"/>
                     </div>
                </div>
                 <AdvancedOptionsToggle title="Contatos Secundários">
                    <div className="bg-black/30 p-4 rounded-md border border-gray-800 space-y-4">
                         <div>
                            <label className="text-sm text-gray-400 block mb-1">WhatsApp (Suporte)</label>
                            <input type="text" placeholder="5575912345678" value={siteInfo.links.whatsappSupport} onChange={(e) => handleInputChange(e, 'links', 'whatsappSupport')} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"/>
                         </div>
                         <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                            <input 
                                type="checkbox" 
                                id="showSupport"
                                checked={siteInfo.links.showSupport !== false}
                                onChange={(e) => handleInputChange(e, 'links', 'showSupport')}
                                className="w-4 h-4 rounded border-gray-600 bg-black text-yellow-500 focus:ring-yellow-500"
                            />
                            <label htmlFor="showSupport" className="text-sm text-gray-300 font-medium cursor-pointer">Mostrar Contato de Suporte no Site</label>
                         </div>
                    </div>
                </AdvancedOptionsToggle>
            </SubSection>
        </div>
    );
};

export default LogosFaviconContactPanel;
