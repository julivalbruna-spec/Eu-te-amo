
import React, { useState, useRef } from 'react';
import { SiteInfo, HeroInfo, Category, CarouselItem, CategoryId, AuroraElement, BuyButtonConfig, BannerInfo } from '../../../types';
import SliderInput from '../SliderInput';
import { ChevronDown, ChevronUp, Plus, Trash2, Cpu, Film, Box, Sun, Zap, Layout, Activity, Download, Upload, FilePlus, Image, Video, Loader } from 'react-feather';
import AIHeroWizard from '../AIHeroWizard';
import HeroVideoGenerator from '../HeroVideoGenerator';

// Reusable Prop Interface for Settings Components
interface AnimationSettingsProps {
    hero: HeroInfo;
    updateHeroField: (index: number, field: keyof HeroInfo, value: any) => void;
    heroIndex: number;
}

// --- Specific Settings Components ---

const RoletaSettings: React.FC<AnimationSettingsProps> = ({ hero, updateHeroField, heroIndex }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderInput label="Altura (Mobile)" value={hero.carouselHeightMobile} onChange={v => updateHeroField(heroIndex, 'carouselHeightMobile', v)} min={100} max={500} unit="px" placeholder="240" />
        <SliderInput label="Altura (Desktop)" value={hero.carouselHeightDesktop} onChange={v => updateHeroField(heroIndex, 'carouselHeightDesktop', v)} min={150} max={600} unit="px" placeholder="300" />
        <SliderInput label="Tamanho Imagem (Mobile)" value={hero.carouselImageSizeMobile} onChange={v => updateHeroField(heroIndex, 'carouselImageSizeMobile', v)} min={10} max={100} unit="%" placeholder="74" />
        <SliderInput label="Tamanho Imagem (Desktop)" value={hero.carouselImageSizeDesktop} onChange={v => updateHeroField(heroIndex, 'carouselImageSizeDesktop', v)} min={10} max={100} unit="%" placeholder="80" />
        <SliderInput label="Espaçamento (Mobile)" value={hero.carouselItemSpreadMobile} onChange={v => updateHeroField(heroIndex, 'carouselItemSpreadMobile', v)} min={50} max={300} unit="px" placeholder="110" />
        <SliderInput label="Espaçamento (Desktop)" value={hero.carouselItemSpreadDesktop} onChange={v => updateHeroField(heroIndex, 'carouselItemSpreadDesktop', v)} min={100} max={500} unit="px" placeholder="280" />
        <div className="md:col-span-2">
            <SliderInput label="Duração da Rotação Completa" value={hero.carouselAnimationDuration} onChange={v => updateHeroField(heroIndex, 'carouselAnimationDuration', v)} min={5} max={60} unit="s" placeholder="24" />
        </div>
    </div>
);

const FocusLoopSettings: React.FC<AnimationSettingsProps> = ({ hero, updateHeroField, heroIndex }) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderInput label="Altura (Mobile)" value={hero.carouselHeightMobile} onChange={v => updateHeroField(heroIndex, 'carouselHeightMobile', v)} min={100} max={500} unit="px" placeholder="240" />
        <SliderInput label="Altura (Desktop)" value={hero.carouselHeightDesktop} onChange={v => updateHeroField(heroIndex, 'carouselHeightDesktop', v)} min={150} max={600} unit="px" placeholder="300" />
        <SliderInput label="Intervalo entre Imagens" value={hero.focusLoopInterval} onChange={v => updateHeroField(heroIndex, 'focusLoopInterval', v)} min={1000} max={10000} unit="ms" placeholder="3500" />
        <SliderInput label="Duração da Transição" value={hero.focusLoopTransitionDuration} onChange={v => updateHeroField(heroIndex, 'focusLoopTransitionDuration', v)} min={300} max={2000} unit="ms" placeholder="700" />
    </div>
);

const CrossfadeSettings: React.FC<AnimationSettingsProps> = ({ hero, updateHeroField, heroIndex }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderInput label="Altura (Mobile)" value={hero.carouselHeightMobile} onChange={v => updateHeroField(heroIndex, 'carouselHeightMobile', v)} min={100} max={500} unit="px" placeholder="240" />
        <SliderInput label="Altura (Desktop)" value={hero.carouselHeightDesktop} onChange={v => updateHeroField(heroIndex, 'carouselHeightDesktop', v)} min={150} max={600} unit="px" placeholder="300" />
        <SliderInput label="Intervalo entre Imagens" value={hero.crossfadeInterval} onChange={v => updateHeroField(heroIndex, 'crossfadeInterval', v)} min={1000} max={10000} unit="ms" placeholder="3500" />
        <SliderInput label="Duração da Transição" value={hero.crossfadeDuration} onChange={v => updateHeroField(heroIndex, 'crossfadeDuration', v)} min={0.5} max={5} step={0.1} unit="s" placeholder="1.2" />
    </div>
);

