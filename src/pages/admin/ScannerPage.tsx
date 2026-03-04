import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ScannerPage = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');
    const [guestData, setGuestData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const handleScan = async (decodedText: string) => {
        // Basic UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // In our system, the QR just contains the qr_token (UUID)
        let token = decodedText;

        // Fallback if the QR contained a full URL instead of just token (e.g. halal.com/verify?token=...)
        if (decodedText.includes('token=')) {
            const url = new URL(decodedText);
            token = url.searchParams.get('token') || '';
        }

        if (!uuidRegex.test(token)) {
            setStatus('error');
            setErrorMessage('Invalid QR Code format.');
            return;
        }

        setStatus('loading');

        try {
            // 1. Find registration by qr_token
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .eq('qr_token', token)
                .single();

            if (error || !data) {
                setStatus('error');
                setErrorMessage('Ticket not found in system.');
                return;
            }

            setGuestData(data);

            // 2. Check logic: Are they allowed?
            if (data.status !== 'approved') {
                setStatus('error');
                setErrorMessage('This reservation is not approved.');
                return;
            }

            if (data.entered_count >= data.guest_count) {
                setStatus('duplicate');
                return;
            }

            // 3. Mark as entered (increment entered_count to match guest_count for simplicity)
            // Since they arrive together, we assume all guests for this ticket enter at once
            const { error: updateError } = await supabase
                .from('registrations')
                .update({ entered_count: data.guest_count })
                .eq('id', data.id);

            if (updateError) throw updateError;

            setStatus('success');

        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message || 'System error validating ticket.');
        }
    };

    useEffect(() => {
        if (status !== 'idle') return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                handleScan(decodedText);
            },
            (_error) => {
                // Ignore silent background errors
            }
        );

        return () => {
            scanner.clear().catch(e => console.error(e));
        };
    }, [status]);

    const resetScanner = () => {
        setGuestData(null);
        setStatus('idle');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[75vh]">

            {status === 'idle' && (
                <div className="w-full max-w-sm">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">QR Scanner</h2>
                        <p className="text-slate-500 text-sm">Scan digital pass at entrance</p>
                    </div>

                    <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 overflow-hidden relative">
                        <div id="reader" className="w-full h-full rounded-2xl overflow-hidden [&_video]:rounded-xl [&_#reader__dashboard_section_csr]:hidden bg-slate-900 min-h-[250px] flex items-center justify-center">
                            {/* html5-qrcode injects UI here */}
                        </div>
                    </div>
                </div>
            )}

            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                    <p className="text-lg font-bold text-slate-700">Validating Pass...</p>
                </div>
            )}

            {status === 'success' && guestData && (
                <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-lg border border-green-100 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-50"></div>
                        <CheckCircle2 className="w-10 h-10 text-green-600 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Access Granted</h2>
                    <p className="text-green-600 font-bold mb-6 text-xl">Table {guestData.table_number} Assigned</p>

                    <div className="bg-slate-50 rounded-2xl p-4 text-left mb-6 space-y-2 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 pb-2 mb-2">GUEST DETAILS</p>
                        <p className="text-sm font-medium text-slate-900"><span className="text-slate-500 w-20 inline-block">Name:</span> {guestData.full_name}</p>
                        <p className="text-sm font-medium text-slate-900"><span className="text-slate-500 w-20 inline-block">Guests:</span> {guestData.guest_count} People</p>
                        <p className="text-sm font-medium text-slate-900"><span className="text-slate-500 w-20 inline-block">Phone:</span> {guestData.phone}</p>
                    </div>

                    <button
                        onClick={resetScanner}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                        Scan Next Guest
                    </button>
                </div>
            )}

            {status === 'duplicate' && guestData && (
                <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-lg border border-orange-100 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Already Entered</h2>
                    <p className="text-orange-600 text-sm font-medium mb-6">This ticket has already been marked as entered.</p>

                    <div className="bg-orange-50 rounded-2xl p-4 text-left mb-6 text-orange-800">
                        <p className="text-sm font-bold">{guestData.full_name}</p>
                        <p className="text-xs mt-1">Table {guestData.table_number} • {guestData.guest_count} Guests</p>
                    </div>

                    <button
                        onClick={resetScanner}
                        className="w-full bg-slate-100 outline-none text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Scan Next Guest
                    </button>
                </div>
            )}

            {status === 'error' && (
                <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-lg border border-red-100 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Pass</h2>
                    <p className="text-red-600 text-sm font-medium mb-6">{errorMessage}</p>

                    <button
                        onClick={resetScanner}
                        className="w-full bg-slate-100 outline-none text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

        </div>
    );
};

export default ScannerPage;
