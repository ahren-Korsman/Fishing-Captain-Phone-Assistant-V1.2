import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/lib/models/User";
import connectDB from "@/lib/mongodb";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  url: process.env.NEXTAUTH_URL,
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔍 DEBUG: Credentials authorize called with:", {
          email: credentials?.email,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("🔍 DEBUG: Missing credentials");
          return null;
        }

        try {
          await connectDB();

          // Find user by email
          const user = await User.findByEmail(credentials.email);
          console.log("🔍 DEBUG: User found:", user ? "YES" : "NO");

          if (user) {
            console.log("🔍 DEBUG: User details:", {
              id: user._id.toString(),
              email: user.email,
              provider: user.provider,
              isActive: user.isActive,
            });
          }

          if (!user || !user.isActive) {
            console.log("🔍 DEBUG: User not found or inactive");
            return null;
          }

          // Check if password matches
          const isPasswordValid = await user.comparePassword(
            credentials.password
          );
          console.log("🔍 DEBUG: Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("🔍 DEBUG: Invalid password");
            return null;
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          const userObject = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            provider: user.provider,
            hasActiveSubscription: user.hasActiveSubscription(),
            canAccessPlatform: user.canAccessPlatform(),
            subscriptionStatus: user.subscription.status,
          };

          console.log("🔍 DEBUG: Returning user object:", userObject);
          return userObject;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // If this is the initial sign in, add user info to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.provider = user.provider;
        token.hasActiveSubscription = user.hasActiveSubscription;
        token.canAccessPlatform = user.canAccessPlatform;
        token.subscriptionStatus = user.subscriptionStatus;
      }

      // Always refresh user data from database to get latest subscription status
      if (token.email) {
        try {
          await connectDB();
          const dbUser = await User.findByEmail(token.email);
          if (dbUser) {
            // Check if this is a different user than before
            if (token.id && token.id !== dbUser._id.toString()) {
              console.log(
                "🔍 DEBUG: User switched accounts, clearing old session:",
                token.email
              );
              // Mark token as invalid to force re-authentication
              token.userExists = false;
              return token;
            }

            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.provider = dbUser.provider;
            token.hasActiveSubscription = dbUser.hasActiveSubscription();
            token.canAccessPlatform = dbUser.canAccessPlatform();
            token.subscriptionStatus = dbUser.subscription.status;
            token.userExists = true; // Flag to indicate user exists
          } else {
            // User not found in database - mark for session invalidation
            console.log(
              "🔍 DEBUG: User not found in database, marking for session invalidation:",
              token.email
            );
            token.userExists = false; // Flag to indicate user doesn't exist
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT callback:", error);
          token.userExists = false; // Mark as invalid on error
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Check if user exists in database - if not, return empty session to invalidate
      if (token && token.userExists === false) {
        console.log(
          "🔍 DEBUG: Session callback - user doesn't exist, invalidating session for:",
          token.email
        );
        return {}; // Return empty session object instead of null
      }

      // Add user ID and role to session
      if (session?.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.provider = token.provider;
        session.user.hasActiveSubscription = token.hasActiveSubscription;
        session.user.canAccessPlatform = token.canAccessPlatform;
        session.user.subscriptionStatus = token.subscriptionStatus;

        // Check if user is admin
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        const isEmailAdmin = adminEmails.includes(session.user.email);
        session.user.isAdmin = token.role === "admin" || isEmailAdmin;
      }
      return session;
    },
    async signIn({ user, account }) {
      console.log("🔍 DEBUG: signIn callback called with:", {
        provider: account?.provider,
        userEmail: user?.email,
        userId: user?.id,
      });

      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          await connectDB();

          // Check if user exists in our User collection
          let dbUser = await User.findByEmail(user.email);

          if (!dbUser) {
            // Create new user for Google OAuth
            const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
            const isAdmin = adminEmails.includes(user.email);

            dbUser = new User({
              email: user.email,
              name: user.name,
              provider: "google",
              providerId: account.providerAccountId,
              role: isAdmin ? "admin" : "captain",
              isActive: true,
              lastLogin: new Date(),
            });

            await dbUser.save();
          } else {
            // Update existing user
            dbUser.lastLogin = new Date();
            await dbUser.save();
          }

          // Set the user ID to the MongoDB ObjectId for consistent handling
          user.id = dbUser._id.toString();
          user.role = dbUser.role;
          user.provider = dbUser.provider;
          user.hasActiveSubscription = dbUser.hasActiveSubscription();
          user.canAccessPlatform = dbUser.canAccessPlatform();
          user.subscriptionStatus = dbUser.subscription.status;

          return true;
        } catch (error) {
          console.error("Error handling Google sign-in:", error);
          return false;
        }
      }

      // For credentials provider, user is already validated in authorize
      console.log(
        "🔍 DEBUG: Credentials provider - user already validated, returning true"
      );
      return true;
    },
    async signOut({ token }) {
      console.log(
        "🔍 DEBUG: SignOut callback called, clearing session for:",
        token?.email
      );
      // The session will be automatically cleared by NextAuth
      return true;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        domain: undefined, // Let NextAuth handle domain automatically
      },
    },
  },
};

export default NextAuth(authOptions);
