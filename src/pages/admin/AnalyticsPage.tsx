import { useEffect, useState } from 'react';
import { TrendingUp, Users, Loader2, BarChart3, CheckCircle2, XCircle, Clock, ScanLine, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getRamadanDates } from '../../lib/ramadan';
import * as XLSX from 'xlsx-js-style';

const VENUE_CAPACITY = 400;

interface DayStats {
    label: string;
    ramadanDay: number;
    isoDate: string;
    totalRegs: number;
    totalPax: number;
    approved: number;
    approvedPax: number;
    pending: number;
    rejected: number;
    entered: number;
}

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [dayStats, setDayStats] = useState<DayStats[]>([]);
    const [paymentBreakdown, setPaymentBreakdown] = useState<Record<string, number>>({});
    const [allRegs, setAllRegs] = useState<any[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;

    const ramadanDates = getRamadanDates();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const { data: regs, error } = await supabase
                .from('registrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllRegs(regs || []);

            // Build per-day stats
            const dayMap: Record<string, DayStats> = {};
            ramadanDates.forEach(d => {
                dayMap[d.isoDate] = {
                    label: d.label,
                    ramadanDay: d.ramadanDay,
                    isoDate: d.isoDate,
                    totalRegs: 0, totalPax: 0,
                    approved: 0, approvedPax: 0,
                    pending: 0, rejected: 0, entered: 0
                };
            });

            const payDist: Record<string, number> = {};

            regs?.forEach(r => {
                const date = r.reservation_date;
                if (dayMap[date]) {
                    dayMap[date].totalRegs++;
                    dayMap[date].totalPax += r.guest_count;
                    if (r.status === 'approved') { dayMap[date].approved++; dayMap[date].approvedPax += r.guest_count; }
                    if (r.status === 'pending') dayMap[date].pending++;
                    if (r.status === 'rejected') dayMap[date].rejected++;
                    dayMap[date].entered += r.entered_count || 0;
                }
                payDist[r.payment_method] = (payDist[r.payment_method] || 0) + 1;
            });

            setDayStats(Object.values(dayMap));
            setPaymentBreakdown(payDist);
        } catch (err) {
            console.error("Error fetching analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    const grandTotalPax = dayStats.reduce((s, d) => s + d.totalPax, 0);
    const grandTotalRegs = dayStats.reduce((s, d) => s + d.totalRegs, 0);
    const grandEntered = dayStats.reduce((s, d) => s + d.entered, 0);
    const grandApprovedPax = dayStats.reduce((s, d) => s + d.approvedPax, 0);
    const grandPending = dayStats.reduce((s, d) => s + d.pending, 0);
    const grandRejected = dayStats.reduce((s, d) => s + d.rejected, 0);
    const maxPaxInDay = Math.max(...dayStats.map(d => d.approvedPax), 1);

    const totalPages = Math.ceil(allRegs.length / PAGE_SIZE);
    const paginatedRegs = allRegs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ─── Style Presets ───
    const s = {
        title: { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E293B' } }, alignment: { horizontal: 'center' } },
        subtitle: { font: { bold: true, sz: 10, color: { rgb: '94A3B8' } }, alignment: { horizontal: 'center' } },
        sectionHead: { font: { bold: true, sz: 12, color: { rgb: '1E293B' } }, fill: { fgColor: { rgb: 'F1F5F9' } }, border: { bottom: { style: 'medium', color: { rgb: '1E293B' } } } },
        header: { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '334155' } }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin', color: { rgb: '64748B' } } } },
        headerGreen: { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '166534' } }, alignment: { horizontal: 'center' } },
        cell: { font: { sz: 10 }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
        cellLeft: { font: { sz: 10 }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
        cellBold: { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
        totalRow: { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E293B' } }, alignment: { horizontal: 'center' } },
        approved: { font: { bold: true, sz: 10, color: { rgb: '166534' } }, fill: { fgColor: { rgb: 'DCFCE7' } }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
        pending: { font: { bold: true, sz: 10, color: { rgb: '9A3412' } }, fill: { fgColor: { rgb: 'FFF7ED' } }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
        rejected: { font: { bold: true, sz: 10, color: { rgb: 'DC2626' } }, fill: { fgColor: { rgb: 'FEF2F2' } }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
        metricLabel: { font: { sz: 10 }, fill: { fgColor: { rgb: 'F8FAFC' } }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
        metricValue: { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: 'F8FAFC' } }, border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } },
    } as Record<string, any>;

    const styledCell = (v: any, style: any) => ({ v, t: typeof v === 'number' ? 'n' : 's', s: style });

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        // ═══ Sheet 1: Summary ═══
        const wsSum = XLSX.utils.aoa_to_sheet([]);
        wsSum['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 14 }];
        wsSum['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];

        const sumRows: any[][] = [
            [styledCell('HALAL CATERING — EVENT REPORT', s.title), styledCell('', s.title), styledCell('', s.title)],
            [styledCell(`Generated: ${new Date().toLocaleString()}`, s.subtitle), styledCell('', s.subtitle), styledCell('', s.subtitle)],
            ['', '', ''],
            [styledCell('GRAND TOTALS', s.sectionHead), styledCell('', s.sectionHead), styledCell('', s.sectionHead)],
            [styledCell('Metric', s.header), styledCell('Value', s.header), styledCell('', s.header)],
            [styledCell('Total Bookings', s.metricLabel), styledCell(grandTotalRegs, s.metricValue), ''],
            [styledCell('Total Pax (all statuses)', s.metricLabel), styledCell(grandTotalPax, s.metricValue), ''],
            [styledCell('Approved Pax', s.metricLabel), styledCell(grandApprovedPax, s.metricValue), ''],
            [styledCell('Pending Bookings', s.metricLabel), styledCell(grandPending, s.metricValue), ''],
            [styledCell('Rejected Bookings', s.metricLabel), styledCell(grandRejected, s.metricValue), ''],
            [styledCell('Total Entered (checked in)', s.metricLabel), styledCell(grandEntered, s.metricValue), ''],
            [styledCell('Venue Capacity Per Night', s.metricLabel), styledCell(VENUE_CAPACITY, s.metricValue), ''],
            ['', '', ''],
            [styledCell('PAYMENT METHOD BREAKDOWN', s.sectionHead), styledCell('', s.sectionHead), styledCell('', s.sectionHead)],
            [styledCell('Method', s.header), styledCell('Bookings', s.header), styledCell('% Share', s.header)],
            ...Object.entries(paymentBreakdown).map(([method, count]) => [
                styledCell(method, s.cellLeft),
                styledCell(count, s.cell),
                styledCell(grandTotalRegs > 0 ? `${Math.round((count / grandTotalRegs) * 100)}%` : '0%', s.cellBold)
            ])
        ];
        XLSX.utils.sheet_add_aoa(wsSum, sumRows, { origin: 'A1' });
        XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');

        // ═══ Sheet 2: Nightly Breakdown ═══
        const nightlyHeaders = ['Night', 'Day', 'Date', 'Bookings', 'Total Pax', 'Approved', 'Approved Pax', 'Pending', 'Rejected', 'Entered', 'Fill %', 'Spots Left'];
        const wsNight = XLSX.utils.aoa_to_sheet([]);
        wsNight['!cols'] = [{ wch: 14 }, { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 13 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 8 }, { wch: 11 }];

        const nightRows: any[][] = [
            nightlyHeaders.map(h => styledCell(h, s.header)),
            ...dayStats.map(d => {
                const fill = Math.round((d.approvedPax / VENUE_CAPACITY) * 100);
                const fillStyle = fill >= 90 ? s.rejected : fill >= 70 ? s.pending : s.approved;
                return [
                    styledCell(`Ramadan ${d.ramadanDay}`, s.cellBold),
                    styledCell(d.label.split('·')[1]?.trim() || '', s.cell),
                    styledCell(d.isoDate, s.cell),
                    styledCell(d.totalRegs, s.cell),
                    styledCell(d.totalPax, s.cell),
                    styledCell(d.approved, s.cell),
                    styledCell(d.approvedPax, s.cellBold),
                    styledCell(d.pending, d.pending > 0 ? s.pending : s.cell),
                    styledCell(d.rejected, d.rejected > 0 ? s.rejected : s.cell),
                    styledCell(d.entered, s.cell),
                    styledCell(`${fill}%`, fillStyle),
                    styledCell(Math.max(0, VENUE_CAPACITY - d.approvedPax), s.cell),
                ];
            }),
            [
                styledCell('TOTAL', s.totalRow),
                styledCell('', s.totalRow),
                styledCell('', s.totalRow),
                styledCell(grandTotalRegs, s.totalRow),
                styledCell(grandTotalPax, s.totalRow),
                styledCell(dayStats.reduce((a, d) => a + d.approved, 0), s.totalRow),
                styledCell(grandApprovedPax, s.totalRow),
                styledCell(grandPending, s.totalRow),
                styledCell(grandRejected, s.totalRow),
                styledCell(grandEntered, s.totalRow),
                styledCell('', s.totalRow),
                styledCell('', s.totalRow),
            ]
        ];
        XLSX.utils.sheet_add_aoa(wsNight, nightRows, { origin: 'A1' });
        XLSX.utils.book_append_sheet(wb, wsNight, 'Nightly Breakdown');

        // ═══ Sheet 3: All Registrations ═══
        const regHeaders = ['#', 'Name', 'Phone', 'Guests', 'Payment', 'Status', 'Night', 'Date', 'Table', 'Entered', 'Registered At'];
        const wsRegs = XLSX.utils.aoa_to_sheet([]);
        wsRegs['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 15 }, { wch: 8 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 7 }, { wch: 8 }, { wch: 20 }];

        const getStatusStyle = (status: string) => {
            if (status === 'approved') return s.approved;
            if (status === 'pending') return s.pending;
            if (status === 'rejected') return s.rejected;
            return s.cell;
        };

        const regRows: any[][] = [
            regHeaders.map(h => styledCell(h, s.header)),
            ...allRegs.map((r, i) => {
                const dateInfo = ramadanDates.find(d => d.isoDate === r.reservation_date);
                return [
                    styledCell(i + 1, s.cell),
                    styledCell(r.full_name, s.cellLeft),
                    styledCell(r.phone || 'N/A', s.cell),
                    styledCell(r.guest_count, s.cellBold),
                    styledCell(r.payment_method, s.cell),
                    styledCell(r.status?.toUpperCase(), getStatusStyle(r.status)),
                    styledCell(dateInfo ? `R${dateInfo.ramadanDay}` : '', s.cell),
                    styledCell(r.reservation_date || '', s.cell),
                    styledCell(r.table_number ? `T-${r.table_number}` : '', s.cellBold),
                    styledCell(r.entered_count || 0, s.cell),
                    styledCell(new Date(r.created_at).toLocaleString(), s.cell),
                ];
            })
        ];
        XLSX.utils.sheet_add_aoa(wsRegs, regRows, { origin: 'A1' });
        XLSX.utils.book_append_sheet(wb, wsRegs, 'All Registrations');

        // Download
        const now = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `Halal-Catering-Report_${now}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-10">

            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reports</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">All Nights Analytics</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* Grand Totals */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-5 rounded-2xl text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary-500/15 rounded-full blur-2xl"></div>
                    <Users className="w-5 h-5 text-primary-400 mb-2" />
                    <p className="text-3xl font-black tabular-nums">{grandTotalPax}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Pax</p>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-green-500/15 rounded-full blur-2xl"></div>
                    <ScanLine className="w-5 h-5 text-green-400 mb-2" />
                    <p className="text-3xl font-black tabular-nums">{grandEntered}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Entered</p>
                </div>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-4 gap-2">
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-lg font-black text-slate-900 tabular-nums">{grandTotalRegs}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Bookings</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-lg font-black text-blue-600 tabular-nums">{grandApprovedPax}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Approved</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-lg font-black text-orange-500 tabular-nums">{dayStats.reduce((s, d) => s + d.pending, 0)}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Pending</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-lg font-black text-red-500 tabular-nums">{dayStats.reduce((s, d) => s + d.rejected, 0)}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Rejected</p>
                </div>
            </div>

            {/* Nightly Capacity Chart */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Nightly Guest Trend</h3>
                </div>

                <div className="flex items-end gap-1.5 h-32">
                    {dayStats.map((d, i) => {
                        const height = (d.approvedPax / maxPaxInDay) * 100;
                        const fill = Math.round((d.approvedPax / VENUE_CAPACITY) * 100);
                        return (
                            <div key={i} className="flex flex-col items-center flex-1 h-full group">
                                <div className="w-full flex-1 flex flex-col justify-end relative">
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer hover:opacity-80 ${fill >= 90 ? 'bg-red-500' : fill >= 70 ? 'bg-orange-500' : 'bg-primary-500'
                                            }`}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    ></div>
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        {d.approvedPax}p
                                    </div>
                                </div>
                                <span className="text-[8px] font-black text-slate-400 uppercase mt-2">R{d.ramadanDay}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-primary-500"></div>
                        <span className="text-[9px] font-bold text-slate-400">Under 70%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-orange-500"></div>
                        <span className="text-[9px] font-bold text-slate-400">70-89%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                        <span className="text-[9px] font-bold text-slate-400">90%+</span>
                    </div>
                </div>
            </div>

            {/* Nightly Breakdown Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 p-5 pb-3">
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Night-by-Night</h3>
                </div>

                <div className="divide-y divide-slate-50">
                    {dayStats.map((d, i) => {
                        const fill = Math.round((d.approvedPax / VENUE_CAPACITY) * 100);
                        return (
                            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-600">R{d.ramadanDay}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-800 truncate">{d.label}</span>
                                        <span className="text-xs font-black text-slate-900 tabular-nums shrink-0 ml-2">{d.approvedPax}<span className="text-slate-400 font-medium">/{VENUE_CAPACITY}</span></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${fill >= 90 ? 'bg-red-500' : fill >= 70 ? 'bg-orange-500' : 'bg-primary-500'
                                                }`}
                                            style={{ width: `${fill}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-orange-500"><Clock className="w-3 h-3" />{d.pending}</span>
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-blue-500"><CheckCircle2 className="w-3 h-3" />{d.approved}</span>
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-red-400"><XCircle className="w-3 h-3" />{d.rejected}</span>
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-green-600"><ScanLine className="w-3 h-3" />{d.entered}p in</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 p-5 pb-3">
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Payment Methods</h3>
                </div>

                <div className="px-5 pb-5 space-y-3">
                    {Object.entries(paymentBreakdown).map(([method, count], i) => {
                        const pct = grandTotalRegs > 0 ? Math.round((count / grandTotalRegs) * 100) : 0;
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${method === 'CBE' ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                    : method === 'Admin Override' ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                        : 'bg-green-50 text-green-600 border border-green-100'
                                    }`}>
                                    {method.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-800 truncate">{method}</span>
                                        <span className="text-xs font-black text-slate-900 tabular-nums">{pct}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-slate-400 transition-all"
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1">{count} bookings</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Full History Log */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between p-5 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm">Recent History</h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{allRegs.length} total</span>
                </div>

                <div className="divide-y divide-slate-50">
                    {paginatedRegs.map((r, i) => {
                        const dateInfo = ramadanDates.find(d => d.isoDate === r.reservation_date);
                        return (
                            <div key={i} className="px-5 py-3 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{r.full_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400">{r.guest_count}p</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                        <span className="text-[9px] font-bold text-slate-400">{dateInfo ? `R${dateInfo.ramadanDay}` : ''}</span>
                                        {r.table_number && (
                                            <>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                <span className="text-[9px] font-bold text-slate-400">T-{r.table_number}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${r.status === 'approved' ? 'bg-blue-50 text-blue-600'
                                    : r.status === 'pending' ? 'bg-orange-50 text-orange-600'
                                        : 'bg-red-50 text-red-500'
                                    }`}>
                                    {r.status}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 bg-slate-50/50 border-t border-slate-100">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="flex items-center gap-1 px-3 py-2 bg-white text-slate-600 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all shadow-sm border border-slate-200"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Page <span className="text-slate-900">{currentPage}</span> of {totalPages}
                        </span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="flex items-center gap-1 px-3 py-2 bg-white text-slate-600 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all shadow-sm border border-slate-200"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