const MotionBlurSettings: React.FC<AnimationSettingsProps> = ({ hero, updateHeroField, heroIndex }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderInput label="Altura (Mobile)" value={hero.carouselHeightMobile} onChange={v => updateHeroField(heroIndex, 'carouselHeightMobile', v)} min={100} max={500} unit="px" placeholder="240" />
        <SliderInput label="Altura (Desktop)" value={hero.carouselHeightDesktop} onChange={v => updateHeroField(heroIndex, 'carouselHeightDesktop', v)} min={150} max={600} unit="px" placeholder="300" />
        <SliderInput label="Intervalo entre Imagens" value={hero.motionBlurInterval} onChange={v => updateHeroField(heroIndex, 'motionBlurInterval', v)} min={1000} max={10000} unit="ms" placeholder="3500" />
        <SliderInput label="Duração da Transição" value={hero.motionBlurDuration} onChange={v => updateHeroField(heroIndex, 'motionBlurDuration', v)} min={0.3} max={2} step={0.1} unit="s" placeholder="0.7" />
        <div className="md:col-span-2">
            <SliderInput label="Intensidade do Blur" value={hero.motionBlurAmount} onChange={v => updateHeroField(heroIndex, 'motionBlurAmount', v)} min={0} max={30} unit="px" placeholder="12" />
        </div>
    </div>
);

const StaticSettings: React.FC<AnimationSettingsProps> = ({ hero, updateHeroField, heroIndex }) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderInput label="Altura (Mobile)" value={hero.carouselHeightMobile} onChange={v => updateHeroField(heroIndex, 'carouselHeightMobile', v)} min={100} max={500} unit="px" placeholder="240" />
        <SliderInput label="Altura (Desktop)" value={hero.carouselHeightDesktop} onChange={v => updateHeroField(heroIndex, 'carouselHeightDesktop', v)} min={150} max={600} unit="px" placeholder="300" />
    </div>
);

const FloatingSettings: React.FC<AnimationSettingsProps> = ({ hero, updateHeroField, heroIndex }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderInput label="Altura do Contêiner" value={hero.carouselHeightDesktop} onChange={v => updateHeroField(heroIndex, 'carouselHeightDesktop', v)} min={150} max={600} unit="px" placeholder="300" />
        <SliderInput label="Tamanho da Imagem" value={hero.carouselImageSizeDesktop} onChange={v => updateHeroField(heroIndex, 'carouselImageSizeDesktop', v)} min={10} max={100} unit="%" placeholder="80" />
        <SliderInput label="Duração da Flutuação" value={hero.floatingDuration} onChange={v => updateHeroField(heroIndex, 'floatingDuration', v)} min={1} max={10} step={0.5} unit="s" placeholder="4" />
        <SliderInput label="Altura da Flutuação" value={hero.floatingHeight} onChange={v => updateHeroField(heroIndex, 'floatingHeight', v)} min={-50} max={50} unit="px" placeholder="-12" />
    </div>
);

// Fallback for simple animations
const SimpleSettings: React.FC<AnimationSettingsProps> = ({ hero, updateHeroField, heroIndex }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderInput label="Altura (Mobile)" value={hero.carouselHeightMobile} onChange={v => updateHeroField(heroIndex, 'carouselHeightMobile', v)} min={100} max={500} unit="px" placeholder="240" />
        <SliderInput label="Altura (Desktop)" value={hero.carouselHeightDesktop} onChange={v => updateHeroField(heroIndex, 'carouselHeightDesktop', v)} min={150} max={600} unit="px" placeholder="300" />
    </div>
);


// --- Main Panel and Other Components ---

interface HeroSectionPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    categories: Category[];
    showToast: (message: string, type: 'success' | 'error') => void;
    uploadImage: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (value: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer gap-2">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-yellow-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
        <span className="text-xs font-semibold text-gray-300">{label}</span>
    </label>
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

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-4 mt-4 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-base mb-3 text-gray-200">{title}</h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; }> = ({ label, value, onChange }) => (
    <div>
        <label className="text-sm text-gray-400 block mb-1">{label}</label>
        <div className="flex items-center gap-2 bg-black border border-[#27272a] rounded-lg p-1">
            <input 
                type="color" 
                value={(value === 'transparent' || !value) ? '#000000' : value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-8 h-8 bg-transparent border-none cursor-pointer" 
                disabled={value === 'transparent'}
            />
            <div className="relative flex-grow">
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)} 
                    placeholder="Vazio = Padrão"
                    className="w-full bg-transparent text-sm focus:outline-none placeholder-zinc-700 pr-16" 
                />
                {value !== 'transparent' && (
                    <button 
                        onClick={() => onChange('transparent')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-2 py-0.5 rounded transition-colors"
                        title="Definir como Transparente"
                    >
                        Sem Borda
                    </button>
                )}
            </div>
        </div>
    </div>
);

