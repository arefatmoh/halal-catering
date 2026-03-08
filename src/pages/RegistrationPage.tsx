import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, UploadCloud, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getRamadanDates, getTodayRamadanDate } from '../lib/ramadan';

const RegistrationPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const ramadanDates = getRamadanDates();
    const todayRamadan = getTodayRamadanDate();

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        guestCount: 1,
        guestNames: [''] as string[],
        paymentMethod: 'CBE',
        reservationDate: todayRamadan.isoDate,
    });

    const handleGuestCountChange = (increment: number) => {
        setFormData(prev => {
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

    const handleGuestNameChange = (index: number, value: string) => {
        setFormData(prev => {
            const newNames = [...prev.guestNames];
            newNames[index] = value;
            return { ...prev, guestNames: newNames };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!file) {
            setError('Please upload a payment screenshot.');
            return;
        }

        setLoading(true);

        try {
            // 1. Upload the screenshot to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw new Error(`Image Upload Failed: ${uploadError.message}`);

            // Get public URL of the uploaded image
            const { data: publicUrlData } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            // 2. Insert into database
            const { error: dbError } = await supabase
                .from('registrations')
                .insert({
                    full_name: formData.fullName,
                    phone: formData.phone,
                    guest_count: formData.guestCount,
                    guest_names: formData.guestNames.slice(1),
                    payment_method: formData.paymentMethod,
                    screenshot_url: publicUrlData.publicUrl,
                    reservation_date: formData.reservationDate,
                    status: 'pending'
                });

            if (dbError) throw new Error(`Database Error: ${dbError.message}`);

            // Success
            navigate('/success');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4">
            {/* Header */}
            <div className="w-full max-w-sm flex items-center mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-200"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-900 ml-2">Reservation</h1>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                {/* Basic Info */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="e.g. Ahmed Ali"
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="09..."
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Attendance Date</label>
                        <select
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none font-medium text-slate-800"
                            value={formData.reservationDate}
                            onChange={e => setFormData({ ...formData, reservationDate: e.target.value })}
                        >
                            {ramadanDates.map(d => (
                                <option key={d.isoDate} value={d.isoDate}>
                                    {d.label}{d.isoDate === todayRamadan.isoDate ? '  ✦ Today' : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1.5 ml-1">Select the night you plan to attend</p>
                    </div>
                </div>

                {/* Guests Selection */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900">Total Guests</h3>
                            <p className="text-xs text-slate-500">Maximum 6 people</p>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-full p-1">
                            <button
                                type="button"
                                onClick={() => handleGuestCountChange(-1)}
                                disabled={formData.guestCount <= 1}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm text-slate-700 disabled:opacity-50 active:scale-95 transition-all"
                            >
                                <Minus className="w-5 h-5" />
                            </button>

                            <span className="text-lg font-bold w-4 text-center">
                                {formData.guestCount}
                            </span>

                            <button
                                type="button"
                                onClick={() => handleGuestCountChange(1)}
                                disabled={formData.guestCount >= 6}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm text-slate-700 disabled:opacity-50 active:scale-95 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Guest Names */}
                    {formData.guestCount > 1 && (
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                            <p className="text-sm font-medium text-slate-700">Guest Names</p>
                            {formData.guestNames.slice(1).map((name, index) => (
                                <div key={index}>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                                        placeholder={`Guest ${index + 2} Name`}
                                        value={name}
                                        onChange={e => handleGuestNameChange(index + 1, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                        <select
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none font-medium"
                            value={formData.paymentMethod}
                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                        >
                            <option value="CBE">CBE (Commercial Bank of Ethiopia)</option>
                            <option value="Telebirr">Telebirr</option>
                        </select>
                    </div>

                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] font-black text-primary-800 uppercase tracking-widest mb-1 opacity-60">Payment Account</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-black text-primary-700 selection:bg-primary-200 tabular-nums">
                                {formData.paymentMethod === 'CBE' ? '1000232323232' : '0912121212'}
                            </p>
                            <span className="text-[10px] font-bold bg-primary-200 text-primary-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {formData.paymentMethod === 'CBE' ? 'CBE Account' : 'Telebirr No'}
                            </span>
                        </div>
                        <p className="text-[10px] mt-2 font-medium text-primary-600/80">
                            Please transfer the total amount and upload the screenshot below.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Payment Screenshot</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 relative group cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[120px]">

                            <input
                                type="file"
                                accept="image/*"
                                required={!file}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setFile(e.target.files[0]);
                                    }
                                }}
                            />

                            {file ? (
                                <div className="absolute inset-0 w-full h-full">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        className="w-full h-full object-cover opacity-50"
                                        alt="Preview"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white font-medium drop-shadow-md">
                                        Tap to change image
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 flex flex-col items-center justify-center text-slate-500 group-hover:text-primary-600">
                                    <UploadCloud className="w-8 h-8 mb-2" />
                                    <span className="text-sm font-medium">Upload Receipt Image</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center"
                >
                    {loading ? (
                        <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Submitting...</>
                    ) : (
                        'Submit Registration'
                    )}
                </button>
                <div className="pb-10"></div>
            </form>
        </div>
    );
};

export default RegistrationPage;
