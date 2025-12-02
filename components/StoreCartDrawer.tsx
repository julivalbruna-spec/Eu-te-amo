
import React, { useMemo } from 'react';
import { StoreCartItem, SiteInfo } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CornerDownLeft } from 'react-feather';

interface StoreCartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: StoreCartItem[];
    onUpdateQuantity: (productId: string, variantIndex: number, delta: number) => void;
    onRemoveItem: (productId: string, variantIndex: number) => void;
    onCheckout: () => void;
    siteInfo: SiteInfo;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const StoreCartDrawer: React.FC<StoreCartDrawerProps> = ({
    isOpen,
    onClose,
    cart,
    onUpdateQuantity,
    onRemoveItem,
    onCheckout,
    siteInfo
}) => {
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    }, [cart]);

    // Use Backdrop only on mobile to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && window.innerWidth < 768) {
            onClose();
        }
    };

    const { theme, chatWidget } = siteInfo;
    
    // Dynamic Position based on ChatWidget Settings
    // We add extra spacing (approx 80-90px) to sit ABOVE the chatbot button
    const baseBottom = (chatWidget?.positionBottom || 24);
    const panelBottom = baseBottom + 76; // 60px button + 16px gap
    
    const positionRight = (chatWidget?.positionRight || 24);
    
    // Size Constraints (Matching ChatWindow)
    const width = 380;
    const maxHeight = '80vh';

    return (
        <>
            {/* Backdrop (Visible/Active mainly on Mobile) */}
            <div 
                className={`fixed inset-0 z-[9995] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:bg-transparent md:pointer-events-none ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleBackdropClick}
            />

            {/* Floating Cart Panel */}
            <div 
                className={`fixed z-[9996] shadow-2xl flex flex-col transition-all duration-300 ease-in-out
                    w-full h-[85vh] bottom-0 left-0 rounded-t-2xl border-t
                    md:rounded-2xl md:border md:w-[380px] md:h-[600px] md:max-h-[80vh]
                    ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}
                `}
                style={{ 
                    backgroundColor: 'var(--cart-bg)',
                    borderColor: 'var(--cart-border)',
                    color: 'var(--cart-text)',
                    // Desktop Positioning
                    ...(window.innerWidth > 768 ? {
                        bottom: `${panelBottom}px`, // Higher up to avoid Chatbot Button
                        right: `${positionRight}px`,
                    } : {})
                }}
            >
                {/* Header */}
                <div className="p-4 flex justify-between items-center shadow-md relative z-10 rounded-t-2xl" style={{ backgroundColor: 'var(--cart-header-bg)', color: 'var(--cart-header-text)' }}>
                    <h2 className="text-base font-bold flex items-center gap-2">
                        <ShoppingBag size={20} /> Carrinho ({cart.reduce((acc, item) => acc + item.quantity, 0)})
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6">
                            <ShoppingBag size={48} className="mb-4" />
                            <p className="text-sm">Seu carrinho está vazio.</p>
                            <button onClick={onClose} className="mt-6 font-bold underline text-xs uppercase tracking-wider hover:text-white transition-colors">
                                Continuar Comprando
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => {
                            const variant = item.product.variants?.[item.selectedVariantIndex];
                            const image = variant?.imageUrl || item.product.image || item.product.variants?.[0]?.imageUrl;
                            
                            return (
                                <div key={`${item.product.id}-${item.selectedVariantIndex}`} className="flex gap-3 p-3 rounded-xl border relative group" style={{ borderColor: 'var(--cart-border)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                    <div className="w-16 h-16 bg-black rounded-lg flex-shrink-0 overflow-hidden border border-white/5">
                                        <img src={image} alt={item.product.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <h4 className="font-bold text-sm truncate" style={{ color: 'var(--cart-text)' }}>{item.product.name}</h4>
                                            {variant && (
                                                <p className="text-[10px] mt-0.5 opacity-70" style={{ color: 'var(--cart-text)' }}>Cor: {variant.colorName}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-end mt-1">
                                            <p className="font-bold text-sm" style={{ color: theme.brand }}>{formatCurrency(item.product.price)}</p>
                                            
                                            <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1 border border-white/10">
                                                <button 
                                                    onClick={() => {
                                                        if (item.quantity > 1) onUpdateQuantity(item.product.id, item.selectedVariantIndex, -1);
                                                        else onRemoveItem(item.product.id, item.selectedVariantIndex);
                                                    }}
                                                    className="p-0.5 hover:text-white transition-colors opacity-70 hover:opacity-100"
                                                    style={{ color: 'var(--cart-text)' }}
                                                >
                                                    {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center" style={{ color: 'var(--cart-text)' }}>{item.quantity}</span>
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.product.id, item.selectedVariantIndex, 1)}
                                                    className="p-0.5 hover:text-white transition-colors opacity-70 hover:opacity-100"
                                                    style={{ color: 'var(--cart-text)' }}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer / Checkout */}
                <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--cart-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    {cart.length > 0 && (
                        <div className="space-y-1 mb-2">
                            <div className="flex justify-between text-xs opacity-70" style={{ color: 'var(--cart-text)' }}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold" style={{ color: 'var(--cart-text)' }}>
                                <span>Total</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                        </div>
                    )}
                    
                    {cart.length > 0 ? (
                        <button 
                            onClick={onCheckout}
                            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
                            style={{ 
                                backgroundColor: 'var(--cart-checkout-bg)', 
                                color: 'var(--cart-checkout-text)' 
                            }}
                        >
                            Finalizar Compra <ArrowRight size={16} />
                        </button>
                    ) : null}
                    
                    <button 
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors hover:bg-white/5 border border-transparent hover:border-white/10"
                        style={{ color: 'var(--cart-text)' }}
                    >
                        <CornerDownLeft size={14} /> Continuar Comprando
                    </button>
                </div>
            </div>
        </>
    );
};

export default StoreCartDrawer;
