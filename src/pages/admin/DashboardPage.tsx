import { useEffect, useState } from 'react';
import { Users, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DashboardPage = () => {
    const [stats, setStats] = useState({
        totalCapacity: 0,
        reservedSeats: 0,
        availableSeats: 0,
        pendingApprovals: 0,
        confirmedGuests: 0,
        enteredGuests: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        // Listen to both tables
        const regSub = supabase.channel('reg_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchStats)
            .subscribe();

        const tabSub = supabase.channel('tab_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchStats)
            .subscribe();

        return () => {
            supabase.removeChannel(regSub);
            supabase.removeChannel(tabSub);
        };
    }, []);

    const fetchStats = async () => {
        try {
            // 1. Fetch tables stats
            const { data: tables } = await supabase.from('tables').select('*');

            let totalCap = 0;
            let reserved = 0;

            if (tables) {
                tables.forEach(t => {
                    totalCap += t.capacity;
                    reserved += t.occupied_seats;
                });
            }

            // 2. Fetch registrations stats
            const { data: registrations } = await supabase.from('registrations').select('status, guest_count, entered_count');

            let pending = 0;
            let confirmed = 0;
            let entered = 0;

            if (registrations) {
                registrations.forEach(r => {
                    if (r.status === 'pending') pending += 1; // Count by application
                    if (r.status === 'approved') confirmed += r.guest_count; // Count by people
                    entered += r.entered_count;
                });
            }

            setStats({
                totalCapacity: totalCap,
                reservedSeats: reserved,
                availableSeats: Math.max(0, totalCap - reserved),
                pendingApprovals: pending,
                confirmedGuests: confirmed,
                enteredGuests: entered
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
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
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Real-time Event Status</p>
            </div>

            {/* Top Banner Overview */}
            <div className="bg-primary-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary-600/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                    <p className="text-primary-100 font-bold text-xs uppercase tracking-[0.2em] mb-2 opacity-80">Total Capacity</p>
                    <div className="flex items-baseline gap-2 mb-8">
                        <h2 className="text-6xl font-black tracking-tighter tabular-nums">{stats.totalCapacity}</h2>
                        <span className="text-primary-200 font-bold text-lg uppercase tracking-widest">Seats</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-3xl p-5 backdrop-blur-md border border-white/10">
                            <p className="text-primary-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Reserved</p>
                            <p className="text-3xl font-black tabular-nums">{stats.reservedSeats}</p>
                        </div>
                        <div className="bg-white/10 rounded-3xl p-5 backdrop-blur-md border border-white/10">
                            <p className="text-primary-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Available</p>
                            <p className="text-3xl font-black tabular-nums">{stats.availableSeats}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                        <Clock className="w-7 h-7 text-orange-500" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">{stats.pendingApprovals}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Pending</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                        <CheckCircle2 className="w-7 h-7 text-blue-500" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">{stats.confirmedGuests}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Confirmed</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center col-span-2 lg:col-span-1 border-b-4 border-b-primary-600 transition-transform active:scale-95">
                    <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4 border border-green-100">
                        <Users className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">{stats.enteredGuests}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center">Entered Pax</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
