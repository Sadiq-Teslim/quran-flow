import { determineProfileFromAnswers } from "@/lib/profile/determine-profile";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return Response.json(determineProfileFromAnswers(payload));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid profile answers";

    return Response.json(
      {
        error: {
          message,
        },
      },
      { status: 400 },
    );
  }
}
