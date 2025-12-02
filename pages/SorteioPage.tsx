

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, getDocRef } from '../firebase';
import { Sorteio, SiteInfo } from '../types';
import { SITE_INFO as defaultSiteInfo } from '../constants';
import { Gift, CheckCircle, ArrowLeft, ShoppingCart } from 'react-feather';
import Logo from '../components/Logo';
import Preloader from '../components/Preloader';
import AuroraBackground from '../components/AuroraBackground';

interface SorteioPageProps {
    storeId: string;
}

const SorteioPage: React.FC<SorteioPageProps> = ({ storeId }) => {
    const { sorteioId } = useParams<{ sorteioId: string }>();
    const [sorteio, setSorteio] = useState<Sorteio | null>(null);
    const [loading, setLoading] = useState(true);
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);

    useEffect(() => {
        const fetchData = async () => {
            if (!sorteioId || !storeId) {
                setLoading(false);
                return;
            }
            try {
                const [sorteioDoc, siteInfoDoc] = await Promise.all([
                    getDocRef('sorteios', sorteioId, storeId).get(),
                    getDocRef('settings', 'siteInfo', storeId).get()
                ]);

                if (sorteioDoc.exists) {
                    setSorteio({ id: sorteioDoc.id, ...sorteioDoc.data() } as Sorteio);
                }

                if (siteInfoDoc.exists) {
                    setSiteInfo({ ...defaultSiteInfo, ...siteInfoDoc.data() } as SiteInfo);
                }
            } catch (error) {
                console.error("Erro ao buscar dados do sorteio:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sorteioId, storeId]);

    if (loading) return <Preloader />;

    return (
        <div 
            className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white relative overflow-hidden selection:bg-yellow-500/50"
            style={{ backgroundColor: siteInfo.theme.background }}
        >
            <AuroraBackground
                elements={[{ color: siteInfo.theme.brand, sizeMobile: 600, sizeDesktop: 800 }, { color: siteInfo.theme.surface, sizeMobile: 500, sizeDesktop: 700 }]}
                blurStrength={120}
                uniqueId="sorteio-page"
            />

            <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                <Link to="/" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <ArrowLeft size={18} /> Voltar para a Loja
                </Link>
                <Logo logoUrl={siteInfo.logos.header || siteInfo.logos.main} className="h-10" />
            </header>

            <main className="relative z-10 w-full max-w-6xl px-4">
                 {!sorteio ? (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 text-center shadow-2xl">
                        <h2 className="text-2xl font-bold">Sorteio não encontrado</h2>
                        <p className="text-gray-400 mt-2">O link pode estar incorreto ou o sorteio foi removido.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="w-full aspect-square relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/20 rounded-full blur-3xl"></div>
                            <img 
                                src={sorteio.premioImageUrl} 
                                alt={sorteio.premio} 
                                className="w-full max-w-md lg:max-w-lg object-contain relative z-10 floating-img" 
                                style={{
                                    '--float-duration': '6s',
                                    '--float-height': '-15px',
                                    filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.5))'
                                } as React.CSSProperties}
                            />
                        </div>
                        <div className="text-center lg:text-left">
                            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white tracking-tighter">{sorteio.titulo}</h1>
                            <p className="text-lg text-gray-300 mt-4">Concorra a um <span className="font-bold text-yellow-400 text-xl">{sorteio.premio}</span>!</p>

                            <div className="my-8 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent lg:from-yellow-500/30 lg:to-transparent"></div>

                             {sorteio.status === 'finalizado' && sorteio.clientePremiadoNome ? (
                                <div className="animate-fade-in bg-black/30 border border-white/10 p-6 rounded-lg">
                                    <p className="text-sm uppercase tracking-widest text-gray-400">Ganhador(a)</p>
                                    <p className="text-4xl md:text-5xl font-extrabold text-yellow-400 my-2 break-words">
                                        {sorteio.clientePremiadoNome}
                                    </p>
                                    <p className="text-gray-400">Sorteio realizado em: {sorteio.dataFim.toDate().toLocaleDateString('pt-BR')}</p>
                                    <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                                        <CheckCircle size={20} />
                                        <span className="font-semibold">Resultado Oficial</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in space-y-6">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-200">Sorteio em andamento!</p>
                                        <p className="text-gray-400 mt-2">O resultado será divulgado após <span className="font-semibold">{sorteio.dataFim.toDate().toLocaleDateString('pt-BR')}</span>. Boa sorte!</p>
                                    </div>
                                    <Link to="/" className="inline-block bg-yellow-500 text-black font-bold py-4 px-10 rounded-full text-lg hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg shadow-yellow-500/20">
                                        Quero Participar!
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

             <footer className="absolute bottom-6 text-center text-xs text-gray-500 z-10">
                <p>{siteInfo.copyrightText}</p>
            </footer>
        </div>
    );
};

export default SorteioPage;
