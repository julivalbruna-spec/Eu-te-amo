
import React, { useState, useEffect } from 'react';
import { db, firebaseConfig } from '../../firebase'; // Import config needed for secondary app
import firebase from 'firebase/compat/app';
import { Store, SiteInfo, DomainMapping } from '../../types';
import { Server, Plus, X, Loader, Copy, Save, Users, Trash2, Globe, Key, Info } from 'react-feather';

interface SuperAdminPanelProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState<'stores' | 'domains'>('stores');
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Admin Management Modal State
    const [adminModalStore, setAdminModalStore] = useState<Store | null>(null);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [isUpdatingAdmins, setIsUpdatingAdmins] = useState(false);

    // Form state (Create Store)
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreId, setNewStoreId] = useState('');
    const [cloneFromIphoneRios, setCloneFromIphoneRios] = useState(true);

    // Domain Management State
    const [domains, setDomains] = useState<DomainMapping[]>([]);
    const [domainsLoading, setDomainsLoading] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [selectedStoreForDomain, setSelectedStoreForDomain] = useState('');


    useEffect(() => {
        // Self-healing: Garante que o documento da loja 'iphonerios' exista.
        const ensurePrimaryStoreExists = async () => {
            const primaryStoreRef = db.collection('stores').doc('iphonerios');
            try {
                const doc = await primaryStoreRef.get();
                if (!doc.exists) {
                    console.log("Documento da loja principal 'iphonerios' não encontrado. Criando agora...");
                    await primaryStoreRef.set({
                        name: 'iPhone Rios',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        admins: [] // Ensure admins field exists
                    });
                }
            } catch (error) {
                console.error("Erro ao verificar/criar loja principal:", error);
                showToast("Erro ao verificar a loja principal.", "error");
            }
        };

        ensurePrimaryStoreExists();

        const unsubscribe = db.collection('stores').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const storesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
            setStores(storesData);
            // If the admin modal is open, refresh its data
            if (adminModalStore) {
                const updatedStore = storesData.find(s => s.id === adminModalStore.id);
                if (updatedStore) {
                    setAdminModalStore(updatedStore);
                }
            }
            setLoading(false);
        }, error => {
            showToast("Erro ao carregar lojas.", "error");
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [showToast, adminModalStore]);

    // Fetch Domains
    useEffect(() => {
        if (activeTab === 'domains') {
            setDomainsLoading(true);
            const unsubscribeDomains = db.collection('domain_mappings').onSnapshot(snapshot => {
                const domainData = snapshot.docs.map(doc => ({
                    domain: doc.id,
                    ...doc.data()
                } as DomainMapping));
                setDomains(domainData);
                setDomainsLoading(false);
            }, error => {
                console.error("Error fetching domains:", error);
                setDomainsLoading(false);
            });
            return () => unsubscribeDomains();
        }
    }, [activeTab]);


    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setNewStoreName(name);
        const slug = name.toLowerCase()
                         .replace(/\s+/g, '-')
                         .replace(/[^\w-]+/g, '')
                         .replace(/--+/g, '-');
        setNewStoreId(slug);
    };

    const handleCreateStore = async () => {
        if (!newStoreName.trim() || !newStoreId.trim()) {
            showToast("Nome e ID da Loja são obrigatórios.", 'error');
            return;
        }

        setIsSaving(true);
        try {
            const newStoreRef = db.collection('stores').doc(newStoreId);
            const doc = await newStoreRef.get();
            if (doc.exists) {
                showToast("Uma loja com este ID já existe.", 'error');
                setIsSaving(false);
                return;
            }

            const batch = db.batch();
            
            batch.set(newStoreRef, {
                name: newStoreName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                admins: [] // Initialize with empty admins array
            });

            if (cloneFromIphoneRios) {
                const sourceSettingsRef = db.doc('stores/iphonerios/settings/siteInfo');
                const sourceSettingsSnap = await sourceSettingsRef.get();
                
                if (sourceSettingsSnap.exists) {
                    const clonedData = sourceSettingsSnap.data() as SiteInfo;
                    clonedData.storeName = newStoreName;
                    const newSettingsRef = newStoreRef.collection('settings').doc('siteInfo');
                    batch.set(newSettingsRef, clonedData);
                } else {
                    showToast("AVISO: Loja 'iphonerios' não tem configurações para clonar.", "error");
                }
            }
            
            await batch.commit();
            showToast(`Loja "${newStoreName}" criada com sucesso!`, 'success');
            setIsCreateModalOpen(false);
            setNewStoreName('');
            setNewStoreId('');
            setCloneFromIphoneRios(true);

        } catch (error) {
            console.error(error);
            showToast("Erro ao criar a loja.", 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddAdmin = async () => {
        if (!adminModalStore || !newAdminEmail.trim() || !newAdminPassword.trim()) {
            showToast("E-mail e Senha são obrigatórios.", "error");
            return;
        }
        
        if (newAdminPassword.length < 6) {
            showToast("A senha deve ter pelo menos 6 caracteres.", "error");
            return;
        }

        setIsUpdatingAdmins(true);
        
        // --- TRUQUE: Criar App Secundário ---
        // Isso permite criar um usuário sem deslogar o Super Admin atual.
        let secondaryApp: firebase.app.App | null = null;
        
        try {
            // 1. Tentar criar o usuário no Auth
            const appName = "secondaryAppForUserCreation";
            // Verifica se já existe para evitar erro
            const existingApps = firebase.apps.filter(app => app.name === appName);
            if (existingApps.length > 0) {
                secondaryApp = existingApps[0];
            } else {
                secondaryApp = firebase.initializeApp(firebaseConfig, appName);
            }

            let userCreated = false;
            try {
                await secondaryApp.auth().createUserWithEmailAndPassword(newAdminEmail.trim(), newAdminPassword);
                userCreated = true;
                showToast("Usuário criado no Firebase Auth com sucesso!", 'success');
            } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use') {
                    showToast("Usuário já existe no Auth. Adicionando permissão à loja...", 'success');
                    userCreated = true; // Tratamos como sucesso para prosseguir
                } else {
                    console.error("Erro ao criar usuário Auth:", authError);
                    showToast(`Erro no Auth: ${authError.message}`, "error");
                    setIsUpdatingAdmins(false);
                    // Não deletamos o app aqui para poder reutilizar ou limpar no finally
                    return; 
                }
            }

            // 2. Se passou pelo Auth (criou ou já existia), adiciona ao Firestore
            if (userCreated) {
                if (!adminModalStore.id) {
                    throw new Error("ID da loja inválido.");
                }
                const storeRef = db.collection('stores').doc(adminModalStore.id);
                await storeRef.update({
                    admins: firebase.firestore.FieldValue.arrayUnion(newAdminEmail.trim().toLowerCase())
                });
                showToast(`Acesso liberado para ${newAdminEmail} na loja ${adminModalStore.name}!`, 'success');
                setNewAdminEmail('');
                setNewAdminPassword('');
            }

        } catch(e) {
            console.error("Erro geral ao adicionar admin:", e);
            showToast("Erro ao adicionar administrador.", "error");
        } finally {
            // Limpeza: Deleta o app secundário para não ocupar memória/conexões
            if (secondaryApp) {
                await secondaryApp.delete();
            }
            setIsUpdatingAdmins(false);
        }
    };

    const handleRemoveAdmin = async (email: string) => {
        if (!adminModalStore || !adminModalStore.id) return;
        setIsUpdatingAdmins(true);
        try {
            const storeRef = db.collection('stores').doc(adminModalStore.id);
            await storeRef.update({
                admins: firebase.firestore.FieldValue.arrayRemove(email)
            });
            showToast("Acesso do administrador removido desta loja!", 'success');
            // Nota: Não deletamos o usuário do Auth, pois ele pode ter acesso a outras lojas.
        } catch(e) {
            showToast("Erro ao remover administrador.", "error");
        } finally {
            setIsUpdatingAdmins(false);
        }
    };

    const handleAddDomain = async () => {
        if (!newDomain.trim() || !selectedStoreForDomain) {
            showToast("Preencha o domínio e selecione uma loja.", 'error');
            return;
        }
        
        // Clean domain: remove protocol and trailing slashes
        const cleanDomain = newDomain.trim()
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '')
            .toLowerCase();

        if (!cleanDomain) {
             showToast("Domínio inválido.", 'error');
             return;
        }

        setIsSaving(true);
        try {
             await db.collection('domain_mappings').doc(cleanDomain).set({
                storeId: selectedStoreForDomain,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast(`Domínio ${cleanDomain} mapeado com sucesso!`, 'success');
            setNewDomain('');
            setSelectedStoreForDomain('');
        } catch (error) {
            console.error("Erro ao adicionar domínio:", error);
            showToast("Erro ao mapear domínio.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDomain = async (domain: string) => {
        if (!domain) {
            console.error("Tentativa de excluir domínio com string vazia.");
            return;
        }
        if (!window.confirm(`Tem certeza que deseja remover o domínio ${domain}?`)) return;
        
        try {
            await db.collection('domain_mappings').doc(domain).delete();
            showToast("Domínio removido.", 'success');
        } catch (error) {
            console.error("Erro ao remover domínio:", error);
            showToast("Erro ao remover domínio.", 'error');
        }
    };

    const handleDeleteStore = async (id: string) => {
        const storeToDelete = stores.find(s => s.id === id);
        if (!storeToDelete) return;

        if (!window.confirm(`ATENÇÃO CRÍTICA:\n\nVocê está prestes a EXCLUIR PERMANENTEMENTE a loja "${storeToDelete.name}" (ID: ${id}).\n\nIsso irá:\n1. Remover o acesso de todos os administradores desta loja.\n2. Desconectar todos os domínios associados.\n3. Remover a loja da listagem.\n\nOs dados internos (produtos, vendas) não serão apagados do banco de dados, mas ficarão órfãos e inacessíveis pelo painel.\n\nTem certeza absoluta que deseja continuar?`)) {
            return;
        }

        const confirmId = window.prompt(`Para confirmar a exclusão, digite o ID da loja: "${id}"`);
        if (confirmId !== id) {
            showToast("ID incorreto. Ação cancelada.", 'error');
            return;
        }

        setLoading(true);
        try {
            // 1. Remove Domain Mappings linked to this store
            const domainQuery = await db.collection('domain_mappings').where('storeId', '==', id).get();
            const batch = db.batch();
            
            domainQuery.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // 2. Delete the Store Document itself
            // Note: This does not recursively delete subcollections in Firestore Client SDK.
            // Subcollections (products, etc) will remain but be inaccessible via UI.
            batch.delete(db.collection('stores').doc(id));

            await batch.commit();

            showToast(`Loja "${storeToDelete.name}" excluída com sucesso!`, 'success');
        } catch (error) {
            console.error("Erro ao excluir loja:", error);
            showToast("Erro ao excluir a loja. Verifique o console.", 'error');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
             <div className="flex border-b border-zinc-800 mb-6">
                <button 
                    onClick={() => setActiveTab('stores')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'stores' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <Server size={16} className="inline mr-2" /> Gerenciar Lojas
                </button>
                <button 
                    onClick={() => setActiveTab('domains')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'domains' ? 'border-purple-500 text-purple-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <Globe size={16} className="inline mr-2" /> Gerenciador de Domínios
                </button>
            </div>

            {activeTab === 'stores' && (
                <>
                {/* Admin Management Modal */}
                {adminModalStore && (
                     <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users/> Administradores de "{adminModalStore.name}"</h3>
                                <button onClick={() => setAdminModalStore(null)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                    <h4 className="text-sm font-bold text-zinc-300 mb-3">Adicionar Novo Admin</h4>
                                    <div className="flex flex-col gap-3">
                                        <input 
                                            value={newAdminEmail} 
                                            onChange={e => setNewAdminEmail(e.target.value)} 
                                            type="email" 
                                            placeholder="E-mail" 
                                            className="w-full admin-input" 
                                        />
                                        <div className="flex gap-2">
                                            <div className="relative flex-grow">
                                                <input 
                                                    value={newAdminPassword} 
                                                    onChange={e => setNewAdminPassword(e.target.value)} 
                                                    type="text" 
                                                    placeholder="Senha (min 6 chars)" 
                                                    className="w-full admin-input pr-10" 
                                                />
                                                <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                                            </div>
                                            <button onClick={handleAddAdmin} disabled={isUpdatingAdmins} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center min-w-[50px]">
                                                {isUpdatingAdmins ? <Loader className="animate-spin" size={18} /> : <Plus size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-zinc-500">
                                            * Cria o login automaticamente. Se o e-mail já existir, apenas libera o acesso a esta loja.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-black/30 p-2 rounded-lg">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase px-2 mt-2 mb-1">Admins Atuais</h4>
                                    {(adminModalStore.admins || []).map(email => (
                                        <div key={email} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded">
                                            <span className="text-sm font-medium text-zinc-300">{email}</span>
                                            <button onClick={() => handleRemoveAdmin(email)} disabled={isUpdatingAdmins} className="text-zinc-500 hover:text-red-500 p-1 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(adminModalStore.admins || []).length === 0 && <p className="text-center text-zinc-600 text-xs p-4">Nenhum admin associado.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Store Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Plus/> Criar Nova Loja</h3>
                                <button onClick={() => setIsCreateModalOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-zinc-400 block mb-1">Nome da Loja</label>
                                    <input value={newStoreName} onChange={handleNameChange} placeholder="Ex: iPhone Salvador" className="w-full admin-input" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-zinc-400 block mb-1">ID da Loja (URL)</label>
                                    <input value={newStoreId} onChange={e => setNewStoreId(e.target.value)} placeholder="ex: iphone-salvador" className="w-full admin-input font-mono text-zinc-500" />
                                </div>
                                <label className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 cursor-pointer">
                                    <input type="checkbox" checked={cloneFromIphoneRios} onChange={e => setCloneFromIphoneRios(e.target.checked)} className="w-5 h-5 accent-yellow-500" />
                                    <div>
                                        <span className="font-semibold text-white">Clonar Configurações</span>
                                        <p className="text-xs text-zinc-500">Copia toda a identidade visual, textos e taxas da loja 'iphonerios'.</p>
                                    </div>
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold">Cancelar</button>
                                <button onClick={handleCreateStore} disabled={isSaving} className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex items-center gap-2 disabled:opacity-50">
                                    {isSaving ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>}
                                    {isSaving ? 'Salvando...' : 'Criar Loja'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="admin-card">
                     <div className="admin-card-header flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Server /> Gerenciamento de Lojas</h2>
                        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors">
                            <Plus size={18} className="mr-2"/> Criar Nova Loja
                        </button>
                    </div>
                    <div className="admin-card-content p-0">
                         {loading ? <div className="p-8 text-center"><Loader className="animate-spin mx-auto"/></div> : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="p-4">Nome da Loja</th>
                                            <th className="p-4">ID (storeId)</th>
                                            <th className="p-4">Data de Criação</th>
                                            <th className="p-4">Admins</th>
                                            <th className="p-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stores.map(store => (
                                            <tr key={store.id} className="border-t border-zinc-800/50">
                                                <td className="p-4 font-semibold">{store.name}</td>
                                                <td className="p-4 text-zinc-400 font-mono text-sm">{store.id}</td>
                                                <td className="p-4 text-zinc-400">{store.createdAt?.toDate().toLocaleDateString('pt-BR')}</td>
                                                <td className="p-4 text-zinc-300 font-bold">{(store.admins || []).length}</td>
                                                <td className="p-4 text-right">
                                                     <div className="flex justify-end gap-2">
                                                         <button onClick={() => setAdminModalStore(store)} title="Gerenciar Administradores" className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors border border-zinc-700/50 flex items-center gap-2">
                                                            <Users size={16} /> <span className="text-xs font-bold hidden sm:inline">Gerenciar Acesso</span>
                                                         </button>
                                                         <button onClick={() => handleDeleteStore(store.id)} title="Excluir Loja" className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors border border-red-900/30">
                                                            <Trash2 size={16} />
                                                         </button>
                                                     </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                 {stores.length === 0 && <p className="text-center text-zinc-500 p-8">Nenhuma loja criada ainda.</p>}
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}

            {activeTab === 'domains' && (
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Globe /> Gerenciador de Domínios Personalizados</h2>
                    </div>
                    <div className="admin-card-content">
                         <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-lg mb-6 flex items-start gap-3">
                            <Info className="text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-purple-200 font-bold mb-1">Instruções de DNS (Para o Cliente)</p>
                                <p className="text-xs text-purple-300 mb-2">
                                    Para que o domínio funcione, o cliente deve acessar o registro do domínio (GoDaddy, Registro.br, etc) e adicionar uma entrada do Tipo <strong>CNAME</strong> ou <strong>A</strong> apontando para a Vercel.
                                </p>
                                <div className="bg-black/40 p-2 rounded text-xs font-mono text-zinc-300 border border-purple-500/20">
                                    Tipo: A <br/>
                                    Nome: @ <br/>
                                    Valor: 76.76.21.21
                                </div>
                                <p className="text-xs text-purple-300 mt-2">
                                    * Se usar Vercel, adicione o domínio no painel da Vercel também.
                                </p>
                            </div>
                         </div>

                         <div className="flex flex-col md:flex-row gap-4 mb-8 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Domínio (sem https://)</label>
                                <input 
                                    value={newDomain} 
                                    onChange={e => setNewDomain(e.target.value)} 
                                    placeholder="www.minhaloja.com" 
                                    className="w-full admin-input" 
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Loja Alvo</label>
                                <select 
                                    value={selectedStoreForDomain} 
                                    onChange={e => setSelectedStoreForDomain(e.target.value)}
                                    className="w-full admin-input"
                                >
                                    <option value="">Selecione a Loja...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button 
                                    onClick={handleAddDomain} 
                                    disabled={isSaving}
                                    className="bg-purple-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2 disabled:opacity-50 h-[42px]"
                                >
                                    {isSaving ? <Loader className="animate-spin" size={18}/> : <Plus size={18}/>} Adicionar
                                </button>
                            </div>
                         </div>

                         {domainsLoading ? <div className="p-8 text-center"><Loader className="animate-spin mx-auto"/></div> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                                        <tr>
                                            <th className="p-4 rounded-tl-lg">Domínio</th>
                                            <th className="p-4">Aponta para Loja (ID)</th>
                                            <th className="p-4 rounded-tr-lg text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {domains.map(mapping => {
                                            const storeName = stores.find(s => s.id === mapping.storeId)?.name || 'Desconhecida';
                                            return (
                                                <tr key={mapping.domain} className="hover:bg-zinc-900/30 transition-colors">
                                                    <td className="p-4 font-mono text-sm text-white">{mapping.domain}</td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-white">{storeName}</span>
                                                        <span className="text-xs text-zinc-500 block">{mapping.storeId}</span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteDomain(mapping.domain)}
                                                            className="text-zinc-500 hover:text-red-500 p-2 hover:bg-zinc-800 rounded-md transition-colors"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {domains.length === 0 && <p className="text-center text-zinc-500 p-8">Nenhum domínio personalizado configurado.</p>}
                            </div>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPanel;
