import React, { useState, useRef, useEffect } from 'react';
import { HeroInfo, SiteInfo } from '../../types';
import { X, Smartphone, Instagram, Box, Monitor, Film, Download, RefreshCcw, Loader } from 'react-feather';
import AuroraBackground from '../AuroraBackground';
import StoreProductCarousel from '../StoreProductCarousel';
import { useTypingEffect } from '../../hooks/useTypingEffect';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

declare var html2canvas: any;

interface HeroVideoGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    hero: HeroInfo;
    showToast: (message: string, type: 'success' | 'error') => void;
    siteInfo: SiteInfo;
}

type VideoFormat = 'story' | 'feed' | 'square' | 'landscape';

interface FormatConfig {
    label: string;
    width: number;
    height: number;
    icon: React.ReactNode;
    scalePreview: number;
}

const FORMATS: Record<VideoFormat, FormatConfig> = {
    story: { 
        label: 'Story (9:16)', 
        width: 1080, 
        height: 1920, 
        icon: <Smartphone size={18} />,
        scalePreview: 0.35 
    },
    feed: { 
        label: 'Feed (4:5)', 
        width: 1080, 
        height: 1350, 
        icon: <Instagram size={18} />,
        scalePreview: 0.4 
    },
    square: { 
        label: 'Quadrado (1:1)', 
        width: 1080, 
        height: 1080, 
        icon: <Box size={18} />,
        scalePreview: 0.45 
    },
    landscape: { 
        label: 'Paisagem (16:9)', 
        width: 1920, 
        height: 1080, 
        icon: <Monitor size={18} />,
        scalePreview: 0.4 
    }
};

const HeroVideoPreview: React.FC<{ 
    hero: HeroInfo; 
    format: VideoFormat; 
    width: number; 
    height: number;
    refreshKey: number;
}> = ({ hero, format, width, height, refreshKey }) => {
    
    const isLandscape = format === 'landscape';
    const titleSize = isLandscape ? (hero.titleFontSizeDesktop || 64) : (hero.titleFontSizeMobile ? hero.titleFontSizeMobile * 1.5 : 56);
    const subtitleSize = isLandscape ? (hero.subtitleFontSizeDesktop || 28) : (hero.subtitleFontSizeMobile ? hero.subtitleFontSizeMobile * 1.5 : 28);
    
    const { text: typedText, isWaiting } = useTypingEffect(
        (hero.typingEffectTarget === 'title' ? (hero.title || '').split('\n') : hero.phrases || []),
        100, 2000, 500
    );

    return (
        <div 
            id="video-capture-container"
            className="relative overflow-hidden flex flex-col items-center justify-center text-center"
            style={{ 
                width: `${width}px`, 
                height: `${height}px`, 
                backgroundColor: hero.backgroundColor || '#000000' 
            }}
        >
            <div className="absolute inset-0 z-0">
                <AuroraBackground 
                    elements={hero.auroraElements}
                    blurStrength={hero.blurStrength}
                    uniqueId={`video-${refreshKey}`}
                    animationDurationMobile={15}
                    animationDurationDesktop={15}
                />
            </div>

            <div className="relative z-10 w-full px-12 flex flex-col items-center justify-center h-full">
                <h1 
                    className="font-bold mb-6 leading-tight"
                    style={{ 
                        fontSize: `${titleSize}px`, 
                        color: hero.titleColor || '#ffffff',
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        minHeight: `${titleSize * 2.4}px`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                    }}
                >
                    {hero.typingEffectTarget === 'title' ? (
                        <span style={{ opacity: isWaiting ? 0 : 1, transition: 'opacity 0.5s' }}>{typedText}</span>
                    ) : (
                        (hero.title || '').split('\n').map((line, i) => <React.Fragment key={i}>{line}{i < (hero.title || '').split('\n').length - 1 && <br />}</React.Fragment>)
                    )}
                </h1>
                <p 
                    className="mb-10 font-medium"
                    style={{ 
                        fontSize: `${subtitleSize}px`, 
                        color: hero.subtitleColor || '#cccccc',
                        minHeight: `${subtitleSize * 1.5}px`
                    }}
                >
                     {hero.typingEffectTarget === 'subtitle' ? (
                        <>
                            <span style={{ opacity: isWaiting ? 0 : 1, transition: 'opacity 0.5s' }}>{typedText}</span>
                            {!isWaiting && <span className="typing-cursor">|</span>}
                        </>
                    ) : ((hero.phrases || []).join(' '))}
                </p>
                <div className="flex justify-center items-center gap-6 mb-10 scale-125">
                    {hero.buttonPrimary && (
                        <div
                           className="inline-block font-semibold py-3 px-8 rounded-full border-2"
                           style={{
                                backgroundColor: hero.buttonPrimaryBackgroundColor || '#ffae00',
                                color: hero.buttonPrimaryTextColor || '#000000',
                                borderColor: hero.buttonPrimaryBackgroundColor || '#ffae00'
                           }}
                        >{hero.buttonPrimary}</div>
                    )}
                    {hero.buttonSecondary && (
                        <div className="inline-block font-semibold py-3 px-8 rounded-full border-2"
                            style={{
                                backgroundColor: hero.buttonSecondaryBackgroundColor || 'transparent',
                                color: hero.buttonSecondaryTextColor || '#ffffff',
                                borderColor: hero.buttonSecondaryBorderColor || '#ffffff'
                            }}
                        >{hero.buttonSecondary}</div>
                    )}
                </div>
                <div style={{ width: '100%', transform: 'scale(1.2)' }}>
                     <StoreProductCarousel 
                        items={hero.carouselItems || []} 
                        uniqueId={`video-carousel-${refreshKey}`}
                        heightMobile={hero.carouselHeightMobile ? hero.carouselHeightMobile * 1.2 : 350}
                        heightDesktop={hero.carouselHeightDesktop ? hero.carouselHeightDesktop * 1.2 : 400}
                        imageSizeMobile={hero.carouselImageSizeMobile}
                        imageSizeDesktop={hero.carouselImageSizeDesktop}
                        itemSpreadMobile={hero.carouselItemSpreadMobile ? hero.carouselItemSpreadMobile * 1.2 : 150}
                        itemSpreadDesktop={hero.carouselItemSpreadDesktop}
                        animationDuration={hero.carouselAnimationDuration || 20}
                    />
                </div>
                {hero.carouselTitle && (
                    <p className="text-white font-semibold mt-8" style={{ fontSize: '24px' }}>
                        {hero.carouselTitle}
                    </p>
                )}
            </div>
        </div>
    );
};

