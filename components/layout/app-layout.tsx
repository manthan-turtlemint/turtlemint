"use client";

import { User } from "@/types";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

interface AppLayoutProps {
    children: React.ReactNode;
    user: User | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
    if (!user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-muted/40">
            <Sidebar userRole={user.role} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <TopNav user={user} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
