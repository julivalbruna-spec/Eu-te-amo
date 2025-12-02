

import React, { useState, useEffect } from 'react';
import { getCollectionRef } from '../../firebase';
import { Sale } from '../../types';
import { DollarSign, ShoppingCart, TrendingUp, UserPlus, Cpu, Loader, Activity, BarChart2, Zap } from 'react-feather';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper Types
interface DashboardMetrics {
    dailyRevenue: number;
    dailyItems: number;
    activeClientsToday: number;
    weeklySales: { day: string; value: number; fullDate: string }[];
    totalWeeklyRevenue: number;
}

interface LogItem {
    id: string;
    action: string;
    user: string;
    details: any;
    timestamp: any;
}

// Helper Functions
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min atrás";
    return "agora mesmo";
};

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string; gradientFrom: string }> = ({ icon, title, value, color, gradientFrom }) => (
    <div className="admin-card relative overflow-hidden group border border-zinc-800 bg-zinc-900/50">
        {/* Gradient Glow Effect */}
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${gradientFrom}`}></div>
        
        <div className="admin-card-content flex items-center gap-5 relative z-10">
            <div className={`p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm shadow-inner ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            </div>
        </div>
    </div>
);

interface DashboardPanelProps {
    storeId: string;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ storeId }) => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        dailyRevenue: 0,
        dailyItems: 0,
        activeClientsToday: 0,
        weeklySales: [],
        totalWeeklyRevenue: 0
    });
    const [recentActivity, setRecentActivity] = useState<LogItem[]>([]);
    const [aiSummary, setAiSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }

        // 1. Setup Dates
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(todayStart.getDate() - 6); // Last 7 days including today
        sevenDaysAgo.setHours(0, 0, 0, 0);

        console.log(`[Dashboard:${storeId}] Fetching sales from:`, sevenDaysAgo.toISOString());

        // 2. Real-time Sales Listener
        const salesCollection = getCollectionRef('sales', storeId);
        const unsubscribeSales = salesCollection
            .where('saleDate', '>=', sevenDaysAgo)
            .orderBy('saleDate', 'asc')
            .onSnapshot((snapshot) => {
                const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
                
                let dailyRev = 0;
                let dailyItemsCount = 0;
                let dailyClientsSet = new Set<string>();
                let weeklyRev = 0;

                const weeklyMap = new Map<string, number>();
                const dayLabels: string[] = [];
                
                for (let d = 0; d < 7; d++) {
                    const dDate = new Date(sevenDaysAgo);
                    dDate.setDate(dDate.getDate() + d);
                    const dayKey = dDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const dayLabel = dDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
                    
                    weeklyMap.set(dayKey, 0);
                    dayLabels.push(`${dayKey}|${dayLabel}`);
                }

                sales.forEach(sale => {
                    if (!sale.saleDate || !sale.saleDate.toDate) return;
                    
                    const saleDateObj = sale.saleDate.toDate();
                    const saleDayKey = saleDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                    weeklyRev += sale.total;

                    if (weeklyMap.has(saleDayKey)) {
                        weeklyMap.set(saleDayKey, (weeklyMap.get(saleDayKey) || 0) + sale.total);
                    }

                    if (saleDateObj >= todayStart) {
                        dailyRev += sale.total;
                        const itemsCount = sale.items ? sale.items.reduce((acc, item) => acc + (item.quantity || 0), 0) : 0;
                        dailyItemsCount += itemsCount;

                        if (sale.customerId && sale.customerId !== 'avulso') {
                            dailyClientsSet.add(sale.customerId);
                        }
                    }
                });

                const weeklySalesChart = dayLabels.map(labelStr => {
                    const [key, label] = labelStr.split('|');
                    return {
                        day: label,
                        value: weeklyMap.get(key) || 0,
                        fullDate: key
                    };
                });

                setMetrics({
                    dailyRevenue: dailyRev,
                    dailyItems: dailyItemsCount,
                    activeClientsToday: dailyClientsSet.size,
                    weeklySales: weeklySalesChart,
                    totalWeeklyRevenue: weeklyRev
                });
                setLoading(false);

            }, (error) => {
                console.error(`[Dashboard:${storeId}] Error fetching sales:`, error);
                setLoading(false);
            });

        // 3. Real-time Activity Listener
        const logsCollection = getCollectionRef('audit_logs', storeId);
        const unsubscribeLogs = logsCollection
            .orderBy('timestamp', 'desc')
            .limit(6)
            .onSnapshot((snapshot) => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogItem));
                setRecentActivity(logs);
            }, (error) => {
                 console.error(`[Dashboard:${storeId}] Error fetching audit logs:`, error);
            });

        return () => {
            unsubscribeSales();
            unsubscribeLogs();
        };
    }, [storeId]);


    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        setAiSummary('');
        
        try {
            const promptContext = {
                data: new Date().toLocaleDateString('pt-BR'),
                vendasHoje: formatCurrency(metrics.dailyRevenue),
                itensVendidos: metrics.dailyItems,
                atividadesRecentes: recentActivity.slice(0, 3).map(a => `${a.action}`).join('; ')
            };

            const prompt = `
                Você é um gerente de loja analítico. Com base nos dados reais abaixo, gere um resumo curto (max 2 frases) e motivador sobre o desempenho da loja hoje.
                Se não houver vendas, sugira uma ação (ex: verificar estoque, postar no instagram).
                
                DADOS:
                ${JSON.stringify(promptContext)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setAiSummary(response.text || "Sem dados suficientes para análise.");

        } catch (error) {
            console.error(error);
            setAiSummary("Não foi possível gerar o resumo no momento.");
        } finally {
            setIsGenerating(false);
        }
    };

    const maxChartValue = Math.max(...metrics.weeklySales.map(d => d.value), 100);

    const formatAction = (action: string, details: any) => {
        if (action === 'sale_completed') return `Venda de <span class="text-green-400 font-bold">${formatCurrency(details.total || 0)}</span> realizada.`;
        if (action === 'product_created') return `Produto criado.`;
        if (action === 'product_updated') return `Produto atualizado.`;
        if (action === 'chatbot_prompt_updated') return `IA do Chatbot re-treinada.`;
        if (action === 'ai_knowledge_injected') return `Novo conhecimento adicionado à IA.`;
        if (action === 'chatbot_logic_generate') return `Lógica do Chatbot RESETADA.`;
        if (action === 'chatbot_logic_update') return `Lógica do Chatbot atualizada.`;
        if (action === 'sale_deleted') return `<span class="text-red-400 font-bold">Venda cancelada/excluída.</span>`;
        return action.replace(/_/g, ' ');
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-yellow-500" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard 
                    icon={<DollarSign size={24} />} 
                    title="Vendas de Hoje" 
                    value={formatCurrency(metrics.dailyRevenue)} 
                    color="text-emerald-400"
                    gradientFrom="bg-emerald-500"
                />
                <MetricCard 
                    icon={<BarChart2 size={24} />} 
                    title="Faturamento (7 Dias)" 
                    value={formatCurrency(metrics.totalWeeklyRevenue)} 
                    color="text-blue-400"
                    gradientFrom="bg-blue-500"
                />
                <MetricCard 
                    icon={<ShoppingCart size={24} />} 
                    title="Itens Vendidos Hoje" 
                    value={metrics.dailyItems.toString()} 
                    color="text-yellow-400" 
                    gradientFrom="bg-yellow-500"
                />
                <MetricCard 
                    icon={<UserPlus size={24} />} 
                    title="Clientes Ativos Hoje" 
                    value={metrics.activeClientsToday.toString()} 
                    color="text-purple-400" 
                    gradientFrom="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart & AI Summary */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="admin-card">
                        <div className="admin-card-header flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Desempenho Semanal</h3>
                            <span className="text-xs text-zinc-500 font-medium px-2 py-1 bg-zinc-900 rounded border border-zinc-800">Últimos 7 Dias</span>
                        </div>
                        <div className="admin-card-content">
                            <div className="h-64 flex items-end justify-around gap-2 pt-4 px-2 border-b border-zinc-800/30 pb-4">
                                {metrics.weeklySales.map((data, index) => (
                                    <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-bold bg-zinc-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 pointer-events-none whitespace-nowrap border border-zinc-700">
                                            {formatCurrency(data.value)}
                                            <div className="text-[10px] text-zinc-400 text-center">{data.fullDate}</div>
                                        </div>
                                        <div 
                                            className="w-full max-w-[40px] bg-blue-600 hover:bg-blue-500 rounded-t-md transition-all duration-500 relative overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                                            style={{ height: `${Math.max((data.value / maxChartValue) * 100, 2)}%` }} // Min height 2% for visibility
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-blue-400 opacity-50"></div>
                                        </div>
                                        <p className="text-[10px] font-medium text-zinc-500 mt-3 uppercase tracking-wider truncate w-full text-center">{data.day}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                     
                     {/* AI Summary Card */}
                     <div className="admin-card border-l-4 border-l-blue-500 overflow-hidden relative">
                         <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full pointer-events-none"></div>
                        <div className="admin-card-header relative z-10">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Cpu size={18} className="text-blue-400"/> Resumo Inteligente</h3>
                        </div>
                        <div className="admin-card-content relative z-10">
                            {aiSummary ? (
                                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                    <p className="text-blue-100 leading-relaxed font-medium text-sm">{aiSummary}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-2">
                                    <p className="text-zinc-400 text-sm mb-4">Analise as vendas e atividades de hoje para obter insights.</p>
                                     <button onClick={handleGenerateSummary} disabled={isGenerating} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-full transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none text-sm">
                                        {isGenerating ? <Loader size={16} className="animate-spin" /> : <Zap size={16} className="fill-current" />}
                                        {isGenerating ? "Analisando..." : "Gerar Insight"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Activity size={18} /> Atividades Recentes</h3>
                    </div>
                    <div className="admin-card-content p-0">
                        {recentActivity.length > 0 ? (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-6 top-4 bottom-4 w-[1px] bg-zinc-800"></div>
                                
                                <ul className="space-y-0">
                                    {recentActivity.map((activity, index) => (
                                        <li key={activity.id} className="relative pl-12 pr-6 py-4 hover:bg-zinc-900/30 transition-colors border-b border-zinc-800/50 last:border-none group">
                                            <div className="absolute left-[21px] top-5 w-2.5 h-2.5 bg-zinc-950 border-2 border-zinc-600 rounded-full group-hover:border-yellow-500 group-hover:bg-yellow-500 transition-colors z-10"></div>
                                            <div>
                                                <p className="text-sm text-zinc-200 font-medium" dangerouslySetInnerHTML={{__html: formatAction(activity.action, activity.details)}}></p>
                                                <div className="flex justify-between items-center mt-1.5">
                                                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{activity.user.split('@')[0]}</p>
                                                    <p className="text-[10px] text-zinc-500">{activity.timestamp ? getTimeAgo(activity.timestamp.toDate()) : '...'}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-center py-12 text-sm">Nenhuma atividade recente.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPanel;