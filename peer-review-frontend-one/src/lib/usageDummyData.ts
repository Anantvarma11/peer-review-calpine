// src/lib/usageDummyData.ts

export const YEAR = 2024;
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MNF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOW_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const RATE = 0.245;

export const TEMP_PROFILES = [
    { min: 1, max: 7 }, { min: 1, max: 8 }, { min: 3, max: 11 }, { min: 5, max: 15 },
    { min: 8, max: 19 }, { min: 11, max: 22 }, { min: 13, max: 25 }, { min: 13, max: 24 },
    { min: 10, max: 20 }, { min: 7, max: 15 }, { min: 4, max: 10 }, { min: 2, max: 7 },
];

export const PROFILES = [
    { kwh: 12.3, avg: 16.8, pct: 12 }, { kwh: 12.1, avg: 17.5, pct: 9 },
    { kwh: 9.4, avg: 13.2, pct: 15 }, { kwh: 7.0, avg: 9.3, pct: 22 },
    { kwh: 5.6, avg: 6.8, pct: 38 }, { kwh: 5.0, avg: 5.2, pct: 52 },
    { kwh: 5.5, avg: 4.8, pct: 64 }, { kwh: 6.3, avg: 5.0, pct: 78 },
    { kwh: 7.7, avg: 6.7, pct: 60 }, { kwh: 10.0, avg: 11.0, pct: 41 },
    { kwh: 13.7, avg: 15.3, pct: 26 }, { kwh: 16.8, avg: 17.7, pct: 44 },
];

function seededRand(seed: number) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
}
export function getDow(m: number, d: number) { return (new Date(YEAR, m, d).getDay() + 6) % 7; }

const rand = seededRand(20240101);
export const yearData = PROFILES.map((p, m) =>
    Array.from({ length: DIM[m] }, () => {
        const tp = TEMP_PROFILES[m];
        const tempMin = +(tp.min + (rand() - 0.5) * 3).toFixed(1);
        const tempMax = +(tp.max + (rand() - 0.5) * 4).toFixed(1);
        const tempAvg = +((tempMin + tempMax) / 2).toFixed(1);
        return {
            kwh: +(p.kwh * (0.55 + rand() * 0.9)).toFixed(1),
            avg: +(p.avg * (0.70 + rand() * 0.6)).toFixed(1),
            pct: Math.max(2, Math.min(98, Math.round(p.pct + (rand() - 0.5) * 44))),
            tempMin, tempMax, tempAvg
        };
    })
);

export const allDays: any[] = [];
for (let m = 0; m < 12; m++) yearData[m].forEach((d, di) => allDays.push({ ...d, m, day: di + 1 }));

export const monthTotals = yearData.map(mArr => +(mArr.reduce((s, d) => s + d.kwh, 0)).toFixed(1));
export const peerMonthly = yearData.map((mArr) => +(mArr.reduce((s, d) => s + d.avg, 0)).toFixed(1));

export const totalKwh = +(monthTotals.reduce((a, b) => a + b, 0)).toFixed(1);
export const totalPeerKwh = +(peerMonthly.reduce((a, b) => a + b, 0)).toFixed(1);
export const dailyAvg = +(totalKwh / 366).toFixed(2);
export const annualCost = +(totalKwh * RATE).toFixed(0);
export const greenDays = allDays.filter(d => d.pct <= 50).length;
export const greenPct = Math.round(greenDays / 366 * 100);
export const overallPct = Math.round(allDays.reduce((s, d) => s + d.pct, 0) / allDays.length);

export const SEASONS = [
    { name: 'Winter', icon: '❄️', months: [11, 0, 1], color: '#3B82F6' },
    { name: 'Spring', icon: '🌸', months: [2, 3, 4], color: '#10B981' },
    { name: 'Summer', icon: '☀️', months: [5, 6, 7], color: '#F59E0B' },
    { name: 'Autumn', icon: '🍂', months: [8, 9, 10], color: '#EF4444' },
];

export const seasonTotals = SEASONS.map(s => ({
    ...s,
    kwh: +(s.months.reduce((acc, m) => acc + monthTotals[m], 0)).toFixed(0)
}));
export const maxSeasonKwh = Math.max(...seasonTotals.map(s => s.kwh));

export const dowTotals = Array(7).fill(0);
export const dowCounts = Array(7).fill(0);
allDays.forEach(d => {
    const dow = getDow(d.m, d.day);
    dowTotals[dow] += d.kwh;
    dowCounts[dow] += 1;
});
export const dowAvgs = dowTotals.map((t, i) => +(t / dowCounts[i]).toFixed(2));
export const maxDow = Math.max(...dowAvgs);

export const sorted = [...allDays].sort((a, b) => b.kwh - a.kwh);
export const topHigh = sorted.slice(0, 5);
export const topLow = sorted.slice(-5).reverse();

export const monthCosts = monthTotals.map(k => +(k * RATE).toFixed(2));
export const peerMonthCosts = peerMonthly.map(k => +(k * RATE).toFixed(2));
export const annualCostFull = +(totalKwh * RATE).toFixed(2);
export const peerAnnualCost = +(totalPeerKwh * RATE).toFixed(2);
export const savedVsPeer = +(peerAnnualCost - annualCostFull).toFixed(2);
export const dailyCostAvg = +(annualCostFull / 366).toFixed(2);

export const HIST_YEARS = [2020, 2021, 2022, 2023, 2024];
export const HIST_MONTHLY = {
    2020: [580, 490, 420, 370, 280, 220, 215, 240, 295, 395, 490, 570],
    2021: [555, 470, 398, 350, 260, 205, 210, 232, 280, 378, 465, 548],
    2022: [530, 450, 380, 332, 248, 195, 200, 218, 265, 358, 440, 520],
    2023: [490, 420, 352, 305, 228, 180, 185, 200, 248, 328, 410, 478],
    2024: monthTotals.map(v => Math.round(v))
} as const;

export const PEAK_RATIO = 0.37;
export const OFFPK_RATIO = 0.63;
export const PEAK_HOURS = new Set([7, 8, 16, 17, 18, 19]);

export const peakByMonth = monthTotals.map(v => +(v * PEAK_RATIO).toFixed(1));
export const offpkByMonth = monthTotals.map(v => +(v * OFFPK_RATIO).toFixed(1));
export const totalPeakKwh = +(totalKwh * PEAK_RATIO).toFixed(1);
export const totalOffpkKwh = +(totalKwh * OFFPK_RATIO).toFixed(1);

export const HOUR_PROFILE = [
    0.38, 0.28, 0.24, 0.22, 0.28, 0.48,
    0.72, 1.55, 1.38, 0.88, 0.68, 0.62,
    0.60, 0.58, 0.54, 0.60, 1.22, 1.82,
    1.72, 1.44, 1.15, 0.86, 0.68, 0.48
];
const _hpSum = HOUR_PROFILE.reduce((a, b) => a + b, 0);
export const hourAvgs = HOUR_PROFILE.map(v => +((v / _hpSum) * dailyAvg * 24).toFixed(3));
