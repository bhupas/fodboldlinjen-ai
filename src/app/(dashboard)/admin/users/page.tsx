"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DataTable,
    DataTableHeader,
    DataTableHead,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableEmpty,
    DataTableLoading
} from "@/components/ui/data-table";
import { MiniStat } from "@/components/ui/stats-display";
import { PageHeader } from "@/components/ui/page-header";
import { Pencil, Trash2, Shield, Search, UserPlus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Profile = {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    created_at: string;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editRole, setEditRole] = useState("user");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setUsers(data || []);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error) setUsers(data || []);
            } catch (fallbackErr) {
                console.error("Fallback failed", fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete");
            setUsers(users.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;
        setUpdating(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedUser.id, role: editRole })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: editRole } : u));
            setIsEditDialogOpen(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.email?.toLowerCase().includes(search.toLowerCase())) ||
        (u.first_name?.toLowerCase().includes(search.toLowerCase())) ||
        (u.last_name?.toLowerCase().includes(search.toLowerCase()))
    );

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
            coach: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
            user: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        };
        return styles[role] || styles.user;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                icon={Users}
                iconColor="blue"
                title="User Management"
                description="Manage system access and roles"
                actions={
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 h-11"
                        />
                    </div>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MiniStat
                    icon={Users}
                    label="Total Users"
                    value={users.length}
                    color="blue"
                />
                <MiniStat
                    icon={Shield}
                    label="Admins"
                    value={users.filter(u => u.role === 'admin').length}
                    color="purple"
                />
                <MiniStat
                    icon={UserPlus}
                    label="Coaches"
                    value={users.filter(u => u.role === 'coach').length}
                    color="green"
                />
            </div>

            {/* Users Table */}
            <DataTable>
                <DataTableHeader>
                    <DataTableHead>User</DataTableHead>
                    <DataTableHead>Email</DataTableHead>
                    <DataTableHead>Role</DataTableHead>
                    <DataTableHead>Joined</DataTableHead>
                    <DataTableHead className="text-right">Actions</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                    {loading ? (
                        <DataTableLoading colSpan={5} message="Loading users..." />
                    ) : filteredUsers.length === 0 ? (
                        <DataTableEmpty colSpan={5} message="No users found." />
                    ) : (
                        filteredUsers.map((user) => (
                            <DataTableRow key={user.id}>
                                <DataTableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                            {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <span>{user.first_name} {user.last_name || ""}</span>
                                        {!user.first_name && !user.last_name && <span className="text-muted-foreground">N/A</span>}
                                    </div>
                                </DataTableCell>
                                <DataTableCell className="text-muted-foreground">{user.email}</DataTableCell>
                                <DataTableCell>
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                </DataTableCell>
                                <DataTableCell className="text-muted-foreground">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </DataTableCell>
                                <DataTableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-xl hover:bg-primary/10 hover:text-primary"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setEditRole(user.role);
                                                setIsEditDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDelete(user.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </DataTableCell>
                            </DataTableRow>
                        ))
                    )}
                </DataTableBody>
            </DataTable>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Edit User Role</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="coach">Coach</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={updating}>
                            {updating ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
