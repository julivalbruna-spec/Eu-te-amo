
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SiteInfo } from '../types';

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

interface PaymentSimulatorProps {
    product: Product;
    siteInfo: SiteInfo;
}

// FIX: Changed to a named export to resolve module resolution issue.
export const PaymentSimulator: React.FC<PaymentSimulatorProps> = ({ product, siteInfo }) => {
    const [downPayment, setDownPayment] = useState('');
    const [installments, setInstallments] = useState('1');
    const [paymentType, setPaymentType] = useState('credito');
    const [simulation, setSimulation] = useState<string | null>(null);
    const [simulationSummary, setSimulationSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isService = product.category === 'assistencia';
    const isConsultPrice = !isService && product.price === 0.00;
    
    const whatsappSalesUrl = `https://wa.me/${siteInfo.links.whatsappSales}`;
    
    useEffect(() => {
        const savedSim = localStorage.getItem(`simulation-${product.id}`);
        if (savedSim) {
            try {
                const { dp, pt, inst } = JSON.parse(savedSim);
                setDownPayment(dp || '');
                setPaymentType(pt || 'credito');
                setInstallments(inst || '1');
            } catch (e) {
                 setDownPayment('');
                 setInstallments('1');
                 setPaymentType('credito');
            }
        }
    }, [product.id]);

    useEffect(() => {
        const simData = {
            dp: downPayment,
            pt: paymentType,
            inst: installments,
        };
        localStorage.setItem(`simulation-${product.id}`, JSON.stringify(simData));
    }, [downPayment, paymentType, installments, product.id]);
    
    const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDownPayment(formatCurrencyInput(e.target.value));
    };

    const handleSimulate = () => {
        setError(null);
        setSimulation(null);
        setSimulationSummary(null);
        const basePrice = product.price;
        const dp = parseFloat(downPayment.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

        if (dp < 0 || dp > basePrice) {
            setError('Valor de entrada inválido.');
            return;
        }

        if (dp === basePrice) {
            const msg = `<p class="text-center font-semibold">Pagamento à vista!</p>`;
            setSimulation(msg);
            setSimulationSummary(`Custo total: ${formatCurrency(basePrice)}`);
            return;
        }
        
        const financingAmount = basePrice - dp;
        let resultMessage = '';
        let summaryMessage = '';

        if (paymentType === 'debito') {
            const finalDebitAmount = financingAmount * (1 + siteInfo.rates.debit);
            const totalCost = finalDebitAmount + dp;
            resultMessage = `<p><strong>Entrada:</strong> ${formatCurrency(dp)}</p><p><strong>Débito:</strong> ${formatCurrency(finalDebitAmount)}</p><p class="text-xs text-gray-500 mt-1">(Custo total: ${formatCurrency(totalCost)})</p>`;
            summaryMessage = `Custo total no débito: ${formatCurrency(totalCost)}`;
        } else {
            const numInstallments = parseInt(installments);
            if (isNaN(numInstallments) || numInstallments < 1 || numInstallments > 12) {
                setError('Insira de 1 a 12 parcelas.');
                return;
            }
            const interestRate = siteInfo.rates.credit[numInstallments as keyof typeof siteInfo.rates.credit];
            const finalFinancedAmount = financingAmount * (1 + interestRate);
            const monthlyPayment = finalFinancedAmount / numInstallments;
            const totalCost = finalFinancedAmount + dp;
            resultMessage = `<p><strong>${numInstallments}x de:</strong> ${formatCurrency(monthlyPayment)}</p><p class="text-xs text-gray-500 mt-1">(Total no cartão: ${formatCurrency(finalFinancedAmount)} | Custo total: ${formatCurrency(totalCost)})</p>`;
            summaryMessage = `Custo total no crédito em ${numInstallments}x: ${formatCurrency(totalCost)}`;
        }
        setSimulation(resultMessage);
        setSimulationSummary(summaryMessage);
    };

    const whatsappLinkSimulation = useMemo(() => {
        let text = `Olá! Tenho interesse no ${product.name}.`;
        if (simulation) {
            const dp = parseFloat(downPayment.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
            if (dp === product.price) {
                text += ` Gostaria de confirmar a compra com pagamento à vista de ${formatCurrency(product.price)}.`;
            } else if (paymentType === 'debito') {
                 const finalDebitAmount = (product.price - dp) * (1 + siteInfo.rates.debit);
                 text += ` Gostaria de simular a compra com uma entrada de ${formatCurrency(dp)} e o restante de ${formatCurrency(finalDebitAmount)} no débito.`;
            } else {
                const numInstallments = parseInt(installments);
                if (numInstallments > 0 && numInstallments <= 12) {
                    const interestRate = siteInfo.rates.credit[numInstallments as keyof typeof siteInfo.rates.credit];
                    const finalFinancedAmount = (product.price - dp) * (1 + interestRate);
                    const monthlyPayment = finalFinancedAmount / numInstallments;
                    text += ` Gostaria de simular a compra com uma entrada de ${formatCurrency(dp)} e o restante em ${numInstallments}x de ${formatCurrency(monthlyPayment)} no cartão.`
                }
            }
        }
        return `${whatsappSalesUrl}?text=${encodeURIComponent(text)}`;
    }, [product, simulation, downPayment, paymentType, installments, whatsappSalesUrl, siteInfo.rates]);
    
    const whatsappLinkVista = useMemo(() => {
        let text;
        if (isConsultPrice) {
            text = `Olá! Gostaria de saber o preço do ${product.name}.`
        } else if(isService) {
            text = `Olá! Gostaria de saber mais sobre o serviço de ${product.name}.`
        } else {
             text = `Olá! Tenho interesse em comprar o ${product.name} à vista por ${formatCurrency(product.price)}.`;
        }
        return `${whatsappSalesUrl}?text=${encodeURIComponent(text)}`;
    }, [product, isConsultPrice, isService, whatsappSalesUrl]);
    
    if (isService || isConsultPrice) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <a href={whatsappLinkVista} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors">
                    Falar no WhatsApp
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
             <div className="text-center">
                <p className="text-gray-400 text-sm">Valor à vista</p>
                <p className="font-bold text-3xl text-white">{formatCurrency(product.price)}</p>
            </div>
             <a href={whatsappLinkVista} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-colors">
                Pagar à Vista (WhatsApp)
            </a>

            <div className="relative text-center">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-black/30 px-2 text-sm text-gray-400 backdrop-blur-sm">OU SIMULE PARCELADO</span>
                </div>
            </div>

            <div className="space-y-4 text-left">
                <div>
                    <label htmlFor={`pix-${product.id}`} className="block text-sm font-semibold mb-1 text-gray-300">Entrada (PIX/dinheiro)</label>
                    <input type="text" inputMode="decimal" id={`pix-${product.id}`} value={downPayment} onChange={handleDownPaymentChange} placeholder="R$ 0,00 (opcional)" className="bg-black/50 border border-white/20 text-white rounded-lg w-full py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Restante em:</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setPaymentType('credito')} className={`py-2 rounded-md text-sm font-semibold border ${paymentType === 'credito' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-800 text-gray-300 border-gray-700'}`}>Crédito</button>
                        <button onClick={() => setPaymentType('debito')} className={`py-2 rounded-md text-sm font-semibold border ${paymentType === 'debito' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-800 text-gray-300 border-gray-700'}`}>Débito</button>
                    </div>
                </div>
                {paymentType === 'credito' && (
                    <div>
                        <label htmlFor={`installments-${product.id}`} className="block text-sm font-semibold mb-1 text-gray-300">Parcelas (Crédito)</label>
                        <select id={`installments-${product.id}`} value={installments} onChange={e => setInstallments(e.target.value)} className="bg-black/50 border border-white/20 text-white rounded-lg w-full py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-500">
                            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x</option>)}
                        </select>
                    </div>
                )}
                <button onClick={handleSimulate} className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors">Calcular Parcelas</button>
            </div>
            {error && <div className="mt-3 text-center text-red-400 text-sm" role="alert">{error}</div>}
            {simulation && (
                <div className="mt-4 pt-4 border-t border-white/20 text-center">
                    {simulationSummary && <p className="text-gray-300 text-sm mb-2 font-semibold">{simulationSummary}</p>}
                    <div className="text-white text-lg" dangerouslySetInnerHTML={{__html: simulation}} />
                     <a href={whatsappLinkSimulation} target="_blank" rel="noopener noreferrer" className="block mt-4 w-full text-center bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors">Confirmar no WhatsApp</a>
                </div>
            )}
        </div>
    );
};

export default PaymentSimulator;