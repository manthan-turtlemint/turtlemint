import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    Settings,
    Users,
    ShieldCheck,
    FileClock,
} from "lucide-react";
import { UserRole } from "@/types";

interface SidebarProps {
    userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();

    const links = [
        {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            roles: ["admin", "underwriter", "risk_manager"],
        },
        {
            href: "/applications/new",
            label: "New Application",
            icon: PlusCircle,
            roles: ["underwriter", "admin", "broker"],
        },
        {
            href: "/applications",
            label: "Applications",
            icon: FileText,
            roles: ["admin", "underwriter", "risk_manager"],
        },
        {
            href: "/admin/rules",
            label: "Rules & Scoring",
            icon: ShieldCheck,
            roles: ["admin"],
        },
        {
            href: "/admin/users",
            label: "Users & Roles",
            icon: Users,
            roles: ["admin"],
        },
        {
            href: "/audit-logs",
            label: "Audit Logs",
            icon: FileClock,
            roles: ["admin", "risk_manager"],
        },
        {
            href: "/settings",
            label: "Settings",
            icon: Settings,
            roles: ["admin", "underwriter"],
        },
    ];

    const filteredLinks = links.filter((link) => link.roles.includes(userRole));

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card">
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="relative h-12 w-48">
                        <Image
                            src="/logo.png"
                            alt="Turtlemint BondDesk"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {filteredLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    pathname === link.href || pathname?.startsWith(link.href + "/")
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
