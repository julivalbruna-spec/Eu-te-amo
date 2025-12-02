
import React, { useState, useMemo, useEffect } from 'react';
import { getCollectionRef } from '../../firebase';
import { Sale, Product, FixedCost, VariableCost } from '../../types';
import { Loader, DollarSign, ShoppingCart, TrendingUp, Target, TrendingDown, PieChart, Clock, BarChart2 } from 'react-feather';

// --- HELPER FUNCTIONS ---
const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; value: string; delta?: string; isPositive?: boolean }> = ({ icon, title, value, delta, isPositive }) => (
    <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gray-800 text-yellow-400">{icon}</div>
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
        {delta && <p className={`text-xs mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{delta}</p>}
    </div>
);


// --- MAIN COMPONENT ---
const AnalyticsPanel: React.FC<{ allProducts: Product[], storeId: string }> = ({ allProducts, storeId }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
    const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30days'); // 'today', '7days', '30days', 'all'

    useEffect(() => {
        if (!storeId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [salesSnap, fixedCostsSnap, variableCostsSnap] = await Promise.all([
                    getCollectionRef('sales', storeId).orderBy('saleDate', 'desc').get(),
                    getCollectionRef('fixed_costs', storeId).get(),
                    getCollectionRef('variable_costs', storeId).orderBy('date', 'desc').get()
                ]);
                setSales(salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[]);
                setFixedCosts(fixedCostsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FixedCost[]);
                setVariableCosts(variableCostsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VariableCost[]);
            } catch (error) {
                console.error("Erro ao carregar dados de analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [storeId]);

    const { filteredSales, daysInPeriod } = useMemo(() => {
        const now = new Date();
        let days = 0;
        const cutoffDate = new Date(now);
        switch(period) {
            case 'today': cutoffDate.setHours(0, 0, 0, 0); days = 1; break;
            case '7days': cutoffDate.setDate(now.getDate() - 7); days = 7; break;
            case '30days': cutoffDate.setDate(now.getDate() - 30); days = 30; break;
            default: cutoffDate.setTime(0); days = (now.getTime() - new Date(0).getTime()) / (1000 * 3600 * 24); 
        }
        const filtered = sales.filter(s => s.saleDate.toDate() >= cutoffDate);
        return { filteredSales: filtered, daysInPeriod: Math.max(1, days) };
    }, [sales, period]);

    const stats = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
        const totalSales = filteredSales.length;
        
        // Costs Calculation
        const monthlyFixedCost = fixedCosts.reduce((sum, c) => sum + c.amount, 0);
        const dailyFixedCost = monthlyFixedCost / 30;
        const totalFixedCostForPeriod = dailyFixedCost * daysInPeriod;
        
        const periodStartDate = new Date();
        periodStartDate.setDate(periodStartDate.getDate() - daysInPeriod);
        const totalVariableCostForPeriod = variableCosts
            .filter(c => c.date.toDate() >= periodStartDate)
            .reduce((sum, c) => sum + c.amount, 0);

        // Calculate CMV (Cost of Goods Sold)
        // We check each sale item. If costPrice exists on the item (snapshot), use it.
        // Otherwise fallback to 0 (or maybe look up current product, but snapshot is safer for historical data)
        const totalCMV = filteredSales.reduce((sum, s) => {
            const saleCost = s.items.reduce((isum, item) => isum + ((item.costPrice || 0) * item.quantity), 0);
            return sum + saleCost;
        }, 0);

        const totalCosts = totalFixedCostForPeriod + totalVariableCostForPeriod + totalCMV;
        const netProfit = totalRevenue - totalCosts;

        // Sales analysis
        const salesByDay = filteredSales.reduce((acc, sale) => {
            const day = sale.saleDate.toDate().toLocaleString('pt-BR', { weekday: 'long' });
            acc[day] = (acc[day] || 0) + sale.total;
            return acc;
        }, {} as Record<string, number>);

        const salesByHour = filteredSales.reduce((acc, sale) => {
            const hour = sale.saleDate.toDate().getHours();
            acc[hour] = (acc[hour] || 0) + 1; // count of sales
            return acc;
        }, {} as Record<number, number>);

        const paymentMethods = filteredSales.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'desconhecido';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCategories = filteredSales.flatMap(s => s.items).reduce((acc, item) => {
            const product = allProducts.find(p => p.id === item.productId);
            if (product) {
                const categoryName = product.category; // Assuming you'll map ID to name later
                acc[categoryName] = (acc[categoryName] || 0) + (item.price * item.quantity);
            }
            return acc;
        }, {} as Record<string, number>);

        return {
            totalRevenue, totalSales, totalCosts, netProfit, salesByDay, salesByHour, paymentMethods, topCategories
        };
    }, [filteredSales, fixedCosts, variableCosts, daysInPeriod, allProducts]);

    const categoryMap = useMemo(() => new Map(allProducts.map(p => [p.category, p.category])), [allProducts]);
    
    if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div>;

    const weekDaysOrder = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    // FIX: Cast the result of Object.values to number[] to satisfy Math.max.
    const maxDaySale = Math.max(...(Object.values(stats.salesByDay) as number[]), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2"><PieChart /> Análise de Vendas</h2>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-black border border-gray-700 rounded-lg p-2 text-sm">
                    <option value="today">Hoje</option>
                    <option value="7days">Últimos 7 dias</option>
                    <option value="30days">Últimos 30 dias</option>
                    <option value="all">Todo o período</option>
                </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<DollarSign />} title="Receita Bruta" value={formatCurrency(stats.totalRevenue)} />
                <MetricCard icon={<TrendingDown />} title="Custos Totais (Est.)" value={formatCurrency(stats.totalCosts)} />
                <MetricCard icon={stats.netProfit >= 0 ? <TrendingUp /> : <TrendingDown />} title="Lucro Líquido (Est.)" value={formatCurrency(stats.netProfit)} />
                <MetricCard icon={<ShoppingCart />} title="Vendas Realizadas" value={stats.totalSales.toString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="admin-card">
                    <div className="admin-card-header"><h3 className="text-lg font-semibold">Vendas por Dia da Semana</h3></div>
                    <div className="admin-card-content">
                         <div className="h-64 flex items-end justify-around gap-2">
                             {weekDaysOrder.map(day => (
                                <div key={day} className="flex flex-col items-center flex-1 h-full justify-end">
                                    <div className="w-full bg-blue-500 rounded-t-md hover:bg-blue-400 transition-colors"
                                        style={{ height: `${maxDaySale > 0 ? ((stats.salesByDay[day] || 0) / maxDaySale) * 100 : 0}%` }}
                                        title={`${day}: ${formatCurrency(stats.salesByDay[day] || 0)}`}
                                    ></div>
                                    <p className="text-xs text-gray-400 mt-2 capitalize">{day.substring(0, 3)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="admin-card">
                    <div className="admin-card-header"><h3 className="text-lg font-semibold">Formas de Pagamento Mais Usadas</h3></div>
                    <div className="admin-card-content">
                        <ul className="space-y-3">
                            {/* FIX: Cast array values to number for correct sorting. */}
                            {Object.entries(stats.paymentMethods).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([method, count]) => (
                                <li key={method} className="flex justify-between items-center text-sm">
                                    <span className="capitalize font-semibold">{method}</span>
                                    <span className="font-bold bg-gray-800 px-2 py-0.5 rounded">{count} vendas</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                 <div className="admin-card">
                    <div className="admin-card-header"><h3 className="text-lg font-semibold">Categorias Mais Vendidas (por Receita)</h3></div>
                    <div className="admin-card-content">
                        <ul className="space-y-3">
                            {/* FIX: Cast array values to number for correct sorting. */}
                            {Object.entries(stats.topCategories).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([catId, revenue]) => (
                                <li key={catId} className="flex justify-between items-center text-sm">
                                    <span className="capitalize font-semibold">{categoryMap.get(catId) || catId}</span>
                                    {/* FIX: Cast revenue to number to satisfy formatCurrency function. */}
                                    <span className="font-bold text-green-400">{formatCurrency(revenue as number)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                 <div className="admin-card">
                    <div className="admin-card-header"><h3 className="text-lg font-semibold">Horários de Pico de Vendas</h3></div>
                    <div className="admin-card-content">
                        <ul className="space-y-3">
                            {/* FIX: Cast array values to number for correct sorting. */}
                            {Object.entries(stats.salesByHour).sort((a,b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([hour, count]) => (
                                <li key={hour} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold">{hour.padStart(2, '0')}:00 - {String(parseInt(hour) + 1).padStart(2, '0')}:00</span>
                                    <span className="font-bold bg-gray-800 px-2 py-0.5 rounded">{count} vendas</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AnalyticsPanel;
