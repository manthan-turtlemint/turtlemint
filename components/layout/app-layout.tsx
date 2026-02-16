"use client";

import { User } from "@/types";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

interface AppLayoutProps {
    children: React.ReactNode;
    user: User; // In a real app, we'd fetch this from context/session
}

export function AppLayout({ children, user }: AppLayoutProps) {
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
