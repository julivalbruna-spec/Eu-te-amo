
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';

interface StoreContextType {
    storeId: string | null;
    setStoreIdForSuperAdmin: (newStoreId: string) => void;
    isSuperAdmin: boolean;
    loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within an StoreProvider');
    }
    return context;
};

// E-mail do Super Administrador
const SUPER_ADMIN_EMAIL = 'luicarods@gmail.com';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, loading: authLoading } = useAuth();
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Robust check for Super Admin (Case insensitive + Trim)
    const isSuperAdmin = currentUser?.email 
        ? currentUser.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() 
        : false;

    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }

        // --- 1. PRIORIDADE: URL PARAMETER (Permite Deep Linking e Previews explícitos) ---
        let urlStoreId: string | null = null;
        const searchParams = new URLSearchParams(window.location.search);
        urlStoreId = searchParams.get('storeId');

        if (!urlStoreId && window.location.hash.includes('?')) {
            const hashString = window.location.hash.split('?')[1]; 
            const hashParams = new URLSearchParams(hashString);
            urlStoreId = hashParams.get('storeId');
        }

        if (urlStoreId) {
            console.log(`[StoreContext] Carregando loja via URL: ${urlStoreId}`);
            setStoreId(urlStoreId);
            setLoading(false);
            return;
        }

        // --- 2. LÓGICA PARA VISITANTES (NÃO LOGADOS) ---
        if (!currentUser) {
            const hostname = window.location.hostname.toLowerCase();

            // Domínios de teste/desenvolvimento
            const isDefaultDomain = hostname.includes('localhost') || 
                                    hostname.includes('127.0.0.1') || 
                                    hostname.includes('firebaseapp.com') || 
                                    hostname.includes('web.app') ||
                                    hostname.includes('.run.app') || 
                                    hostname.includes('googleusercontent.com');

            if (isDefaultDomain) {
                // MUDANÇA CRÍTICA: Ler configuração global do Firestore em vez de localStorage
                // Isso permite que a escolha do Admin no PC reflita no Celular (ambiente de teste)
                const unsubscribe = db.collection('settings').doc('preview')
                    .onSnapshot((doc) => {
                        if (doc.exists && doc.data()?.currentStoreId) {
                            console.log(`[StoreContext] Preview Global Ativo: ${doc.data()?.currentStoreId}`);
                            setStoreId(doc.data()?.currentStoreId);
                        } else {
                            // Fallback para iphonerios se não houver preview configurado
                            setStoreId('iphonerios');
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("Erro ao ler preview global:", error);
                        setStoreId('iphonerios');
                        setLoading(false);
                    });
                
                return () => unsubscribe();
            }

            // Domínio Real (Produção) - Busca no mapeamento
            if (!hostname) {
                setStoreId('iphonerios');
                setLoading(false);
                return;
            }

            db.collection('domain_mappings').doc(hostname).get()
                .then((doc) => {
                    if (doc.exists) {
                        setStoreId(doc.data()?.storeId);
                    } else {
                        const altHostname = hostname.startsWith('www.') ? hostname.replace('www.', '') : `www.${hostname}`;
                        return db.collection('domain_mappings').doc(altHostname).get().then(altDoc => {
                            if(altDoc.exists) {
                                setStoreId(altDoc.data()?.storeId);
                            } else {
                                console.warn(`[StoreContext] Domínio ${hostname} não registrado.`);
                                setStoreId(null);
                            }
                        });
                    }
                })
                .catch((error) => {
                    console.error("[StoreContext] Erro de domínio:", error);
                    setStoreId(null);
                })
                .finally(() => {
                    setLoading(false);
                });
            return;
        }

        // --- 3. LÓGICA PARA ADMINISTRADORES (LOGADOS) ---
        
        if (isSuperAdmin) {
            // Para o Admin logado, usamos o localStorage para resposta imediata,
            // mas também sincronizamos com o banco (feito na função setStoreIdForSuperAdmin)
            const savedStoreId = localStorage.getItem('superAdminActiveStoreId') || 'iphonerios';
            setStoreId(savedStoreId);
            setLoading(false);
            return;
        }
        
        // Admin Regular (Loja Única)
        if (!currentUser.email) {
            setStoreId(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        db.collection('stores')
            .where('admins', 'array-contains', currentUser.email)
            .limit(1)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    const storeDoc = snapshot.docs[0];
                    if (storeDoc.data().status === 'blocked') {
                        setStoreId(null);
                    } else {
                        setStoreId(storeDoc.id);
                    }
                } else {
                    setStoreId(null);
                }
            })
            .catch(error => {
                console.error("Error fetching user's store:", error);
                setStoreId(null);
            })
            .finally(() => setLoading(false));

    }, [currentUser, authLoading, isSuperAdmin]);

    const setStoreIdForSuperAdmin = (newStoreId: string) => {
        if (isSuperAdmin) {
            // 1. Atualiza estado local (para o PC do admin ser rápido)
            setStoreId(newStoreId);
            localStorage.setItem('superAdminActiveStoreId', newStoreId);

            // 2. Atualiza estado GLOBAL no Firestore (para o Celular/Visitante ver a mudança)
            // Não bloqueamos a UI esperando isso terminar (fire and forget)
            db.collection('settings').doc('preview').set({
                currentStoreId: newStoreId,
                updatedAt: new Date()
            }, { merge: true }).catch(err => console.error("Erro ao atualizar preview global:", err));
        }
    };

    const value = {
        storeId,
        setStoreIdForSuperAdmin,
        isSuperAdmin,
        loading
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
