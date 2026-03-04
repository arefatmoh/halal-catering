import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Users, Loader2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRegistrations: 0,
        totalPax: 0,
        paymentDistribution: {} as Record<string, number>,
        dailyTrends: [] as { date: string, count: number }[]
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const { data: results, error } = await supabase
                .from('registrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setData(results || []);
            calculateStats(results || []);
        } catch (err) {
            console.error("Error fetching analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (records: any[]) => {
        const payDist: Record<string, number> = {};
        const daily: Record<string, number> = {};
        let pax = 0;

        records.forEach(r => {
            // Payment breakdown
            payDist[r.payment_method] = (payDist[r.payment_method] || 0) + 1;

            // PAX Sum
            pax += r.guest_count;

            // Daily trends
            const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            daily[date] = (daily[date] || 0) + r.guest_count;
        });

        // Convert daily to array and limit to last 7 days for small screen
        const trendArray = Object.entries(daily)
            .map(([date, count]) => ({ date, count }))
            .reverse()
            .slice(-7);

        setStats({
            totalRegistrations: records.length,
            totalPax: pax,
            paymentDistribution: payDist,
            dailyTrends: trendArray
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reports</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Historical Insights</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all"
                >
                    <Download className="w-5 h-5" />
                </button>
            </div>

            {/* High Level Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-blue-50 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                    <Users className="w-6 h-6 text-blue-500 mb-3 relative z-10" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">Total pax</p>
                    <p className="text-3xl font-black text-slate-900 tabular-nums relative z-10">{stats.totalPax}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-primary-50 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                    <PieChart className="w-6 h-6 text-primary-500 mb-3 relative z-10" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">Bookings</p>
                    <p className="text-3xl font-black text-slate-900 tabular-nums relative z-10">{stats.totalRegistrations}</p>
                </div>
            </div>

            {/* Trends Section */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-2 mb-8">
                    <TrendingUp className="w-5 h-5 text-primary-400" />
                    <h3 className="font-bold text-lg">Pax Trend (7 Days)</h3>
                </div>

                <div className="flex items-end justify-around h-32 gap-2">
                    {stats.dailyTrends.map((t, i) => {
                        const maxVal = Math.max(...stats.dailyTrends.map(d => d.count), 1);
                        const height = (t.count / maxVal) * 100;
                        return (
                            <div key={i} className="flex flex-col items-center gap-3 flex-1 h-full">
                                <div className="w-full flex-1 flex flex-col justify-end">
                                    <div
                                        className="w-full bg-primary-500/80 rounded-t-xl hover:bg-primary-500 transition-all duration-700"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate w-full text-center">
                                    {t.date}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment split & Detailed List */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs">Payment Method Breakdown</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {Object.entries(stats.paymentDistribution).map(([method, count], i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${method === 'CBE' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                    {method.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 tracking-tight">{method}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{count} Transactions</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-slate-900">{Math.round((count / stats.totalRegistrations) * 100)}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* All History Button / Shortcut */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs">Full History Log</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">{data.length} Total</p>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                    {data.slice(0, 10).map((r, i) => (
                        <div key={i} className="p-5 flex items-center justify-between">
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 leading-tight">{r.full_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                    {new Date(r.created_at).toLocaleDateString()} • {r.guest_count} Pax
                                </p>
                            </div>
                            <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.1em] ${r.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                {r.status}
                            </div>
                        </div>
                    ))}
                    {data.length > 10 && (
                        <div className="p-4 text-center bg-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing last 10 records</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
