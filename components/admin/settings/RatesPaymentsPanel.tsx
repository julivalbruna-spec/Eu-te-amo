
import React from 'react';
import { SiteInfo } from '../../../types';

interface RatesPaymentsPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4"><span className="bg-zinc-800 text-white px-3 py-1 rounded-md">{title}</span></h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
);

const RateInput: React.FC<{ label: string, value: number, onChange: (value: number) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="text-sm text-gray-400 block mb-1">{label}</label>
        <div className="relative">
            <input
                type="number"
                value={value * 100} // Display as percentage
                onChange={e => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                        onChange(val / 100);
                    }
                }}
                className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-center text-sm pr-6"
                step="0.1"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">%</span>
        </div>
    </div>
);


const RatesPaymentsPanel: React.FC<RatesPaymentsPanelProps> = ({ siteInfo, updateSiteInfo }) => {
    
    const handleDebitRateChange = (value: number) => {
        updateSiteInfo(prev => ({
            ...prev,
            rates: { ...prev.rates, debit: value }
        }));
    };

    const handleCreditRateChange = (installments: number, value: number) => {
        updateSiteInfo(prev => ({
            ...prev,
            rates: {
                ...prev.rates,
                credit: {
                    ...prev.rates.credit,
                    [installments]: value
                }
            }
        }));
    };
    
    const handlePixConfigChange = (field: 'pixKey' | 'pixName', value: string) => {
        updateSiteInfo(prev => ({
            ...prev,
            paymentConfig: {
                ...prev.paymentConfig,
                [field]: value,
                // Ensure other fields are preserved or defaulted if undefined
                pixKey: field === 'pixKey' ? value : (prev.paymentConfig?.pixKey || ''),
                pixName: field === 'pixName' ? value : (prev.paymentConfig?.pixName || '')
            }
        }));
    };
    
    const creditInstallments = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400 -mt-2 mb-4">Gerencie as taxas de cartão e configure os dados para recebimento via Pix.</p>
            
            <SubSection title="Configuração do Pix">
                <div className="col-span-2 sm:col-span-3 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Chave Pix</label>
                        <input 
                            type="text" 
                            value={siteInfo.paymentConfig?.pixKey || ''} 
                            onChange={(e) => handlePixConfigChange('pixKey', e.target.value)} 
                            placeholder="CPF, CNPJ, Email ou Chave Aleatória"
                            className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Nome do Beneficiário</label>
                        <input 
                            type="text" 
                            value={siteInfo.paymentConfig?.pixName || ''} 
                            onChange={(e) => handlePixConfigChange('pixName', e.target.value)} 
                            placeholder="Nome que aparecerá no comprovante"
                            className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-sm"
                        />
                    </div>
                </div>
            </SubSection>

            <SubSection title="Taxa do Débito">
                <div className="max-w-xs">
                     <RateInput 
                        label="Taxa do Cartão de Débito"
                        value={siteInfo.rates.debit}
                        onChange={handleDebitRateChange}
                    />
                </div>
            </SubSection>

            <SubSection title="Taxas do Crédito (Parcelado)">
                {creditInstallments.map(installment => (
                    <RateInput 
                        key={installment}
                        label={`${installment}x`}
                        value={siteInfo.rates.credit[installment] || 0}
                        onChange={value => handleCreditRateChange(installment, value)}
                    />
                ))}
            </SubSection>
        </div>
    );
};

export default RatesPaymentsPanel;
