"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Mail, Lock, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dob, setDob] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'signin' | 'signup' | 'forgot_password' | 'confirmation_sent'>('signin');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [honeyPot, setHoneyPot] = useState(""); // Anti-spam hidden field
    const router = useRouter();
    const { theme } = useTheme();

    const isValidEmail = (email: string) => {
        // Basic pattern check
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!pattern.test(email)) return false;

        // Block obvious dummy domains that cause high bounce rates
        const blockedDomains = ['example.com', 'test.com', 'demo.com', 'foobar.com', 'yourdomain.com'];
        const domain = email.split('@')[1];
        if (blockedDomains.includes(domain)) return false;

        return true;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Anti-bot check
        if (honeyPot) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const { error, data } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setMessage({ text: error.message, type: 'error' });
                setIsLoading(false);
            } else {
                // Successful login
                router.refresh();
                router.push("/home");
            }
        } catch (err) {
            console.error("Login error:", err);
            setMessage({ text: "An unexpected error occurred", type: 'error' });
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Anti-bot check
        if (honeyPot) {
            // Fake success to fool bots
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setView('confirmation_sent');
            }, 1000);
            return;
        }

        // Pre-validation to prevent Supabase Bounces
        if (!isValidEmail(email)) {
            setMessage({ text: "Please enter a valid, real email address.", type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    date_of_birth: dob
                }
            }
        });
        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setView('confirmation_sent');
        }
        setIsLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (honeyPot) return;

        if (!isValidEmail(email)) {
            setMessage({ text: "Please enter a valid, real email address.", type: 'error' });
            return;
        }

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
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Decoration */}
            {theme === 'dark' ? (
                <BackgroundBeams className="opacity-40" />
            ) : (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-100/50 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
            )}

            {/* Back to Home Link */}
            <Link href="/" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors z-20">
                <ArrowLeft size={16} />
                Back to Home
            </Link>

            <Card className="w-full max-w-[440px] p-10 glass-card relative z-10 shadow-2xl">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse-glow">
                        <Sparkles className="text-white w-8 h-8" />
                    </div>
                </div>

                {view === 'confirmation_sent' ? (
                    <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Check your inbox</h2>
                            <p className="text-muted-foreground">
                                We've sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Please click the link to verify your account and access the platform.
                            </p>
                        </div>
                        <Button
                            className="w-full btn-premium"
                            onClick={() => setView('signin')}
                        >
                            Back to Sign In
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                                {view === 'signin' ? "Welcome Back" : view === 'signup' ? "Join the Elite" : "Reset Password"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {view === 'signin' ? "Sign in to access your tactical dashboard" :
                                    view === 'signup' ? "Create an account to start analyzing" :
                                        "Enter your email to receive a reset link"
                                }
                            </p>
                        </div>

                        <div className="space-y-5">
                            {/* Status Message */}
                            {message && (
                                <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${message.type === 'success'
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-300 border border-green-500/20'
                                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={
                                view === 'signin' ? handleLogin :
                                    view === 'signup' ? handleSignUp :
                                        handleForgotPassword
                            } className="space-y-5">

                                {/* Honeypot - Hidden from humans */}
                                <input
                                    type="text"
                                    name="confirm_website"
                                    className="hidden pointer-events-none absolute opacity-0"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={honeyPot}
                                    onChange={(e) => setHoneyPot(e.target.value)}
                                />

                                {view === 'signup' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="font-medium text-sm">First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="font-medium text-sm">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label htmlFor="dob" className="font-medium text-sm">Date of Birth</Label>
                                            <Input
                                                id="dob"
                                                type="date"
                                                value={dob}
                                                onChange={(e) => setDob(e.target.value)}
                                                className="h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-medium text-sm">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="coach@club.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-12 h-12 rounded-xl transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {view !== 'forgot_password' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="password" className="font-medium text-sm">Password</Label>
                                            {view === 'signin' && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                                                    onClick={() => setView('forgot_password')}
                                                >
                                                    Forgot password?
                                                </button>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            showStrength={view === 'signup'}
                                            required
                                        />
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 btn-premium text-base font-semibold"
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

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Switch View */}
                        <div className="text-center text-sm text-muted-foreground">
                            {view === 'signin' && (
                                <p>
                                    New to myaitrainer?{" "}
                                    <button onClick={() => setView('signup')} className="text-primary hover:text-primary/80 font-medium transition-colors">
                                        Create an account
                                    </button>
                                </p>
                            )}
                            {(view === 'signup' || view === 'forgot_password') && (
                                <p>
                                    Already have an account?{" "}
                                    <button onClick={() => setView('signin')} className="text-primary hover:text-primary/80 font-medium transition-colors">
                                        Sign in
                                    </button>
                                </p>
                            )}
                        </div>
                    </>
                )}
            </Card >
        </div >
    );
}
