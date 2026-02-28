import { createSeedData } from "@/data/create-seed-data";

const DEFAULT_TIMELINE_COUNT = 7;
const MAX_TIMELINE_COUNT = 30;

function parseCount(rawCount: string | null) {
  if (rawCount === null) {
    return DEFAULT_TIMELINE_COUNT;
  }

  const parsedCount = Number.parseInt(rawCount, 10);

  if (Number.isNaN(parsedCount)) {
    return null;
  }

  return Math.min(Math.max(parsedCount, 0), MAX_TIMELINE_COUNT);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseCount(searchParams.get("count"));

  if (count === null) {
    return Response.json(
      {
        error: "Invalid 'count' query param. It must be an integer.",
      },
      { status: 400 },
    );
  }

  const timeline = createSeedData(count);
  return Response.json(timeline);
}
