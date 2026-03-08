import { useState, useEffect } from 'react';
import { Eye, Check, X, Search, Loader2, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendSMS } from '../../lib/sms';
import { v4 as uuidv4 } from 'uuid';
import { getRamadanDates, getTodayRamadanDate, isGrandIftarDate, type RamadanDate } from '../../lib/ramadan';

const RegistrationsPage = () => {
    const ramadanDates = getRamadanDates();
    const [selectedDate, setSelectedDate] = useState<RamadanDate>(getTodayRamadanDate());

    const [selectedReg, setSelectedReg] = useState<any>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

    const [showAdminReg, setShowAdminReg] = useState(false);
    const [adminFormData, setAdminFormData] = useState({
        fullName: '',
        phone: '',
        guestCount: 1,
        guestNames: [''] as string[]
    });
    const [adminRegLoading, setAdminRegLoading] = useState(false);

    useEffect(() => {
        fetchRegistrations();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('public:registrations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
                fetchRegistrations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedDate]);

    const fetchRegistrations = async () => {
        try {
            // Filter by selected reservation_date (the night the guest chose to attend)
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .eq('reservation_date', selectedDate.isoDate)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRegistrations(data || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const assignTable = async (guestCount: number, reservationDate: string) => {
        // 1. Fetch all approved registrations for this specific date
        const { data: regs, error: fetchError } = await supabase
            .from('registrations')
            .select('table_number, guest_count')
            .eq('reservation_date', reservationDate)
            .eq('status', 'approved');

        if (fetchError) throw fetchError;

        let totalBooked = 0;
        const tableOccupancy: Record<number, number> = {};

        regs?.forEach(reg => {
            totalBooked += reg.guest_count;
            if (reg.table_number) {
                tableOccupancy[reg.table_number] = (tableOccupancy[reg.table_number] || 0) + reg.guest_count;
            }
        });

        // 2. Check maximum venue capacity = 400 (skip for Grand Iftar dates)
        if (!isGrandIftarDate(reservationDate) && totalBooked + guestCount > 400) {
            throw new Error(`Venue is fully booked! Only ${Math.max(0, 400 - totalBooked)} spots left.`);
        }

        // 3. Find a table with space (Table max capacity = 12)
        let targetTableNum = null;
        const maxCapacity = isGrandIftarDate(reservationDate) ? 10000 : 400;
        const maxTables = Math.ceil(maxCapacity / 12);

        for (let i = 1; i <= maxTables; i++) {
            const occupied = tableOccupancy[i] || 0;
            if (12 - occupied >= guestCount) {
                targetTableNum = i;
                break;
            }
        }

        if (!targetTableNum) {
            throw new Error('No single table can fit this group size on this date.');
        }

        return targetTableNum;
    };

    const handleApprove = async () => {
        if (!selectedReg) return;
        setActionLoading(true);
        try {
            const qrToken = uuidv4();

            // Auto-assign table
            const assignedTable = await assignTable(selectedReg.guest_count, selectedReg.reservation_date || selectedDate.isoDate);

            const { error } = await supabase
                .from('registrations')
                .update({
                    status: 'approved',
                    qr_token: qrToken,
                    table_number: assignedTable
                })
                .eq('id', selectedReg.id);

            if (error) throw error;

            // Send SMS
            const qrLink = `${window.location.origin}/entry/${qrToken}`;
            const isGrand = isGrandIftarDate(selectedReg.reservation_date);
            const smsMsg = isGrand
                ? `Grand Iftar Confirmation! Your reservation is approved. Table: ${assignedTable} Guests: ${selectedReg.guest_count} Your digital pass: ${qrLink}`
                : `Ramadan Iftar Confirmation. Your reservation is approved. Table: ${assignedTable} Guests: ${selectedReg.guest_count} Your digital pass: ${qrLink}`;
            await sendSMS(selectedReg.phone, smsMsg);

            setSelectedReg(null);
            fetchRegistrations();
        } catch (error: any) {
            console.error('Approval failed:', error);
            alert(`Failed to approve: ${error.message || 'Unknown error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedReg) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('registrations')
                .update({ status: 'rejected' })
                .eq('id', selectedReg.id);

            if (error) throw error;

            // Send SMS
            const smsMsg = `Ramadan Iftar Update. Sorry, your reservation could not be approved due to payment verification failure. Please contact support.`;
            await sendSMS(selectedReg.phone, smsMsg);

            setSelectedReg(null);
            fetchRegistrations();
        } catch (error) {
            console.error('Rejection failed:', error);
            alert('Failed to reject registration.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminRegGuestCountChange = (increment: number) => {
        setAdminFormData(prev => {
            const newCount = Math.max(1, Math.min(6, prev.guestCount + increment));
            let newGuestNames = [...prev.guestNames];
            if (newCount > prev.guestNames.length) {
                for (let i = prev.guestNames.length; i < newCount; i++) {
                    newGuestNames.push('');
                }
            } else if (newCount < prev.guestNames.length) {
                newGuestNames = newGuestNames.slice(0, newCount);
            }
            return { ...prev, guestCount: newCount, guestNames: newGuestNames };
        });
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminRegLoading(true);
        try {
            const qrToken = uuidv4();
            const assignedTable = await assignTable(adminFormData.guestCount, selectedDate.isoDate);

            const { error: insertError } = await supabase
                .from('registrations')
                .insert({
                    full_name: adminFormData.fullName,
                    phone: adminFormData.phone || 'N/A', // Phone is optional for admin, defaults to N/A
                    guest_count: adminFormData.guestCount,
                    guest_names: adminFormData.guestNames.slice(1),
                    payment_method: 'Admin Override',
                    screenshot_url: null,
                    reservation_date: selectedDate.isoDate,
                    event_type: isGrandIftarDate(selectedDate.isoDate) ? 'grand_iftar' : 'iftar',
                    status: 'approved',
                    qr_token: qrToken,
                    table_number: assignedTable
                });

            if (insertError) throw insertError;

            // Send SMS unconditionally if phone exists
            if (adminFormData.phone && adminFormData.phone.length > 5) {
                const qrLink = `${window.location.origin}/entry/${qrToken}`;
                const isGrand = isGrandIftarDate(selectedDate.isoDate);
                const smsMsg = isGrand
                    ? `Grand Iftar Confirmation! Your reservation on ${selectedDate.label} is confirmed. Table: ${assignedTable} Guests: ${adminFormData.guestCount}. Your digital pass: ${qrLink}`
                    : `Ramadan Iftar Confirmation. Your reservation on ${selectedDate.label} is confirmed. Table: ${assignedTable} Guests: ${adminFormData.guestCount}. Your digital pass: ${qrLink}`;
                await sendSMS(adminFormData.phone, smsMsg);
            }

            setShowAdminReg(false);
            setAdminFormData({ fullName: '', phone: '', guestCount: 1, guestNames: [''] });
            fetchRegistrations();
        } catch (err: any) {
            console.error('Admin Registration Failed:', err);
            alert(`Failed to register user: ${err.message || 'Unknown error'}`);
        } finally {
            setAdminRegLoading(false);
        }
    };

    const filteredData = registrations.filter(r => {
        const term = searchTerm.toLowerCase();
        return (
            r.full_name.toLowerCase().includes(term) ||
            r.phone.includes(searchTerm) ||
            (r.guest_names && r.guest_names.some((name: string) => name.toLowerCase().includes(term)))
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedDate]);

    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    const paginatedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const currentIndex = ramadanDates.findIndex(d => d.isoDate === selectedDate.isoDate);
    const todayRamadan = getTodayRamadanDate();

    return (
        <div className="space-y-4">

            {/* Ramadan Date Navigator */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center">
                    <button
                        onClick={() => currentIndex > 0 && setSelectedDate(ramadanDates[currentIndex - 1])}
                        disabled={currentIndex === 0}
                        className="p-4 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex-1 text-center py-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Viewing Registrations For</p>
                        <p className="text-base font-extrabold text-slate-900 leading-tight">{selectedDate.label}</p>
                        {selectedDate.isoDate === todayRamadan.isoDate && (
                            <span className="inline-block mt-1 text-[9px] font-black bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
                        )}
                    </div>

                    <button
                        onClick={() => currentIndex < ramadanDates.length - 1 && setSelectedDate(ramadanDates[currentIndex + 1])}
                        disabled={currentIndex === ramadanDates.length - 1}
                        className="p-4 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Quick jump to date pills */}
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

            {/* Search and Global Actions */}
            <div className="flex gap-2">
                <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Search phone or name..."
                        className="w-full bg-transparent border-none outline-none text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowAdminReg(true)}
                    className="w-[52px] h-[52px] bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all shrink-0"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : filteredData.length === 0 ? (
                <div className="text-center p-8 text-slate-500">No registrations found.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        {paginatedData.map((reg, index) => (
                            <div
                                key={reg.id}
                                className={`p-5 flex items-center justify-between active:bg-slate-50 transition-colors ${index !== paginatedData.length - 1 ? 'border-b border-slate-100' : ''}`}
                                onClick={() => setSelectedReg(reg)}
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-extrabold text-slate-900 leading-tight">{reg.full_name}</h4>
                                    {reg.guest_names && reg.guest_names.length > 0 && (
                                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                                            + {reg.guest_names.join(', ')}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs font-bold text-slate-400 tabular-nums">{reg.phone}</p>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <p className="text-xs font-bold text-primary-600 uppercase tracking-tighter">{reg.guest_count} Pax</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {reg.status === 'pending' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                                    )}
                                    {reg.status === 'approved' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                    )}
                                    {reg.status === 'rejected' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    )}

                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-active:text-primary-600 transition-colors">
                                        <Eye className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-white p-3 px-4 rounded-2xl shadow-sm border border-slate-100">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Page <span className="text-slate-900">{currentPage}</span> of {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal View */}
            {selectedReg && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 pb-0 pt-20 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 max-h-full overflow-y-auto animate-in slide-in-from-bottom-5 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedReg.full_name}</h2>
                                <p className="text-slate-500 font-medium mt-1">{selectedReg.phone}</p>
                            </div>
                            <button
                                onClick={() => setSelectedReg(null)}
                                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex justify-between items-center text-center">
                            <div>
                                <p className="text-xs font-bold text-slate-400 tracking-wider">GUESTS</p>
                                <p className="text-xl font-bold text-slate-900">{selectedReg.guest_count}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 tracking-wider">PAYMENT</p>
                                <p className="text-lg font-bold text-slate-900">{selectedReg.payment_method}</p>
                            </div>
                            {selectedReg.table_number && (
                                <>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 tracking-wider">TABLE</p>
                                        <p className="text-lg font-bold text-primary-600">{selectedReg.table_number}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Guest Names */}
                        {selectedReg.guest_names && selectedReg.guest_names.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Guest Names</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[9px] font-black shrink-0">1</div>
                                        <span className="text-sm font-bold text-slate-900">{selectedReg.full_name}</span>
                                        <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full">Main</span>
                                    </div>
                                    {selectedReg.guest_names.map((name: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-black shrink-0">{i + 2}</div>
                                            <span className="text-sm font-medium text-slate-700">{name || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-100 rounded-xl mb-6 overflow-hidden flex items-center justify-center relative group min-h-[300px]">
                            {selectedReg.screenshot_url ? (
                                <img
                                    src={selectedReg.screenshot_url}
                                    alt="Receipt"
                                    className="w-full h-auto object-contain max-h-[50vh]"
                                />
                            ) : (
                                <span className="text-slate-400 font-medium">No Image Provided</span>
                            )}
                        </div>

                        {selectedReg.status === 'pending' && (
                            <div className="flex gap-3 mb-6 md:mb-0">
                                <button
                                    disabled={actionLoading}
                                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                    onClick={handleReject}
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><X className="w-5 h-5" /> Reject</>}
                                </button>
                                <button
                                    disabled={actionLoading}
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-500/30 transition-transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
                                    onClick={handleApprove}
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Approve</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Admin Direct Reg Modal */}
            {showAdminReg && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 pb-0 pt-20 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 max-h-full overflow-y-auto animate-in slide-in-from-bottom-5 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Add Guest</h2>
                                <p className="text-slate-500 font-medium mt-1">For {selectedDate.label}</p>
                            </div>
                            <button
                                onClick={() => setShowAdminReg(false)}
                                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdminSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                    placeholder="e.g. Ahmed Ali"
                                    value={adminFormData.fullName}
                                    onChange={e => setAdminFormData({ ...adminFormData, fullName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                    placeholder="To instantly send SMS pass..."
                                    value={adminFormData.phone}
                                    onChange={e => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-200 rounded-xl mt-4">
                                <span className="font-semibold text-slate-700 text-sm">Total Guests</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleAdminRegGuestCountChange(-1)}
                                        disabled={adminFormData.guestCount <= 1}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold w-4 text-center">{adminFormData.guestCount}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleAdminRegGuestCountChange(1)}
                                        disabled={adminFormData.guestCount >= 6}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={adminRegLoading}
                                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center"
                            >
                                {adminRegLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register & Approve Guest'}
                            </button>
                            <div className="pb-4"></div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RegistrationsPage;
