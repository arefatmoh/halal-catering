import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5 py-10">
            <div className="w-full max-w-sm flex flex-col items-center text-center">

                {/* Logo */}
                <div className="w-28 h-28 mb-6 rounded-full overflow-hidden flex items-center justify-center border-4 border-slate-50 shadow-lg">
                    <img src="/Logo.png" alt="Halal Catering Logo" className="w-full h-full object-cover" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
                    Ramadan with Halal Catering
                </h1>
                <p className="text-sm text-slate-500 font-medium mb-2 max-w-[280px]">
                    Join us for blessed gatherings filled with community, peace, and great food.
                </p>

                {/* Info Badges */}
                <div className="flex items-center gap-4 mb-8 text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        <span className="text-xs font-semibold">Friendship Park</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        <span className="text-xs font-semibold">Ramadan 2026</span>
                    </div>
                </div>

                {/* Event Cards */}
                <div className="flex flex-col gap-3.5 w-full">

                    {/* Daily Iftar Card */}
                    <button
                        onClick={() => navigate('/register?type=iftar')}
                        className="w-full group relative overflow-hidden bg-white border-2 border-slate-200 hover:border-primary-300 rounded-[1.5rem] p-5 text-left transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary-100">
                                    Daily
                                </span>
                            </div>
                            <h2 className="text-lg font-black text-slate-900 mb-0.5">Halal Iftar</h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Daily Iftar · Ramadan 2026
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-primary-600 font-bold text-sm">
                                Reserve your spot
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                    </button>

                    {/* Grand Iftar Card */}
                    <button
                        onClick={() => navigate('/register?type=grand_iftar')}
                        className="w-full group relative overflow-hidden bg-slate-900 border-2 border-slate-800 hover:border-amber-400/50 rounded-[1.5rem] p-5 text-left transition-all active:scale-[0.98] shadow-lg hover:shadow-xl"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-500/30">
                                    Special
                                </span>
                            </div>
                            <h2 className="text-lg font-black text-white mb-0.5">Grand Iftar</h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Grand Iftar · Ramadan 29 & 30
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-amber-400 font-bold text-sm">
                                Reserve your spot
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                    </button>

                </div>

                {/* Footer */}
                <p className="text-[10px] text-slate-400 mt-8 font-medium">
                    Powered by BeWide Technologies © 2026
                </p>
            </div>
        </div>
    );
};

export default LandingPage;
