"use client";

import { Card } from "@/components/ui/card";
import { Users, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <PageHeader
                icon={Shield}
                iconColor="purple"
                title="System Administration"
                description="Manage platform settings and users"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/users">
                    <Card className="glass-card p-6 hover:bg-accent/50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                <Users size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    User Management
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Manage users, roles and permissions
                                </p>
                            </div>
                            <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
