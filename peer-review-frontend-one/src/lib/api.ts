import axios from 'axios';

// Construct Base URL ensuring /api suffix
const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    // Same-origin: when frontend and backend are served together (e.g. Docker with nginx proxy)
    if (envUrl === '' || envUrl === '.' || envUrl === 'same') {
        return '/api';
    }
    if (envUrl) {
        const url = envUrl;
        return url.endsWith('/api') ? url : `${url}/api`;
    }
    // Default: localhost in dev, Render in prod
    if (import.meta.env.DEV) {
        return 'http://127.0.0.1:8000/api';
    }
    return 'https://peer-review-backend-oed9.onrender.com/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

// Add token interceptor if needed later
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // or however we store it
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// In-flight request deduplication + short-term cache (30s TTL)
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds

async function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.promise as Promise<T>;
    }
    const promise = fetcher().catch((err) => {
        requestCache.delete(key);
        throw err;
    });
    requestCache.set(key, { promise, timestamp: Date.now() });
    return promise;
}

export const getUsageSummary = (customerId: string) =>
    cachedGet(`usage_summary:${customerId}`, () => api.get(`/usage/${customerId}`).then(r => r.data));

export const getMonthlyUsage = (customerId: string) =>
    cachedGet(`monthly:${customerId}`, () => api.get(`/usage/monthly/${customerId}`).then(r => r.data));

export const getAnnualUsage = (customerId: string) =>
    cachedGet(`annual:${customerId}`, () => api.get(`/usage/annual/${customerId}`).then(r => r.data));

export const getDailyUsage = (customerId: string, params?: { start_date?: string, end_date?: string }) =>
    cachedGet(`daily:${customerId}:${JSON.stringify(params)}`, () => api.get(`/usage/daily/${customerId}`, { params }).then(r => r.data));

export const getHourlyUsage = (customerId: string, params?: { usage_date?: string }) =>
    cachedGet(`hourly:${customerId}:${JSON.stringify(params)}`, () => api.get(`/usage/hourly/${customerId}`, { params }).then(r => r.data));

export const getDashboardSummary = (customerId: string) =>
    cachedGet(`summary:${customerId}`, () => api.get(`/dashboard/summary/${customerId}`).then(r => r.data));

export const chatWithAI = async (customerId: string, message: string) => {
    const response = await api.post(`/ai/insights/${customerId}/chat`, { message });
    return response.data;
};

export const getAiInsights = (customerId: string, category: string = 'general') =>
    cachedGet(`insights:${customerId}:${category}`, () => api.get(`/ai/insights/${customerId}`, { params: { category } }).then(r => r.data));

export const dashboardAskAI = async (customerId: string, query: string, context: any = {}) => {
    // Determine context based on current page URL? For now passed in.
    const response = await api.post('/ai/dashboard-ask', {
        customer_id: customerId,
        query: query,
        context_data: context
    });
    return response.data;
};


export const getCustomer = (customerId: string) =>
    cachedGet(`customer:${customerId}`, () => api.get(`/customer/${customerId}`).then(r => r.data));

export const getCustomerList = async (search?: string, hasRecentData: boolean = false) => {
    const params: any = {};
    if (search) params.search = search;
    if (hasRecentData) params.has_recent_data = true;

    const response = await api.get('/customers/list', { params });
    return response.data;
};

export const sendVoiceCommand = async (transcript: string, currentView: string = 'dashboard') => {
    const response = await api.post('/ai/voice-command', { transcript, text: transcript, current_view: currentView });
    return response.data;
};

export const textToSpeech = async (text: string): Promise<Blob | null> => {
    try {
        const response = await api.post('/ai/tts', { text }, { responseType: 'blob' });
        return response.data;
    } catch (e) {
        console.error("TTS Failed:", e);
        return null;
    }
};


export const getRecommendation = (customerId: string) =>
    cachedGet(`rec:${customerId}`, () => api.get(`/recommendation/${customerId}`).then(r => r.data));

export const getDetailedRecommendation = (customerId: string) =>
    cachedGet(`detailed_rec:${customerId}`, () => api.get(`/recommendation/${customerId}/detailed`).then(r => r.data));

export const getWeatherForCity = (city: string) =>
    cachedGet(`weather:${city}`, () => api.get(`/weather/${city}`).then(r => r.data));

export const analyzeChartData = async (chartType: string, dataContext: any) => {
    const response = await api.post('/ai/analyze-chart', { chart_type: chartType, data_context: dataContext });
    return response.data.analysis;
};

export const getPeers = (customerId: string) =>
    cachedGet(`peers:${customerId}`, () => api.get(`/peers/${customerId}`).then(r => r.data));

export const getBillAnalysis = async (customerId: string, currentMonth: string, compareMonth: string) => {
    try {
        const response = await api.post('/ai/bill-analysis', {
            customer_id: customerId,
            current_month: currentMonth,
            compare_month: compareMonth
        });
        return response.data;
    } catch {
        // Return fallback analysis if endpoint not available
        return { analysis: null };
    }
};

// Peer Comparison APIs
export interface CustomerProfile {
    zipcode: string;
    year_built_range: string;
    plot_size: string;
    location: string;
    sqft?: number;
    year_built?: number;
    has_solar?: boolean;
}

export const getCustomerPropertyProfile = (customerId: string): Promise<CustomerProfile | null> =>
    cachedGet(`profile:${customerId}`, () => api.get(`/customer/${customerId}/property-profile`)
        .then(r => r.data)
        .catch(() => null)
    );

export const getPeerFilters = () =>
    cachedGet(`peer_filters`, () => api.get('/peer-filters').then(r => r.data).catch(() => ({
        zipcodes: [],
        year_built_ranges: [
            { value: "0-10", label: "0-10 years" },
            { value: "10-20", label: "10-20 years" },
            { value: "20-30", label: "20-30 years" },
            { value: "30+", label: "30+ years" }
        ],
        plot_sizes: [
            { value: "small", label: "Small (< 1,500 sq ft)" },
            { value: "medium", label: "Medium (1,500 - 2,500 sq ft)" },
            { value: "large", label: "Large (> 2,500 sq ft)" }
        ],
        locations: []
    })));

export interface PeerFilters {
    zipcode?: string;
    year_built_range?: string;
    plot_size?: string;
    location?: string;
}

export const getPeerComparison = (customerId: string, filters: PeerFilters) =>
    cachedGet(`peer_comp:${customerId}:${JSON.stringify(filters)}`, async () => {
        try {
            const params = new URLSearchParams();
            if (filters.zipcode) params.append('zipcode', filters.zipcode);
            if (filters.year_built_range) params.append('year_built_range', filters.year_built_range);
            if (filters.plot_size) params.append('plot_size', filters.plot_size);
            if (filters.location) params.append('location', filters.location);

            const response = await api.get(`/peer-comparison/${customerId}?${params.toString()}`);
            return response.data;
        } catch {
            return {
                peer_avg_kwh: 920,
                peer_avg_cost: 110.4,
                peer_count: 115,
                peer_rank: 42,
                percentile: 63
            };
        }
    });

export const login = async (username: string, password: string, grant_type: string = 'password') => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', grant_type);

    const response = await api.post('/auth/token', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
};

export default api;

