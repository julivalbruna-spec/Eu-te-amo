
import React, { useState, useEffect, useMemo } from 'react';
import { db, getCollectionRef, getDocRef } from '../../../firebase';
import firebase from 'firebase/compat/app';
import { Employee } from '../../../types';
import { Plus, Edit2, Trash2, X, Save, Loader, UserPlus, Users } from 'react-feather';

interface EmployeesPanelProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    storeId: string;
}

const emptyEmployee: Partial<Employee> = { name: '', role: '', active: true };

const EmployeesPanel: React.FC<EmployeesPanelProps> = ({ showToast, storeId }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

    useEffect(() => {
        if(!storeId) return;
        const unsubscribe = getCollectionRef('employees', storeId).orderBy('name').onSnapshot(snap => {
            setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching employees: ", error);
            showToast("Erro ao carregar funcionários.", "error");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [storeId]);

    const activeEmployeesCount = useMemo(() => employees.filter(e => e.active).length, [employees]);

    const handleOpenModal = (employee: Partial<Employee> | null = null) => {
        setEditingEmployee(employee || emptyEmployee);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingEmployee || !editingEmployee.name || !editingEmployee.role) {
            showToast("Nome e Cargo são obrigatórios.", 'error');
            return;
        }
        try {
            const { id, ...data } = editingEmployee;
            if (id) {
                await getDocRef('employees', id, storeId).update(data);
                showToast("Funcionário atualizado!", 'success');
            } else {
                await getCollectionRef('employees', storeId).add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast("Funcionário adicionado!", 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast("Erro ao salvar funcionário.", 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja remover este funcionário?")) {
            await getDocRef('employees', id, storeId).delete();
            showToast("Funcionário removido.", 'success');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-yellow-500" /></div>;

    return (
        <div>
            {isModalOpen && editingEmployee && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingEmployee.id ? 'Editar' : 'Adicionar'} Funcionário</h3>
                            <button onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="space-y-4">
                            <input value={editingEmployee.name} onChange={e => setEditingEmployee(p => ({ ...p, name: e.target.value }))} required placeholder="Nome completo" className="w-full admin-input" />
                            <input value={editingEmployee.role} onChange={e => setEditingEmployee(p => ({ ...p, role: e.target.value }))} required placeholder="Cargo (Ex: Vendedor)" className="w-full admin-input" />
                            <label className="flex items-center gap-3 cursor-pointer text-white">
                                <input type="checkbox" checked={editingEmployee.active} onChange={e => setEditingEmployee(p => ({ ...p, active: e.target.checked }))} className="w-5 h-5 accent-yellow-500" />
                                <span>Ativo (pode ser selecionado no PDV)</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="bg-zinc-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-zinc-600 transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="admin-card">
                <div className="admin-card-header flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-3"><Users /> Gestão de Equipe</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <p className="font-bold text-lg text-white">{activeEmployeesCount}</p>
                             <p className="text-xs text-zinc-400">Funcionários Ativos</p>
                        </div>
                        <button onClick={() => handleOpenModal()} className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors">
                            <Plus size={18} className="mr-2"/> Adicionar
                        </button>
                    </div>
                </div>
                <div className="admin-card-content p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Cargo</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} className="border-t border-zinc-800/50">
                                        <td className="p-4 font-semibold">{emp.name}</td>
                                        <td className="p-4 text-zinc-400">{emp.role}</td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${emp.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {emp.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-end items-center gap-3">
                                            <button onClick={() => handleOpenModal(emp)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-md transition-colors" title="Editar"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(emp.id)} className="text-zinc-400 hover:text-red-500 p-2 hover:bg-zinc-800 rounded-md transition-colors" title="Remover"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         {employees.length === 0 && <p className="text-center py-12 text-zinc-500">Nenhum funcionário cadastrado.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeesPanel;
