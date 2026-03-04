import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ScanLine, Grid3X3, LogOut } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // In a real app we'd clear auth tokens here
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-4 pb-24 md:pb-6 font-sans">

            {/* Top Header */}
            <header className="px-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-100 shadow-sm">
                        <img src="/Logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Halal Catering</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 px-4 max-w-lg w-full mx-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile First) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pt-2 px-2 flex justify-between items-center z-50 rounded-t-[2rem] shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)] md:sticky md:mt-auto md:max-w-lg md:mx-auto md:rounded-b-[2rem] h-20">
                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <LayoutDashboard className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Stats</span>
                </NavLink>

                <NavLink
                    to="/admin/registrations"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <Users className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Daily</span>
                </NavLink>

                <NavLink
                    to="/admin/scanner"
                    className={({ isActive }) =>
                        `flex items-center justify-center transition-all -mt-10 ${isActive ? 'scale-110' : ''}`
                    }
                >
                    <div className="bg-primary-600 p-4 rounded-full shadow-xl shadow-primary-500/40 border-4 border-slate-50">
                        <ScanLine className="w-7 h-7 text-white" />
                    </div>
                </NavLink>

                <NavLink
                    to="/admin/tables"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <Grid3X3 className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Tables</span>
                </NavLink>

                <NavLink
                    to="/admin/analytics"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <LayoutDashboard className="w-6 h-6 rotate-90" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Reports</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default AdminLayout;
