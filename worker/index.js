
const ALLOWED_ORIGINS = (originList) =>
  (originList || "*")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function corsHeaders(origin, env) {
  const allowed = ALLOWED_ORIGINS(env.ALLOWED_ORIGINS);
  const permitted = allowed.includes("*")
    ? "*"
    : allowed.includes(origin)
      ? origin
      : "null";

  return {
    "Access-Control-Allow-Origin": permitted,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    if (url.pathname !== "/api/chat") {
      return json(
        { error: "Not found. Use POST /api/chat." },
        404,
        cors
      );
    }

    if (request.method !== "POST") {
      return json(
        { error: "Method not allowed." },
        405,
        cors
      );
    }

    if (!env.GEMINI_API_KEY) {
      return json(
        { error: "Missing GEMINI_API_KEY Worker secret." },
        500,
        cors
      );
    }

    const contentLength = Number(
      request.headers.get("Content-Length") || 0
    );

    if (contentLength > 50000) {
      return json(
        { error: "Your message is too large. Please shorten it." },
        413,
        cors
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json(
        { error: "Please send valid JSON." },
        400,
        cors
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json(
        { error: "Invalid request body." },
        400,
        cors
      );
    }

    const mode = ["chat", "summary", "quiz"].includes(body.mode)
      ? body.mode
      : "chat";

    const input =
      typeof body.input === "string" ? body.input.trim() : "";

    if (!input) {
      return json(
        { error: "Please enter a question or some study notes." },
        400,
        cors
      );
    }

    if (input.length > 20000) {
      return json(
        { error: "Please keep your input under 20,000 characters." },
        413,
        cors
      );
    }

    let prompt;

    if (mode === "summary") {
      prompt = `You are StudyMate AI, a friendly study assistant.
Create an accurate, student-friendly summary of the following notes.
Use a clear title, concise bullet points, key definitions, and a
short key-takeaways section. Do not invent unsupported facts.

NOTES:
${input}`;
    } else if (mode === "quiz") {
      const count = Math.max(
        3,
        Math.min(15, Number(body.options?.count) || 5)
      );

      const difficulty = [
        "Beginner",
        "Intermediate",
        "Advanced"
      ].includes(body.options?.difficulty)
        ? body.options.difficulty
        : "Intermediate";

      prompt = `You are StudyMate AI, a careful teacher.
Create exactly ${count} ${difficulty.toLowerCase()}-difficulty
practice questions based on the supplied topic or notes.
Number every question, provide choices for multiple-choice
questions, and include an answer key with brief explanations.

TOPIC OR NOTES:
${input}`;
    } else {
      prompt = `You are StudyMate AI, a supportive and accurate study tutor.
Explain concepts in plain, friendly language, using step-by-step
explanations and examples when helpful. Keep short answers short.
Ask a clarifying question if necessary, and do not pretend certainty.

STUDENT MESSAGE:
${input}`;
    }

    try {
      const model = env.GEMINI_MODEL || "gemini-2.5-flash";

      const apiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1800
          }
        })
      });

      const result = await apiResponse.json().catch(() => ({}));

      if (!apiResponse.ok) {
        const status = apiResponse.status;

        if (status === 429 || status >= 500) {
          return json(
            {
              error: "Gemini is busy or temporarily unavailable. Please try again shortly."
            },
            503,
            cors
          );
        }

        return json(
          {
            error:
              result.error?.message ||
              `Gemini API returned status ${status}.`
          },
          502,
          cors
        );
      }

      const text = (
        result.candidates?.[0]?.content?.parts || []
      )
        .map((part) => part.text || "")
        .join("\n")
        .trim();

      if (!text) {
        return json(
          { error: "The AI did not return text. Please try again." },
          502,
          cors
        );
      }

      return json({ text }, 200, cors);
    } catch {
      return json(
        { error: "Could not connect to the AI service. Please try again shortly." },
        502,
        cors
      );
    }
  }
};
