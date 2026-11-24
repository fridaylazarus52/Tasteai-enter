
const fs = require("fs");

async function main() {
  const env = fs.readFileSync(".env.local", "utf8");
  const match = env.match(/^GEOAPIFY_API_KEY\s*=\s*(.+)$/m);

  if (!match) {
    console.log("Geoapify API key not found.");
    return;
  }

  const apiKey = match[1].trim().replace(/^["']|["']$/g, "");

  const placeId =
    "5148b969e97f3c0b4059c4569a5ee7c91940f00102f9018787f2570000000092030c42616c6f277320506c616365";

  const url = new URL("https://api.geoapify.com/v2/place-details");
  url.searchParams.set("id", placeId);
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url);
  console.log("HTTP status:", response.status);

  const data = await response.json();

  if (!response.ok) {
    console.log("API error:", data);
    return;
  }

  for (const feature of data.features || []) {
    const properties = feature.properties || {};

    console.log("\nRestaurant:", properties.name);
    console.log("Feature type:", properties.feature_type);
    console.log("Available fields:", Object.keys(properties));
    console.log("Wiki/media:", properties.wiki_and_media);
  }
}

main().catch((error) => {
  console.error("Diagnostic failed:", error.message);
});
