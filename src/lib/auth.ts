import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for login
const loginSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Validate input
                const result = loginSchema.safeParse(credentials);
                if (!result.success) {
                    return null;
                }

                const { email, password } = result.data;

                // Find user
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    return null;
                }

                // Verify password
                const isValid = await compare(password, user.password);
                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id ?? "";
                token.role = user.role ?? "VIEWER";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
});

// Type augmentation for session
declare module "next-auth" {
    interface User {
        role?: string;
    }
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            role: string;
        };
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        role: string;
    }
}
