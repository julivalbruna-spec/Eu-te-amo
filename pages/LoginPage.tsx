

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Removed Firebase v9 modular imports to use v8 compatible methods.
// import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, getDocRef } from '../firebase';
// import { doc, getDoc } from 'firebase/firestore';
import { SITE_INFO as defaultSiteInfo } from '../constants';
import { SiteInfo } from '../types';
import Logo from '../components/Logo';

interface LoginPageProps {
    storeId: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ storeId }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSiteInfo = async () => {
            if (!storeId) return;
            try {
                const siteInfoRef = getDocRef('settings', 'siteInfo', storeId);
                const docSnap = await siteInfoRef.get();
                if (docSnap.exists) {
                    setSiteInfo({ ...defaultSiteInfo, ...docSnap.data() } as SiteInfo);
                }
            } catch (err) {
                console.error("Failed to fetch site info for logo", err);
            }
        };
        fetchSiteInfo();
    }, [storeId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // FIX: Switched to Firebase v8 compat syntax for login.
            await auth.signInWithEmailAndPassword(email, password);
            navigate('/admin');
        } catch (err: any) {
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                     setError('E-mail ou senha inválidos.');
                     break;
                case 'auth/invalid-email':
                     setError('Formato de e-mail inválido.');
                     break;
                default:
                     setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
                     break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto overflow-hidden bg-[var(--surface)] rounded-lg shadow-md border border-[var(--border-color)]">
                <div className="px-6 py-8">
                    <div className="flex justify-center mx-auto">
                        <Logo 
                            logoUrl={siteInfo.logos.login || siteInfo.logos.main}
                            className="w-auto h-10"
                        />
                    </div>

                    <h3 className="mt-6 text-xl font-medium text-center text-white">Bem-vindo</h3>
                    <p className="mt-1 text-center text-gray-400">Acesse o painel de administrador</p>

                    <form onSubmit={handleLogin}>
                        <div className="w-full mt-6">
                            <input className="block w-full px-4 py-2 mt-2 text-base text-white placeholder-gray-500 bg-black border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-500" 
                                type="email" placeholder="E-mail" aria-label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>

                        <div className="w-full mt-4">
                            <input className="block w-full px-4 py-2 mt-2 text-base text-white placeholder-gray-500 bg-black border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-500" 
                                type="password" placeholder="Senha" aria-label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        {error && <p className="mt-4 text-xs text-red-500 text-center">{error}</p>}

                        <div className="flex items-center justify-between mt-6">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-300 transform rounded-lg focus:outline-none focus:ring focus:ring-yellow-300 focus:ring-opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: 'var(--button-primary-background)',
                                    color: 'var(--button-primary-text)',
                                }}
                            >
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
