import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    X, Send, Bot, Headphones, HelpCircle, Ticket,
    ChevronDown, ChevronRight, Search, Plus, Clock, Sparkles, Loader2
} from 'lucide-react';
import { chatWithAI } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    category: string;
    status: 'open' | 'in-progress' | 'resolved';
    createdAt: string;
}

type Tab = 'bot' | 'faq' | 'tickets';

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const FAQ_DATA = [
    {
        category: 'Billing',
        questions: [
            { q: 'How is my electricity bill calculated?', a: 'Your bill is based on your monthly kWh consumption multiplied by your plan rate, plus any fixed charges, delivery fees, and applicable taxes.' },
            { q: 'Why did my bill increase this month?', a: 'Common reasons include seasonal weather changes (heating/cooling), rate adjustments, or increased usage. Check the "Weather Impact" page for temperature correlations.' },
            { q: 'When is my bill due?', a: 'Bills are typically due 21 days after the statement date. Check your account details for your specific billing cycle.' },
        ]
    },
    {
        category: 'Usage',
        questions: [
            { q: 'How can I reduce my energy usage?', a: 'Key tips: 1) Adjust thermostat by 2°F, 2) Shift heavy appliance use to off-peak hours, 3) Unplug phantom loads, 4) Use smart power strips. Visit "Recommendations" for personalized advice.' },
            { q: 'What are peak vs off-peak hours?', a: 'Peak hours are typically 2 PM - 8 PM on weekdays when demand is highest. Off-peak is everything else. Some plans offer lower rates during off-peak times.' },
            { q: 'How do I read my usage chart?', a: 'The bar charts show daily kWh consumption. Blue bars are actual usage, purple bars indicate projected data. Click on any bar to drill down into hourly detail.' },
        ]
    },
    {
        category: 'Plans',
        questions: [
            { q: 'How do I switch my energy plan?', a: 'Visit the "Compare Plans" page to see all available plans. The system will recommend the best plan based on your usage pattern. Contact your provider to initiate the switch.' },
            { q: 'What is a fixed-rate vs variable-rate plan?', a: 'Fixed-rate locks your per-kWh price for the contract term. Variable-rate fluctuates with market prices — potentially cheaper in mild months but risky in extreme weather.' },
            { q: 'Are there penalties for switching plans?', a: 'Some plans have early termination fees (typically $50-$200). Check the "Compare Plans" page for specific cancellation fees on each plan.' },
        ]
    },
    {
        category: 'Account',
        questions: [
            { q: 'How do I update my account information?', a: 'Contact customer support through the ticketing system below or call your energy provider directly to update personal or account details.' },
            { q: 'Can I view past bills?', a: 'Yes, the "My Usage" page shows your historical monthly data. You can also check the dashboard for trend analysis and month-over-month comparisons.' },
            { q: 'How does peer comparison work?', a: 'We compare your usage against anonymized data from similar homes in your area (same zip code, home size, and age). Visit "Peer Analysis" for full details.' },
        ]
    }
];

