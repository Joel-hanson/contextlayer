import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

// Extend the built-in session types
declare module "next-auth" {
    interface User {
        username?: string;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name?: string;
            image?: string;
            username?: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        username?: string;
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET, // Fail if not set - no fallback
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                username: { label: "Username", type: "text" },
                isSignUp: { label: "Is Sign Up", type: "hidden" },
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    throw new Error("Email is required");
                }

                const isSignUp = credentials.isSignUp === "true";

                if (isSignUp) {
                    // // Sign up flow
                    // if (!credentials.password || !credentials.username) {
                    //     throw new Error("Username and password are required for sign up");
                    // }

                    // // Check if user already exists
                    // const existingUser = await prisma.user.findFirst({
                    //     where: {
                    //         OR: [
                    //             { email: credentials.email },
                    //             { username: credentials.username },
                    //         ],
                    //     },
                    // });

                    // if (existingUser) {
                    //     throw new Error("User already exists with this email or username");
                    // }

                    // // Hash password
                    // const hashedPassword = await bcrypt.hash(credentials.password, 12);

                    // // Create new user
                    // const user = await prisma.user.create({
                    //     data: {
                    //         email: credentials.email,
                    //         username: credentials.username,
                    //         name: credentials.username,
                    //         password: hashedPassword,
                    //     },
                    // });

                    // // Create default user settings
                    // await prisma.userSettings.create({
                    //     data: {
                    //         userId: user.id,
                    //         displayName: credentials.username,
                    //     },
                    // });

                    // return {
                    //     id: user.id,
                    //     email: user.email,
                    //     name: user.name,
                    //     username: user.username || undefined,
                    // };
                    throw new Error("New account creation is temporarily disabled. Please sign in with Google to create an account.");
                } else {
                    // Sign in flow
                    if (!credentials.password) {
                        throw new Error("Password is required");
                    }

                    // Find user by email or username
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { email: credentials.email },
                                { username: credentials.email }, // Allow login with username in email field
                            ],
                        },
                    });

                    if (!user || !user.password) {
                        throw new Error("Invalid credentials");
                    }

                    // Check password
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        throw new Error("Invalid credentials");
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        username: user.username || undefined,
                    };
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.username = user.username;
                token.sub = user.id.padEnd(32, '0');
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
                session.user.username = token.username;
            }
            return session;
        },
        async signIn({ user, account }) {
            // Handle Google OAuth sign-in
            if (account?.provider === "google") {
                try {
                    // Format the UUID to ensure it's the correct length
                    const formattedUserId = user.id.padEnd(32, '0');

                    // Use upsert to atomically check and create settings in one query
                    await prisma.userSettings.upsert({
                        where: { userId: formattedUserId },
                        create: {
                            userId: formattedUserId,
                            displayName: user.name || user.email?.split("@")[0] || "User",
                        },
                        update: {} // No update needed if exists
                    });
                } catch (error) {
                    console.error("Error handling user settings:", error);
                    // Don't block sign-in if settings creation fails
                }
            }
            return true;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
};
