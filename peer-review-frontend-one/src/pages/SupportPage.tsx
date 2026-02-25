import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Bot, Send, Search, ChevronDown, Plus, ArrowLeft, Sparkles,
    Ticket, Clock, LifeBuoy, CreditCard, BarChart3, Zap, Settings,
    CheckCircle2, AlertCircle, Loader2, MessageCircle
} from 'lucide-react';
import { chatWithAI } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; }
interface SupportTicket {
    id: string; subject: string; description: string;
    category: string; status: 'open' | 'in-progress' | 'resolved'; createdAt: string;
}

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
    {
        id: 'billing', title: 'Billing & Payments', icon: CreditCard,
        description: 'Invoices, charges, payment methods & billing cycles',
        color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50', textColor: 'text-blue-600',
        questions: [
            { q: 'How is my electricity bill calculated?', a: 'Your bill is based on your monthly kWh consumption multiplied by your plan rate, plus any fixed charges, delivery fees, and applicable taxes. You can see a detailed breakdown on the Home dashboard.' },
            { q: 'Why did my bill increase this month?', a: 'Common reasons include seasonal weather changes (increased heating/cooling), rate adjustments, or higher-than-normal usage. Check the "Weather Impact" page for temperature correlations with your consumption.' },
            { q: 'When is my bill due?', a: 'Bills are typically due 21 days after the statement date. Check your account details or the dashboard summary for your specific billing cycle and due date.' },
            { q: 'How can I dispute a charge?', a: 'Submit a support ticket under the "Billing Issue" category with your account details and the specific charge you\'d like to dispute. Our team will review it within 24 hours.' },
        ]
    },
    {
        id: 'usage', title: 'Usage & Monitoring', icon: BarChart3,
        description: 'Understanding your energy consumption & efficiency',
        color: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600',
        questions: [
            { q: 'How can I reduce my energy usage?', a: 'Key tips: 1) Adjust thermostat by 2°F, 2) Shift heavy appliance use to off-peak hours, 3) Unplug phantom loads, 4) Use smart power strips. Visit "Recommendations" for AI-powered personalized advice.' },
            { q: 'What are peak vs off-peak hours?', a: 'Peak hours are typically 2 PM – 8 PM on weekdays when demand is highest. Off-peak is everything else — nights, early mornings, and weekends. Some plans offer significantly lower rates during off-peak times.' },
            { q: 'How do I read my usage chart?', a: 'Bar charts show daily kWh consumption. Blue bars represent actual usage, purple dashed bars indicate projected/forecasted data. Click on any bar to drill down into hourly detail.' },
            { q: 'What is the efficiency score?', a: 'Your efficiency score (0–100) measures how well you use energy compared to similar households. Higher is better. It factors in total usage, peak/off-peak balance, and weather-adjusted norms.' },
        ]
    },
    {
        id: 'plans', title: 'Plans & Switching', icon: Zap,
        description: 'Compare plans, switching options & contract terms',
        color: 'from-violet-500 to-violet-600', bgLight: 'bg-violet-50', textColor: 'text-violet-600',
        questions: [
            { q: 'How do I switch my energy plan?', a: 'Visit the "Compare Plans" page to see all available plans with personalized cost estimates. The AI recommends the best plan based on your usage pattern. Contact your provider to initiate the switch.' },
            { q: 'What is a fixed-rate vs variable-rate plan?', a: 'Fixed-rate locks your per-kWh price for the contract term, providing predictability. Variable-rate fluctuates with market prices — potentially cheaper in mild months but can spike in extreme weather.' },
            { q: 'Are there penalties for switching plans?', a: 'Some plans have early termination fees (typically $50–$200). Check the "Compare Plans" page for specific cancellation fees listed on each plan before switching.' },
        ]
    },
    {
        id: 'account', title: 'Account & Technical', icon: Settings,
        description: 'Profile updates, data security & technical help',
        color: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50', textColor: 'text-amber-600',
        questions: [
            { q: 'How do I update my account information?', a: 'Submit a support ticket under "Account Update" category with the details you need to change, or call your energy provider directly for immediate assistance.' },
            { q: 'Can I view past bills and history?', a: 'Yes! The "My Usage" page shows your full historical data with monthly and daily views. The dashboard also provides trend analysis and month-over-month comparisons.' },
            { q: 'How does peer comparison work?', a: 'We compare your usage against anonymized data from similar homes in your area (matching zip code, home size, and building age). Visit "Peer Analysis" for detailed benchmarks and rankings.' },
            { q: 'Is my data secure?', a: 'Yes. All data is encrypted in transit and at rest. We follow industry-standard security practices and never share your personal usage data with third parties.' },
        ]
    }
];

