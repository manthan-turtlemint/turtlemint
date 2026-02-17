import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    // SECURITY: This is a nuclear option. In a real app, you'd protect this with a secret key.
    // However, since we are in the initial setup phase and the user needs to get in, we'll use it once.

    try {
        console.log("Nuclear Reset: Starting...");

        // Delete in order
        await prisma.session.deleteMany({});
        await prisma.account.deleteMany({});
        await prisma.user.deleteMany({});

        console.log("Nuclear Reset: Success.");

        return NextResponse.json({
            success: true,
            message: "Database cleared. You can now log in with Google to create a fresh Admin account.",
            action: "Close this tab, go to your homepage, and click Sign In."
        });
    } catch (error: any) {
        console.error("Nuclear Reset Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
