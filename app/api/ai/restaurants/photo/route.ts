
import { NextRequest, NextResponse } from "next/server";

type GeoapifyDetailsFeature = {
  properties?: {
    wiki_and_media?: {
      image?: string;
    };
  };
};

type GeoapifyDetailsResponse = {
  features?: GeoapifyDetailsFeature[];
};

function unavailable() {
  return new NextResponse(null, {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const placeId = request.nextUrl.searchParams.get("id")?.trim();
    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!placeId || placeId.length > 512) {
      return NextResponse.json(
        { error: "A valid restaurant place ID is required." },
        { status: 400 }
      );
    }

    if (!apiKey) {
      console.error("GEOAPIFY_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Restaurant photo service is not configured." },
        { status: 503 }
      );
    }

    const detailsUrl = new URL(
      "https://api.geoapify.com/v2/place-details"
    );

    detailsUrl.searchParams.set("id", placeId);
    detailsUrl.searchParams.set("apiKey", apiKey);

    const response = await fetch(detailsUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 86400,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return unavailable();
    }

    const data =
      (await response.json()) as GeoapifyDetailsResponse;

    const image = data.features
      ?.map((feature) => feature.properties?.wiki_and_media?.image)
      .find(
        (value): value is string =>
          typeof value === "string" && value.length > 0
      );

    if (!image || image.length > 4096) {
      return unavailable();
    }

    let imageUrl: URL;

    try {
      imageUrl = new URL(image);
    } catch {
      return unavailable();
    }

    if (imageUrl.protocol !== "https:") {
      return unavailable();
    }

    return NextResponse.redirect(imageUrl, {
      status: 302,
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
      },
    );
  } catch (error) {
    console.error("Restaurant photo lookup failed:", error);
    return unavailable();
  }
}