const TICKET_CATEGORIES = ['Billing Issue', 'Usage Question', 'Plan Change', 'Technical Problem', 'Account Update', 'Other'];

function loadTickets(): SupportTicket[] {
    try { const r = localStorage.getItem('support_tickets'); return r ? JSON.parse(r) : []; }
    catch { return []; }
}
function saveTickets(t: SupportTicket[]) { localStorage.setItem('support_tickets', JSON.stringify(t)); }

// ─── Component ───────────────────────────────────────────────────────────────
export default function SupportPage({ customerId }: { customerId: string }) {
    // Views: 'home' | 'category' | 'tickets' | 'new-ticket' | 'chat'
    const [view, setView] = useState<'home' | 'category' | 'tickets' | 'new-ticket' | 'chat'>('home');
    const [selectedCategory, setSelectedCategory] = useState<typeof FAQ_CATEGORIES[0] | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ q: string; a: string; category: string }[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [expandedQ, setExpandedQ] = useState<string | null>(null);

    // Chat
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! I\'m your energy support assistant. How can I help you today?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Tickets
    const [tickets, setTickets] = useState<SupportTicket[]>(loadTickets);
    const [newSubject, setNewSubject] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCategory, setNewCategory] = useState(TICKET_CATEGORIES[0]);
    const [aiWriting, setAiWriting] = useState(false);
    const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    // Search logic
    const handleSearch = (q: string) => {
        setSearchQuery(q);
        if (!q.trim()) { setShowResults(false); setSearchResults([]); return; }
        const results: { q: string; a: string; category: string }[] = [];
        FAQ_CATEGORIES.forEach(cat => {
            cat.questions.forEach(faq => {
                if (faq.q.toLowerCase().includes(q.toLowerCase()) || faq.a.toLowerCase().includes(q.toLowerCase())) {
                    results.push({ ...faq, category: cat.title });
                }
            });
        });
        setSearchResults(results);
        setShowResults(true);
    };

    // Chat logic
    const handleChatSend = async () => {
        if (!chatInput.trim() || chatLoading) return;
        const msg = chatInput; setChatInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setChatLoading(true);
        try {
            const data = await chatWithAI(customerId, msg);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again or submit a ticket." }]);
        } finally { setChatLoading(false); }
    };

    // Ticket logic
    const handleSubmitTicket = () => {
        if (!newSubject.trim() || !newDesc.trim()) return;
        const ticket: SupportTicket = {
            id: `TKT-${Date.now().toString(36).toUpperCase()}`,
            subject: newSubject.trim(), description: newDesc.trim(),
            category: newCategory, status: 'open', createdAt: new Date().toISOString()
        };
        const updated = [ticket, ...tickets];
        setTickets(updated); saveTickets(updated);
        setNewSubject(''); setNewDesc(''); setView('tickets');
    };

    const handleWriteWithAI = async () => {
        if (!newSubject.trim()) return;
        setAiWriting(true);
        try {
            const prompt = `Write a clear, detailed support ticket description for the following:\nCategory: ${newCategory}\nSubject: ${newSubject}\n\nWrite 2-3 concise sentences describing the issue from the customer's perspective. Be specific and include what the expected vs actual behavior is. Do not use markdown, just plain text.`;
            const data = await chatWithAI(customerId, prompt);
            setNewDesc(data.response);
        } catch {
            setNewDesc('Could not generate description. Please write it manually.');
        } finally {
            setAiWriting(false);
        }
    };

    const filteredTickets = tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter);

    const statusBadge = (status: string) => {
        const m: Record<string, string> = {
            'open': 'bg-amber-50 text-amber-700 border-amber-200',
            'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${m[status] || ''}`}>{status.replace('-', ' ').toUpperCase()}</span>;
    };

    const statusIcon = (s: string) => {
        if (s === 'open') return <AlertCircle className="h-4 w-4 text-amber-500" />;
        if (s === 'in-progress') return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-0 -mt-6 -mx-6">

            {/* ═══ HOME VIEW ═══ */}
            {view === 'home' && (
                <>
                    {/* Hero Banner */}
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 pt-16 pb-20 text-center relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-10 left-20 w-32 h-32 bg-white rounded-full blur-3xl" />
                            <div className="absolute bottom-5 right-32 w-40 h-40 bg-white rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full mb-5">
                                <LifeBuoy className="h-4 w-4 text-white" />
                                <span className="text-xs font-medium text-white/90">Support Center</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-3">How can we help you?</h1>
                            <p className="text-blue-100 text-sm mb-8">Search our knowledge base or browse categories below</p>

                            {/* Search Bar */}
                            <div className="relative max-w-xl mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Search for answers..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-slate-800 text-sm shadow-xl shadow-black/10 outline-none focus:ring-2 focus:ring-white/50 placeholder:text-slate-400"
                                />
                                {/* Search Results Dropdown */}
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 max-h-80 overflow-y-auto z-20">
                                        {searchResults.map((r, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setExpandedQ(expandedQ === r.q ? null : r.q); }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                            >
                                                <p className="text-sm font-medium text-slate-800">{r.q}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{r.category}</p>
                                                {expandedQ === r.q && (
                                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg">{r.a}</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showResults && searchResults.length === 0 && searchQuery.trim() && (
                                    <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 p-6 text-center z-20">
                                        <p className="text-sm text-slate-400">No results found for "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Cards Grid */}
                    <div className="px-6 -mt-10 relative z-10">
                        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {FAQ_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedCategory(cat); setView('category'); }}
                                    className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                                >
                                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <cat.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 mb-1">{cat.title}</h3>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">{cat.description}</p>
                                    <p className="text-[10px] text-slate-400 mt-3 font-medium">{cat.questions.length} articles</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="px-6 mt-12">
                        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {/* Chat with AI */}
                            <button
                                onClick={() => setView('chat')}
                                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <MessageCircle className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-sm text-slate-800">Chat with AI</h3>
                                    <p className="text-[11px] text-slate-500">Get instant answers from our AI assistant</p>
                                </div>
                            </button>

                            {/* Submit Ticket */}
                            <button
                                onClick={() => setView('new-ticket')}
                                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                                    <Ticket className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-sm text-slate-800">Submit a Ticket</h3>
                                    <p className="text-[11px] text-slate-500">Create a support request for our team</p>
                                </div>
                            </button>

                            {/* View Tickets */}
                            <button
                                onClick={() => setView('tickets')}
                                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-emerald-200 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-sm text-slate-800">My Tickets</h3>
                                    <p className="text-[11px] text-slate-500">Track your existing support requests</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 mt-14 pb-10">
                        <p className="text-center text-xs text-slate-400">Can't find what you need? <button onClick={() => setView('chat')} className="text-blue-600 font-medium hover:underline">Chat with our AI</button> or <button onClick={() => setView('new-ticket')} className="text-blue-600 font-medium hover:underline">submit a ticket</button>.</p>
                    </div>
                </>
            )}

            {/* ═══ CATEGORY VIEW ═══ */}
            {view === 'category' && selectedCategory && (
                <div className="px-6 py-6">
                    <div className="max-w-3xl mx-auto">
                        <button onClick={() => { setView('home'); setExpandedQ(null); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Support
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${selectedCategory.color} flex items-center justify-center`}>
                                <selectedCategory.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedCategory.title}</h2>
                                <p className="text-sm text-slate-500">{selectedCategory.description}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {selectedCategory.questions.map(q => {
                                const isOpen = expandedQ === q.q;
                                return (
                                    <div key={q.q} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                                        <button
                                            onClick={() => setExpandedQ(isOpen ? null : q.q)}
                                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                                        >
                                            <span className="text-sm font-medium text-slate-800 pr-4">{q.q}</span>
                                            <ChevronDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                                                {q.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
                            <p className="text-sm text-slate-600 mb-3">Still need help?</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setView('chat')} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                    Chat with AI
                                </button>
                                <button onClick={() => setView('new-ticket')} className="px-5 py-2 bg-white text-slate-700 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors">
                                    Submit a Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CHAT VIEW ═══ */}
            {view === 'chat' && (
                <div className="px-6 py-6">
                    <div className="max-w-2xl mx-auto">
                        <button onClick={() => setView('home')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Support
                        </button>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: '560px' }}>
                            {/* Chat Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center gap-3 text-white">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm">AI Support Assistant</h2>
                                    <p className="text-[11px] text-blue-100">Powered by AskCal Intelligence</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[11px] text-blue-100">Online</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="overflow-y-auto p-4 space-y-3 bg-slate-50" style={{ height: 'calc(100% - 130px)' }} ref={scrollRef}>
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.role === 'assistant' && (
                                            <div className="h-7 w-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                                                <Bot className="h-4 w-4 text-blue-600" />
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${m.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-sm'
                                            }`}>
                                            <div className="prose prose-sm max-w-none">
                                                <ReactMarkdown>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="h-7 w-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                                            <Bot className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 flex gap-1.5">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-3 bg-white border-t border-slate-100">
                                <div className="flex gap-2">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                                        placeholder="Type your question..."
                                        className="flex-1 bg-slate-100 border-0 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                                    />
                                    <button
                                        onClick={handleChatSend}
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ NEW TICKET VIEW ═══ */}
            {view === 'new-ticket' && (
                <div className="px-6 py-6">
                    <div className="max-w-2xl mx-auto">
                        <button onClick={() => setView('home')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Support
                        </button>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Ticket className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-slate-900">Submit a Ticket</h2>
                                    <p className="text-xs text-slate-500">Fill out the form below and our team will respond within 24 hours</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                                    <select
                                        value={newCategory} onChange={e => setNewCategory(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {TICKET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Subject</label>
                                    <input
                                        value={newSubject} onChange={e => setNewSubject(e.target.value)}
                                        placeholder="Brief description of your issue"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-700">Description</label>
                                        <button
                                            onClick={handleWriteWithAI}
                                            disabled={aiWriting || !newSubject.trim()}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm"
                                        >
                                            {aiWriting ? (
                                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                                            ) : (
                                                <><Sparkles className="h-3.5 w-3.5" /> Write with AI</>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        value={newDesc} onChange={e => setNewDesc(e.target.value)}
                                        placeholder="Provide detailed information about your issue, or click 'Write with AI' to auto-generate..."
                                        rows={5}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => setView('home')} className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitTicket}
                                        disabled={!newSubject.trim() || !newDesc.trim()}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                    >
                                        Submit Ticket
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TICKETS LIST VIEW ═══ */}
            {view === 'tickets' && (
                <div className="px-6 py-6">
                    <div className="max-w-3xl mx-auto">
                        <button onClick={() => setView('home')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Support
                        </button>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <Ticket className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg text-slate-900">My Tickets</h2>
                                        <p className="text-xs text-slate-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setView('new-ticket')}
                                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    <Plus className="h-4 w-4" /> New Ticket
                                </button>
                            </div>

                            {/* Filter */}
                            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                {(['all', 'open', 'in-progress', 'resolved'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTicketFilter(f)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${ticketFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        {f === 'all' ? `All (${tickets.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${tickets.filter(t => t.status === f).length})`}
                                    </button>
                                ))}
                            </div>

                            {/* List */}
                            <div className="divide-y divide-slate-100">
                                {filteredTickets.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Ticket className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-slate-400">No tickets found</p>
                                        <p className="text-xs text-slate-400 mt-1">Create a new ticket to get support</p>
                                    </div>
                                ) : (
                                    filteredTickets.map(t => (
                                        <div key={t.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                {statusIcon(t.status)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-semibold text-slate-800 truncate">{t.subject}</h3>
                                                        {statusBadge(t.status)}
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{t.description}</p>
                                                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                                                        <span className="font-mono flex items-center gap-1"><Ticket className="h-3 w-3" />{t.id}</span>
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{t.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
