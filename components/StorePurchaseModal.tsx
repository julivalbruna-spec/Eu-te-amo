
import React, { useState, useEffect, useMemo } from 'react';
import { Product, SiteInfo, BuyButtonConfig, Coupon, StoreCartItem, PendingSale } from '../types';
import { X, Tag, Loader, ChevronDown, ChevronRight, Copy, Check } from 'react-feather';
import { logEvent } from '../utils/analytics';
import { getCollectionRef, db } from '../firebase'; 
import firebase from 'firebase/compat/app';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatCurrencyInput = (value: string): string => {
    if (!value) return '';
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    const number = Number(numericValue) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
};

const generateModalButtonCss = (config: BuyButtonConfig | undefined) => {
    if (!config) return '';
    const c = (val: string | undefined, fallback: string = 'transparent') => val || fallback;
    const btn = config;
    const className = `modal-action-button`;
    let buttonCss = '';
    buttonCss = `
        .${className} {
            background-color: ${c(btn.primaryColor)} !important;
            color: ${c(btn.textColor)} !important;
            transition: all 0.3s ease;
        }
        .${className}:hover {
            background-color: ${c(btn.secondaryColor)} !important;
        }
    `;
    return buttonCss;
};


interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  cart?: StoreCartItem[];
  siteInfo: SiteInfo;
  storeId: string; 
}

const StorePurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, product, cart, siteInfo, storeId }) => {
    const [downPayment, setDownPayment] = useState('');
    const [installments, setInstallments] = useState('1');
    const [paymentType, setPaymentType] = useState('credito');
    const [simulation, setSimulation] = useState<string | null>(null);
    const [simulationSummary, setSimulationSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    
    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponMessage, setCouponMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isCouponExpanded, setIsCouponExpanded] = useState(false);
    
    // Pix Copy State
    const [copiedPix, setCopiedPix] = useState(false);

    // Logic Mode
    const isCartMode = !!cart && cart.length > 0;
    const itemsToPurchase = isCartMode ? cart : (product ? [{ product, quantity: 1, selectedVariantIndex }] : []);
    
    const isService = !isCartMode && product?.category === 'assistencia';
    const isConsultPrice = !isCartMode && !isService && product?.price === 0.00;
    
    // FIX: Ensure siteInfo.links exists before accessing
    const whatsappSalesUrl = `https://wa.me/${siteInfo?.links?.whatsappSales || ''}`;
    
    const hasVariants = !isCartMode && product?.variants && product.variants.length > 0;
    const activeVariant = hasVariants ? product!.variants![selectedVariantIndex] : null;
    const imageUrl = activeVariant?.imageUrl || product?.image || product?.variants?.[0]?.imageUrl;
    
    const title = isCartMode ? `Resumo do Pedido` : product?.name;
    const subtitle = isCartMode ? `${itemsToPurchase.reduce((acc, i) => acc + i.quantity, 0)} itens no carrinho` : activeVariant?.colorName;

    const baseTotalPrice = useMemo(() => {
        return itemsToPurchase.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    }, [itemsToPurchase]);

    const effectivePrice = useMemo(() => {
        if (!baseTotalPrice) return 0;
        if (!appliedCoupon) return baseTotalPrice;
        if (appliedCoupon.type === 'percentage') {
            return baseTotalPrice * (1 - appliedCoupon.value / 100);
        } else {
            return Math.max(0, baseTotalPrice - appliedCoupon.value);
        }
    }, [baseTotalPrice, appliedCoupon]);

    const modalSettings = siteInfo.purchaseModalSettings || { backgroundColor: '#0a0a0a', textColor: '#FFFFFF', borderRadius: 'xl', buttonBorderRadius: 'lg', buttonBackgroundColor: '#ffae00', buttonTextColor: '#000000', imageBackgroundColor: 'rgba(255, 255, 255, 0.05)' };
    const buttonConfig = modalSettings.buttonStyle || { stylePreset: 'standard', primaryColor: modalSettings.buttonBackgroundColor || '#ffae00', secondaryColor: modalSettings.buttonBackgroundColor || '#ffae00', highlightColor: '#ffffff', textColor: modalSettings.buttonTextColor || '#000000' };
    const customBtnColors = modalSettings.customButtonColors || {};
    
    const inputStyle = { backgroundColor: modalSettings.inputBackgroundColor || 'rgba(0, 0, 0, 0.2)', color: modalSettings.inputTextColor || modalSettings.textColor || '#ffffff', borderColor: modalSettings.inputBorderColor || 'rgba(255, 255, 255, 0.1)' };
    const texts = siteInfo.customTexts || {};
    const radiusClass = modalSettings.borderRadius === 'full' ? 'rounded-[2rem]' : 'rounded-xl';
    const btnRadiusClass = modalSettings.buttonBorderRadius === 'full' ? 'rounded-full' : 'rounded-lg';

    useEffect(() => {
        if (isOpen) {
            if (!isCartMode && product) {
                logEvent('checkout_opened', { productId: product.id, productName: product.name }, storeId);
            } else if(isCartMode) {
                logEvent('checkout_cart_opened', { itemCount: itemsToPurchase.length, value: baseTotalPrice }, storeId);
            }
            setSelectedVariantIndex(0);
            setCouponCode(''); setAppliedCoupon(null); setCouponMessage(null); setSimulation(null); setSimulationSummary(null); setError(null); setDownPayment(''); setInstallments('1'); setPaymentType('credito'); setIsCouponExpanded(false); setCopiedPix(false);
        }
    }, [isOpen, product, isCartMode, storeId]);

     const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true); setCouponMessage(null);
        
        try {
            const snapshot = await getCollectionRef('coupons', storeId).where('code', '==', couponCode.toUpperCase().trim()).where('active', '==', true).limit(1).get();
            if (!snapshot.empty) {
                const couponData = snapshot.docs[0].data() as Coupon;
                setAppliedCoupon({ id: snapshot.docs[0].id, ...couponData });
                setCouponMessage({ text: `Cupom aplicado!`, type: 'success' });
            } else {
                setAppliedCoupon(null);
                setCouponMessage({ text: 'Cupom inválido ou expirado.', type: 'error' });
            }
        } catch (error) { setCouponMessage({ text: 'Erro ao validar cupom.', type: 'error' }); } finally { setIsValidatingCoupon(false); }
    };
    
    const copyPixKey = () => {
        if (siteInfo.paymentConfig?.pixKey) {
            navigator.clipboard.writeText(siteInfo.paymentConfig.pixKey);
            setCopiedPix(true);
            setTimeout(() => setCopiedPix(false), 2500);
        }
    }

    const handleSimulate = () => {
         setError(null); setSimulation(null); setSimulationSummary(null);
        const basePrice = effectivePrice;
        const dp = parseFloat(downPayment.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        if (dp < 0 || dp > basePrice) { setError('Valor de entrada inválido.'); return; }
        if (dp === basePrice) {
            setSimulation(`<p class="text-center font-semibold" style="color:${modalSettings.textColor}">Pagamento à vista!</p>`);
            setSimulationSummary(`Custo total: ${formatCurrency(basePrice)}`);
            return;
        }
        const financingAmount = basePrice - dp;
        let resultMessage = ''; let summaryMessage = '';
        if (paymentType === 'debito') {
            const finalDebitAmount = financingAmount * (1 + siteInfo.rates.debit);
            const totalCost = finalDebitAmount + dp;
            resultMessage = `<p style="color:${modalSettings.textColor}"><strong>Entrada:</strong> ${formatCurrency(dp)}</p><p style="color:${modalSettings.textColor}"><strong>Débito:</strong> ${formatCurrency(finalDebitAmount)}</p><p class="text-xs opacity-70 mt-1" style="color:${modalSettings.textColor}">(Custo total: ${formatCurrency(totalCost)})</p>`;
            summaryMessage = `Custo total no débito: ${formatCurrency(totalCost)}`;
        } else {
            const numInstallments = parseInt(installments);
            if (isNaN(numInstallments) || numInstallments < 1 || numInstallments > 12) { setError('Insira de 1 a 12 parcelas.'); return; }
            const interestRate = siteInfo.rates.credit[numInstallments as keyof typeof siteInfo.rates.credit];
            const finalFinancedAmount = financingAmount * (1 + interestRate);
            const monthlyPayment = finalFinancedAmount / numInstallments;
            const totalCost = finalFinancedAmount + dp;
            resultMessage = `<p style="color:${modalSettings.textColor}"><strong>${numInstallments}x de:</strong> ${formatCurrency(monthlyPayment)}</p><p class="text-xs opacity-70 mt-1" style="color:${modalSettings.textColor}">(Total no cartão: ${formatCurrency(finalFinancedAmount)} | Custo total: ${formatCurrency(totalCost)})</p>`;
            summaryMessage = `Custo total no crédito em ${numInstallments}x: ${formatCurrency(totalCost)}`;
        }
        setSimulation(resultMessage); setSimulationSummary(summaryMessage);
    };

    const createPendingSale = () => {
        if (!storeId) {
            console.error("Store ID missing for pending sale creation");
            return;
        }
        const pendingSaleData: Omit<PendingSale, 'id'> = {
            customerName: '',
            products: itemsToPurchase.map(i => ({
                productName: i.product.name,
                productId: i.product.id,
                quantity: i.quantity,
                variantName: i.product.variants?.[i.selectedVariantIndex]?.colorName
            })),
            totalValue: effectivePrice,
            origin: 'whatsapp_click',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        };
        
        getCollectionRef('pending_sales', storeId).add(pendingSaleData).catch(console.error);
    };

    const generateOrderText = () => {
        let text = isCartMode ? `Olá! Gostaria de finalizar o seguinte pedido:\n` : `Olá! Tenho interesse no ${product?.name}`;
        if (isCartMode) {
            itemsToPurchase.forEach(item => {
                const variantName = item.product.variants?.[item.selectedVariantIndex]?.colorName;
                text += `- ${item.quantity}x ${item.product.name}${variantName ? ` (${variantName})` : ''} - ${formatCurrency(item.product.price)}\n`;
            });
            text += `\nTotal Base: ${formatCurrency(baseTotalPrice)}`;
        } else if (hasVariants && activeVariant) {
            text += ` (${activeVariant.colorName})`;
        }
        if (appliedCoupon) {
            text += `\nCupom Aplicado: ${appliedCoupon.code} (Desconto: ${appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : formatCurrency(appliedCoupon.value)})`;
            text += `\nTotal com Desconto: ${formatCurrency(effectivePrice)}`;
        }
        return text;
    };

    const whatsappLinkSimulation = useMemo(() => {
        let text = generateOrderText();
        if (simulation) {
            const dp = parseFloat(downPayment.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
            if (dp === effectivePrice) {
                text += `\n\nForma de Pagamento: À Vista (${formatCurrency(effectivePrice)}).`;
            } else if (paymentType === 'debito') {
                 const finalDebitAmount = (effectivePrice - dp) * (1 + siteInfo.rates.debit);
                 text += `\n\nForma de Pagamento: Simulação de entrada de ${formatCurrency(dp)} + restante de ${formatCurrency(finalDebitAmount)} no débito.`;
            } else {
                const numInstallments = parseInt(installments);
                if (numInstallments > 0 && numInstallments <= 12) {
                    const interestRate = siteInfo.rates.credit[numInstallments as keyof typeof siteInfo.rates.credit];
                    const finalFinancedAmount = (effectivePrice - dp) * (1 + interestRate);
                    const monthlyPayment = finalFinancedAmount / numInstallments;
                    text += `\n\nForma de Pagamento: Simulação de entrada de ${formatCurrency(dp)} + restante em ${numInstallments}x de ${formatCurrency(monthlyPayment)} no cartão.`;
                }
            }
        }
        return `${whatsappSalesUrl}?text=${encodeURIComponent(text)}`;
    }, [itemsToPurchase, simulation, downPayment, paymentType, installments, whatsappSalesUrl, siteInfo.rates, appliedCoupon, effectivePrice]);
    
    const whatsappLinkDirect = useMemo(() => {
        let text = generateOrderText();
        if (isConsultPrice) text = `Olá! Gostaria de saber o preço do ${product?.name}.`;
        else if(isService) text = `Olá! Gostaria de saber mais sobre o serviço de ${product?.name}.`;
        else text += `\n\nForma de Pagamento: À Vista.`;
        return `${whatsappSalesUrl}?text=${encodeURIComponent(text)}`;
    }, [itemsToPurchase, isConsultPrice, isService, whatsappSalesUrl, effectivePrice, appliedCoupon]);

    if (!isOpen) return null;
    
    // Scale Factor logic (Global or specific setting)
    const scale = (siteInfo.storeLayout?.productModalScale || 100) / 100;
    const buttonStyles = generateModalButtonCss(buttonConfig);
    
    // Helper styles for specific buttons override
    const getButtonStyle = (type: 'cash' | 'installments' | 'whatsapp') => {
        let bg = customBtnColors[`${type}Background`];
        let color = customBtnColors[`${type}Text`];
        
        // Fallback to generic styles if custom not set
        if (!bg) bg = undefined; 
        if (!color) color = undefined;

        return {
            backgroundColor: bg,
            color: color
        };
    };
    
    const getToggleStyle = (isActive: boolean) => {
        if (isActive) {
            return {
                backgroundColor: customBtnColors.toggleButtonActiveBackground || 'rgba(255,255,255,0.1)',
                color: customBtnColors.toggleButtonActiveText || modalSettings.textColor,
                borderColor: customBtnColors.toggleButtonBorder || buttonConfig.primaryColor,
            }
        }
        return {
            backgroundColor: customBtnColors.toggleButtonBackground || 'transparent',
            color: customBtnColors.toggleButtonText || modalSettings.textColor,
            borderColor: customBtnColors.toggleButtonBorder || 'rgba(255,255,255,0.2)',
        }
    };

    return (
        <>
        <style>{buttonStyles}</style>
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" aria-hidden="true" />
            <div className="w-full max-w-md relative flex flex-col transition-transform duration-200 ease-out" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }} onClick={(e) => e.stopPropagation()}>
                <div className={`w-full p-6 animate-scale-in overflow-y-auto custom-scrollbar relative shadow-2xl border border-white/10 ${radiusClass}`} style={{ backgroundColor: modalSettings.backgroundColor, color: modalSettings.textColor, maxHeight: `${85/scale}vh` }}>
                    <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100 transition-opacity z-10 p-1 bg-white/5 rounded-full hover:bg-white/10" style={{ color: modalSettings.textColor }}><X size={20} /></button>
                    
                     {/* Header / Product Info */}
                     <div className="mb-6">
                        {isCartMode && itemsToPurchase.length > 1 ? (
                             /* List of Items in Cart */
                             <div className="space-y-4 mb-4">
                                <h3 className="font-bold text-xl leading-tight border-b border-white/10 pb-2" style={{ color: modalSettings.textColor }}>{title}</h3>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                    {itemsToPurchase.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                            <div className="w-12 h-12 flex-shrink-0 rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
                                                <img src={item.product.variants?.[item.selectedVariantIndex]?.imageUrl || item.product.image} className="w-full h-full object-cover"/>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-bold truncate">{item.quantity}x {item.product.name}</p>
                                                {item.product.variants?.[item.selectedVariantIndex]?.colorName && (
                                                    <p className="text-xs opacity-60">{item.product.variants[item.selectedVariantIndex].colorName}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">{formatCurrency(item.product.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                     <span className="text-sm font-medium opacity-70">Total:</span>
                                     {appliedCoupon ? (
                                        <div className="text-right">
                                            <p className="text-xs line-through opacity-50" style={{ color: modalSettings.textColor }}>{formatCurrency(baseTotalPrice)}</p>
                                            <p className="font-extrabold text-xl text-green-400">{formatCurrency(effectivePrice)}</p>
                                            <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-1.5 py-0.5 rounded">CUPOM ATIVO</span>
                                        </div>
                                    ) : (
                                        <p className="font-extrabold text-xl" style={{ color: modalSettings.textColor }}>{formatCurrency(baseTotalPrice)}</p>
                                    )}
                                </div>
                             </div>
                        ) : (
                             /* Single Item Display */
                             <div className="flex gap-4 items-center mb-2">
                                <div className="w-24 h-24 flex-shrink-0 rounded-xl p-2 border border-white/10 flex items-center justify-center shadow-inner" style={{ backgroundColor: modalSettings.imageBackgroundColor || 'rgba(255, 255, 255, 0.05)' }}>
                                     <img src={imageUrl} alt={title || "Produto"} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="flex-grow text-left">
                                    <h3 className="font-bold text-xl leading-tight mb-1" style={{ color: modalSettings.textColor }}>{title}</h3>
                                    <p className="text-sm opacity-70 mb-1" style={{ color: modalSettings.textColor }}>{subtitle}</p>
                                    {appliedCoupon ? (
                                        <div>
                                            <p className="text-xs line-through opacity-50" style={{ color: modalSettings.textColor }}>{formatCurrency(baseTotalPrice)}</p>
                                            <p className="font-extrabold text-2xl text-green-400">{formatCurrency(effectivePrice)}</p>
                                            <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-1.5 py-0.5 rounded">CUPOM ATIVO</span>
                                        </div>
                                    ) : (
                                        <p className="font-extrabold text-2xl" style={{ color: modalSettings.textColor }}>{formatCurrency(baseTotalPrice)}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {(isService || isConsultPrice) ? <div className="text-center mt-4"><p className="mb-4 opacity-80 text-sm" style={{ color: modalSettings.textColor }}>Entre em contato.</p><a href={whatsappLinkDirect} onClick={createPendingSale} target="_blank" className="block w-full text-center font-bold py-2.5 transition-colors opacity-90 hover:opacity-100 text-sm" style={{ backgroundColor: '#22c55e', color: '#fff', borderRadius: '0.5rem' }}>Falar no WhatsApp</a></div> : 
                    (
                        <>
                            {hasVariants && (
                                <div className="flex items-center gap-2 mb-4 pl-1">
                                    <span className="text-xs font-semibold opacity-80" style={{ color: modalSettings.textColor }}>Cor:</span>
                                    {product!.variants!.map((variant, index) => (
                                        <button key={index} onClick={() => setSelectedVariantIndex(index) } className={`w-6 h-6 rounded-full border-2 transition-transform duration-200 ${index === selectedVariantIndex ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: variant.colorHex }}/>
                                    ))}
                                </div>
                            )}
                            
                            {modalSettings.showCouponField !== false && (
                                <div className="mb-4">
                                    <button onClick={() => setIsCouponExpanded(!isCouponExpanded)} className="flex items-center gap-2 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity mb-2" style={{ color: modalSettings.textColor }}>
                                        <Tag size={14} /> <span>Possui um cupom de desconto?</span> {isCouponExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {isCouponExpanded && (
                                        <div className="bg-white/5 p-3 rounded-lg border animate-fade-in" style={{ borderColor: inputStyle.borderColor }}>
                                            <div className="flex gap-2">
                                                <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Digite seu cupom" className="border rounded-lg w-full py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm uppercase" style={inputStyle} disabled={!!appliedCoupon} />
                                                {appliedCoupon ? ( <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(null); }} className="p-2 text-red-400 hover:text-red-300"><X size={18}/></button> ) : ( <button onClick={handleApplyCoupon} disabled={!couponCode || isValidatingCoupon} className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 rounded-lg font-bold text-xs transition-colors">{isValidatingCoupon ? <Loader size={14} className="animate-spin"/> : 'Aplicar'}</button> )}
                                            </div>
                                            {couponMessage && ( <p className={`text-xs mt-2 font-medium ${couponMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{couponMessage.text}</p> )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <a 
                                href={whatsappLinkDirect} 
                                onClick={createPendingSale} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`modal-action-button block w-full text-center font-bold py-3.5 transition-all opacity-90 hover:opacity-100 text-sm ${btnRadiusClass} shadow-lg`}
                                style={getButtonStyle('cash')}
                            >
                                {texts.modalBtnCash || "Pagar à Vista (WhatsApp)"}
                            </a>

                            <div className="relative text-center my-5">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t opacity-10" style={{ borderColor: modalSettings.textColor }} /></div>
                                <div className="relative flex justify-center"><span className="px-2 text-[10px] opacity-50 uppercase font-bold tracking-widest" style={{ color: modalSettings.textColor, backgroundColor: modalSettings.backgroundColor }}>{texts.modalCalculatorTitle || "OU SIMULE PARCELADO"}</span></div>
                            </div>

                            <div className="space-y-4 text-left bg-white/5 p-4 rounded-xl border border-white/5">
                                <div>
                                    <label className="block text-xs font-bold mb-1.5 opacity-70 uppercase tracking-wider" style={{ color: modalSettings.textColor }}>Entrada (PIX/dinheiro)</label>
                                    <input type="text" inputMode="decimal" value={downPayment} onChange={(e) => setDownPayment(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00 (opcional)" className="border rounded-lg w-full py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm font-mono" style={inputStyle} />
                                    
                                    {/* PIX KEY DISPLAY */}
                                    {siteInfo.paymentConfig?.pixKey && (
                                        <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 animate-fade-in relative group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] text-emerald-400 font-bold mb-1 tracking-wider uppercase">CHAVE PIX PARA PAGAMENTO</p>
                                                    <p className="text-sm font-mono text-white break-all">{siteInfo.paymentConfig.pixKey}</p>
                                                    {siteInfo.paymentConfig.pixName && <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{siteInfo.paymentConfig.pixName}</p>}
                                                </div>
                                                <button 
                                                    onClick={copyPixKey} 
                                                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded-md transition-colors flex-shrink-0"
                                                    title="Copiar Chave Pix"
                                                >
                                                    {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                            {copiedPix && <div className="absolute top-2 right-12 text-[10px] text-emerald-400 font-bold bg-black/50 px-2 py-0.5 rounded animate-fade-in">Copiado!</div>}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1.5 opacity-70 uppercase tracking-wider" style={{ color: modalSettings.textColor }}>Restante em:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setPaymentType('credito')} className={`py-2.5 rounded-lg text-xs font-bold border transition-colors ${paymentType === 'credito' ? 'opacity-100 shadow-inner' : 'opacity-50 hover:opacity-80'}`} style={getToggleStyle(paymentType === 'credito')}>Crédito</button>
                                        <button onClick={() => setPaymentType('debito')} className={`py-2.5 rounded-lg text-xs font-bold border transition-colors ${paymentType === 'debito' ? 'opacity-100 shadow-inner' : 'opacity-50 hover:opacity-80'}`} style={getToggleStyle(paymentType === 'debito')}>Débito</button>
                                    </div>
                                </div>
                                {paymentType === 'credito' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-bold mb-1.5 opacity-70 uppercase tracking-wider" style={{ color: modalSettings.textColor }}>Parcelas (Crédito)</label>
                                        <select value={installments} onChange={e => setInstallments(e.target.value)} className="border rounded-lg w-full py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm font-mono" style={inputStyle}>
                                            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x</option>)}
                                        </select>
                                    </div>
                                )}
                                <button 
                                    onClick={handleSimulate} 
                                    className={`modal-action-button w-full font-bold py-3 transition-all opacity-90 hover:opacity-100 text-sm ${btnRadiusClass} mt-2 shadow-lg`}
                                    style={getButtonStyle('installments')}
                                >
                                    {texts.modalBtnInstallments || "Calcular Parcelas"}
                                </button>
                            </div>

                            {error && <div className="mt-3 text-center text-red-500 text-xs font-bold animate-pulse" role="alert">{error}</div>}

                            {simulation && (
                                <div className="mt-4 pt-4 border-t border-white/10 text-center animate-scale-in">
                                    {simulationSummary && <p className="text-center text-xs mb-2 font-bold opacity-80 uppercase tracking-wider" style={{ color: modalSettings.textColor }}>{simulationSummary}</p>}
                                    <div className="text-sm mb-4" dangerouslySetInnerHTML={{__html: simulation}} />
                                    <a 
                                        href={whatsappLinkSimulation} 
                                        onClick={createPendingSale} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={`modal-action-button block w-full text-center font-bold py-3.5 transition-colors opacity-90 hover:opacity-100 text-sm ${btnRadiusClass} shadow-lg`}
                                        style={getButtonStyle('whatsapp')}
                                    >
                                        {texts.modalBtnWhatsApp || "Confirmar no WhatsApp"}
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

export default StorePurchaseModal;
