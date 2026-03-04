import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
            <div className="w-full max-w-sm flex flex-col items-center text-center">
                {/* Logo */}
                <div className="w-32 h-32 mb-8 rounded-full overflow-hidden flex items-center justify-center border-4 border-slate-50 shadow-md">
                    <img src="/Logo.png" alt="Halal Catering Logo" className="w-full h-full object-cover" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                    Ramadan Iftar
                </h1>

                <p className="text-lg text-slate-600 mb-8 max-w-[280px]">
                    Join us for a blessed gathering filled with community and peace.
                </p>

                <div className="flex flex-col gap-3 w-full mb-10 text-slate-600">
                    <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        <span className="font-medium">Every Day in Ramadan</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-5 h-5 text-primary-500" />
                        <span className="font-medium">Friendship Park</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/register')}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg py-4 rounded-full shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Reserve Your Spot
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
