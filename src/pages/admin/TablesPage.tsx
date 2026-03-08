import { useEffect, useState } from 'react';
import { Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getRamadanDates, getTodayRamadanDate, type RamadanDate } from '../../lib/ramadan';

const TABLE_CAPACITY = 12;

const TablesPage = () => {
    const ramadanDates = getRamadanDates();
    const [selectedDate, setSelectedDate] = useState<RamadanDate>(getTodayRamadanDate());
    const [tableData, setTableData] = useState<Record<number, { guests: number; names: string[] }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTableData();

        const channel = supabase.channel('tables_live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchTableData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedDate]);

    const fetchTableData = async () => {
        try {
            const { data: regs, error } = await supabase
                .from('registrations')
                .select('table_number, guest_count, full_name')
                .eq('reservation_date', selectedDate.isoDate)
                .eq('status', 'approved')
                .not('table_number', 'is', null);

            if (error) throw error;

            const map: Record<number, { guests: number; names: string[] }> = {};
            regs?.forEach(r => {
                if (!map[r.table_number]) map[r.table_number] = { guests: 0, names: [] };
                map[r.table_number].guests += r.guest_count;
                map[r.table_number].names.push(r.full_name);
            });
            setTableData(map);
        } catch (error) {
            console.error('Error fetching tables', error);
        } finally {
            setLoading(false);
        }
    };

    const todayRamadan = getTodayRamadanDate();
    const currentIndex = ramadanDates.findIndex(d => d.isoDate === selectedDate.isoDate);

    // Derive table numbers from data
    const tableNumbers = Object.keys(tableData).map(Number).sort((a, b) => a - b);
    const totalGuests = Object.values(tableData).reduce((sum, t) => sum + t.guests, 0);
    const fullTables = tableNumbers.filter(n => tableData[n].guests >= TABLE_CAPACITY).length;
    const activeTables = tableNumbers.filter(n => tableData[n].guests > 0 && tableData[n].guests < TABLE_CAPACITY).length;

    const getBarColor = (occupied: number) => {
        if (occupied >= TABLE_CAPACITY) return 'bg-red-500';
        if (occupied >= TABLE_CAPACITY * 0.7) return 'bg-orange-500';
        return 'bg-primary-500';
    };

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
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tables</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Seating Map</p>
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

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <p className="text-2xl font-black text-primary-600 tabular-nums">{tableNumbers.length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Tables</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{totalGuests}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Seated</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-lg font-black text-green-600 tabular-nums">{activeTables}</span>
                        <span className="text-slate-300 font-bold">/</span>
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-lg font-black text-red-500 tabular-nums">{fullTables}</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Open / Full</p>
                </div>
            </div>

            {/* Table Grid */}
            {tableNumbers.length === 0 ? (
                <div className="text-center p-10 text-slate-500 bg-white rounded-3xl border border-slate-100">
                    No tables assigned yet for this date. They are created automatically when approving registrations.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {tableNumbers.map(num => {
                        const t = tableData[num];
                        const pct = Math.round((t.guests / TABLE_CAPACITY) * 100);
                        const isFull = t.guests >= TABLE_CAPACITY;

                        return (
                            <div
                                key={num}
                                className={`p-4 rounded-2xl border transition-all ${isFull ? 'bg-red-50/60 border-red-200'
                                        : t.guests > 0 ? 'bg-white border-slate-200 shadow-sm'
                                            : 'bg-white border-slate-100'
                                    }`}
                            >
                                {/* Table Header */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-black text-slate-900">T-{num}</span>
                                    {isFull ? (
                                        <span className="text-[8px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Full</span>
                                    ) : (
                                        <span className="text-[8px] font-black bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{TABLE_CAPACITY - t.guests} open</span>
                                    )}
                                </div>

                                {/* Seat Dots Grid */}
                                <div className="grid grid-cols-6 gap-1 mb-3">
                                    {Array.from({ length: TABLE_CAPACITY }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-full aspect-square rounded-full transition-all ${idx < t.guests
                                                    ? isFull ? 'bg-red-400' : 'bg-primary-500'
                                                    : 'bg-slate-100'
                                                }`}
                                        ></div>
                                    ))}
                                </div>

                                {/* Count + Bar */}
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className={`w-3.5 h-3.5 ${isFull ? 'text-red-500' : 'text-primary-500'}`} />
                                    <span className={`text-sm font-black ${isFull ? 'text-red-600' : 'text-slate-800'}`}>
                                        {t.guests}<span className="text-xs font-medium text-slate-400">/{TABLE_CAPACITY}</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(t.guests)}`}
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>

                                {/* Guest Names */}
                                {t.names.length > 0 && (
                                    <div className="mt-2.5 pt-2.5 border-t border-slate-100/80">
                                        {t.names.slice(0, 3).map((name, i) => (
                                            <p key={i} className="text-[10px] text-slate-500 font-medium truncate leading-relaxed">
                                                {name}
                                            </p>
                                        ))}
                                        {t.names.length > 3 && (
                                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">+{t.names.length - 3} more</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TablesPage;
