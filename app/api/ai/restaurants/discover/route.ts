
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GeoapifyFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    suburb?: string;
    district?: string;
    state?: string;
    country?: string;
    country_code?: string;
    lat?: number;
    lon?: number;
    categories?: string[];
    website?: string;
    contact?: {
      phone?: string;
      website?: string;
    };
    distance?: number;
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

type GeoapifyResponse = {
  features?: GeoapifyFeature[];
};

type GeoapifyGeocodeResponse = {
  results?: Array<{
    lat?: number;
    lon?: number;
    formatted?: string;
  }>;
};

type CachedCoordinates = {
  latitude: number;
  longitude: number;
  expiresAt: number;
};

const GEOAPIFY_BASE_URL = "https://api.geoapify.com";

// Request timeouts.
const GEOCODE_TIMEOUT_MS = 15000;
const PLACES_TIMEOUT_MS = 30000;

// Named-city coordinate cache.
// This is an in-memory optimization.
// Cache entries are local to this running process.
const GEOCODE_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_GEOCODE_CACHE_ENTRIES = 100;

const geocodeCache = new Map<string, CachedCoordinates>();

function getCachedCoordinates(
  key: string
): CachedCoordinates | null {
  const cached = geocodeCache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    geocodeCache.delete(key);
    return null;
  }

  // Refresh the insertion order.
  geocodeCache.delete(key);
  geocodeCache.set(key, cached);

  return cached;
}

function saveCachedCoordinates(
  key: string,
  latitude: number,
  longitude: number
): void {
  // Replace any existing entry.
  geocodeCache.delete(key);

  // Remove expired entries.
  const now = Date.now();

  for (const [cacheKey, entry] of geocodeCache) {
    if (entry.expiresAt <= now) {
      geocodeCache.delete(cacheKey);
    }
  }

  // Evict the oldest entries when necessary.
  while (
    geocodeCache.size >= MAX_GEOCODE_CACHE_ENTRIES
  ) {
    const oldestKey = geocodeCache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    geocodeCache.delete(oldestKey);
  }

  geocodeCache.set(key, {
    latitude,
    longitude,
    expiresAt: now + GEOCODE_CACHE_TTL_MS,
  });
}

