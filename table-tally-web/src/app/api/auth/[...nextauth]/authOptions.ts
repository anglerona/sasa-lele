import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

// Extend the User type to include 'access' and 'refresh'
declare module "next-auth" {
  interface User {
    access?: string;
    refresh?: string;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function loginWithDjango(username: string, password: string) {
  const { data } = await axios.post(`${API_BASE}/api/token/`, { username, password }, {
    headers: { "Content-Type": "application/json" },
  });
  // data = { access, refresh }
  return data;
}

async function refreshAccessToken(token: any) {
  try {
    const { data } = await axios.post(`${API_BASE}/api/token/refresh/`, { refresh: token.refreshToken }, {
      headers: { "Content-Type": "application/json" },
    });
    return {
      ...token,
      accessToken: data.access,
      accessTokenExpires: Date.now() + 25 * 60 * 1000, // refresh a bit before 30m
    };
  } catch (e) {
    // refresh failed; force re-login
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        try {
          const { access, refresh } = await loginWithDjango(credentials.username, credentials.password);
          // minimal user: NextAuth requires an object
          return { id: credentials.username, name: credentials.username, access, refresh } as any;
        } catch (e) {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.access;
        token.refreshToken = user.refresh;
      }
      return token;
    }
  }
};
