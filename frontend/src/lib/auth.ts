import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Auto-login: everyone gets a default anonymous session
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {},
      async authorize() {
        return {
          id: "anon:1",
          name: "User",
          email: "user@tellmenow.app",
          image: null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "anon:1";
      return session;
    },
  },
});