export async function GET(request: NextRequest) {
  const requestStartedAt = Date.now();

  // Used to identify which upstream request failed.
  let discoveryPhase = "initialization";

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.error(
      "Restaurant discovery failed: GEOAPIFY_API_KEY is missing."
    );

    return NextResponse.json(
      {
        error: "Restaurant discovery service is not configured.",
      },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;

  const query =
    searchParams.get("q")?.trim() || "restaurant";

  const near =
    searchParams.get("near")?.trim() || "";

  const ll =
    searchParams.get("ll")?.trim() || "";

  const requestedLimit = Number(
    searchParams.get("limit") || "50"
  );

  const requestedRadius = Number(
    searchParams.get("radius") || "10000"
  );

  // Validate search keyword.
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json(
      {
        error: "Search must be between 2 and 100 characters.",
      },
      { status: 400 }
    );
  }

  // Validate named location.
  if (near.length > 150) {
    return NextResponse.json(
      {
        error: "Location name is too long.",
      },
      { status: 400 }
    );
  }

  // Validate GPS coordinates: latitude,longitude.
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (ll) {
    const coordinates = ll.split(",").map(Number);

    if (
      coordinates.length !== 2 ||
      !coordinates.every(Number.isFinite) ||
      coordinates[0] < -90 ||
      coordinates[0] > 90 ||
      coordinates[1] < -180 ||
      coordinates[1] > 180
    ) {
      return NextResponse.json(
        {
          error: "Invalid coordinates. Use latitude,longitude.",
        },
        { status: 400 }
      );
    }

    latitude = coordinates[0];
    longitude = coordinates[1];
  }

  if (ll && near) {
    return NextResponse.json(
      {
        error: "Provide GPS coordinates or a city, not both.",
      },
      { status: 400 }
    );
  }

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(50, Math.max(1, Math.floor(requestedLimit)))
    : 50;

  const radius = Number.isFinite(requestedRadius)
    ? Math.min(
        100000,
        Math.max(1, Math.floor(requestedRadius))
      )
    : 10000;

  try {
    // Resolve a named city into coordinates.
    // Geoapify Places API requires a geographic search area.
    if (near && latitude === null) {
      const cacheKey = near.toLowerCase();

      const cachedCoordinates =
        getCachedCoordinates(cacheKey);

      if (cachedCoordinates) {
        latitude = cachedCoordinates.latitude;
        longitude = cachedCoordinates.longitude;

        console.info(
          "[Geoapify] Geocoding cache hit:",
          near
        );
      } else {
        discoveryPhase = "geocoding";

        const geocodeStartedAt = Date.now();

        console.info(
          "[Geoapify] Starting geocoding:",
          near
        );

        const geocodeParams = new URLSearchParams({
          text: near,
          format: "json",
          limit: "1",
          apiKey,
        });

        const geocodeResponse = await fetch(
          `${GEOAPIFY_BASE_URL}/v1/geocode/search?${geocodeParams.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: AbortSignal.timeout(
              GEOCODE_TIMEOUT_MS
            ),
          }
        );

        console.info(
          "[Geoapify] Geocoding completed:",
          {
            status: geocodeResponse.status,
            durationMs:
              Date.now() - geocodeStartedAt,
          }
        );

        if (!geocodeResponse.ok) {
          const errorText =
            await geocodeResponse.text();

          console.error(
            "Geoapify geocoding HTTP status:",
            geocodeResponse.status
          );

          console.error(
            "Geoapify geocoding error:",
            errorText.slice(0, 400)
          );

          return NextResponse.json(
            {
              error: "Unable to find the requested location.",
            },
            {
              status:
                geocodeResponse.status === 429 ? 429 : 502,
            }
          );
        }

        const geocodeData =
          (await geocodeResponse.json()) as GeoapifyGeocodeResponse;

        const matchedLocation =
          geocodeData.results?.[0];

        if (
          !matchedLocation ||
          !Number.isFinite(matchedLocation.lat) ||
          !Number.isFinite(matchedLocation.lon)
        ) {
          return NextResponse.json(
            {
              error: "We could not locate that city or area.",
            },
            { status: 404 }
          );
        }

        latitude = matchedLocation.lat!;
        longitude = matchedLocation.lon!;

        // Cache only valid, successfully resolved coordinates.
        saveCachedCoordinates(
          cacheKey,
          latitude,
          longitude
        );
      }
    }

    // Default to Lagos when no explicit location is provided.
    // Lagos coordinates are used only as a search center.
    if (latitude === null || longitude === null) {
      latitude = 6.5244;
      longitude = 3.3792;
    }

    // Geoapify uses longitude,latitude order.
    const filter =
      `circle:${longitude},${latitude},${radius}`;

    const params = new URLSearchParams({
      categories:
        "catering.restaurant,catering.fast_food,catering.cafe",
      filter,
      bias: `proximity:${longitude},${latitude}`,
      limit: String(limit),
      lang: "en",
      apiKey,
    });

    // For a specific search such as "pizza",
    // filter by place name.
    // General restaurant searches return matching venues.
    const normalizedQuery = query.toLowerCase();

    if (
      normalizedQuery !== "restaurant" &&
      normalizedQuery !== "restaurants" &&
      normalizedQuery !== "food"
    ) {
      params.set("name", query);
    }

    discoveryPhase = "places";

    const placesStartedAt = Date.now();

    console.info(
      "[Geoapify] Starting restaurant search:",
      {
        query,
        limit,
        radius,
        location: near || ll || "Lagos",
      }
    );

    const response = await fetch(
      `${GEOAPIFY_BASE_URL}/v2/places?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(
          PLACES_TIMEOUT_MS
        ),
      }
    );

    console.info(
      "[Geoapify] Places search completed:",
      {
        status: response.status,
        durationMs:
          Date.now() - placesStartedAt,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Geoapify Places API HTTP status:",
        response.status
      );

      console.error(
        "Geoapify Places API error:",
        errorText.slice(0, 500)
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        return NextResponse.json(
          {
            error:
              "Restaurant discovery credentials were rejected. Check your Geoapify API key and project permissions.",
          },
          { status: 502 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "Restaurant discovery has temporarily reached its API usage limit. Please try again later.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "Restaurant discovery failed. Please try again.",
        },
        { status: 502 }
      );
    }

    const data =
      (await response.json()) as GeoapifyResponse;

    const restaurants = (data.features ?? [])
      .map((feature) => {
        const place = feature.properties ?? {};

        const coordinates =
          feature.geometry?.coordinates;

        const placeLatitude =
          place.lat ??
          (coordinates ? coordinates[1] : null);

        const placeLongitude =
          place.lon ??
          (coordinates ? coordinates[0] : null);

        const name =
          typeof place.name === "string"
            ? place.name.trim()
            : "";

        // Exclude results without usable identities.
        if (!place.place_id || !name) {
          return null;
        }

        const address =
          place.formatted ??
          [place.address_line1, place.address_line2]
            .filter(Boolean)
            .join(", ");

        return {
          id: place.place_id,
          name,
          address: address ?? "",
          city: place.city ?? place.suburb ?? "",
          region: place.state ?? "",
          postcode: place.postcode ?? "",
          country: place.country ?? "",
          latitude: placeLatitude,
          longitude: placeLongitude,
          categories: place.categories ?? [],
          website:
            place.website ??
            place.contact?.website ??
            null,
          phone: place.contact?.phone ?? null,

          // Geoapify does not provide a direct equivalent
          // to Foursquare's price and rating in this response.
          priceLevel: null,
          rating: null,

          distance: place.distance ?? null,
          source: "geoapify" as const,
        };
      })
      .filter(
        (
          restaurant
        ): restaurant is NonNullable<typeof restaurant> =>
          restaurant !== null
      );

    console.info(
      "[Geoapify] Discovery succeeded:",
      {
        count: restaurants.length,
        durationMs: Date.now() - requestStartedAt,
      }
    );

    return NextResponse.json(
      {
        restaurants,
        count: restaurants.length,
        limit,
        radius,
        location: ll || near || "Lagos",
        hasMore: restaurants.length === limit,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const errorName =
      error instanceof Error ? error.name : "UnknownError";

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    const timedOut = errorName === "TimeoutError";

    console.error(
      "Geoapify restaurant discovery request failed:",
      {
        phase: discoveryPhase,
        elapsedMs: Date.now() - requestStartedAt,
        errorName,
        errorMessage,
      }
    );

    return NextResponse.json(
      {
        error: timedOut
          ? discoveryPhase === "geocoding"
            ? "Location lookup timed out. Please try again."
            : "Restaurant discovery timed out. Please try again."
          : "Unable to reach the restaurant discovery service.",
        ...(timedOut
          ? {
              code: "GEOAPIFY_TIMEOUT",
              phase: discoveryPhase,
            }
          : {}),
      },
      {
        status: timedOut ? 504 : 502,
      }
    );
  }
}
