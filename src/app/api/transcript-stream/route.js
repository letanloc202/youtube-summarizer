import { NextResponse } from "next/server";
import { OpenAIWhisperAudio } from "@langchain/community/document_loaders/fs/openai_whisper_audio";
import ytdl from "@distube/ytdl-core";
import YTDlpWrap from "yt-dlp-wrap";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Alternative download function using yt-dlp
async function downloadWithYtDlp(youtubeUrl, outputPath, sendUpdate) {
  try {
    sendUpdate("downloading", { message: "Using yt-dlp method..." });
    const ytDlpWrap = new YTDlpWrap();

    await ytDlpWrap.execPromise([
      youtubeUrl,
      "-x", // Extract audio only
      "--audio-format",
      "mp3",
      "--audio-quality",
      "5", // Medium quality to save bandwidth
      "-o",
      outputPath.replace(".mp3", ".%(ext)s"), // Let yt-dlp handle extension
      "--no-playlist",
      "--max-filesize",
      "50M", // Limit file size
    ]);

    // yt-dlp might change the extension, find the actual file
    const dir = path.dirname(outputPath);
    const baseName = path.basename(outputPath, ".mp3");
    const files = await fs.readdir(dir);
    const downloadedFile = files.find((file) => file.startsWith(baseName));

    if (downloadedFile) {
      const actualPath = path.join(dir, downloadedFile);
      // Rename to expected .mp3 extension if needed
      if (actualPath !== outputPath) {
        await fs.move(actualPath, outputPath);
      }
      sendUpdate("downloading", {
        message: "yt-dlp download completed successfully!",
      });
      return outputPath;
    } else {
      throw new Error("Downloaded file not found");
    }
  } catch (error) {
    console.error("yt-dlp download failed:", error);
    throw error;
  }
}

// Function to download YouTube audio with progress updates
async function downloadYouTubeAudio(youtubeUrl, outputPath, sendUpdate) {
  return new Promise(async (resolve, reject) => {
    try {
      // First validate the URL and check if video exists
      sendUpdate("downloading", { message: "Validating YouTube URL..." });
      const isValid = ytdl.validateURL(youtubeUrl);
      if (!isValid) {
        throw new Error("Invalid YouTube URL");
      }

      // Get video info to check availability
      sendUpdate("downloading", { message: "Getting video information..." });
      const info = await ytdl.getInfo(youtubeUrl, {
        requestOptions: {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        },
      });

      sendUpdate("downloading", {
        message: `Found video: "${info.videoDetails.title}" (${Math.round(
          parseInt(info.videoDetails.lengthSeconds) / 60
        )} minutes)`,
      });

      // Check if video is too long (limit to 30 minutes for processing efficiency)
      const maxDurationSeconds = 30 * 60; // 30 minutes
      if (parseInt(info.videoDetails.lengthSeconds) > maxDurationSeconds) {
        throw new Error(
          `Video is too long (${Math.round(
            parseInt(info.videoDetails.lengthSeconds) / 60
          )} minutes). Please use videos under 30 minutes.`
        );
      }

      sendUpdate("downloading", { message: "Starting audio download..." });

      // Try multiple download strategies
      const downloadOptions = [
        // Strategy 1: Lowest audio quality
        {
          quality: "lowestaudio",
          filter: "audioonly",
          requestOptions: {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          },
        },
        // Strategy 2: Any audio format
        {
          filter: "audioonly",
          requestOptions: {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          },
        },
        // Strategy 3: Lowest quality overall
        {
          quality: "lowest",
          requestOptions: {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          },
        },
      ];

      let lastError;
      let stream;
      for (let i = 0; i < downloadOptions.length; i++) {
        try {
          sendUpdate("downloading", {
            message: `Trying download strategy ${i + 1}...`,
          });
          stream = ytdl(youtubeUrl, downloadOptions[i]);
          break; // Success, exit loop
        } catch (error) {
          lastError = error;
          sendUpdate("downloading", {
            message: `Strategy ${i + 1} failed, trying next...`,
          });
          if (i === downloadOptions.length - 1) {
            throw lastError; // All strategies failed
          }
        }
      }

      const writeStream = fs.createWriteStream(outputPath);
      stream.pipe(writeStream);

      writeStream.on("finish", () => {
        sendUpdate("downloading", {
          message: "Audio download completed successfully!",
        });
        resolve(outputPath);
      });

      writeStream.on("error", (error) => {
        console.error("Write stream error:", error);
        reject(new Error(`Failed to save audio file: ${error.message}`));
      });

      stream.on("error", (error) => {
        console.error("Download stream error:", error);
        reject(new Error(`Failed to download audio: ${error.message}`));
      });
    } catch (error) {
      console.error("Download function error:", error);
      reject(error);
    }
  });
}

