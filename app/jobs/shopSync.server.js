import prisma from "../db.server.js";
import { unauthenticated } from "../shopify.server.js";
import { generateProductFeed } from "../services/generateProductFeed.server.js";

export async function runShopSyncJob() {
  console.log("Shop Sync Job started:", new Date().toISOString());

  const sessions = await prisma.session.findMany();
  for (const session of sessions) {
    try {
      // Create Admin API client
      const adminClient = await unauthenticated.admin(session.shop);

      // Wrap it so generateProductFeed can call admin.graphql()
      const admin = {
        graphql: adminClient.admin.graphql.bind(adminClient.admin),
      };

      // Call your feed generator
      const result = await generateProductFeed({
        admin,
        shop: session.shop,
      });

      console.log(`Feed generated for ${session.shop}`, result);
    } catch (error) {
      console.error(
        `Failed to generate feed for ${session.shop}`,
        error
      );
    }
  }

  console.log("Shop Sync Job finished");
}
