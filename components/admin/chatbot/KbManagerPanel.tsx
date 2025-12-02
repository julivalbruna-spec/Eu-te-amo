
import React, { useState, useEffect } from 'react';
import { db, getCollectionRef, getDocRef } from '../../../firebase';
import firebase from 'firebase/compat/app';
import { KB_Item } from '../../../types';
import { Plus, Edit2, Trash2, X, Save, BookOpen } from 'react-feather';

interface KbManagerPanelProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string;
}

const emptyItem: Partial<KB_Item> = {
    titulo: '',
    categoria: 'geral',
    conteudo: '',
    slugRelacionado: ''
};

const KbManagerPanel: React.FC<KbManagerPanelProps> = ({ showToast, storeId }) => {
    const [items, setItems] = useState<KB_Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<KB_Item> | null>(null);

    useEffect(() => {
        if(!storeId) return;
        const unsubscribe = getCollectionRef('kb_chatbot', storeId).orderBy('atualizadoEm', 'desc').onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })) as KB_Item[];
            setItems(data);
            setLoading(false);
        }, error => {
            console.error("Erro ao buscar KB:", error);
            showToast("Erro ao carregar base de conhecimento.", 'error');
        });
        return () => unsubscribe();
    }, [storeId]);

    const handleOpenModal = (item: Partial<KB_Item> | null = null) => {
        setEditingItem(item ? { ...item } : { ...emptyItem });
        setIsModalOpen(true);
    };

    const handleSaveItem = async () => {
        if (!editingItem || !editingItem.titulo || !editingItem.conteudo) {
            showToast("Título e Conteúdo são obrigatórios.", 'error');
            return;
        }

        const dataToSave = {
            ...editingItem,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        delete dataToSave.docId; // Don't save docId inside the document

        try {
            if (editingItem.docId) {
                await getDocRef('kb_chatbot', editingItem.docId, storeId).update(dataToSave);
                showToast("Item atualizado!", 'success');
            } else {
                await getCollectionRef('kb_chatbot', storeId).add(dataToSave);
                showToast("Item adicionado!", 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast("Erro ao salvar item.", 'error');
        }
    };

    const handleDeleteItem = async (docId: string) => {
        if (window.confirm('Tem certeza?')) {
            await getDocRef('kb_chatbot', docId, storeId).delete();
            showToast("Item excluído.", 'success');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editingItem) return;
        const { name, value } = e.target;
        setEditingItem(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div>
            {isModalOpen && editingItem && (
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
                            <h3 className="text-xl font-bold">{editingItem.docId ? 'Editar' : 'Adicionar'} Item de Conhecimento</h3>
                            <button onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <input name="titulo" value={editingItem.titulo} onChange={handleInputChange} placeholder="Título" className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                            <select name="categoria" value={editingItem.categoria} onChange={handleInputChange} className="w-full bg-black border border-[#27272a] rounded-lg p-2">
                                <option value="geral">Geral</option>
                                <option value="produto">Produto</option>
                                <option value="campanha">Campanha</option>
                                <option value="politica">Política</option>
                                <option value="tutorial">Tutorial</option>
                            </select>
                            <textarea name="conteudo" value={editingItem.conteudo} onChange={handleInputChange} rows={8} placeholder="Conteúdo (suporta Markdown)" className="w-full bg-black border border-[#27272a] rounded-lg p-2 font-mono text-sm" />
                            <input name="slugRelacionado" value={editingItem.slugRelacionado} onChange={handleInputChange} placeholder="Slug/Link Relacionado (opcional)" className="w-full bg-black border border-[#27272a] rounded-lg p-2" />
                        </div>
                        <div className="p-4 mt-auto border-t border-[#27272a] flex justify-end">
                            <button onClick={handleSaveItem} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400"><Save className="mr-2" size={18}/>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen /> Base de Conhecimento (KB)</h2>
                </div>
                <div className="admin-card-content">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-400">Gerencie a informação que o chatbot usa para responder perguntas.</p>
                        <button onClick={() => handleOpenModal(null)} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400"><Plus className="mr-2" size={20}/> Adicionar</button>
                    </div>
                    {loading ? <p>Carregando...</p> : (
                         <div className="space-y-2">
                            {items.map(item => (
                                <div key={item.docId} className="bg-black p-3 rounded-md border border-[#27272a] flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{item.titulo}</p>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">{item.categoria}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleOpenModal(item)}><Edit2 size={18} /></button>
                                        <button onClick={() => handleDeleteItem(item.docId!)} className="text-red-500"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KbManagerPanel;
