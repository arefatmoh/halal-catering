import { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TablesPage = () => {
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTables();

        const channel = supabase.channel('tables_live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchTables)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchTables = async () => {
        try {
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .order('table_number', { ascending: true });

            if (error) throw error;
            setTables(data || []);
        } catch (error) {
            console.error('Error fetching tables', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (occupied: number, capacity: number) => {
        if (occupied === capacity) return 'bg-red-50 border-red-200'; // Full
        if (occupied === 0) return 'bg-white border-slate-200'; // Empty
        return 'bg-green-50 border-green-200 shadow-sm'; // Partially Filled (Active)
    };

    const getTextColor = (occupied: number, capacity: number) => {
        if (occupied === capacity) return 'text-red-700'; // Full
        if (occupied === 0) return 'text-slate-400'; // Empty
        return 'text-green-700 font-bold'; // Partially Filled (Active)
    };

    const activeTables = tables.filter(t => t.occupied_seats > 0 && t.occupied_seats < t.capacity).length;
    const fullTables = tables.filter(t => t.occupied_seats === t.capacity).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* Stats Header */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-around">
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-600 leading-none">{activeTables}</p>
                </div>
                <div className="w-px bg-slate-100"></div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Full</p>
                    <p className="text-2xl font-bold text-red-600 leading-none">{fullTables}</p>
                </div>
                <div className="w-px bg-slate-100"></div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Empty</p>
                    <p className="text-2xl font-bold text-slate-600 leading-none">{tables.length - activeTables - fullTables}</p>
                </div>
            </div>

            {tables.length === 0 ? (
                <div className="text-center p-10 text-slate-500 bg-white rounded-3xl border border-slate-100 mt-4">
                    No tables generated yet. They will be created automatically when approving registrations.
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            className={`p-4 rounded-2xl border transition-all ${getStatusColor(table.occupied_seats, table.capacity)}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-md font-bold text-slate-800">T{table.table_number}</span>
                                {table.occupied_seats === table.capacity && (
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">FULL</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Users className={`w-4 h-4 ${getTextColor(table.occupied_seats, table.capacity)}`} />
                                <span className={`text-lg font-bold ${getTextColor(table.occupied_seats, table.capacity)}`}>
                                    {table.occupied_seats}<span className="text-sm font-medium opacity-50">/6</span>
                                </span>
                            </div>

                            {/* Visual Bar */}
                            <div className="w-full h-1.5 bg-slate-200/50 rounded-full mt-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${table.occupied_seats === table.capacity ? 'bg-red-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${(table.occupied_seats / table.capacity) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TablesPage;
