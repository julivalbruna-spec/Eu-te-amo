
import React from 'react';
import { SiteInfo } from '../types';
import { Zap, MapPin, Clock } from 'react-feather';

const StoreContactSection: React.FC<{siteInfo: SiteInfo}> = ({ siteInfo }) => (
    <section id="contact" className="py-16 md:py-24 px-4 transition-colors duration-300" style={{ backgroundColor: 'var(--contact-bg)', color: 'var(--contact-text)' }}>
        <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--contact-text)' }}>{siteInfo.customTexts.contactTitle}</h2>
                <p className="text-lg mt-2 max-w-3xl mx-auto opacity-80" style={{ color: 'var(--contact-text)' }}>{siteInfo.customTexts.contactSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="space-y-8">
                    <div 
                        className="p-6 rounded-lg border transition-colors duration-300 space-y-6"
                        style={{ 
                            backgroundColor: 'var(--contact-card-bg)', 
                            borderColor: 'var(--contact-card-border)',
                            color: 'var(--contact-text)'
                        }}
                    >
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 flex items-center" style={{ color: 'var(--contact-text)' }}>
                                <Zap size={20} className="mr-3" style={{ color: 'var(--contact-icon-color)' }} /> Contatos
                            </h3>
                            <div className="space-y-4">
                                <a 
                                    href={`https://wa.me/${siteInfo.links.whatsappSales}?text=Olá!+Vim+pelo+site+e+tenho+interesse+em+um+produto.`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center transition-colors group text-lg opacity-80 hover:opacity-100"
                                    style={{ color: 'var(--contact-text)' }}
                                >
                                    <span className="font-medium group-hover:text-[var(--contact-icon-color)] transition-colors">WhatsApp:</span>
                                    <span className="ml-2 group-hover:text-[var(--contact-icon-color)] transition-colors">({siteInfo.links.whatsappSales.slice(2,4)}) {siteInfo.links.whatsappSales.slice(4)}</span>
                                </a>
                                {siteInfo.links.showSupport !== false && (
                                    <a 
                                        href={`https://wa.me/${siteInfo.links.whatsappSupport}?text=Olá!+Preciso+de+suporte.`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center transition-colors group text-lg opacity-80 hover:opacity-100"
                                        style={{ color: 'var(--contact-text)' }}
                                    >
                                        <span className="font-medium group-hover:text-[var(--contact-icon-color)] transition-colors">Suporte:</span>
                                        <span className="ml-2 group-hover:text-[var(--contact-icon-color)] transition-colors">({siteInfo.links.whatsappSupport.slice(2,4)}) {siteInfo.links.whatsappSupport.slice(4)}</span>
                                    </a>
                                )}
                                <a 
                                    href={siteInfo.links.instagram} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center transition-colors group text-lg opacity-80 hover:opacity-100"
                                    style={{ color: 'var(--contact-text)' }}
                                >
                                    <span className="font-medium group-hover:text-[var(--contact-icon-color)] transition-colors">Instagram:</span>
                                    <span className="ml-2 group-hover:text-[var(--contact-icon-color)] transition-colors">{siteInfo.links.instagramHandle}</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="p-6 rounded-lg border transition-colors duration-300 space-y-6"
                        style={{ 
                            backgroundColor: 'var(--contact-card-bg)', 
                            borderColor: 'var(--contact-card-border)',
                            color: 'var(--contact-text)'
                        }}
                    >
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 flex items-center" style={{ color: 'var(--contact-text)' }}>
                                <MapPin size={20} className="mr-3" style={{ color: 'var(--contact-icon-color)' }} /> Endereço
                            </h3>
                            <p className="text-lg opacity-80" style={{ color: 'var(--contact-text)' }} dangerouslySetInnerHTML={{ __html: siteInfo.address }} />
                        </div>
                        <div className="border-t" style={{ borderColor: 'var(--contact-card-border)' }}></div>
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 flex items-center" style={{ color: 'var(--contact-text)' }}>
                                <Clock size={20} className="mr-3" style={{ color: 'var(--contact-icon-color)' }} /> Horários
                            </h3>
                            <p className="text-lg opacity-80" style={{ color: 'var(--contact-text)' }}>{siteInfo.hoursWeek}</p>
                            <p className="text-lg opacity-80" style={{ color: 'var(--contact-text)' }}>{siteInfo.hoursSaturday}</p>
                        </div>
                    </div>
                </div>
                <div className="w-full h-80 md:h-[500px] rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--contact-card-border)' }}>
                    <iframe 
                        src={siteInfo.streetViewUrl} 
                        width="100%" 
                        height="100%" 
                        style={{ border:0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade" 
                        className="rounded-lg"
                        title="Localização da iPhone Rios">
                    </iframe>
                </div>
            </div>
        </div>
    </section>
);

export default StoreContactSection;
