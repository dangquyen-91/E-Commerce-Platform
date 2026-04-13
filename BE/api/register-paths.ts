/**
 * Register path aliases for Vercel serverless.
 * Must be imported first - @vercel/node does not resolve @/ paths at build time.
 */
import * as path from "path";
import { register } from "tsconfig-paths";

const baseUrl = path.join(__dirname, "..", "src");
register({ baseUrl, paths: { "@/*": ["*"] } });
