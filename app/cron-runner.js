import cron from "node-cron";
import { runShopSyncJob } from "./jobs/shopSync.server.js";

console.log("⏰ Cron runner started");

cron.schedule("0 1 * * *", async () => {
  try {
    console.log("⏰ Hourly shop sync started");
    await runShopSyncJob();
    console.log("✅ Hourly shop sync finished");
  } catch (error) {
    console.error("❌ Hourly shop sync failed", error);
  }
});
