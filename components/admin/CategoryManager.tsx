import React, { useState, useEffect, useRef } from 'react';
import { db, getCollectionRef, getDocRef } from '../../firebase';
import { Category } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Menu as MenuIcon } from 'react-feather';

interface CategoryManagerProps {
    storeId: string;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ storeId, showToast }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ docId: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        if (!storeId) return;
        const categoriesQuery = getCollectionRef('categories', storeId).orderBy('order');
        const unsubCategories = categoriesQuery.onSnapshot((snapshot) => {
            const categoryList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })) as Category[];
            setCategories(categoryList);
            setLoading(false);
        });
        return () => unsubCategories();
    }, [storeId]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            showToast('O nome da categoria não pode estar vazio.', 'error');
            return;
        }
        try {
            const newCategoryData: Omit<Category, 'docId'> = {
                id: newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                name: newCategoryName.trim(),
                order: categories.length
            };
            await getCollectionRef('categories', storeId).add(newCategoryData);
            showToast('Categoria adicionada com sucesso!', 'success');
            setNewCategoryName('');
        } catch (error) {
            showToast('Erro ao adicionar categoria.', 'error');
            console.error(error);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.docId || !editingCategory.name.trim()) return;
        try {
            await getDocRef('categories', editingCategory.docId, storeId).update({ name: editingCategory.name.trim() });
            showToast('Categoria atualizada!', 'success');
            setEditingCategory(null);
        } catch (error) {
            showToast('Erro ao atualizar categoria.', 'error');
        }
    };

    const handleDeleteCategory = async (docId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria? Os produtos existentes nesta categoria não serão excluídos.')) {
            try {
                await getDocRef('categories', docId, storeId).delete();
                showToast('Categoria removida com sucesso.', 'success');
            } catch (error) {
                showToast('Erro ao remover categoria.', 'error');
            }
        }
    };

    const handleSortEnd = async () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }
        
        const catsCopy = [...categories];
        const draggedItemContent = catsCopy.splice(dragItem.current, 1)[0];
        catsCopy.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        const batch = db.batch();
        catsCopy.forEach((cat, index) => {
            if (cat.docId) {
                const docRef = getDocRef('categories', cat.docId, storeId);
                batch.update(docRef, { order: index });
            }
        });
        
        try {
            await batch.commit();
            setCategories(catsCopy); // Optimistic update
            showToast('Ordem das categorias salva!', 'success');
        } catch (error) {
            showToast('Erro ao salvar a nova ordem.', 'error');
        }
    };

    if (loading) {
        return <p>Carregando categorias...</p>;
    }

    return (
        <div className="admin-card">
            <div className="admin-card-content">
                <p className="text-gray-400 mb-6">Adicione novas categorias para seus produtos ou reordene as existentes arrastando-as.</p>
                
                <div className="mb-8">
                    <h3 className="font-bold mb-4">Adicionar Nova Categoria</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Nome da Categoria"
                            className="w-full bg-black border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                        <button onClick={handleAddCategory} className="flex items-center bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">
                            <Plus size={20} className="mr-2" /> Adicionar
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold mb-2">Categorias Existentes</h3>
                    <p className="text-sm text-gray-400 mb-4">Arraste para reordenar como aparecerão na loja.</p>
                    <ul className="space-y-2">
                        {categories.map((cat, index) => (
                            <li 
                                key={cat.docId} 
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleSortEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className="flex items-center justify-between p-3 bg-black rounded-md cursor-grab active:cursor-grabbing"
                            >
                            <div className="flex items-center">
                                    <MenuIcon size={18} className="text-gray-500 mr-3" />
                                    {editingCategory?.docId === cat.docId ? (
                                        <input 
                                            type="text"
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                                            onBlur={handleUpdateCategory}
                                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-medium">{cat.name}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {editingCategory?.docId === cat.docId ? (
                                        <>
                                            <button onClick={handleUpdateCategory} className="text-green-400 hover:text-green-300"><Save size={16} /></button>
                                            <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                                        </>
                                    ) : (
                                        <button onClick={() => setEditingCategory({ docId: cat.docId!, name: cat.name })} className="text-gray-400 hover:text-white"><Edit2 size={16} /></button>
                                    )}
                                    <button onClick={() => handleDeleteCategory(cat.docId!)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {categories.length === 0 && (
                        <p className="text-center text-gray-500 py-4">Nenhuma categoria encontrada.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
