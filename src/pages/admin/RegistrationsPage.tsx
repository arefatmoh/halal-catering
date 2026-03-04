import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendSMS } from '../../lib/sms';
import { v4 as uuidv4 } from 'uuid';

const RegistrationsPage = () => {
    const [selectedReg, setSelectedReg] = useState<any>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
    }, []);

    const fetchRegistrations = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRegistrations(data || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const assignTable = async (guestCount: number) => {
        // 1. Find a table with enough capacity
        const { data: tables, error: fetchError } = await supabase
            .from('tables')
            .select('*')
            .order('table_number', { ascending: true });

        if (fetchError) throw fetchError;

        let targetTable = null;

        if (tables && tables.length > 0) {
            // Find first table that can fit the guests
            targetTable = tables.find(t => (t.capacity - t.occupied_seats) >= guestCount);
        }

        // 2. If no table fits, create a new one
        if (!targetTable) {
            const nextTableNum = tables && tables.length > 0
                ? Math.max(...tables.map(t => t.table_number)) + 1
                : 1;

            const { data: newTableData, error: insertError } = await supabase
                .from('tables')
                .insert([{ table_number: nextTableNum, capacity: 6, occupied_seats: guestCount }])
                .select()
                .single();

            if (insertError) throw insertError;
            return nextTableNum;
        } else {
            // 3. Update existing table
            const { error: updateError } = await supabase
                .from('tables')
                .update({ occupied_seats: targetTable.occupied_seats + guestCount })
                .eq('id', targetTable.id);

            if (updateError) throw updateError;
            return targetTable.table_number;
        }
    };

    const handleApprove = async () => {
        if (!selectedReg) return;
        setActionLoading(true);
        try {
            const qrToken = uuidv4();

            // Auto-assign table
            const assignedTable = await assignTable(selectedReg.guest_count);

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
            const smsMsg = `Ramadan Iftar Confirmation. Your reservation is approved. Table: ${assignedTable} Guests: ${selectedReg.guest_count} Your digital pass: ${qrLink}`;
            await sendSMS(selectedReg.phone, smsMsg);

            setSelectedReg(null);
            fetchRegistrations();
        } catch (error) {
            console.error('Approval failed:', error);
            alert('Failed to approve registration.');
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

    const filteredData = registrations.filter(r =>
        r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-4">
            {/* Search Header */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input
                    type="text"
                    placeholder="Search phone or name..."
                    className="w-full bg-transparent border-none outline-none text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : filteredData.length === 0 ? (
                <div className="text-center p-8 text-slate-500">No registrations found.</div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {filteredData.map((reg, index) => (
                        <div
                            key={reg.id}
                            className={`p-5 flex items-center justify-between active:bg-slate-50 transition-colors ${index !== filteredData.length - 1 ? 'border-b border-slate-100' : ''}`}
                            onClick={() => setSelectedReg(reg)}
                        >
                            <div className="flex-1">
                                <h4 className="font-extrabold text-slate-900 leading-tight">{reg.full_name}</h4>
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

        </div>
    );
};

export default RegistrationsPage;
