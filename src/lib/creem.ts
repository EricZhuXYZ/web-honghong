import { Creem } from "creem";

const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_BASE_URL = process.env.CREEM_BASE_URL;

if (!CREEM_API_KEY) {
  throw new Error("缺少 CREEM_API_KEY 环境变量");
}

export const creem = new Creem({
  apiKey: CREEM_API_KEY,
  serverURL: CREEM_BASE_URL || "https://test-api.creem.io",
});
