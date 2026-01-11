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
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Pencil, Trash2, Shield, Search, UserPlus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FilterPanel, FilterRow } from "@/components/ui/filter-panel";
import { ComboSelect } from "@/components/ui/combo-select";

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
    const [roleFilter, setRoleFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editRole, setEditRole] = useState("user");
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editDob, setEditDob] = useState("");
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
                body: JSON.stringify({
                    id: selectedUser.id,
                    role: editRole,
                    first_name: editFirstName,
                    last_name: editLastName,
                    date_of_birth: editDob
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");
            setUsers(users.map(u => u.id === selectedUser.id ? {
                ...u,
                role: editRole,
                first_name: editFirstName,
                last_name: editLastName,
                // Assuming backend doesn't return updated profile object in list view immediately, we optimistic update
                // But simplified:
                // ...data 
            } : u));
            // Re-fetch to be safe or update state properly
            fetchUsers();
            setIsEditDialogOpen(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = !search ||
            (u.email?.toLowerCase().includes(search.toLowerCase())) ||
            (u.first_name?.toLowerCase().includes(search.toLowerCase())) ||
            (u.last_name?.toLowerCase().includes(search.toLowerCase()));

        const matchesRole = roleFilter === "all" || u.role === roleFilter;

        return matchesSearch && matchesRole;
    }).sort((a, b) => {
        if (sortBy === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'name') {
            const nameA = a.first_name || a.email;
            const nameB = b.first_name || b.email;
            return nameA.localeCompare(nameB);
        }
        return 0;
    });

    const userOptions = users.map(u => ({
        label: `${u.first_name || ''} ${u.last_name || ''} (${u.email})`.trim(),
        value: u.email // Using email for search as it's unique enough for UI selection usually, or we can use ID if ComboSelect supports unique values well.
    }));

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
            coach: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
            user: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        };
        return styles[role] || styles.user;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <PageHeader
                icon={Users}
                iconColor="orange"
                title="User Management"
                description="Manage system access and roles"
            />

            {/* Filter Panel */}
            <FilterPanel>
                <FilterRow>
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                        <Label className="text-xs text-muted-foreground mb-2 block">Search User</Label>
                        <ComboSelect
                            options={userOptions}
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Select user by name or email"
                            searchPlaceholder="Type to search..."
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-xs text-destructive mt-1 hover:underline text-right w-full block">Clear</button>
                        )}
                    </div>

                    {/* Role Filter */}
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Role</Label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="coach">Coach</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort By */}
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at">📅 Date Joined</SelectItem>
                                <SelectItem value="name">Aa Name</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </FilterRow>
            </FilterPanel>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon={Users}
                    title="Total Users"
                    value={users.length}
                    color="blue"
                />
                <StatCard
                    icon={Shield}
                    title="Admins"
                    value={users.filter(u => u.role === 'admin').length}
                    color="purple"
                />
                <StatCard
                    icon={UserPlus}
                    title="Coaches"
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
                                                setEditFirstName(user.first_name || "");
                                                setEditLastName(user.last_name || "");
                                                setEditDob(user.date_of_birth || (user as any).date_of_birth || ""); // Type fix if generic Profile type is missing dob
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editFirstName">First Name</Label>
                                <Input
                                    id="editFirstName"
                                    value={editFirstName}
                                    onChange={(e) => setEditFirstName(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editLastName">Last Name</Label>
                                <Input
                                    id="editLastName"
                                    value={editLastName}
                                    onChange={(e) => setEditLastName(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editDob">Date of Birth</Label>
                            <Input
                                id="editDob"
                                type="date"
                                value={editDob}
                                onChange={(e) => setEditDob(e.target.value)}
                                className="h-10"
                            />
                        </div>
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
