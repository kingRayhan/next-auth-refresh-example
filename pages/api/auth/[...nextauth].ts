import axios from "axios";
import NextAuth, { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  debug: true,
  secret: "supersecretkeyyoushouldnotcommittogithub",
  // https://next-auth.js.org/configuration/providers/oauth
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      type: "credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "jsmith",
          value: "example@example.com",
        },
        password: { label: "Password", type: "password", value: "pa$$word" },
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        try {
          const {
            data: { token },
          } = await axios.post(
            "https://dummy-jwt-refresh-token-api.vercel.app/auth/login",
            credentials
          );

          return token;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  theme: {
    colorScheme: "light",
  },
  jwt: {
    encode({ token }) {
      return Promise.resolve(JSON.stringify(token));
    },
    decode({ token }) {
      return new Promise((resolve, reject) => {
        resolve(token ? JSON.parse(token) : null);
      });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      return user?.accessToken ? user : token;
    },
    async session({ session, token, user }) {
      console.log("session/token", { ...token });
      console.log("session/session", { ...session });
      try {
        const { data } = await axios.get(
          "https://dummy-jwt-refresh-token-api.vercel.app/auth/me",
          {
            headers: { Authorization: `Bearer ${token?.accessToken}` },
          }
        );

        const _session: Session = {
          ...session,
          user: data?.data,
        };
        return _session;
      } catch (error) {
        console.log("Access token expired. Refreshing...");
        const { data: _refreshed } = await axios.post(
          "https://dummy-jwt-refresh-token-api.vercel.app/auth/refresh",
          {},
          {
            headers: { Authorization: `Bearer ${token?.refreshToken}` },
          }
        );

        const { data: _refreshedUser } = await axios.get(
          "https://dummy-jwt-refresh-token-api.vercel.app/auth/me",
          {
            headers: {
              Authorization: `Bearer ${_refreshed.token.accessToken}`,
            },
          }
        );

        console.log("Refreshed user", _refreshedUser);

        const _session: Session = {
          ...session,
          // accessToken: _refreshed.accessToken,
          // refreshToken: _refreshed.refreshToken,
          user: _refreshedUser?.data,
        };

        return _session;
      }
    },
  },
};

export default NextAuth(authOptions);
