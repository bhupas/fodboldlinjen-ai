import { Card } from "@/components/ui/card";
import { Users, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-purple-500" />
                        System Administration
                    </h1>
                    <p className="text-gray-400 mt-1">Manage platform settings and users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/users">
                    <Card className="glass-panel p-6 hover:bg-white/5 transition-all cursor-pointer group border-0 bg-black/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">User Management</h3>
                                <p className="text-sm text-gray-400">Manage users, roles and permissions</p>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
