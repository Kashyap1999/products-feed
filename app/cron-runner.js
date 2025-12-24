import { runShopSyncJob } from "./jobs/shopSync.server.js";

console.log("⏰ Cron runner started");

export default async function start() {
  // run once immediately
  // await runShopSyncJob();

  // run every 5 minutes
  setInterval(async () => {
    try {
      console.log("⏰ Running scheduled shop sync...");
      await runShopSyncJob();
    } catch (error) {
      console.error("❌ Cron job failed", error);
    }
  }, 1000 * 60 * 5); // 5 minutes
}
