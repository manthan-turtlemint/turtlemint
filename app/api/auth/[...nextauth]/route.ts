import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            const adminEmail = process.env.ADMIN_EMAIL || "manthan.varghese@turtlemint.com";

            // Step 1: Restriction - Gmail accounts OR the specific Admin email
            const isGmail = user.email.endsWith("@gmail.com");
            const isAdmin = user.email === adminEmail;

            if (!isGmail && !isAdmin) {
                console.log("Blocked non-compliant login:", user.email);
                return false;
            }

            // Step 2: Auto-approve Admin (from env)

            // Check if user exists and is approved
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (!dbUser) {
                // New user - create with pending approval unless they are the admin
                const isFirstAdmin = user.email === adminEmail;
                await prisma.user.create({
                    data: {
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        isApproved: isFirstAdmin,
                        role: isFirstAdmin ? "admin" : "underwriter",
                    },
                });

                if (isFirstAdmin) return true;
                return "/pending-approval";
            }

            if (dbUser.isApproved) {
                return true;
            }

            return "/pending-approval";
        },
        async session({ session, user }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = user.id;
                // @ts-ignore
                session.user.role = user.role;
                // @ts-ignore
                session.user.isApproved = user.isApproved;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
