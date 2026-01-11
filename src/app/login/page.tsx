"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setMessage({ text: error.message, type: 'error' });
            setIsLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setMessage({ text: "Confirmation email sent! Check your inbox to continue.", type: 'success' });
            setView('signin');
        }
        setIsLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setMessage({ text: "Password reset link sent to your email!", type: 'success' });
            setView('signin');
        }
        setIsLoading(false);
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-[420px] p-8 bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl rounded-2xl relative z-10 text-white">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {view === 'signin' ? "Welcome Back" : view === 'signup' ? "Join the Elite" : "Reset Password"}
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">
                        {view === 'signin' ? "Sign in to access your tactical dashboard" :
                            view === 'signup' ? "Create an account to start analyzing" :
                                "Enter your email to receive a reset link"
                        }
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Status Message */}
                    {message && (
                        <div className={`p-3 rounded-md text-sm text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={
                        view === 'signin' ? handleLogin :
                            view === 'signup' ? handleSignUp :
                                handleForgotPassword
                    } className="space-y-5">

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 font-medium ml-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="coach@club.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 h-12 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all rounded-xl"
                                required
                            />
                        </div>

                        {view !== 'forgot_password' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                                    {view === 'signin' && (
                                        <button
                                            type="button"
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                            onClick={() => setView('forgot_password')}
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black/20 border-white/10 text-white h-12 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all rounded-xl"
                                    required
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_35px_rgba(37,99,235,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                            {view === 'signin' ? "Sign In" :
                                view === 'signup' ? "Create Account" :
                                    "Send Reset Link"
                            }
                        </Button>
                    </form>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                    {view === 'signin' && (
                        <p>
                            New to Fodboldlinjen?{" "}
                            <button onClick={() => setView('signup')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Sign up now
                            </button>
                        </p>
                    )}
                    {(view === 'signup' || view === 'forgot_password') && (
                        <p>
                            Already have an account?{" "}
                            <button onClick={() => setView('signin')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
}
