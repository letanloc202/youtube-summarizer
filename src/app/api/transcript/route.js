import { NextResponse } from "next/server";
import TranscriptClient from "youtube-transcript-api";

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to get YouTube transcript
async function getYouTubeTranscript(videoId) {
  try {
    const client = new TranscriptClient();
    await client.ready; // wait for client initialization
    const result = await client.getTranscript(videoId);
    console.log("Full transcript result:", result);

    // Extract the actual transcript from the nested structure
    if (
      result.tracks &&
      result.tracks.length > 0 &&
      result.tracks[0].transcript
    ) {
      const transcriptArray = result.tracks[0].transcript;
      const language = result.tracks[0].language || "English";
      const languageCode =
        result.languages && result.languages.length > 0
          ? result.languages[0].languageCode
          : "en";

      console.log("Transcript array:", transcriptArray);
      console.log("Detected language:", language, "Code:", languageCode);

      return {
        text: transcriptArray.map((item) => item.text).join(" "),
        language: language,
        languageCode: languageCode,
      };
    } else {
      throw new Error("No transcript tracks found in the response");
    }
  } catch (error) {
    console.error("Transcript fetch error:", error);
    throw new Error(
      "Failed to fetch YouTube transcript. Make sure the video has captions available."
    );
  }
}

export async function POST(request) {
  try {
    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Get transcript
    const transcriptData = await getYouTubeTranscript(videoId);
    console.log(
      "Final transcript text:",
      transcriptData.text.substring(0, 200) + "..."
    );
    console.log(
      "Language info:",
      transcriptData.language,
      transcriptData.languageCode
    );

    return NextResponse.json({
      transcript: transcriptData.text,
      language: transcriptData.language,
      languageCode: transcriptData.languageCode,
      videoId,
      success: true,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
