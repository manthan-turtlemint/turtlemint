import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const setupKey = searchParams.get("key");
    const email = searchParams.get("email");
    const password = searchParams.get("password");

    // Basic security check
    if (setupKey !== "initialize-bonddesk-2024") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: "admin",
                isApproved: true,
            },
            create: {
                email,
                name: "System Admin",
                password: hashedPassword,
                role: "admin",
                isApproved: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Admin account ${email} is ready.`,
            action: "Go to /login and use these credentials."
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
