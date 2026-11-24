
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const IMAGE_FOLDER = path.join(
  ROOT,
  "public",
  "image",
  "generated-restaurants"
);

const BUCKET = "marketplace-media";
const STORAGE_FOLDER = "generated-restaurants";

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env.local");

  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local was not found.");
  }

  const contents = fs.readFileSync(envPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");

    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    value = value.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase URL or server-side secret key in .env.local"
    );
  }

  if (!fs.existsSync(IMAGE_FOLDER)) {
    throw new Error(
      `Image folder does not exist: ${IMAGE_FOLDER}`
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const files = fs
    .readdirSync(IMAGE_FOLDER)
    .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

  if (files.length === 0) {
    throw new Error("No restaurant images were found.");
  }

  console.log(`Found ${files.length} restaurant images.\n`);

  let successful = 0;
  let failed = 0;

  for (const file of files) {
    const localPath = path.join(IMAGE_FOLDER, file);
    const storagePath = `${STORAGE_FOLDER}/${file}`;

    const fileBuffer = fs.readFileSync(localPath);

    const extension = path.extname(file).toLowerCase();

    const contentType =
      extension === ".png"
        ? "image/png"
        : extension === ".webp"
          ? "image/webp"
          : "image/jpeg";

    console.log(`Uploading: ${file}`);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      failed++;
      console.error(`Failed: ${file}`, error.message);
      continue;
    }

    successful++;

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    console.log("Uploaded successfully.");
    console.log(data.publicUrl);
    console.log("");
  }

  console.log("--------------------------------");
  console.log("RESTAURANT IMAGE UPLOAD COMPLETE");
  console.log("--------------------------------");
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error("Upload process failed:", error.message);
  process.exitCode = 1;
});
