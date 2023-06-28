import { shopifyApi } from "@shopify/shopify-api";
import "dotenv/config";

const isDev = process.env.NODE_ENV === "dev";

// Setup Shopify configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_API_SCOPES,
  hostName: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  hostScheme: "https",
  apiVersion: "2023-04",
  isEmbeddedApp: true,
  logger: { level: isDev ? 3 : 0 }, //Error = 0,Warning = 1,Info = 2,Debug = 3
});
export default shopify;
