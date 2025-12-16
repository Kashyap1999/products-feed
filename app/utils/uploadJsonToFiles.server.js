/**
 * Upload or update products_feed.json in Shopify Files
 * CDN URL remains CONSISTENT across updates
 */

/**
 * Find existing feed file using Shopify-supported filename search
 */
async function findExistingFeedFile(admin) {
  const res = await admin.graphql(`
    query {
      files(first: 1, query: "filename:products_feed.json") {
        nodes {
          id
          __typename
          ... on GenericFile {
            url
          }
        }
      }
    }
  `);

  const data = await res.json();
  return data.data.files.nodes[0] || null;
}

/**
 * Create staged upload target
 */
async function createStagedUpload(admin) {
  const res = await admin.graphql(
    `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      variables: {
        input: [
          {
            resource: "FILE",
            filename: "products_feed.json",
            mimeType: "application/json",
            httpMethod: "POST",
          },
        ],
      },
    }
  );

  const data = await res.json();
  const target = data.data.stagedUploadsCreate.stagedTargets?.[0];

  if (!target) {
    throw new Error("Failed to create staged upload");
  }

  return target;
}

/**
 * Upload JSON content to staged Google storage
 */
async function uploadToStagedTarget(target, jsonContent) {
  const formData = new FormData();

  target.parameters.forEach(({ name, value }) => {
    formData.append(name, value);
  });

  formData.append(
    "file",
    new Blob([jsonContent], { type: "application/json" })
  );

  const res = await fetch(target.url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload to staged URL failed");
  }
}

/**
 * Main entry: upload or update feed file
 */
export async function uploadJsonToShopifyFiles(admin, jsonContent) {
  // Check if feed file already exists
  const existingFile = await findExistingFeedFile(admin);

  // Create staged upload
  const target = await createStagedUpload(admin);

  // Upload JSON to Google storage
  await uploadToStagedTarget(target, jsonContent);

  // Update OR Create Shopify file
  if (existingFile?.id) {
    // UPDATE (URL remains consistent)
    const res = await admin.graphql(
      `
      mutation fileUpdate($id: ID!, $url: String!) {
        fileUpdate(
          files: [{
            id: $id
            originalSource: $url
          }]
        ) {
          files {
            ... on GenericFile {
              id
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
      `,
      {
        variables: {
          id: existingFile.id,
          url: target.resourceUrl,
        },
      }
    );

    const data = await res.json();

    if (data.data.fileUpdate.userErrors.length) {
      console.error("fileUpdate errors:", data.data.fileUpdate.userErrors);
      throw new Error("File update failed");
    }

    return data.data.fileUpdate.files[0];
  }

  // CREATE (first time only)
  const res = await admin.graphql(
    `
    mutation fileCreate($url: String!) {
      fileCreate(
        files: [{
          originalSource: $url
          contentType: FILE
        }]
      ) {
        files {
          ... on GenericFile {
            id
            url
          }
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      variables: {
        url: target.resourceUrl,
      },
    }
  );

  const data = await res.json();

  if (data.data.fileCreate.userErrors.length) {
    console.error("fileCreate errors:", data.data.fileCreate.userErrors);
    throw new Error("File creation failed");
  }

  return data.data.fileCreate.files[0];
}
