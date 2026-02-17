import NextAuth, { NextAuthOptions } from "next-auth";
export const runtime = "nodejs";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;
            const adminEmail = process.env.ADMIN_EMAIL || "manthan.varghese@turtlemint.com";

            const isGmail = user.email.endsWith("@gmail.com");
            const isAdmin = user.email === adminEmail;

            if (!isGmail && !isAdmin) return false;

            // Check if user exists. If not, allow creation by returning true.
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (!dbUser) return true;
            return dbUser.isApproved || user.email === adminEmail;
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
    events: {
        async createUser({ user }) {
            const adminEmail = process.env.ADMIN_EMAIL || "manthan.varghese@turtlemint.com";
            if (user.email === adminEmail) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isApproved: true, role: "admin" },
                });
            }
        }
    },
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
    debug: process.env.NODE_ENV !== "production" || true, // Force true for now to see live logs
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
