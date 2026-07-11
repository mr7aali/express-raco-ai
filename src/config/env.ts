import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().default("sk_test_your_stripe_secret_key"),
  STRIPE_WEBHOOK_SECRET: z.string().default("whsec_your_stripe_webhook_secret"),
  STRIPE_CURRENCY: z.string().trim().toLowerCase().default("usd"),
  BKASH_BASE_URL: z.string().url().default("https://tokenized.sandbox.bka.sh/v1.2.0-beta"),
  BKASH_APP_KEY: z.string().default("your_bkash_app_key"),
  BKASH_APP_SECRET: z.string().default("your_bkash_app_secret"),
  BKASH_USERNAME: z.string().default("your_bkash_username"),
  BKASH_PASSWORD: z.string().default("your_bkash_password"),
  BKASH_CALLBACK_URL: z.string().url().default("http://localhost:5000/api/payments/bkash/callback"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`);
}

export const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  jwtExpiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  stripeSecretKey: parsedEnv.data.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnv.data.STRIPE_WEBHOOK_SECRET,
  stripeCurrency: parsedEnv.data.STRIPE_CURRENCY,
  bkashBaseUrl: parsedEnv.data.BKASH_BASE_URL,
  bkashAppKey: parsedEnv.data.BKASH_APP_KEY,
  bkashAppSecret: parsedEnv.data.BKASH_APP_SECRET,
  bkashUsername: parsedEnv.data.BKASH_USERNAME,
  bkashPassword: parsedEnv.data.BKASH_PASSWORD,
  bkashCallbackUrl: parsedEnv.data.BKASH_CALLBACK_URL,
};
