"use client";

import { User } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShieldCheck, User as UserIcon, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface TopNavProps {
    user: User;
}

export function TopNav({ user }: TopNavProps) {
    const { setRole } = useAppStore();

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
            <div className="flex-1">
                <h1 className="text-lg font-semibold md:text-xl capitalize">
                    BondDesk: {user.role} View
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1 px-2 rounded-md transition-colors">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-blue-600 font-bold capitalize">
                                    {user.role} Access
                                </span>
                            </div>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                                    {user.role.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Switch Perspective</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setRole("admin")}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                                <span>Administrator</span>
                            </div>
                            {user.role === "admin" && <Check className="h-4 w-4 text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setRole("underwriter")}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
                                <span>Underwriter</span>
                            </div>
                            {user.role === "underwriter" && <Check className="h-4 w-4 text-green-600" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
