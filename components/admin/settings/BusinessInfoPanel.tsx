

import React from 'react';
import { SiteInfo } from '../../../types';

interface BusinessInfoPanelProps {
    siteInfo: SiteInfo;
    updateSiteInfo: React.Dispatch<React.SetStateAction<SiteInfo>>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 mt-6 border-t border-gray-800 first:mt-0 first:pt-0 first:border-none">
        <h4 className="font-semibold text-lg mb-4"><span className="bg-zinc-800 text-white px-3 py-1 rounded-md">{title}</span></h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

const BusinessInfoPanel: React.FC<BusinessInfoPanelProps> = ({ siteInfo, updateSiteInfo }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof SiteInfo) => {
        const { value } = e.target;
        updateSiteInfo(prev => ({
            ...prev,
            [key]: value
        }));
    };
    
     const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        // Allow multiline addresses using '\n', convert to <br /> for HTML rendering
        updateSiteInfo(prev => ({
            ...prev,
            address: value.replace(/\n/g, '<br />')
        }));
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400 -mt-2 mb-4">Informações que identificam sua loja e horário de funcionamento.</p>
            
            <SubSection title="Dados da Empresa">
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Nome da Loja</label>
                    <input type="text" value={siteInfo.storeName} onChange={e => handleInputChange(e, 'storeName')} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                </div>
                 <div>
                    <label className="text-sm text-gray-400 block mb-1">CNPJ (Opcional)</label>
                    <input type="text" value={siteInfo.cnpj || ''} onChange={e => handleInputChange(e, 'cnpj')} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                </div>
            </SubSection>

            <SubSection title="Endereço e Horários">
                <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Endereço</label>
                    <input type="text" value={siteInfo.address.replace(/<br \/>/g, '\n')} onChange={handleAddressChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Horário (Segunda a Sexta)</label>
                    <input type="text" value={siteInfo.hoursWeek} onChange={e => handleInputChange(e, 'hoursWeek')} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                </div>
                 <div>
                    <label className="text-sm text-gray-400 block mb-1">Horário (Sábado)</label>
                    <input type="text" value={siteInfo.hoursSaturday} onChange={e => handleInputChange(e, 'hoursSaturday')} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                </div>
                <div className="md:col-span-2">
                     <label className="text-sm text-gray-400 block mb-1">URL do Google Street View</label>
                    <input type="text" value={siteInfo.streetViewUrl} onChange={e => handleInputChange(e, 'streetViewUrl')} className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                </div>
            </SubSection>
        </div>
    );
};

export default BusinessInfoPanel;