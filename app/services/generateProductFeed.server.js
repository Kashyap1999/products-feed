// app/services/generateProductFeed.server.js

import { uploadJsonToShopifyFiles } from "../utils/uploadJsonToFiles.server";

/**
 * Generate product feed and upload to Shopify Files
 * Reusable by loader, action, Flow, cron, webhook, etc.
 */
export async function generateProductFeed({ admin, shop }) {
  let products = [];
  let cursor = null;

  try {
    /* ------------------ FETCH PRODUCTS ------------------ */
    while (true) {
      const res = await admin.graphql(
        `
        query GetProducts($cursor: String) {
          products(first: 250, after: $cursor) {
            edges {
              node {
                handle
                title
                descriptionHtml
                productType
                featuredImage { url }
                variants(first: 1) {
                  edges {
                    node {
                      sku
                      price
                      compareAtPrice
                    }
                  }
                }
                metafield(namespace: "custom", key: "race") {
                  value
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
        `,
        { variables: { cursor } }
      );

      const data = await res.json();
      const productData = data?.data?.products;

      if (!productData) {
        throw new Error("Failed to fetch products from Shopify");
      }

      products.push(...productData.edges.map(e => e.node));

      if (!productData.pageInfo.hasNextPage) break;
      cursor = productData.pageInfo.endCursor;
    }

    /* ------------------ MAP FEED ------------------ */
    const feed = products.map(p => {
      const v = p.variants.edges[0]?.node || {};

      return {
        Sku: v.sku || "",
        Title: p.title,
        Image: p.featuredImage?.url || "",
        Intro: p.descriptionHtml || "",
        Price: v.price || "",
        SpecialPrice: v.compareAtPrice || "",
        Link: `https://${shop}/products/${p.handle}`,
        Kategori: p.productType || "",
        Race: p.metafield?.value || "",
      };
    });

    /* ------------------ UPLOAD FILE ------------------ */
    const feedJson = JSON.stringify(feed);
    const file = await uploadJsonToShopifyFiles(admin, feedJson);

    return {
      productCount: feed.length,
      fileUrl: file.url,
    };
  } catch (error) {
    console.error("Generate Product Feed Error:", error);
    throw error;
  }
}
