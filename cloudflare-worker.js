export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const apiKey = env.OPENAI_API_KEY || env.API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing API key secret in worker environment",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const messages = body.messages;
    const requestedModel = body.model || "gpt-4.1";
    const enableWebSearch = body.enableWebSearch !== false;
    const model =
      enableWebSearch && requestedModel === "gpt-4o"
        ? "gpt-4.1"
        : requestedModel;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    /* Convert chat-style messages into one input string for the Responses API */
    const input = messages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join("\n\n");

    const requestBody = {
      model,
      input,
    };

    if (enableWebSearch) {
      requestBody.tools = [{ type: "web_search_preview" }];
    }

    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!openAIResponse.ok) {
      let errorPayload;

      try {
        errorPayload = await openAIResponse.json();
      } catch {
        errorPayload = {
          error: { message: "OpenAI returned a non-JSON error response." },
        };
      }

      const openAIDetail =
        errorPayload?.error?.message || "OpenAI request failed.";

      return new Response(
        JSON.stringify({
          error: "OpenAI request failed",
          details: openAIDetail,
        }),
        {
          status: openAIResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const data = await openAIResponse.json();

    /* Extract source links from web search annotations if present */
    const citations = extractCitations(data);

    const assistantText =
      (typeof data.output_text === "string" && data.output_text.trim()) ||
      "I could not generate a response right now. Please try again.";

    /* Return a chat-completions-like shape so frontend parsing stays simple */
    const normalizedResponse = {
      choices: [
        {
          message: {
            content: assistantText,
          },
        },
      ],
      citations,
    };

    return new Response(JSON.stringify(normalizedResponse), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};

/* Collect unique citation URLs from nested Responses API payload fields */
function extractCitations(data) {
  const seenUrls = new Set();
  const citations = [];

  function visit(value) {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    const maybeUrl =
      typeof value.url === "string"
        ? value.url
        : typeof value.href === "string"
          ? value.href
          : "";

    if (maybeUrl && /^https?:\/\//i.test(maybeUrl) && !seenUrls.has(maybeUrl)) {
      seenUrls.add(maybeUrl);
      citations.push({
        title:
          typeof value.title === "string" && value.title.trim()
            ? value.title
            : maybeUrl,
        url: maybeUrl,
      });
    }

    Object.values(value).forEach(visit);
  }

  visit(data?.output);
  return citations.slice(0, 8);
}