const RadioCard: React.FC<{ 
    selected: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string;
}> = ({ selected, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all w-full text-center ${selected ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'}`}
    >
        <div className={`mb-1.5 ${selected ? 'text-blue-400' : 'text-zinc-500'}`}>
            {icon}
        </div>
        <span className="text-xs font-bold">{label}</span>
    </button>
);

const HeroSectionPanel: React.FC<HeroSectionPanelProps> = ({ siteInfo, updateSiteInfo, categories, showToast, uploadImage }) => {
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number | null }>({});
    const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const singleHeroImportRef = useRef<HTMLInputElement>(null);
    
    const [videoGeneratorOpen, setVideoGeneratorOpen] = useState(false);
    const [heroForVideo, setHeroForVideo] = useState<HeroInfo | null>(null);
    
    const updateHeroField = (index: number, field: keyof HeroInfo, value: any) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        (newHeroes[index] as any)[field] = value;
        updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
    };

    const updateHeroButtonConfig = (heroIndex: number, key: keyof BuyButtonConfig, value: any) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        const hero = newHeroes[heroIndex];
        
        // Ensure buttonStyleConfig exists
        const currentConfig = hero.buttonStyleConfig || {
            stylePreset: 'standard',
            primaryColor: hero.buttonPrimaryBackgroundColor || '#ffae00',
            secondaryColor: '#e69c00',
            highlightColor: '#ffffff',
            textColor: hero.buttonPrimaryTextColor || '#000000'
        };

        hero.buttonStyleConfig = { ...currentConfig, [key]: value };
        updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
    };

    const updateHeroAuroraElement = (heroIndex: number, elementIndex: number, field: keyof AuroraElement, value: any) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        const hero = newHeroes[heroIndex];
        if (hero && hero.auroraElements) {
            const newElements = [...hero.auroraElements];
            (newElements[elementIndex] as any)[field] = value;
            hero.auroraElements = newElements;
            updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
        }
    };
    
    const addHeroAuroraElement = (heroIndex: number) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        const hero = newHeroes[heroIndex];
        if (hero) {
            const newElement: AuroraElement = { color: '#ffae00', sizeMobile: 400, sizeDesktop: 500 };
            hero.auroraElements = [...(hero.auroraElements || []), newElement];
            updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
        }
    };

    const removeHeroAuroraElement = (heroIndex: number, elementIndex: number) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        const hero = newHeroes[heroIndex];
        if (hero && hero.auroraElements) {
            hero.auroraElements = hero.auroraElements.filter((_, i) => i !== elementIndex);
            updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
        }
    };

    const updateCarouselItem = (heroIndex: number, itemIndex: number, field: keyof CarouselItem, value: any) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        const hero = newHeroes[heroIndex];
        if (hero && hero.carouselItems) {
            const newItems = [...hero.carouselItems];
            (newItems[itemIndex] as any)[field] = value;
            hero.carouselItems = newItems;
            updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
        }
    };
    
    const addCarouselItem = (heroIndex: number) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        const hero = newHeroes[heroIndex];
        if (hero) {
            const newItem: CarouselItem = { src: '', alt: 'Nova Imagem' };
            hero.carouselItems = [...(hero.carouselItems || []), newItem];
            updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
        }
    };

    const removeCarouselItem = (heroIndex: number, itemIndex: number) => {
        const newHeroes = [...(siteInfo.heroes || [])];
        const hero = newHeroes[heroIndex];
        if (hero && hero.carouselItems) {
            hero.carouselItems = hero.carouselItems.filter((_, i) => i !== itemIndex);
            updateSiteInfo(prev => ({ ...prev, heroes: newHeroes }));
        }
    };
    
    const handleAiHeroSave = (newHero: HeroInfo) => {
        updateSiteInfo(prev => ({
            ...prev,
            heroes: [newHero, ...(prev.heroes || [])]
        }));
        showToast("Hero criado com IA com sucesso!", 'success');
    };
    
    const handleDeleteHero = (index: number) => {
        if (window.confirm("Tem certeza que deseja remover este Hero?")) {
            updateSiteInfo(prev => ({
                ...prev,
                heroes: (prev.heroes || []).filter((_, i) => i !== index)
            }));
        }
    };
    
    const handleOpenVideoGenerator = (hero: HeroInfo) => {
        setHeroForVideo(hero);
        setVideoGeneratorOpen(true);
    };

    const handleToggleAllHeroes = (isEnabled: boolean) => {
        updateSiteInfo(prev => ({
            ...prev,
            heroes: (prev.heroes || []).map(hero => ({ ...hero, enabled: isEnabled }))
        }));
    };

    // --- Banner Management Logic ---
    const updateBannerField = (index: number, field: keyof BannerInfo, value: any) => {
        const newBanners = [...(siteInfo.banners || [])];
        (newBanners[index] as any)[field] = value;
        updateSiteInfo(prev => ({ ...prev, banners: newBanners }));
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const key = `banner-${index}`;
        try {
            setUploadProgress(prev => ({ ...prev, [key]: 0 }));
            // Use 'hero' type for better quality on banners
            const url = await window.uploadImage(file, (p) => setUploadProgress(prev => ({ ...prev, [key]: p })), 'hero');
            updateBannerField(index, 'imageUrl', url);
            showToast('Banner enviado com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar banner.', 'error');
        } finally {
            setUploadProgress(prev => ({ ...prev, [key]: null }));
        }
    };

    const addBanner = () => {
        const newBanner: BannerInfo = {
            id: `banner-${Date.now()}`,
            enabled: true,
            imageUrl: '',
            linkUrl: '',
            type: 'image',
            // Default props to satisfy BannerInfo type
            typingEffectTarget: 'none',
            title: '',
            phrases: [],
            buttonPrimary: '',
            buttonSecondary: '',
            buttonPrimaryCategory: 'todos',
            buttonSecondaryCategory: 'todos',
            carouselTitle: '',
            carouselItems: [],
            bonusMinutesEnabled: false
        };
        updateSiteInfo(prev => ({ ...prev, banners: [...(prev.banners || []), newBanner] }));
    };

    const removeBanner = (index: number) => {
        if (window.confirm('Remover este banner?')) {
            const newBanners = (siteInfo.banners || []).filter((_, i) => i !== index);
            updateSiteInfo(prev => ({ ...prev, banners: newBanners }));
        }
    };


    // --- Export/Import Logic ---
    const handleExportHeroes = () => {
        try {
            const dataStr = JSON.stringify(siteInfo.heroes || [], null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `heroes_config_${siteInfo.storeName.replace(/\s+/g, '_').toLowerCase()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("Configuração de Heroes exportada!", "success");
        } catch (error) {
            console.error("Export error:", error);
            showToast("Erro ao exportar configuração.", "error");
        }
    };

    const handleImportHeroes = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (Array.isArray(json)) {
                    updateSiteInfo(prev => ({ ...prev, heroes: json }));
                    showToast("Configuração de Heroes importada com sucesso!", "success");
                } else {
                    showToast("Arquivo inválido. O formato deve ser um array de Heroes.", "error");
                }
            } catch (error) {
                console.error("Import error:", error);
                showToast("Erro ao ler o arquivo. Verifique se é um JSON válido.", "error");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleImportSingleHero = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                
                let newHeroes: HeroInfo[] = [];
                if (Array.isArray(json)) {
                    // If array, take all of them
                    newHeroes = json;
                } else if (typeof json === 'object' && json !== null) {
                    // If single object, wrap in array
                    newHeroes = [json as HeroInfo];
                } else {
                     throw new Error("Formato inválido");
                }
                
                // Assign new IDs to avoid conflicts
                newHeroes = newHeroes.map(h => ({
                    ...h,
                    id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    enabled: true
                }));

                updateSiteInfo(prev => ({
                    ...prev,
                    heroes: [...newHeroes, ...(prev.heroes || [])] // Prepend new heroes
                }));

                showToast(`${newHeroes.length} Hero(s) importado(s) com sucesso!`, "success");
            } catch (error) {
                console.error("Import error:", error);
                showToast("Erro ao importar Hero. Arquivo inválido.", "error");
            }
            if (singleHeroImportRef.current) singleHeroImportRef.current.value = '';
        };
        reader.readAsText(file);
    };


    const areAnyHeroesEnabled = siteInfo.heroes?.some(h => h.enabled !== false);


    const handleCarouselImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, heroIndex: number, itemIndex: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const progressKey = `${heroIndex}-${itemIndex}`;

        try {
            setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
            // Pass 'hero' optimization type to preserve high quality
            const url = await window.uploadImage(file, (progress) => {
                setUploadProgress(prev => ({ ...prev, [progressKey]: progress }));
            }, 'hero');
            
            updateCarouselItem(heroIndex, itemIndex, 'src', url);

            showToast('Imagem enviada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao enviar imagem.', 'error');
            console.error(error);
        } finally {
            setUploadProgress(prev => ({ ...prev, [progressKey]: null }));
        }
    };
    
    const renderAnimationSettings = (hero: HeroInfo, heroIndex: number) => {
        const props = { hero, updateHeroField, heroIndex };
        switch (hero.carouselAnimationType) {
            case 'roleta': return <RoletaSettings {...props} />;
            case 'focus_loop': return <FocusLoopSettings {...props} />;
            case 'crossfade': return <CrossfadeSettings {...props} />;
            case 'motion_blur': return <MotionBlurSettings {...props} />;
            case 'static': return <StaticSettings {...props} />;
            case 'floating': return <FloatingSettings {...props} />;
            case 'parallax_3d':
            case 'scroll_reveal':
                return <SimpleSettings {...props} />;
            default:
                return <RoletaSettings {...props} />;
        }
    };

    return (
        <div className="space-y-6">
            <AIHeroWizard isOpen={isAiWizardOpen} onClose={() => setIsAiWizardOpen(false)} existingHeroes={siteInfo.heroes || []} onSave={handleAiHeroSave} showToast={showToast} />
            {heroForVideo && (<HeroVideoGenerator isOpen={videoGeneratorOpen} onClose={() => setVideoGeneratorOpen(false)} hero={heroForVideo} showToast={showToast} siteInfo={siteInfo} />)}
            
            <div className="flex justify-between items-center flex-wrap gap-4">
                <p className="text-sm text-gray-400">Gerencie os banners principais da página inicial.</p>
                 <div className="flex items-center gap-2 flex-wrap">
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportHeroes} className="hidden" />
                    <input type="file" accept=".json" ref={singleHeroImportRef} onChange={handleImportSingleHero} className="hidden" />
                    
                    <button onClick={handleExportHeroes} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-3 rounded-lg text-xs border border-zinc-700 transition-colors" title="Baixar configuração de todos os heroes">
                        <Download size={14}/> Exportar Tudo
                    </button>
                     <button onClick={() => singleHeroImportRef.current?.click()} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-3 rounded-lg text-xs border border-zinc-700 transition-colors" title="Adicionar Hero de um arquivo">
                        <FilePlus size={14}/> Importar Hero (Adicionar)
                    </button>
                    
                    <ToggleSwitch label={areAnyHeroesEnabled ? "Seção Ativada" : "Seção Desativada"} checked={areAnyHeroesEnabled ?? false} onChange={handleToggleAllHeroes} />
                    <button onClick={() => setIsAiWizardOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider shadow-lg shadow-purple-900/20"><Cpu size={16}/> Criar Hero com IA</button>
                </div>
            </div>

             {(siteInfo.heroes || []).map((hero, heroIndex) => {
                const btnConfig = hero.buttonStyleConfig || { stylePreset: 'standard', primaryColor: hero.buttonPrimaryBackgroundColor || '#ffae00', secondaryColor: '#e69c00', highlightColor: '#ffffff', textColor: hero.buttonPrimaryTextColor || '#000000' };
                
                return (
                <div key={hero.id || heroIndex} className="p-4 bg-black/30 border border-gray-800 rounded-lg relative group">
                    <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                         <ToggleSwitch label={hero.enabled !== false ? "Ativo" : "Inativo"} checked={hero.enabled !== false} onChange={(isChecked) => updateHeroField(heroIndex, 'enabled', isChecked)} />
                         <button onClick={() => handleOpenVideoGenerator(hero)} className="bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-pink-500 transition-colors flex items-center gap-1" title="Gerar vídeo para redes sociais"><Film size={14}/> Criar Vídeo</button>
                         <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-1 rounded border border-zinc-700 flex items-center">Hero #{heroIndex + 1}</span>
                         <button onClick={() => handleDeleteHero(heroIndex)} className="bg-red-900/30 text-red-400 p-1 rounded hover:bg-red-900/50 border border-red-900/50"><Trash2 size={14}/></button>
                    </div>
                    
                    <SubSection title="Textos e Botões">
                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-400 block mb-1">Título Principal</label>
                            <textarea value={hero.title} onChange={e => updateHeroField(heroIndex, 'title', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2" rows={2} placeholder="Digite o título aqui (use Enter para pular linha)" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-400 block mb-1">Frases do Subtítulo (uma por linha)</label>
                            <textarea value={(hero.phrases || []).join('\n')} onChange={e => updateHeroField(heroIndex, 'phrases', e.target.value.split('\n'))} rows={3} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Botão Primário (Texto)</label>
                                <input type="text" value={hero.buttonPrimary} onChange={e => updateHeroField(heroIndex, 'buttonPrimary', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                            </div>
                             <div>
                                <label className="text-sm text-gray-400 block mb-1">Botão Primário (Link)</label>
                                <select value={hero.buttonPrimaryCategory} onChange={e => updateHeroField(heroIndex, 'buttonPrimaryCategory', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm">
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="text-sm text-gray-400 block mb-1">Botão Secundário (Texto)</label>
                                <input type="text" value={hero.buttonSecondary} onChange={e => updateHeroField(heroIndex, 'buttonSecondary', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                            </div>
                             <div>
                                <label className="text-sm text-gray-400 block mb-1">Botão Secundário (Link)</label>
                                <select value={hero.buttonSecondaryCategory} onChange={e => updateHeroField(heroIndex, 'buttonSecondaryCategory', e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm">
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </SubSection>

                    <SubSection title="Estilo do Botão Primário">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            <RadioCard selected={btnConfig.stylePreset === 'standard'} onClick={() => updateHeroButtonConfig(heroIndex, 'stylePreset', 'standard')} icon={<Box size={18} />} label="Padrão" />
                            <RadioCard selected={btnConfig.stylePreset === 'shiny'} onClick={() => updateHeroButtonConfig(heroIndex, 'stylePreset', 'shiny')} icon={<Sun size={18} />} label="Brilho" />
                            <RadioCard selected={btnConfig.stylePreset === 'neon'} onClick={() => updateHeroButtonConfig(heroIndex, 'stylePreset', 'neon')} icon={<Zap size={18} />} label="Neon" />
                            <RadioCard selected={btnConfig.stylePreset === 'cyber'} onClick={() => updateHeroButtonConfig(heroIndex, 'stylePreset', 'cyber')} icon={<Layout size={18} />} label="Cyber" />
                            <RadioCard selected={btnConfig.stylePreset === 'pulse'} onClick={() => updateHeroButtonConfig(heroIndex, 'stylePreset', 'pulse')} icon={<Activity size={18} />} label="Pulse" />
                        </div>
                        
                        {btnConfig.stylePreset === 'standard' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 animate-fade-in">
                                <ColorInput label="Fundo" value={hero.buttonPrimaryBackgroundColor || ''} onChange={v => updateHeroField(heroIndex, 'buttonPrimaryBackgroundColor', v)} />
                                <ColorInput label="Texto" value={hero.buttonPrimaryTextColor || ''} onChange={v => updateHeroField(heroIndex, 'buttonPrimaryTextColor', v)} />
                                <ColorInput label="Fundo (Hover)" value={hero.buttonPrimaryBackgroundColorHover || ''} onChange={v => updateHeroField(heroIndex, 'buttonPrimaryBackgroundColorHover', v)} />
                                <ColorInput label="Texto (Hover)" value={hero.buttonPrimaryTextColorHover || ''} onChange={v => updateHeroField(heroIndex, 'buttonPrimaryTextColorHover', v)} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 animate-fade-in">
                                <ColorInput label="Cor Principal / Início" value={btnConfig.primaryColor || '#ffae00'} onChange={v => updateHeroButtonConfig(heroIndex, 'primaryColor', v)} />
                                <ColorInput label="Cor Secundária / Fim" value={btnConfig.secondaryColor || '#e69c00'} onChange={v => updateHeroButtonConfig(heroIndex, 'secondaryColor', v)} />
                                <ColorInput label="Destaque (Brilho/Borda)" value={btnConfig.highlightColor || '#ffffff'} onChange={v => updateHeroButtonConfig(heroIndex, 'highlightColor', v)} />
                                <ColorInput label="Cor do Texto" value={btnConfig.textColor || '#000000'} onChange={v => updateHeroButtonConfig(heroIndex, 'textColor', v)} />
                            </div>
                        )}
                    </SubSection>

                    <SubSection title="Itens do Carrossel">
                        <input type="text" value={hero.carouselTitle} onChange={e => updateHeroField(heroIndex, 'carouselTitle', e.target.value)} placeholder="Título acima do carrossel" className="w-full bg-black border border-[#27272a] rounded-lg p-2 mb-4" />
                        <div className="space-y-3">
                            {(hero.carouselItems || []).map((item, itemIndex) => (
                                <div key={itemIndex} className="p-3 bg-black rounded-lg border border-gray-800 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <img src={item.src} alt={item.alt} className="w-16 h-16 object-contain rounded bg-gray-800" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/0a0a0a/FFFFFF?text=URL'; }} />
                                        <div className="flex-grow space-y-2">
                                            <input type="text" value={item.src} onChange={(e) => updateCarouselItem(heroIndex, itemIndex, 'src', e.target.value)} className="w-full bg-gray-800 p-2 rounded text-sm" placeholder="URL da Imagem"/>
                                            <input type="text" value={item.alt} onChange={(e) => updateCarouselItem(heroIndex, itemIndex, 'alt', e.target.value)} className="w-full bg-gray-800 p-2 rounded text-sm" placeholder="Texto alternativo (alt)"/>
                                        </div>
                                        <button onClick={() => removeCarouselItem(heroIndex, itemIndex)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                    <label className="cursor-pointer text-xs bg-gray-700 text-white text-center p-1 rounded hover:bg-gray-600 block">
                                        {uploadProgress[`${heroIndex}-${itemIndex}`] != null ? `Enviando... ${Math.round(uploadProgress[`${heroIndex}-${itemIndex}`]!)}%` : 'Trocar Imagem'}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCarouselImageUpload(e, heroIndex, itemIndex)} />
                                    </label>
                                </div>
                            ))}
                            <button onClick={() => addCarouselItem(heroIndex)} className="text-xs flex items-center gap-1 bg-gray-700 px-2 py-1 rounded"><Plus size={14}/> Adicionar Imagem</button>
                        </div>
                    </SubSection>
                    
                     <Accordion title="Layout e Animação do Carrossel" defaultOpen>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Tipo de Animação</label>
                                <select value={hero.carouselAnimationType || 'roleta'} onChange={e => updateHeroField(heroIndex, 'carouselAnimationType', e.target.value as HeroInfo['carouselAnimationType'])} className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm">
                                    <option value="roleta">Roleta Contínua</option>
                                    <option value="focus_loop">Foco com Zoom</option>
                                    <option value="crossfade">Crossfade (Apple)</option>
                                    <option value="motion_blur">Deslize com Blur</option>
                                    <option value="static">Estático (Sem Animação)</option>
                                    <option value="parallax_3d">Parallax 3D (Premium)</option>
                                    <option value="floating">Flutuante (Premium)</option>
                                    <option value="scroll_reveal">Revelar com Scroll (Premium)</option>
                                </select>
                            </div>
                            <div className="pt-4 border-t border-gray-800">
                                {renderAnimationSettings(hero, heroIndex)}
                            </div>
                            <div className="pt-4 mt-4 border-t border-gray-800">
                                <h5 className="font-semibold text-sm text-gray-400 mb-4">Posicionamento do Carrossel (Eixo X/Y)</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SliderInput 
                                        label="Deslocamento Horizontal (Mobile)"
                                        value={hero.carouselImageOffsetXMobile}
                                        onChange={v => updateHeroField(heroIndex, 'carouselImageOffsetXMobile', v)}
                                        min={-200} max={200} unit="px" placeholder="0"
                                        onReset={() => updateHeroField(heroIndex, 'carouselImageOffsetXMobile', undefined)}
                                    />
                                    <SliderInput 
                                        label="Deslocamento Vertical (Mobile)"
                                        value={hero.carouselImageOffsetYMobile}
                                        onChange={v => updateHeroField(heroIndex, 'carouselImageOffsetYMobile', v)}
                                        min={-200} max={200} unit="px" placeholder="0"
                                        onReset={() => updateHeroField(heroIndex, 'carouselImageOffsetYMobile', undefined)}
                                    />
                                    <SliderInput 
                                        label="Deslocamento Horizontal (Desktop)"
                                        value={hero.carouselImageOffsetXDesktop}
                                        onChange={v => updateHeroField(heroIndex, 'carouselImageOffsetXDesktop', v)}
                                        min={-300} max={300} unit="px" placeholder="0"
                                        onReset={() => updateHeroField(heroIndex, 'carouselImageOffsetXDesktop', undefined)}
                                    />
                                    <SliderInput 
                                        label="Deslocamento Vertical (Desktop)"
                                        value={hero.carouselImageOffsetYDesktop}
                                        onChange={v => updateHeroField(heroIndex, 'carouselImageOffsetYDesktop', v)}
                                        min={-300} max={300} unit="px" placeholder="0"
                                        onReset={() => updateHeroField(heroIndex, 'carouselImageOffsetYDesktop', undefined)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Accordion>

                    <AdvancedOptionsToggle>
                        <div className="space-y-4 pt-4">
                            <Accordion title="Estilo dos Textos">
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ColorInput label="Cor do Título" value={hero.titleColor || ''} onChange={v => updateHeroField(heroIndex, 'titleColor', v)} />
                                        <ColorInput label="Cor do Subtítulo" value={hero.subtitleColor || ''} onChange={v => updateHeroField(heroIndex, 'subtitleColor', v)} />
                                    </div>
                                    <SliderInput label="Tamanho Fonte Título (Mobile)" value={hero.titleFontSizeMobile} onChange={v => updateHeroField(heroIndex, 'titleFontSizeMobile', v)} min={20} max={80} unit="px" placeholder="40" />
                                    <SliderInput label="Tamanho Fonte Título (Desktop)" value={hero.titleFontSizeDesktop} onChange={v => updateHeroField(heroIndex, 'titleFontSizeDesktop', v)} min={30} max={100} unit="px" placeholder="56" />
                                    <SliderInput label="Tamanho Fonte Subtítulo (Mobile)" value={hero.subtitleFontSizeMobile} onChange={v => updateHeroField(heroIndex, 'subtitleFontSizeMobile', v)} min={14} max={40} unit="px" placeholder="20" />
                                    <SliderInput label="Tamanho Fonte Subtítulo (Desktop)" value={hero.subtitleFontSizeDesktop} onChange={v => updateHeroField(heroIndex, 'subtitleFontSizeDesktop', v)} min={16} max={50} unit="px" placeholder="24" />
                                </div>
                            </Accordion>
                            <Accordion title="Estilo do Botão Secundário & Posição">
                               <div className="p-4 space-y-4">
                                    <h5 className="font-semibold text-sm text-gray-400 pt-4 border-t border-gray-800">Botão Secundário (Estilo Simples)</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ColorInput label="Fundo" value={hero.buttonSecondaryBackgroundColor || ''} onChange={v => updateHeroField(heroIndex, 'buttonSecondaryBackgroundColor', v)} />
                                        <ColorInput label="Texto" value={hero.buttonSecondaryTextColor || ''} onChange={v => updateHeroField(heroIndex, 'buttonSecondaryTextColor', v)} />
                                        <ColorInput label="Borda" value={hero.buttonSecondaryBorderColor || ''} onChange={v => updateHeroField(heroIndex, 'buttonSecondaryBorderColor', v)} />
                                        <div/>
                                        <ColorInput label="Fundo (Hover)" value={hero.buttonSecondaryBackgroundColorHover || ''} onChange={v => updateHeroField(heroIndex, 'buttonSecondaryBackgroundColorHover', v)} />
                                        <ColorInput label="Texto (Hover)" value={hero.buttonSecondaryTextColorHover || ''} onChange={v => updateHeroField(heroIndex, 'buttonSecondaryTextColorHover', v)} />
                                        <ColorInput label="Borda (Hover)" value={hero.buttonSecondaryBorderColorHover || ''} onChange={v => updateHeroField(heroIndex, 'buttonSecondaryBorderColorHover', v)} />
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-gray-800">
                                        <h5 className="font-semibold text-sm text-gray-400 mb-4">Posição Vertical dos Botões</h5>
                                        <div className="space-y-4">
                                            <SliderInput 
                                                label="Deslocamento (Mobile)" 
                                                value={hero.buttonsVerticalOffsetMobile} 
                                                onChange={v => updateHeroField(heroIndex, 'buttonsVerticalOffsetMobile', v)} 
                                                min={-150} 
                                                max={150} 
                                                unit="px" 
                                                placeholder="0"
                                                onReset={() => updateHeroField(heroIndex, 'buttonsVerticalOffsetMobile', undefined)}
                                            />
                                            <SliderInput 
                                                label="Deslocamento (Desktop)" 
                                                value={hero.buttonsVerticalOffsetDesktop} 
                                                onChange={v => updateHeroField(heroIndex, 'buttonsVerticalOffsetDesktop', v)} 
                                                min={-200} 
                                                max={200} 
                                                unit="px" 
                                                placeholder="0"
                                                onReset={() => updateHeroField(heroIndex, 'buttonsVerticalOffsetDesktop', undefined)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Accordion>
                            <Accordion title="Efeitos de Fundo (Aurora)">
                               <div className="p-4 space-y-4">
                                    <SliderInput label="Intensidade do Blur" value={hero.blurStrength} onChange={v => updateHeroField(heroIndex, 'blurStrength', v)} min={0} max={200} unit="px" placeholder="100" />
                                    {(hero.auroraElements || []).map((el, elIndex) => (
                                        <div key={elIndex} className="p-3 bg-black rounded-md border border-gray-700 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <ColorInput label={`Cor ${elIndex + 1}`} value={el.color} onChange={v => updateHeroAuroraElement(heroIndex, elIndex, 'color', v)} />
                                                <button onClick={() => removeHeroAuroraElement(heroIndex, elIndex)} className="text-red-500 mt-5"><Trash2 size={16}/></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <SliderInput label="Tamanho (Mobile)" value={el.sizeMobile} onChange={v => updateHeroAuroraElement(heroIndex, elIndex, 'sizeMobile', v)} min={100} max={800} unit="px" placeholder="400" />
                                                <SliderInput label="Tamanho (Desktop)" value={el.sizeDesktop} onChange={v => updateHeroAuroraElement(heroIndex, elIndex, 'sizeDesktop', v)} min={100} max={1000} unit="px" placeholder="500" />
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => addHeroAuroraElement(heroIndex)} className="text-xs flex items-center gap-1 bg-gray-700 px-2 py-1 rounded"><Plus size={14}/> Adicionar Cor Aurora</button>
                                </div>
                            </Accordion>
                        </div>
                    </AdvancedOptionsToggle>
                </div>
             );
             })}

             {/* --- BANNER MANAGEMENT SECTION --- */}
             <div className="pt-12 mt-12 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Film size={20} className="text-blue-400" /> Banners Promocionais (Abaixo do Hero)
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Adicione imagens ou vídeos que aparecem logo após a seção principal.
                        </p>
                    </div>
                    <button onClick={addBanner} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                        <Plus size={16} /> Adicionar Banner
                    </button>
                </div>

                <div className="space-y-6">
                    {(siteInfo.banners || []).map((banner, index) => (
                        <div key={banner.id} className="bg-black/30 border border-zinc-800 rounded-lg p-6 relative">
                            <button onClick={() => removeBanner(index)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors p-2 hover:bg-zinc-900 rounded">
                                <Trash2 size={18} />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Controls */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-sm font-semibold text-zinc-300">Status do Banner</span>
                                        <ToggleSwitch 
                                            label={banner.enabled ? 'Ativo' : 'Inativo'} 
                                            checked={banner.enabled ?? true} 
                                            onChange={(val) => updateBannerField(index, 'enabled', val)} 
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tipo de Mídia</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => updateBannerField(index, 'type', 'image')}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition-colors ${banner.type !== 'video' ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                            >
                                                <Image size={16} /> Imagem
                                            </button>
                                            <button 
                                                onClick={() => updateBannerField(index, 'type', 'video')}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition-colors ${banner.type === 'video' ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                            >
                                                <Video size={16} /> Vídeo
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Link de Redirecionamento</label>
                                        <input 
                                            type="text" 
                                            value={banner.linkUrl} 
                                            onChange={(e) => updateBannerField(index, 'linkUrl', e.target.value)} 
                                            placeholder="Ex: #produtos ou https://..." 
                                            className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Right: Media Upload & Preview */}
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Arquivo de Mídia</label>
                                    
                                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px] relative bg-black/20 hover:bg-black/40 transition-colors">
                                        {banner.imageUrl ? (
                                            banner.type === 'video' ? (
                                                <video src={banner.imageUrl} className="max-h-40 rounded mb-2" controls />
                                            ) : (
                                                <img src={banner.imageUrl} className="max-h-40 object-contain rounded mb-2" alt="Banner Preview" />
                                            )
                                        ) : (
                                            <div className="text-center text-zinc-500 mb-2">
                                                <Upload className="mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">Nenhuma mídia selecionada</p>
                                            </div>
                                        )}
                                        
                                        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
                                            {uploadProgress[`banner-${index}`] != null ? <Loader className="animate-spin" size={14}/> : <Upload size={14} />}
                                            {uploadProgress[`banner-${index}`] != null ? 'Enviando...' : (banner.imageUrl ? 'Trocar Arquivo' : 'Enviar Arquivo')}
                                            <input 
                                                type="file" 
                                                accept={banner.type === 'video' ? "video/*" : "image/*"} 
                                                className="hidden" 
                                                onChange={(e) => handleBannerUpload(e, index)} 
                                            />
                                        </label>
                                        <input 
                                            type="text" 
                                            value={banner.imageUrl} 
                                            onChange={(e) => updateBannerField(index, 'imageUrl', e.target.value)}
                                            placeholder="Ou cole a URL direta aqui"
                                            className="mt-3 w-full bg-transparent border-b border-zinc-700 p-1 text-xs text-center focus:outline-none focus:border-blue-500 text-zinc-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(siteInfo.banners || []).length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
                            <p>Nenhum banner configurado.</p>
                            <button onClick={addBanner} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold">Criar o primeiro banner</button>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-black border border-[#27272a]/50 rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 font-semibold text-md bg-gray-900/50 rounded-t-lg">
                {title}
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && <div className="border-t border-[#27272a]/50">{children}</div>}
        </div>
    );
};

export default HeroSectionPanel;