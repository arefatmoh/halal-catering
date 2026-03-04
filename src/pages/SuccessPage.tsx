import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const SuccessPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
            <div className="w-full max-w-sm flex flex-col items-center text-center">

                <div className="w-24 h-24 mb-6 relative">
                    <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-50"></div>
                    <div className="relative w-full h-full bg-primary-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-primary-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">
                    Registration Submitted
                </h1>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 w-full space-y-4 mb-10">
                    <div className="flex items-start gap-3 text-left">
                        <div className="w-6 flex justify-center mt-1">⏳</div>
                        <p className="text-slate-600 text-sm">
                            <strong className="text-slate-900 block mb-1">Waiting for approval</strong>
                            Our team is verifying your payment screenshot.
                        </p>
                    </div>
                    <div className="flex items-start gap-3 text-left">
                        <div className="w-6 flex justify-center mt-1">📱</div>
                        <p className="text-slate-600 text-sm">
                            <strong className="text-slate-900 block mb-1">SMS Confirmation</strong>
                            You will receive an SMS with your digital Entry Pass (QR Code) shortly.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="text-slate-500 font-medium hover:text-slate-900 transition-colors"
                >
                    Return to Home
                </button>
            </div>
        </div>
    );
};

export default SuccessPage;
