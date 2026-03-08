// Ramadan 2026 date mapping
// March 8, 2026 = Ramadan 19  →  March 19, 2026 = Ramadan 30

const RAMADAN_START_GREGORIAN = new Date('2026-03-08'); // Ramadan 19
const RAMADAN_START_DAY = 19; // First Ramadan day number shown

export interface RamadanDate {
    ramadanDay: number;   // e.g. 19
    gregorian: Date;      // actual JS Date
    label: string;        // "Ramadan 19 · Mar 8"
    isoDate: string;      // "2026-03-08"
}

/** Returns all Ramadan date options from day 19 to 30 */
export function getRamadanDates(): RamadanDate[] {
    const dates: RamadanDate[] = [];
    for (let i = 0; i <= 11; i++) {
        const gregorian = new Date(RAMADAN_START_GREGORIAN);
        gregorian.setDate(gregorian.getDate() + i);

        const ramadanDay = RAMADAN_START_DAY + i;
        const isoDate = gregorian.toISOString().split('T')[0]; // "YYYY-MM-DD"

        const dayName = gregorian.toLocaleString('en-US', { weekday: 'short' }); // "Sun", "Mon"...

        dates.push({
            ramadanDay,
            gregorian,
            label: `Ramadan ${ramadanDay}  ·  ${dayName}`,
            isoDate,
        });
    }
    return dates;
}

/** Returns today's Ramadan date option, or the first one if outside range */
export function getTodayRamadanDate(): RamadanDate {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().split('T')[0];

    const all = getRamadanDates();
    return all.find(d => d.isoDate === todayIso) ?? all[0];
}

/** Returns only the daily iftar dates: Ramadan 19-28 */
export function getDailyIftarDates(): RamadanDate[] {
    return getRamadanDates().filter(d => d.ramadanDay <= 28);
}

/** Returns only the grand iftar dates: Ramadan 29-30 */
export function getGrandIftarDates(): RamadanDate[] {
    return getRamadanDates().filter(d => d.ramadanDay >= 29);
}

/** Check if a given ISO date is a Grand Iftar date (R29 or R30) */
export function isGrandIftarDate(isoDate: string): boolean {
    return getGrandIftarDates().some(d => d.isoDate === isoDate);
}
