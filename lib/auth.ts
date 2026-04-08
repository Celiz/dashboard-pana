import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import prisma from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        username()
    ],
    // Remove the need to manually pass email when using username. Optional but useful
    user: {
      additionalFields: {
        localId: {
          type: "string",
          required: false
        }
      }
    }
});
