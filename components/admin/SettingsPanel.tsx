
import React, { useState, useEffect, useRef } from 'react';
import { getDocRef } from '../../firebase';
import { SiteInfo } from '../../types';
import { SITE_INFO as defaultSiteInfo } from '../../constants';
import { Save, Loader } from 'react-feather';
import BusinessInfoPanel from './settings/BusinessInfoPanel';
import RatesPaymentsPanel from './settings/RatesPaymentsPanel';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface SettingsPanelProps {
    section: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string;
}

const isObject = (item: any): item is object => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (sourceValue === null || sourceValue === undefined) {
        return;
      }
      
      if (Array.isArray(targetValue)) {
        if (Array.isArray(sourceValue)) {
          output[key] = sourceValue;
        }
      } else if (isObject(targetValue) && isObject(sourceValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    });
  }

  return output;
};

const AdminCard: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children }) => (
    <div className="admin-card">
        <div className="admin-card-header">
            <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <div className="admin-card-content">
            {children}
        </div>
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ section, showToast, storeId }) => {
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const isInitialMount = useRef(true);
    const debouncedSiteInfo = useDebounce(siteInfo, 1000);

    const updateSiteInfo = (updater: React.SetStateAction<SiteInfo>) => {
        if (!isInitialMount.current) {
            setStatus('saving');
        }
        setSiteInfo(updater);
    };

    useEffect(() => {
        if (status === 'saved') {
            const timer = setTimeout(() => setStatus('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        // Protection: Only save if not initial mount AND storeId exists
        if (!isInitialMount.current && debouncedSiteInfo && storeId) {
            setStatus('saving');
            getDocRef('settings', 'siteInfo', storeId).set(debouncedSiteInfo, { merge: true })
                .then(() => setStatus('saved'))
                .catch(error => {
                    console.error(error);
                    showToast('Erro ao salvar alterações automaticamente.', 'error');
                    setStatus('idle');
                })
        }
    }, [debouncedSiteInfo, storeId]);

    useEffect(() => {
        if (!storeId) return;
        
        const docRef = getDocRef('settings', 'siteInfo', storeId);
        const unsubSiteInfo = docRef.onSnapshot(
            (docSnap) => {
                let fetchedData: SiteInfo;
                 if (docSnap.exists) {
                    fetchedData = deepMerge(defaultSiteInfo, docSnap.data());
                } else {
                    fetchedData = defaultSiteInfo;
                    docRef.set(defaultSiteInfo).catch(err => console.error("Failed to set default site info", err));
                }
                setSiteInfo(fetchedData);
                if (loading) setLoading(false);
                if (isInitialMount.current) {
                    setTimeout(() => { isInitialMount.current = false; setStatus('idle'); }, 500);
                }
            },
            (error) => {
                console.error("Error fetching site info:", error);
                showToast("Erro ao carregar configurações.", 'error');
                setLoading(false);
            }
        );
        return () => unsubSiteInfo();
    }, [storeId]);
    
    if (loading) return <p>Carregando configurações...</p>;

    const panelProps = { siteInfo, updateSiteInfo, showToast };

    const SavingIndicator = () => {
        if (status === 'idle') return null;
        let text = '';
        switch(status) {
            case 'saving': text = 'Salvando...'; break;
            case 'saved': text = 'Salvo!'; break;
            default: return null;
        }

        return (
            <div className="fixed bottom-5 md:bottom-auto md:top-5 left-1/2 -translate-x-1/2 md:left-auto md:right-[440px] z-50 bg-[#0a0a0a] border border-[#27272a] text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                {status === 'saving' && <Loader size={16} className="animate-spin" />}
                {status === 'saved' && <Save size={16} className="text-green-500" />}
                <span>{text}</span>
            </div>
        );
    };

    return (
        <div className="relative space-y-8">
            <SavingIndicator />
            <p className="text-gray-400">Gerencie as configurações fundamentais do seu negócio. As alterações são salvas automaticamente.</p>
            
            {section === 'informacoes' && (
                <AdminCard title="Informações do Negócio">
                    <BusinessInfoPanel {...panelProps} />
                </AdminCard>
            )}

            {section === 'taxas' && (
                <AdminCard title="Taxas e Pagamento">
                    <RatesPaymentsPanel {...panelProps} />
                </AdminCard>
            )}
        </div>
    );
};

export default SettingsPanel;
