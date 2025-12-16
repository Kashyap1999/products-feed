import { authenticate } from "../shopify.server";
import { generateProductFeed } from "../services/generateProductFeed.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const result = await generateProductFeed({
    admin,
    shop: session.shop,
  });

  return new Response(
    JSON.stringify({
      status: "success",
      message: "Feed generated and products_feed.json uploaded to Shopify Files",
      ...result,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