const HeroVideoGenerator: React.FC<HeroVideoGeneratorProps> = ({ isOpen, onClose, hero, showToast, siteInfo }) => {
    const [currentFormat, setCurrentFormat] = useState<VideoFormat>('story');
    const [isRecording, setIsRecording] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [statusMsg, setStatusMsg] = useState('');
    const [conversionProgress, setConversionProgress] = useState(0);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chunksRef = useRef<Blob[]>([]);
    const stopSignalRef = useRef(false);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const activeConfig = FORMATS[currentFormat];

    useEffect(() => {
        if (isOpen) {
            setPreviewKey(prev => prev + 1);
            loadFFmpeg();
        }
    }, [isOpen]);

    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return;
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }) => setConversionProgress(Math.round(progress * 100)));
        try {
            setStatusMsg('Carregando codec de vídeo...');
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}ffmpeg-core.wasm`, 'application/wasm'),
            });
            ffmpegRef.current = ffmpeg;
            setStatusMsg(''); // Clear status on success
        } catch (error) {
            console.error("Erro ao carregar FFmpeg:", error);
            showToast("Codec de vídeo não pôde ser carregado. Downloads serão em .webm.", "error");
            ffmpegRef.current = null; 
            setStatusMsg('Erro no codec');
        }
    };

    const convertToMp4 = async (webmBlob: Blob) => {
        if (!ffmpegRef.current) {
             const url = URL.createObjectURL(webmBlob);
             const a = document.createElement('a');
             a.href = url; a.download = `video-${currentFormat}.webm`; a.click();
             setIsConverting(false); return;
        }
        try {
            setStatusMsg('Otimizando para MP4...'); setConversionProgress(0);
            const ffmpeg = ffmpegRef.current;
            await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
            await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '25', '-pix_fmt', 'yuv420p', 'output.mp4']);
            const data = await ffmpeg.readFile('output.mp4');
            const mp4Blob = new Blob([data as any], { type: 'video/mp4' });
            const url = URL.createObjectURL(mp4Blob);
            const a = document.createElement('a');
            a.href = url; a.download = `story-${siteInfo?.storeName || 'loja'}.mp4`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setStatusMsg('Download iniciado!');
        } catch (error) {
            console.error(error); showToast("Erro na conversão. Baixando original...", 'error');
            const url = URL.createObjectURL(webmBlob);
            const a = document.createElement('a'); a.href = url; a.download = `video-raw.webm`; a.click();
        } finally {
            setIsConverting(false);
            try {
                if (ffmpegRef.current) {
                    await ffmpegRef.current.deleteFile('input.webm');
                    await ffmpegRef.current.deleteFile('output.mp4');
                }
            } catch(e) { console.warn('Falha ao limpar arquivos do FFmpeg.'); }
        }
    };

    const handleStartRecording = async () => {
        if (isRecording || isConverting) return;
        setIsRecording(true); stopSignalRef.current = false; chunksRef.current = [];
        setStatusMsg('Preparando...');
        setPreviewKey(prev => prev + 1); await new Promise(r => setTimeout(r, 800));
        const element = document.getElementById('video-capture-container');
        const canvas = canvasRef.current;
        if (!element || !canvas) { showToast("Erro interno de captura.", 'error'); setIsRecording(false); return; }
        canvas.width = activeConfig.width; canvas.height = activeConfig.height;
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream(30); 
        let mediaRecorder: MediaRecorder;
        try {
             mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 5000000 });
        } catch (e) { mediaRecorder = new MediaRecorder(stream); }
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorder.onstop = async () => {
            setIsRecording(false); setIsConverting(true);
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            await convertToMp4(blob);
        };
        mediaRecorder.start(); mediaRecorderRef.current = mediaRecorder;
        setStatusMsg('Gravando... Aguarde a animação.');
        const RECORDING_DURATION = 10000; const startTime = Date.now();
        const captureFrame = async () => {
            if (stopSignalRef.current) return;
            if (Date.now() - startTime > RECORDING_DURATION) { stopRecording(); return; }
            try {
                const renderedCanvas = await html2canvas(element, { width: activeConfig.width, height: activeConfig.height, scale: 1, useCORS: true, backgroundColor: null, logging: false });
                if (ctx && !stopSignalRef.current) ctx.drawImage(renderedCanvas, 0, 0);
                requestAnimationFrame(captureFrame);
            } catch (err) { console.error(err); }
        };
        captureFrame();
    };

    const stopRecording = () => {
        if (stopSignalRef.current) return;
        stopSignalRef.current = true;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    if (!isOpen || !hero) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col md:flex-row overflow-hidden">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="w-full md:w-80 bg-[#0a0a0a] border-r border-[#27272a] flex flex-col h-full z-20 relative shadow-xl">
                <div className="p-6 border-b border-[#27272a] flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Film className="text-purple-500" /> Criar Vídeo</h3>
                    <button onClick={onClose} disabled={isRecording || isConverting} className="text-gray-500 hover:text-white transition-colors disabled:opacity-30"><X size={24} /></button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">1. Formato</h4>
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {(Object.keys(FORMATS) as VideoFormat[]).map((format) => (
                            <button key={format} onClick={() => { setCurrentFormat(format); setPreviewKey(k => k+1); }} disabled={isRecording || isConverting}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${currentFormat === format ? 'bg-purple-900/20 border-purple-500 text-white' : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-600'} disabled:opacity-50`}>
                                <div className={`mb-2 ${currentFormat === format ? 'text-purple-400' : 'text-gray-500'}`}>{FORMATS[format].icon}</div>
                                <span className="text-xs font-semibold">{FORMATS[format].label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center mb-6">
                        <p className="text-gray-400 text-xs mb-2">O vídeo gravará exatamente o que você vê no preview.</p>
                        {statusMsg && <div className="mt-3 p-2 bg-black rounded border border-purple-500/30 text-purple-300 text-xs font-bold animate-pulse">{statusMsg} {isConverting && `${conversionProgress}%`}</div>}
                    </div>
                    <button onClick={handleStartRecording} disabled={isRecording || isConverting}
                        className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg ${(isRecording || isConverting) ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02]'}`}>
                        {isRecording ? <><div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>Gravando (10s)...</> : isConverting ? <><Loader size={20} className="animate-spin"/>Processando...</> : <><Download size={20} />Iniciar Gravação</>}
                    </button>
                    <button onClick={() => setPreviewKey(k => k+1)} disabled={isRecording || isConverting} className="mt-4 w-full text-xs text-gray-500 hover:text-white flex items-center justify-center gap-2 disabled:opacity-30">
                        <RefreshCcw size={12}/> Reiniciar Animação
                    </button>
                </div>
            </div>
            <div className="flex-1 bg-[#050505] relative flex items-center justify-center overflow-hidden p-8">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="relative shadow-2xl shadow-black border border-zinc-800 transition-all duration-500"
                    style={{ width: activeConfig.width, height: activeConfig.height, transform: `scale(${activeConfig.scalePreview})`, transformOrigin: 'center center' }}>
                    <HeroVideoPreview key={previewKey} hero={hero} format={currentFormat} width={activeConfig.width} height={activeConfig.height} refreshKey={previewKey} />
                    <div className="absolute -top-12 left-0 text-white text-xs font-mono opacity-50">Resolução: {activeConfig.width}x{activeConfig.height}</div>
                </div>
            </div>
        </div>
    );
};

export default HeroVideoGenerator;
