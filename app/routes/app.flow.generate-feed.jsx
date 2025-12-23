// app/routes/app.flow.generate-feed.jsx

import { authenticate } from "../shopify.server";
import { generateProductFeed } from "../services/generateProductFeed.server";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.flow(request);

  const result = await generateProductFeed({
    admin,
    shop: session.shop,
  });

  console.log("Product feed generated successfully. Product count:", result.productCount, "File URL:", result.fileUrl);

  return new Response(
    JSON.stringify({
      return_value: {
        productCount: result.productCount,
        fileUrl: result.fileUrl,
      },
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