// Function to transcribe audio using OpenAI Whisper via Langchain
async function transcribeWithWhisper(audioPath, language = "en", sendUpdate) {
  try {
    sendUpdate("transcribing", {
      message: "Loading audio file into Whisper...",
    });

    const loader = new OpenAIWhisperAudio(audioPath, {
      transcriptionCreateParams: {
        language: language === "auto" ? undefined : language,
      },
    });

    sendUpdate("transcribing", {
      message: "Processing audio with OpenAI Whisper...",
    });
    const docs = await loader.load();

    if (docs && docs.length > 0) {
      // Combine all document content
      const transcript = docs.map((doc) => doc.pageContent).join(" ");
      sendUpdate("transcribing", {
        message: "Transcription processing complete!",
      });

      return {
        text: transcript,
        language: language,
        languageCode: language,
      };
    } else {
      throw new Error("No transcript content returned from Whisper");
    }
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw new Error(
      `Failed to transcribe audio with Whisper: ${error.message}`
    );
  }
}

export async function POST(request) {
  try {
    const { youtubeUrl, language = "en" } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Create streaming response
    const encoder = new TextEncoder();
    let tempAudioPath = null;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper function to send status updates
          const sendUpdate = (status, data = {}) => {
            const update = JSON.stringify({ status, ...data }) + "\n";
            controller.enqueue(encoder.encode(update));
          };

          sendUpdate("starting", {
            message: "Initializing transcription process...",
          });

          // Create temporary directory for audio files
          const tempDir = path.join(process.cwd(), "temp");
          await fs.ensureDir(tempDir);

          // Generate unique filename for audio
          const audioFileName = `${uuidv4()}.mp3`;
          tempAudioPath = path.join(tempDir, audioFileName);

          sendUpdate("downloading", {
            message: "Starting YouTube audio download...",
          });

          // Try different download methods
          let downloadSuccess = false;
          try {
            // First try the improved ytdl-core method
            await downloadYouTubeAudio(youtubeUrl, tempAudioPath, sendUpdate);
            downloadSuccess = true;
          } catch (error) {
            sendUpdate("downloading", {
              message:
                "Primary method failed, trying alternative download method...",
            });
            try {
              await downloadWithYtDlp(youtubeUrl, tempAudioPath, sendUpdate);
              downloadSuccess = true;
            } catch (ytDlpError) {
              throw new Error(
                `Download failed: ${error.message}. Alternative method also failed: ${ytDlpError.message}`
              );
            }
          }

          if (!downloadSuccess) {
            throw new Error(
              "Failed to download audio using any available method"
            );
          }

          sendUpdate("transcribing", {
            message:
              "Download complete! Starting OpenAI Whisper transcription...",
          });

          // Transcribe using OpenAI Whisper
          const transcriptData = await transcribeWithWhisper(
            tempAudioPath,
            language,
            sendUpdate
          );

          sendUpdate("completed", {
            message: "Transcription completed successfully!",
            transcript: transcriptData.text,
            language: transcriptData.language,
            languageCode: transcriptData.languageCode,
            videoId,
            method: "OpenAI Whisper",
          });

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);

          // Provide more specific error messages
          let errorMessage = "Internal server error";
          if (
            error.message.includes("Video unavailable") ||
            error.message.includes("Private video")
          ) {
            errorMessage = "Video is unavailable, private, or has been removed";
          } else if (
            error.message.includes("Could not extract") ||
            error.message.includes("functions")
          ) {
            errorMessage =
              "Unable to access YouTube video. The video may be restricted, private, or YouTube is temporarily blocking access. Please try again later or use a different video.";
          } else if (error.message.includes("OpenAI")) {
            errorMessage =
              "OpenAI Whisper transcription failed: " + error.message;
          } else if (error.message.includes("too long")) {
            errorMessage = error.message;
          } else if (error.message.includes("Invalid YouTube URL")) {
            errorMessage = "Invalid YouTube URL format";
          } else {
            errorMessage = error.message;
          }

          const errorUpdate =
            JSON.stringify({ status: "error", error: errorMessage }) + "\n";
          controller.enqueue(encoder.encode(errorUpdate));
          controller.close();
        } finally {
          // Clean up temporary audio file
          if (tempAudioPath && (await fs.pathExists(tempAudioPath))) {
            try {
              await fs.remove(tempAudioPath);
            } catch (cleanupError) {
              console.warn("Failed to clean up temporary file:", cleanupError);
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
