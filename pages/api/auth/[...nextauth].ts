import axios from "axios";
import NextAuth, { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";
// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  debug: true,
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
          } = await axios.post("http://localhost:7550/auth/login", credentials);

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
      console.log("===========");
      console.log("jwt encode");
      console.log(token);
      console.log("===========");

      return Promise.resolve(token);
    },
    decode({ token }) {
      console.log("========");
      console.log("jwt decode");
      console.log(token);
      console.log("=========");
      return new Promise((resolve, reject) => {
        jwt.verify(
          token?.accessToken as string,
          "L8oNQF0pYMXzA20JNYwRmR2RB0BohKgY",
          (err, decoded) => {
            if (decoded) {
              const user = {
                _id: decoded._id,
                name: decoded.name,
                email: decoded.email,
                avatar: decoded?.avatar,
              };
              return resolve(decoded);
            }
            return resolve(null);
          }
        );
      });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("===========");
      console.log("callback jwt");
      console.log(token, user);
      console.log("============");
      return user?.accessToken ? user : token;
    },
    async session({ session, token, user }) {
      console.log("===================================");
      console.log("session");
      console.log(JSON.stringify({ user, token, session }, null, 2));
      console.log("=================================");
      const {
        data: { user: me },
      } = await axios.get("http://localhost:7550/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sess: Session = {
        ...session,
        user: {
          ...me,

          // admin: true,
          // age: 43,
        },
      };

      return sess;
    },
  },
};

export default NextAuth(authOptions);
