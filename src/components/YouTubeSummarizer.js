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
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [language, setLanguage] = useState("");
  const [languageCode, setLanguageCode] = useState("");

  // Auto-trigger summary when transcript is available
  useEffect(() => {
    if (transcript && !isLoadingSummary && !summary) {
      handleSummarize();
    }
  }, [transcript]);

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
    setIsTranscriptExpanded(false);
    setLanguage("");
    setLanguageCode("");

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transcript");
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setLanguage(data.language);
      setLanguageCode(data.languageCode);
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
    setIsTranscriptExpanded(false);
    setLanguage("");
    setLanguageCode("");
  };

  const toggleTranscript = () => {
    setIsTranscriptExpanded(!isTranscriptExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            YouTube Content Summarizer
          </h1>
          <p className="text-lg text-gray-600">
            Get transcripts and AI-powered summaries of YouTube videos
            automatically
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleGetTranscript} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                disabled={isLoadingTranscript}
              />
              <button
                type="submit"
                disabled={isLoadingTranscript}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingTranscript
                  ? "Getting Transcript..."
                  : "Get Transcript"}
              </button>
            </div>
          </form>

          {(transcript || summary || error) && (
            <div className="flex justify-end mb-4">
              <button
                onClick={clearResults}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Results
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {isLoadingTranscript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-sm text-blue-800">
                  Fetching transcript from YouTube...
                </p>
              </div>
            </div>
          )}

          {transcript && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <button
                onClick={toggleTranscript}
                className="w-full flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Video Transcript
                  </h3>
                  {language && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {language}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    isTranscriptExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isTranscriptExpanded && (
                <div className="mt-4 max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                    {transcript}
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoadingSummary && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                <p className="ml-3 text-sm text-green-800">
                  Automatically generating AI summary
                  {language && ` in ${language}`}...
                </p>
              </div>
            </div>
          )}

          {summary && (
            <div className="bg-gray border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Summary
                </h3>
                {language && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {language}
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none text-black">
                <ReactMarkdown>{summary}</ReactMarkdown>
                {isLoadingSummary && (
                  <div className="inline-block w-2 h-4 bg-green-600 animate-pulse ml-1"></div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Get Transcript</h3>
              <p className="text-sm text-gray-600">
                Extract transcript and detect language from YouTube video
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                Auto Processing
              </h3>
              <p className="text-sm text-gray-600">
                AI analyzes content in the original language
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">AI Summary</h3>
              <p className="text-sm text-gray-600">
                Receive markdown summary in the same language
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
