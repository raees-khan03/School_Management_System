import PusherServer from "pusher";

const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!appId || !key || !secret || !cluster) {
  console.error("⚠️ PUSHER KEYS ARE MISSING IN .env FILE! Please check your environment variables.");
}

export const pusherServer = new PusherServer({
  appId: appId || "",
  key: key || "",
  secret: secret || "",
  cluster: cluster || "ap2",
  useTLS: true,
});