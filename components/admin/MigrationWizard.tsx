import React, { useState } from 'react';
import { db } from '../../firebase';
import { Database, Loader, AlertTriangle } from 'react-feather';

interface MigrationWizardProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const MigrationWizard: React.FC<MigrationWizardProps> = ({ showToast }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');

    const handleMigration = async () => {
        if (!window.confirm("Esta é uma operação única que irá copiar todos os dados da sua loja para a nova estrutura multi-loja. Sua loja ao vivo não será afetada. Deseja continuar?")) {
            return;
        }

        setIsLoading(true);
        const storeId = "iphonerios";
        
        // Coleções chave a serem migradas.
        const collectionsToMigrate = [
            'products', 'categories', 'clientes', 'sales', 
            'serviceOrders', 'sorteios', 'employees', 'fixed_costs', 
            'variable_costs', 'chatbot_config', 'kb_chatbot', 'faq_oficial'
        ];

        try {
            // Tratamento especial para o documento único de configurações
            setProgressMessage('Copiando configurações...');
            const settingsDoc = await db.collection('settings').doc('siteInfo').get();
            if (settingsDoc.exists) {
                await db.collection('stores').doc(storeId).collection('settings').doc('siteInfo').set(settingsDoc.data()!);
            }
            
            // Tratamento para todas as outras coleções
            for (const collectionName of collectionsToMigrate) {
                setProgressMessage(`Copiando ${collectionName}...`);
                const oldCollectionRef = db.collection(collectionName);
                const snapshot = await oldCollectionRef.get();

                if (snapshot.empty) {
                    console.log(`Coleção ${collectionName} está vazia, pulando.`);
                    continue;
                }

                // O Firestore tem um limite de 500 operações por lote (batch).
                // Dividimos em lotes de 400 para segurança.
                const chunks = [];
                for (let i = 0; i < snapshot.docs.length; i += 400) {
                    chunks.push(snapshot.docs.slice(i, i + 400));
                }

                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach(doc => {
                        const newDocRef = db.collection('stores').doc(storeId).collection(collectionName).doc(doc.id);
                        batch.set(newDocRef, doc.data());
                    });
                    await batch.commit();
                }
                 setProgressMessage(`${collectionName} copiado com sucesso!`);
            }
            
            setProgressMessage('Migração concluída com sucesso!');
            showToast('Todos os dados foram copiados para a nova estrutura!', 'success');
        } catch (error) {
            console.error("Erro durante a migração:", error);
            setProgressMessage('Erro na migração. Verifique o console para detalhes.');
            showToast('Ocorreu um erro durante a migração.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-card">
            <div className="admin-card-header">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Database size={24} /> Assistente de Migração para Multi-Loja
                </h2>
            </div>
            <div className="admin-card-content text-center">
                <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-yellow-300">Ação Única e Importante</h3>
                            <p className="text-sm text-yellow-200/80 mt-1">
                                Este processo irá <strong>copiar</strong> todos os dados da sua loja (produtos, clientes, configurações, etc.) para a nova estrutura multi-inquilino.
                                Sua loja atual continuará funcionando normalmente durante e após o processo. Esta é a etapa final para preparar sua plataforma para escalar.
                            </p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        <Loader className="animate-spin mx-auto text-yellow-500" size={48} />
                        <p className="font-semibold text-yellow-300">{progressMessage || 'Migrando...'}</p>
                        <p className="text-sm text-gray-500">Isso pode levar alguns instantes. Não feche esta aba.</p>
                    </div>
                ) : (
                    <button 
                        onClick={handleMigration}
                        className="bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-400 transition-transform hover:scale-105 shadow-lg shadow-yellow-500/20"
                    >
                        Iniciar Migração de Dados
                    </button>
                )}
            </div>
        </div>
    );
};

export default MigrationWizard;
