
import React, { useState, useMemo, useEffect } from 'react';
import { db, getCollectionRef } from '../../firebase';
import { SiteInfo } from '../../types';
import { Search, AlertCircle } from 'react-feather';

// --- TYPES ---
interface AuditLog {
    id: string;
    user: string;
    action: string;
    details: any;
    timestamp: any; // Firestore Timestamp
    isOutsideBusinessHours: boolean;
}

// --- MAIN COMPONENT ---
interface AuditLogPanelProps {
    siteInfo: SiteInfo;
    storeId: string;
}

const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ siteInfo, storeId }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }

        const unsubscribe = getCollectionRef('audit_logs', storeId).orderBy('timestamp', 'desc').onSnapshot(snapshot => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
            setLogs(logsData);
            setLoading(false);
        }, error => {
            console.error("Erro ao buscar logs de auditoria:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [storeId]);

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        return logs.filter(log =>
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [logs, searchTerm]);

    const getActionStyle = (action: string) => {
        if (action.includes('created')) return 'text-green-400';
        if (action.includes('updated')) return 'text-yellow-400';
        if (action.includes('deleted')) return 'text-red-400';
        if (action.includes('sale')) return 'text-blue-400';
        return 'text-gray-300';
    };

    return (
        <div className="admin-card">
            <div className="admin-card-header">
                <h2 className="text-xl font-bold">Log de Auditoria</h2>
            </div>
            <div className="admin-card-content">
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Buscar por usuário, ação ou detalhes..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-[#27272a] rounded-lg p-2 pl-10"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-text)]" />
                </div>

                {loading ? <p>Carregando logs...</p> : (
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="w-full text-sm text-left min-w-[800px]">
                            <thead className="bg-[#1a1a1a] sticky top-0">
                                <tr>
                                    <th className="p-4">Data/Hora</th>
                                    <th className="p-4">Usuário</th>
                                    <th className="p-4">Ação</th>
                                    <th className="p-4">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="border-t border-[#27272a]">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {log.isOutsideBusinessHours && (
                                                    <span title="Ação fora do horário comercial">
                                                        <AlertCircle size={16} className="text-yellow-500"/>
                                                    </span>
                                                )}
                                                {log.timestamp?.toDate().toLocaleString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="p-4">{log.user}</td>
                                        <td className={`p-4 font-semibold ${getActionStyle(log.action)}`}>{log.action}</td>
                                        <td className="p-4 text-gray-400 text-xs font-mono">
                                            <pre className="whitespace-pre-wrap break-all max-w-sm">{JSON.stringify(log.details, null, 2)}</pre>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                 {filteredLogs.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        <p>Nenhum log encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogPanel;
