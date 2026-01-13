"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, User, Lock, Mail, Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
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
    const [originalEmail, setOriginalEmail] = useState("");
    const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
    const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState("");
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
            setOriginalEmail(user.email || "");

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

        // Validate current password is provided
        if (!currentPasswordForPassword) {
            setMessage({ text: "Please enter your current password", type: "error" });
            setSaving(false);
            return;
        }

        // Validate new passwords match
        if (newPassword !== confirmPassword) {
            setMessage({ text: "New passwords do not match", type: "error" });
            setSaving(false);
            return;
        }

        // Validate password length
        if (newPassword.length < 6) {
            setMessage({ text: "New password must be at least 6 characters", type: "error" });
            setSaving(false);
            return;
        }

        try {
            // First, verify current password by re-authenticating
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: originalEmail,
                password: currentPasswordForPassword
            });

            if (signInError) {
                setMessage({ text: "Current password is incorrect", type: "error" });
                setSaving(false);
                return;
            }

            // Now update to new password
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setMessage({ text: "Password updated successfully! Signing out...", type: "success" });

            // Clear fields
            setCurrentPasswordForPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Sign out and redirect after a short delay
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push("/login?message=Password updated. Please log in with your new password.");
            }, 1500);

        } catch (error: any) {
            setMessage({ text: error.message, type: "error" });
            setSaving(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        // Validate current password is provided
        if (!currentPasswordForEmail) {
            setMessage({ text: "Please enter your current password to verify your identity", type: "error" });
            setSaving(false);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage({ text: "Please enter a valid email address", type: "error" });
            setSaving(false);
            return;
        }

        // Check if email has changed
        if (email.toLowerCase() === originalEmail.toLowerCase()) {
            setMessage({ text: "Please enter a different email address", type: "error" });
            setSaving(false);
            return;
        }

        try {
            // First, verify current password by re-authenticating
            // Note: This refreshes the session
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: originalEmail,
                password: currentPasswordForEmail
            });

            if (signInError) {
                setMessage({ text: "Current password is incorrect", type: "error" });
                setSaving(false);
                return;
            }

            // Now update email
            const { error } = await supabase.auth.updateUser({
                email: email
            });

            if (error) throw error;

            setMessage({
                text: "Confirmation email sent! Signing out...",
                type: "success"
            });
            setCurrentPasswordForEmail("");

            // Sign out and redirect after a short delay
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push("/login?message=Please check your email to confirm the address change. You will need to log in again.");
            }, 2000);

        } catch (error: any) {
            // Provide more user-friendly error messages
            let errorMessage = error.message;
            if (error.message.includes("already registered")) {
                errorMessage = "This email is already registered to another account";
            } else if (error.message.includes("rate limit")) {
                errorMessage = "Too many requests. Please wait a few minutes before trying again.";
            } else if (error.message.includes("security purposes")) {
                errorMessage = "For security, you need to re-login before changing your email.";
            }
            setMessage({ text: errorMessage, type: "error" });
            setSaving(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const processImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                // Target dimensions
                const TARGET_SIZE = 256;
                canvas.width = TARGET_SIZE;
                canvas.height = TARGET_SIZE;

                // Calculate styling for center crop
                const minScale = Math.max(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
                const width = img.width * minScale;
                const height = img.height * minScale;
                const x = (TARGET_SIZE - width) / 2;
                const y = (TARGET_SIZE - height) / 2;

                ctx.drawImage(img, x, y, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to compress image"));
                    }
                }, 'image/jpeg', 0.8); // 80% quality JPEG
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setSaving(true);
        setMessage(null);

        try {
            // Compress and resize image
            const processedBlob = await processImage(file);

            // Create a new File object from the blob for upload
            const processedFile = new File([processedBlob], "avatar.jpg", { type: "image/jpeg" });

            const fileName = `${user.id}-${Date.now()}.jpg`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, processedFile);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Update profile immediately
            const updates = {
                id: user.id,
                avatar_url: publicUrl,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase.from('profiles').upsert(updates);
            if (updateError) throw updateError;

            setMessage({ text: "Profile picture updated!", type: "success" });

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
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <div
                                        onClick={handleAvatarClick}
                                        className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-xl overflow-hidden relative group cursor-pointer"
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-muted-foreground" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center max-w-[150px]">
                                        Click to upload new picture
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
                                <Label className="text-muted-foreground">Current Email</Label>
                                <p className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-lg border border-border">
                                    {originalEmail}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newEmail">New Email Address</Label>
                                <Input
                                    id="newEmail"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter new email address"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currentPasswordEmail">Current Password</Label>
                                <Input
                                    id="currentPasswordEmail"
                                    type="password"
                                    value={currentPasswordForEmail}
                                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                                    placeholder="Enter your current password"
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Required to verify your identity before changing email.
                                </p>
                            </div>
                            <Button
                                type="submit"
                                disabled={saving || email.toLowerCase() === originalEmail.toLowerCase() || !email || !currentPasswordForEmail}
                                variant="outline"
                            >
                                {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Update Email
                            </Button>
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
                                <Label htmlFor="currentPass">Current Password</Label>
                                <Input
                                    id="currentPass"
                                    type="password"
                                    value={currentPasswordForPassword}
                                    onChange={(e) => setCurrentPasswordForPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPass">New Password</Label>
                                <Input
                                    id="newPass"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 characters)"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPass">Confirm New Password</Label>
                                <Input
                                    id="confirmPass"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="h-11"
                                />
                            </div>
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={saving || !currentPasswordForPassword || !newPassword || !confirmPassword}
                                    className="bg-primary"
                                >
                                    {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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