const TICKET_CATEGORIES = ['Billing Issue', 'Usage Question', 'Plan Change', 'Technical Problem', 'Account Update', 'Other'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadTickets(): SupportTicket[] {
    try {
        const raw = localStorage.getItem('support_tickets');
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveTickets(tickets: SupportTicket[]) {
    localStorage.setItem('support_tickets', JSON.stringify(tickets));
}

// ─── Component ───────────────────────────────────────────────────────────────
export function SupportHub({ customerId }: { customerId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('bot');

    // ── AI Bot State ──
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! 👋 I\'m your energy support assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // ── FAQ State ──
    const [faqSearch, setFaqSearch] = useState('');
    const [expandedQ, setExpandedQ] = useState<string | null>(null);

    // ── Ticket State ──
    const [tickets, setTickets] = useState<SupportTicket[]>(loadTickets);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCategory, setNewCategory] = useState(TICKET_CATEGORIES[0]);
    const [aiWriting, setAiWriting] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // ── AI Bot Logic ──
    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);
        try {
            const data = await chatWithAI(customerId, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again or submit a support ticket." }]);
        } finally {
            setLoading(false);
        }
    };

    // ── Ticket Logic ──
    const handleSubmitTicket = () => {
        if (!newSubject.trim() || !newDesc.trim()) return;
        const ticket: SupportTicket = {
            id: `TKT-${Date.now().toString(36).toUpperCase()}`,
            subject: newSubject.trim(),
            description: newDesc.trim(),
            category: newCategory,
            status: 'open',
            createdAt: new Date().toISOString()
        };
        const updated = [ticket, ...tickets];
        setTickets(updated);
        saveTickets(updated);
        setNewSubject('');
        setNewDesc('');
        setShowNewTicket(false);
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

    // ── FAQ Filter ──
    const filteredFAQs = FAQ_DATA.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q =>
            q.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
            q.a.toLowerCase().includes(faqSearch.toLowerCase())
        )
    })).filter(cat => cat.questions.length > 0);

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'open': 'bg-amber-100 text-amber-700',
            'in-progress': 'bg-blue-100 text-blue-700',
            'resolved': 'bg-emerald-100 text-emerald-700'
        };
        return (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                {status.replace('-', ' ').toUpperCase()}
            </span>
        );
    };

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'bot', label: 'AI Bot', icon: Bot },
        { id: 'faq', label: 'FAQs', icon: HelpCircle },
        { id: 'tickets', label: 'Tickets', icon: Ticket },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* ── Panel ── */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-full">
                                <Headphones className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">Support Center</h3>
                                <p className="text-[10px] text-blue-100">AI Bot • FAQs • Tickets</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-md transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex border-b border-slate-200 bg-slate-50">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${activeTab === t.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <t.icon className="h-3.5 w-3.5" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab Content ── */}
                    <div className="flex-1 overflow-hidden flex flex-col">

                        {/* ─── AI Bot Tab ─── */}
                        {activeTab === 'bot' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" ref={scrollRef}>
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${m.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-sm'
                                                }`}>
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-white border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Ask anything about your energy..."
                                            className="flex-1 bg-slate-100 border-0 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={loading || !input.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ─── FAQ Tab ─── */}
                        {activeTab === 'faq' && (
                            <div className="flex-1 overflow-y-auto">
                                <div className="p-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            value={faqSearch}
                                            onChange={e => setFaqSearch(e.target.value)}
                                            placeholder="Search FAQs..."
                                            className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="px-3 pb-3 space-y-3">
                                    {filteredFAQs.map(cat => (
                                        <div key={cat.category}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">{cat.category}</p>
                                            <div className="space-y-1">
                                                {cat.questions.map(q => {
                                                    const isExpanded = expandedQ === q.q;
                                                    return (
                                                        <div key={q.q} className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                                                            <button
                                                                onClick={() => setExpandedQ(isExpanded ? null : q.q)}
                                                                className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                                            >
                                                                {isExpanded
                                                                    ? <ChevronDown className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                                    : <ChevronRight className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                                }
                                                                <span>{q.q}</span>
                                                            </button>
                                                            {isExpanded && (
                                                                <div className="px-3 pb-3 pl-9 text-[12px] text-slate-600 leading-relaxed border-t border-slate-50 pt-2">
                                                                    {q.a}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredFAQs.length === 0 && (
                                        <p className="text-center text-sm text-slate-400 py-8">No matching FAQs found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── Tickets Tab ─── */}
                        {activeTab === 'tickets' && (
                            <div className="flex-1 overflow-y-auto">
                                {!showNewTicket ? (
                                    <div className="p-3 space-y-3">
                                        <button
                                            onClick={() => setShowNewTicket(true)}
                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                        >
                                            <Plus className="h-4 w-4" />
                                            New Support Ticket
                                        </button>

                                        {tickets.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-400">No tickets yet</p>
                                                <p className="text-xs text-slate-400">Create one to get started</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {tickets.map(t => (
                                                    <div key={t.id} className="border border-slate-100 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <p className="text-[13px] font-semibold text-slate-800 leading-tight">{t.subject}</p>
                                                            {statusBadge(t.status)}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-1.5">{t.description}</p>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <Ticket className="h-3 w-3" />
                                                                {t.id}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(t.createdAt).toLocaleDateString()}
                                                            </span>
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{t.category}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ── New Ticket Form ── */
                                    <div className="p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-800">New Ticket</h4>
                                            <button onClick={() => setShowNewTicket(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Category</label>
                                            <select
                                                value={newCategory}
                                                onChange={e => setNewCategory(e.target.value)}
                                                className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                {TICKET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Subject</label>
                                            <input
                                                value={newSubject}
                                                onChange={e => setNewSubject(e.target.value)}
                                                placeholder="Brief description of your issue"
                                                className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[11px] font-medium text-slate-500">Description</label>
                                                <button
                                                    onClick={handleWriteWithAI}
                                                    disabled={aiWriting || !newSubject.trim()}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm"
                                                >
                                                    {aiWriting ? (
                                                        <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                                                    ) : (
                                                        <><Sparkles className="h-3 w-3" /> Write with AI</>
                                                    )}
                                                </button>
                                            </div>
                                            <textarea
                                                value={newDesc}
                                                onChange={e => setNewDesc(e.target.value)}
                                                placeholder="Describe your issue, or click 'Write with AI'..."
                                                rows={4}
                                                className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSubmitTicket}
                                            disabled={!newSubject.trim() || !newDesc.trim()}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                        >
                                            Submit Ticket
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Floating Button ── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-white group"
                >
                    <Headphones className="h-7 w-7 group-hover:scale-110 transition-transform" />
                </button>
            )}
        </div>
    );
}
