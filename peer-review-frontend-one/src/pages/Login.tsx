import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PersonRegular } from '@fluentui/react-icons';

export default function Login({ onLogin }: { onLogin: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use mock verification or call API
        // Simple mock auth with whitespace trimming
        if (username.trim().toLowerCase() === 'admin' && password.trim() === 'admin123') {
            onLogin();
        } else {
            alert('Invalid credentials. Please use: admin / admin123');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-xl text-primary-600">Enter Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 font-medium"
                        >
                            Sign In
                        </button>

                        {/* Quick Login for Demo */}
                        <div className="pt-4 border-t border-slate-200 mt-4">
                            <p className="text-xs text-slate-400 text-center mb-3">Quick Login (Demo Mode)</p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    type="button"
                                    onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <PersonRegular className="text-xs text-slate-400" />
                                    admin / admin123
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center mt-2">Click to auto-fill, then Sign In</p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
