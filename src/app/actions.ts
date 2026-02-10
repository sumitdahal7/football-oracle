"use server";

import { genAI } from "@/lib/gemini";
import { getMatchStats } from "@/lib/football-data";

export async function fetchLiveStats(
  matchId: number,
  homeId: number,
  awayId: number,
) {
  try {
    const stats = await getMatchStats(matchId, homeId, awayId);
    return stats;
  } catch (error) {
    console.error("Action error fetching live stats:", error);
    return null;
  }
}

interface GroundingChunk {
  web?: {
    title: string;
    uri: string;
  };
}

interface GeminiResponse {
  candidates?: {
    groundingMetadata?: {
      groundingChunks?: GroundingChunk[];
      searchEntryPoint?: {
        renderedContent?: string;
      };
    };
  }[];
  text: () => string;
}

export async function predictMatch(homeTeam: string, awayTeam: string) {
  if (!homeTeam || !awayTeam) {
    throw new Error("Missing team names");
  }

  const currentDate = new Date().toLocaleDateString("en-GB");

  const prompt = `
    Today's Date: ${currentDate}
    
    You are a Senior Football Statistician with real-time web access. 
    INSTRUCTION: Search for the latest 2026 team news, current managers, and injury lists for ${homeTeam} and ${awayTeam} before generating the prediction.
    Analyze this real-time data to generate an elite-level match prediction.
    
    Return ONLY a JSON object with the following structure:
    {
      "winner": "Team Name or Draw",
      "scoreline": "H-A",
      "winProbability": {
        "home": number (0-100),
        "away": number (0-100),
        "draw": number (0-100)
      },
      "tacticalBreakdown": "A detailed 2-3 paragraph analysis of the match including insights from your search."
    }
  `;

  const modelName = "gemini-2.0-flash";

  try {
    console.log(
      `Attempting grounded prediction for ${homeTeam} vs ${awayTeam}...`,
    );

    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: [{ googleSearchRetrieval: {} } as unknown as any],
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = (await result.response) as unknown as GeminiResponse;
    const text = response.text();
    const data = JSON.parse(text);

    // Extract grounding metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];

    const sourceLinks = groundingChunks
      .filter((chunk) => chunk.web)
      .map((chunk) => ({
        title: chunk.web!.title,
        uri: chunk.web!.uri,
      }))
      // Deduplicate sources
      .filter((v, i, a) => a.findIndex((t) => t.uri === v.uri) === i);

    return {
      ...data,
      sources: sourceLinks.length > 0 ? sourceLinks : null,
      searchHtml: groundingMetadata?.searchEntryPoint?.renderedContent || null,
    };
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    console.error(`Prediction Error:`, error.message);

    // Check for rate limit specifically
    if (error.message?.includes("429") || error.status === 429) {
      throw new Error(
        "Rate limit exceeded. Please wait a minute before trying again.",
      );
    }

    throw new Error(error.message || "Failed to generate grounded prediction.");
  }
}
