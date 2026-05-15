import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { env } from "~/env";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${env.DATABASE_PATH}`,
  },
});
