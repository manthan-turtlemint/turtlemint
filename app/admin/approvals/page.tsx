import { getServerSession } from "next-auth";
export const dynamic = "force-dynamic";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { revalidatePath } from "next/cache";

export default async function AdminApprovalsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/");
    }

    const pendingUsers = await prisma.user.findMany({
        where: { isApproved: false },
        orderBy: { email: "asc" },
    });

    const approvedUsers = await prisma.user.findMany({
        where: { isApproved: true },
        orderBy: { email: "asc" },
    });

    async function approveUser(formData: FormData) {
        "use server";
        const email = formData.get("email") as string;
        await prisma.user.update({
            where: { email },
            data: { isApproved: true },
        });
        revalidatePath("/admin/approvals");
    }

    async function revokeAccess(formData: FormData) {
        "use server";
        const email = formData.get("email") as string;
        // Don't revoke own access
        if (email === session?.user?.email) return;

        await prisma.user.update({
            where: { email },
            data: { isApproved: false },
        });
        revalidatePath("/admin/approvals");
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">User Access Management</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Pending Approvals
                        <Badge variant="outline">{pendingUsers.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingUsers.length === 0 ? (
                        <p className="text-slate-500 py-4 text-center italic">No pending requests</p>
                    ) : (
                        <div className="divide-y">
                            {pendingUsers.map((user: any) => (
                                <div key={user.id} className="py-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">{user.name}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                    </div>
                                    <form action={approveUser}>
                                        <input type="hidden" name="email" value={user.email || ""} />
                                        <Button size="sm">Approve</Button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Active Users
                        <Badge variant="secondary">{approvedUsers.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {approvedUsers.map((user: any) => (
                            <div key={user.id} className="py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {user.name} {user.email === session?.user?.email && <Badge className="ml-2">You</Badge>}
                                    </p>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                    <Badge variant="outline" className="mt-1 capitalize">{user.role}</Badge>
                                </div>
                                {user.email !== session?.user?.email && (
                                    <form action={revokeAccess}>
                                        <input type="hidden" name="email" value={user.email || ""} />
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Revoke</Button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
