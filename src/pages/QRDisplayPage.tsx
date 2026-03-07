import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Calendar, MapPin, Users, UtensilsCrossed, Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';

const QRDisplayPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const downloadPass = async () => {
        const cardElement = document.getElementById('ticket-card');
        if (!cardElement) return;

        setDownloading(true);
        try {
            const canvas = await html2canvas(cardElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const image = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `Halal-Catering-Pass-${data.full_name.replace(/\s+/g, '-')}.jpg`;
            link.click();
        } catch (err) {
            console.error('Failed to download pass', err);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        const fetchPass = async () => {
            if (!token) return;
            try {
                const { data: reg, error } = await supabase
                    .from('registrations')
                    .select('*')
                    .eq('qr_token', token)
                    .single();

                if (error) throw error;
                setData(reg);
            } catch (err) {
                console.error("Error fetching pass:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPass();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                <p className="mt-4 text-slate-500 font-medium">Loading your pass...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <UtensilsCrossed className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Pass Not Found</h1>
                <p className="text-slate-500 mb-8">This link may be invalid or expired.</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-transform active:scale-95"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-6 font-sans">

            {/* Branding Header */}
            <div className="w-full max-w-sm flex flex-col items-center mb-6">
                <div className="w-20 h-20 flex items-center justify-center mb-2">
                    <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">ENTRY PASS</h1>
            </div>

            {/* Download Button */}
            <button
                onClick={downloadPass}
                disabled={downloading}
                className="mb-8 w-full max-w-sm flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-primary-300 transition-all active:scale-95 group text-slate-700"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        {downloading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Download className="w-6 h-6" />
                        )}
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Save to Device</span>
                        <span className="block text-[10px] text-slate-500 font-medium">Show this image at entrance</span>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 group-hover:border-primary-200 group-hover:text-primary-500 transition-colors">
                    <Download className="w-4 h-4" />
                </div>
            </button>

            {/* Main Ticket Card */}
            <div id="ticket-card" className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden text-center relative">

                {/* Top Section - Details */}
                <div className="p-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-1 leading-tight">
                        {data.full_name}
                    </h2>
                    <div className="flex items-center justify-center gap-1.5 text-primary-600 font-bold mb-6">
                        <Users className="w-4 h-4" />
                        <span className="text-sm uppercase tracking-widest">{data.guest_count} {data.guest_count > 1 ? 'Guests' : 'Guest'}</span>
                    </div>

                    {/* Dash Line */}
                    <div className="flex items-center gap-2 mb-8 opacity-20">
                        <div className="h-[1px] flex-1 bg-slate-400 border-dashed border-b"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                        <div className="h-[1px] flex-1 bg-slate-400 border-dashed border-b"></div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 inline-block shadow-inner">
                        <QRCodeCanvas
                            value={token || ''}
                            size={200}
                            level="H"
                            includeMargin={false}
                            className="rounded-lg"
                        />
                    </div>

                    <div className="space-y-4 mb-2">
                        <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100 transition-all active:scale-95">
                            <p className="text-[10px] font-black text-primary-800 tracking-tighter uppercase mb-0.5 opacity-60">Assigned Table</p>
                            <p className="text-3xl font-black text-primary-700 leading-none">
                                T-{data.table_number || '??'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - Event Details */}
                <div className="bg-slate-900 p-8 text-white">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</p>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                                <span className="text-sm font-bold truncate">Friendship Park</span>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary-400 shrink-0" />
                                <span className="text-sm font-bold truncate">Iftar Time</span>
                            </div>
                        </div>
                    </div>

                    <p className="mt-8 text-[10px] text-slate-500 font-medium leading-relaxed">
                        Please show this QR code to the usher at the entrance. <br />
                        We look forward to seeing you. Ramadan Kareem!
                    </p>
                </div>

                {/* Decorative Side Cuts */}
                <div className="absolute left-0 top-[55%] -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full -ml-4 shadow-inner border border-slate-100"></div>
                <div className="absolute right-0 top-[55%] -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full -mr-4 shadow-inner border border-slate-100"></div>
            </div>

            {/* The download button was moved to the top */}

            <p className="mt-8 text-slate-400 text-xs font-medium">
                Powered by Halal Catering
            </p>
        </div>
    );
};

export default QRDisplayPage;
