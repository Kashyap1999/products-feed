// app/routes/app.flow.generate-feed.jsx

import { authenticate } from "../shopify.server";
import { generateProductFeed } from "../services/generateProductFeed.server";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.flow(request);

  const result = await generateProductFeed({
    admin,
    shop: session.shop,
  });

  return new Response(
    JSON.stringify({
      status: "success",
      productCount: result.productCount,
      fileUrl: result.fileUrl,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
