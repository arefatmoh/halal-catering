import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle, ScanLine, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getRamadanDates, getTodayRamadanDate, isGrandIftarDate, type RamadanDate } from '../../lib/ramadan';

const VENUE_CAPACITY = 400;
const TABLE_CAPACITY = 12;

const DashboardPage = () => {
    const ramadanDates = getRamadanDates();
    const [selectedDate, setSelectedDate] = useState<RamadanDate>(getTodayRamadanDate());

    const [stats, setStats] = useState({
        totalRegistrations: 0,
        pendingCount: 0,
        pendingGuests: 0,
        approvedCount: 0,
        approvedGuests: 0,
        rejectedCount: 0,
        enteredGuests: 0,
        tablesUsed: 0,
    });
    const [enteredList, setEnteredList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        const channel = supabase
            .channel('dashboard_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchStats)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedDate]);

    const fetchStats = async () => {
        try {
            const { data: regs } = await supabase
                .from('registrations')
                .select('status, guest_count, entered_count, table_number, full_name, phone')
                .eq('reservation_date', selectedDate.isoDate);

            let pendingCount = 0, pendingGuests = 0;
            let approvedCount = 0, approvedGuests = 0;
            let rejectedCount = 0;
            let enteredGuests = 0;
            const tableSet = new Set<number>();

            regs?.forEach(r => {
                if (r.status === 'pending') { pendingCount++; pendingGuests += r.guest_count; }
                if (r.status === 'approved') { approvedCount++; approvedGuests += r.guest_count; }
                if (r.status === 'rejected') { rejectedCount++; }
                enteredGuests += r.entered_count || 0;
                if (r.table_number) tableSet.add(r.table_number);
            });

            setEnteredList(
                regs?.filter(r => (r.entered_count || 0) > 0)
                    .sort((a, b) => (b.entered_count || 0) - (a.entered_count || 0)) || []
            );

            setStats({
                totalRegistrations: regs?.length || 0,
                pendingCount, pendingGuests,
                approvedCount, approvedGuests,
                rejectedCount,
                enteredGuests,
                tablesUsed: tableSet.size,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const todayRamadan = getTodayRamadanDate();
    const currentIndex = ramadanDates.findIndex(d => d.isoDate === selectedDate.isoDate);
    const isGrand = isGrandIftarDate(selectedDate.isoDate);
    const spotsLeft = isGrand ? Infinity : Math.max(0, VENUE_CAPACITY - stats.approvedGuests);
    const fillPercentage = isGrand ? 0 : Math.min(100, Math.round((stats.approvedGuests / VENUE_CAPACITY) * 100));
    const entryPercentage = stats.approvedGuests > 0 ? Math.min(100, Math.round((stats.enteredGuests / stats.approvedGuests) * 100)) : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-10">

            {/* Header */}
            <div className="flex flex-col gap-0.5">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Real-time Event Status</p>
            </div>

            {/* Date Navigator */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center">
                    <button
                        onClick={() => currentIndex > 0 && setSelectedDate(ramadanDates[currentIndex - 1])}
                        disabled={currentIndex === 0}
                        className="p-3 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center py-2">
                        <p className="text-base font-extrabold text-slate-900 leading-tight">{selectedDate.label}</p>
                        {selectedDate.isoDate === todayRamadan.isoDate && (
                            <span className="inline-block mt-0.5 text-[9px] font-black bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
                        )}
                    </div>
                    <button
                        onClick={() => currentIndex < ramadanDates.length - 1 && setSelectedDate(ramadanDates[currentIndex + 1])}
                        disabled={currentIndex === ramadanDates.length - 1}
                        className="p-3 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto px-3 pb-3 no-scrollbar">
                    {ramadanDates.map(d => (
                        <button
                            key={d.isoDate}
                            onClick={() => setSelectedDate(d)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${d.isoDate === selectedDate.isoDate
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                                : d.isoDate === todayRamadan.isoDate
                                    ? 'bg-primary-50 text-primary-600 border border-primary-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            R{d.ramadanDay}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Capacity Card */}
            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Venue Capacity</p>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${fillPercentage >= 90 ? 'bg-red-500/20 text-red-400'
                            : fillPercentage >= 70 ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-primary-500/20 text-primary-400'
                            }`}>
                            {fillPercentage >= 100 ? 'Full' : `${fillPercentage}% Booked`}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                        <h2 className="text-5xl font-black tracking-tighter tabular-nums">{stats.approvedGuests}</h2>
                        <span className="text-slate-500 font-bold text-base">{isGrand ? 'Guests' : `/ ${VENUE_CAPACITY}`}</span>
                    </div>
                    <p className="text-slate-500 text-xs font-medium mb-5">
                        {isGrand ? 'Grand Iftar · No capacity limit' : `${spotsLeft} spots remaining`}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-6">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${fillPercentage >= 90 ? 'bg-red-500' : fillPercentage >= 70 ? 'bg-orange-500' : 'bg-primary-500'
                                }`}
                            style={{ width: `${fillPercentage}%` }}
                        ></div>
                    </div>

                    {/* Inline Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 text-center">
                            <p className="text-2xl font-black tabular-nums">{stats.tablesUsed}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Tables</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 text-center">
                            <p className="text-2xl font-black tabular-nums">{TABLE_CAPACITY}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Per Table</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 text-center">
                            <p className="text-2xl font-black tabular-nums">{stats.totalRegistrations}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Bookings</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Entry Tracker */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                        <ScanLine className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-slate-900">Entry Status</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Check-in Progress</p>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black text-slate-900 tabular-nums">{stats.enteredGuests}</span>
                    <span className="text-slate-400 font-bold text-sm">/ {stats.approvedGuests} arrived</span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3 mb-2">
                    <div
                        className="h-full rounded-full bg-green-500 transition-all duration-700 ease-out"
                        style={{ width: `${entryPercentage}%` }}
                    ></div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                    {stats.approvedGuests - stats.enteredGuests > 0
                        ? `${stats.approvedGuests - stats.enteredGuests} guests yet to arrive`
                        : stats.approvedGuests > 0 ? 'All confirmed guests have arrived!' : 'No confirmed guests yet'}
                </p>

                {/* Entered Guest List */}
                {enteredList.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Arrived ({enteredList.length})</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                            {enteredList.map((g, i) => (
                                <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-green-50/60 rounded-xl">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
                                        <span className="text-xs font-bold text-slate-800 truncate">{g.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400">{g.guest_count}p</span>
                                        <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">T-{g.table_number}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-3">
                {/* Pending */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-1 bg-orange-500"></div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2.5 border border-orange-100">
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{stats.pendingCount}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Pending</p>
                    <p className="text-[9px] text-orange-500 font-bold mt-1">{stats.pendingGuests} pax</p>
                </div>

                {/* Approved */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-1 bg-blue-500"></div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2.5 border border-blue-100">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{stats.approvedCount}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Approved</p>
                    <p className="text-[9px] text-blue-500 font-bold mt-1">{stats.approvedGuests} pax</p>
                </div>

                {/* Rejected */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-1 bg-red-400"></div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-2.5 border border-red-100">
                        <XCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{stats.rejectedCount}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Rejected</p>
                </div>
            </div>

            {/* Quick Summary Bar */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-extrabold text-primary-900">
                        {stats.approvedGuests > 0
                            ? `${stats.approvedGuests} guests confirmed across ${stats.tablesUsed} tables`
                            : 'No guests confirmed yet for this night'}
                    </p>
                    <p className="text-[10px] text-primary-600/70 font-medium mt-0.5">
                        {isGrand
                            ? 'Grand Iftar · No capacity limit'
                            : spotsLeft > 0
                                ? `${spotsLeft} spots still available · Max ${VENUE_CAPACITY}`
                                : 'Venue is fully booked!'}
                    </p>
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;
