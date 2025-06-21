"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function YouTubeSummarizer() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState("");
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [language, setLanguage] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Auto-trigger summary when transcript is available
  useEffect(() => {
    if (transcript && !isLoadingSummary && !summary) {
      handleSummarize();
    }
  }, [transcript]);

  const [transcriptStatus, setTranscriptStatus] = useState("");

  const handleGetTranscript = async (e) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setIsLoadingTranscript(true);
    setError("");
    setTranscript("");
    setSummary("");
    setStreamingProgress(0);
    setLanguage("");
    setLanguageCode("");
    setTranscriptStatus("");

    try {
      const response = await fetch("/api/transcript-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl, language: selectedLanguage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transcript");
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const update = JSON.parse(line);

              if (update.status === "error") {
                throw new Error(update.error);
              } else if (update.status === "completed") {
                setTranscript(update.transcript);
                setLanguage(update.language);
                setLanguageCode(update.languageCode);
                setTranscriptStatus("Transcription completed successfully!");
                updateProgress("completed");
              } else {
                setTranscriptStatus(
                  update.message || `Status: ${update.status}`
                );
                updateProgress(update.status);
              }
            } catch (parseError) {
              console.warn("Failed to parse update:", line);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      setError("No transcript available to summarize");
      return;
    }

    setIsLoadingSummary(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          language,
          languageCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to summarize transcript");
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          setSummary((prev) => prev + chunk);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const clearResults = () => {
    setTranscript("");
    setSummary("");
    setError("");
    setYoutubeUrl("");
    setStreamingProgress(0);
    setLanguage("");
    setLanguageCode("");
    setSelectedLanguage("en");
    setTranscriptStatus("");
  };

  // Update progress based on streaming status
  const updateProgress = (status) => {
    switch (status) {
      case "starting":
        setStreamingProgress(10);
        break;
      case "downloading":
        setStreamingProgress(30);
        break;
      case "transcribing":
        setStreamingProgress(70);
        break;
      case "completed":
        setStreamingProgress(100);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              YouTube Content Summarizer
            </h1>
            <p className="text-base text-gray-300">
              Get transcripts using OpenAI Whisper and AI-powered summaries
              automatically
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-6">
          <form onSubmit={handleGetTranscript}>
            <div className="flex justify-center">
              <div className="flex flex-col sm:flex-row gap-4 max-w-4xl w-full items-center">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all"
                  disabled={isLoadingTranscript}
                />
                <div className="relative min-w-32">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                    disabled={isLoadingTranscript}
                  >
                    <option value="en" className="bg-gray-800">
                      English
                    </option>
                    <option value="vi" className="bg-gray-800">
                      Vietnamese
                    </option>
                    <option value="es" className="bg-gray-800">
                      Spanish
                    </option>
                    <option value="fr" className="bg-gray-800">
                      French
                    </option>
                    <option value="de" className="bg-gray-800">
                      German
                    </option>
                    <option value="it" className="bg-gray-800">
                      Italian
                    </option>
                    <option value="pt" className="bg-gray-800">
                      Portuguese
                    </option>
                    <option value="ru" className="bg-gray-800">
                      Russian
                    </option>
                    <option value="ja" className="bg-gray-800">
                      Japanese
                    </option>
                    <option value="ko" className="bg-gray-800">
                      Korean
                    </option>
                    <option value="zh" className="bg-gray-800">
                      Chinese
                    </option>
                    <option value="ar" className="bg-gray-800">
                      Arabic
                    </option>
                    <option value="hi" className="bg-gray-800">
                      Hindi
                    </option>
                    <option value="auto" className="bg-gray-800">
                      Auto-detect
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoadingTranscript}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                >
                  {isLoadingTranscript ? "Getting Summary..." : "Get Summary"}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl mx-6 my-4 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-base text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Streaming Progress Section */}
          {isLoadingTranscript && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl mx-6 my-4 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-400 border-t-transparent shadow-lg"></div>
                  <div className="ml-4">
                    <p className="text-lg text-white font-semibold">
                      Processing with OpenAI Whisper
                    </p>
                    <p className="text-base text-blue-200 mt-1">
                      {transcriptStatus || "Initializing..."}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-blue-300 font-bold">
                    {streamingProgress}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${streamingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6 p-6">
          {/* Left Column - Video Transcript */}
          <div className="flex-1 bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl">
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-400/30">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 9.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.05 6.636a5 5 0 000 7.071"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Video Transcript
                  </h3>
                  <p className="text-sm text-gray-400">
                    OpenAI Whisper Audio Transcription
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {transcript ? (
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-base">
                  {transcript}
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 py-12">
                  <div className="text-center">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-8 mb-6 inline-flex">
                      <svg
                        className="w-16 h-16 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15.536 9.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.05 6.636a5 5 0 000 7.071"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <p className="text-lg text-gray-300 max-w-sm">
                      AI-powered transcript will appear here after processing
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - AI Summary */}
          <div className="flex-1 bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl">
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-400/30">
                  <svg
                    className="w-5 h-5 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Summary</h3>
                  <p className="text-sm text-gray-400">
                    Intelligent Content Analysis
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {isLoadingSummary ? (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex items-center shadow-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-400 border-t-transparent"></div>
                  <p className="ml-4 text-lg text-purple-200 font-medium">
                    Generating AI summary{language && ` in ${language}`}...
                  </p>
                </div>
              ) : summary ? (
                <div className="text-gray-200 leading-relaxed text-base">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                  {isLoadingSummary && (
                    <div className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1"></div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 py-12">
                  <div className="text-center">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-8 mb-6 inline-flex">
                      <svg
                        className="w-16 h-16 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg text-gray-300 max-w-sm">
                      AI-powered summary will appear here automatically
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
