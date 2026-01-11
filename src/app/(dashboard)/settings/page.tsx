"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, User, Lock, Mail, Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Profile State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dob, setDob] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Account State
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUser(user);
            setEmail(user.email || "");

            // Fetch profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFirstName(profile.first_name || "");
                setLastName(profile.last_name || "");
                setDob(profile.date_of_birth || "");
                setAvatarUrl(profile.avatar_url || "");
            }
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const updates = {
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                date_of_birth: dob,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            setMessage({ text: "Profile updated successfully!", type: "success" });
        } catch (error: any) {
            setMessage({ text: error.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ text: "Passwords do not match", type: "error" });
            setSaving(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage({ text: "Password updated successfully!", type: "success" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setMessage({ text: error.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ email: email });
            if (error) throw error;
            setMessage({ text: "Confirmation email sent to new address!", type: "success" });
        } catch (error: any) {
            setMessage({ text: error.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );

    return (
        <div className="space-y-8">
            <PageHeader
                icon={Settings}
                iconColor="blue"
                title="Account Settings"
                description="Manage your profile and security preferences"
            />

            <Tabs defaultValue="profile" className="w-full max-w-4xl">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="profile">Profile Details</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Status Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {message.text}
                    </div>
                )}

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card className="glass-card p-6 md:p-8">
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Avatar */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-xl overflow-hidden relative group">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-muted-foreground" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center max-w-[150px]">
                                        Profile picture URL (Upload feature coming soon)
                                    </p>
                                </div>

                                {/* Fields */}
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dob">Date of Birth</Label>
                                        <Input
                                            id="dob"
                                            type="date"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            className="h-11 md:w-1/2"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                                        <Input
                                            id="avatarUrl"
                                            placeholder="https://..."
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={saving} className="bg-primary min-w-[140px]">
                                    {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    {/* Email */}
                    <Card className="glass-card p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Email Address</h3>
                                <p className="text-sm text-muted-foreground">Update your login email</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label>Current Email</Label>
                                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                            </div>
                            <Button type="submit" disabled={saving} variant="outline">Update Email</Button>
                        </form>
                    </Card>

                    {/* Password */}
                    <Card className="glass-card p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Password</h3>
                                <p className="text-sm text-muted-foreground">Ensure your account is secure</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="newPass">New Password</Label>
                                <Input
                                    id="newPass"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPass">Confirm Password</Label>
                                <Input
                                    id="confirmPass"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="pt-2">
                                <Button type="submit" disabled={saving || !newPassword} className="bg-primary">
                                    Change Password
                                </Button>
                            </div>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
