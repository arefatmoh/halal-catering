import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ScanLine, Grid3X3, BarChart3, LogOut } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/');
    };

    const navItems = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { to: '/admin/registrations', icon: Users, label: 'Guests' },
        { to: '/admin/scanner', icon: ScanLine, label: 'Scan', isCenter: true },
        { to: '/admin/tables', icon: Grid3X3, label: 'Tables' },
        { to: '/admin/analytics', icon: BarChart3, label: 'Reports' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-4 pb-28 md:pb-6 font-sans">

            {/* Top Header */}
            <header className="px-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-primary-100 shadow-md shadow-primary-500/10 ring-2 ring-primary-500/20">
                        <img src="/Logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Halal Catering</h1>
                        <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest">Admin Panel</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-500 transition-all bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 hover:border-red-100 hover:bg-red-50 active:scale-95"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 px-4 max-w-lg w-full mx-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50">
                {/* Glass background */}
                <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-8px_40px_-10px_rgba(0,0,0,0.08)] md:max-w-lg md:mx-auto">
                    <div className="flex justify-between items-end px-3 pt-1.5 pb-safe">
                        {navItems.map((item) => {
                            if (item.isCenter) {
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `flex flex-col items-center justify-center transition-all -mt-7 ${isActive ? 'scale-105' : 'hover:scale-105'}`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <div className="relative">
                                                {/* Glow effect */}
                                                <div className={`absolute inset-0 rounded-full bg-primary-500 blur-lg transition-opacity ${isActive ? 'opacity-40' : 'opacity-0'}`}></div>
                                                <div className={`relative bg-gradient-to-b from-primary-500 to-primary-700 p-4 rounded-[1.2rem] shadow-lg shadow-primary-500/30 border-4 border-white transition-all ${isActive ? 'ring-2 ring-primary-300' : ''}`}>
                                                    <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                                </div>
                                                <span className="block text-[8px] font-black text-center mt-1.5 uppercase tracking-widest text-primary-700">{item.label}</span>
                                            </div>
                                        )}
                                    </NavLink>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center justify-center w-16 py-2 rounded-2xl transition-all active:scale-95 ${isActive
                                            ? 'text-primary-700'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary-50 shadow-sm shadow-primary-500/10' : ''}`}>
                                                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                            </div>
                                            <span className={`text-[9px] font-bold mt-0.5 uppercase tracking-wider transition-all ${isActive ? 'text-primary-700' : ''}`}>
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <div className="w-1 h-1 rounded-full bg-primary-500 mt-0.5"></div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default AdminLayout;
