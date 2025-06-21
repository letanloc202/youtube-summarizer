# YouTube Content Summarizer

A Next.js application that uses Langchain and OpenAI Whisper to provide AI-powered summaries of YouTube videos with real-time streaming responses.

## Features

- 🎥 **YouTube Video Analysis**: Download and transcribe audio from any YouTube video
- 🎙️ **OpenAI Whisper Transcription**: High-quality audio transcription using OpenAI Whisper via Langchain
- 🌍 **Multi-language Support**: Transcribe videos in multiple languages or auto-detect
- 🤖 **AI-Powered Summarization**: Uses OpenAI's GPT models via Langchain for intelligent content summarization
- ⚡ **Streaming Responses**: Real-time streaming of AI responses for immediate feedback
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- 📱 **Mobile Friendly**: Optimized for all device sizes

## How It Works

1. **Input YouTube URL**: Paste any YouTube video URL and select transcription language
2. **Audio Download**: The app downloads the audio track from the YouTube video using @distube/ytdl-core, with automatic fallback to yt-dlp for restricted videos
3. **Whisper Transcription**: OpenAI Whisper transcribes the audio to text via Langchain
4. **AI Processing**: Langchain processes the transcript with OpenAI's GPT model
5. **Streaming Summary**: Get a structured summary with real-time streaming responses

## Prerequisites

- Node.js 18+
- OpenAI API key
- yt-dlp (for YouTube audio download fallback)

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd youtube-summarizer
   ```

2. **Install yt-dlp** (macOS with Homebrew):

   ```bash
   brew install yt-dlp
   ```

   For other operating systems, see [yt-dlp installation guide](https://github.com/yt-dlp/yt-dlp#installation).

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Set up environment variables**:
   Create a `.env.local` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Run the development server**:

   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to `http://localhost:3000`

## Usage

1. **Enter a YouTube URL** in the input field (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
2. **Click "Summarize"** to start the process
3. **Watch the streaming response** as the AI generates your summary in real-time
4. **Get structured summary** with:
   - Main Topic/Subject
   - Key Points (3-5 bullet points)
   - Important Insights
   - Conclusion/Takeaways

## Technology Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI/ML**: Langchain, OpenAI Whisper, OpenAI GPT-3.5-turbo
- **Audio Processing**: @distube/ytdl-core with yt-dlp fallback for YouTube audio download
- **Transcription**: OpenAI Whisper Audio via @langchain/community
- **Streaming**: ReadableStream API for real-time responses

## Project Structure

```
youtube-summarizer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── transcript/
│   │   │   │   └── route.js          # Whisper transcription API endpoint
│   │   │   └── summarize/
│   │   │       └── route.js          # Streaming AI summary endpoint
│   │   ├── globals.css               # Global styles
│   │   ├── layout.js                 # App layout
│   │   └── page.js                   # Home page
│   └── components/
│       └── YouTubeSummarizer.js      # Main component
├── temp/                             # Temporary audio files (auto-cleaned)
├── .env.local                        # Environment variables
├── package.json                      # Dependencies
└── README.md                         # This file
```

## API Endpoints

### `POST /api/transcript`

Transcribes YouTube video audio using OpenAI Whisper.

**Request Body:**

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "language": "en" // Optional: language code or "auto" for auto-detection
}
```

**Response:**

```json
{
  "transcript": "Full video transcript...",
  "language": "en",
  "languageCode": "en",
  "videoId": "VIDEO_ID",
  "success": true,
  "method": "OpenAI Whisper"
}
```

### `POST /api/summarize`

Summarizes YouTube video content with streaming response.

**Request Body:**

```json
{
  "transcript": "Video transcript text...",
  "language": "English",
  "languageCode": "en"
}
```

**Response:**

- Streaming text response with AI-generated summary

## Key Features Implementation

### Streaming Response

Following the pattern from [langchain-nextjs-streaming](https://github.com/sachio222/langchain-nextjs-streaming), the app implements:

- Server-side streaming using ReadableStream
- Client-side stream consumption with fetch API
- Real-time UI updates as tokens arrive

### YouTube Integration

- Automatic video ID extraction from various YouTube URL formats
- Transcript fetching with error handling for videos without captions
- Content length management to stay within AI model limits

## Error Handling

The app handles various error scenarios:

- Invalid YouTube URLs
- Videos without available transcripts
- OpenAI API errors
- Network connectivity issues

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [langchain-nextjs-streaming](https://github.com/sachio222/langchain-nextjs-streaming) for streaming implementation patterns
- Built with [Langchain](https://langchain.com/) for AI orchestration
- Uses [OpenAI](https://openai.com/) for language model capabilities
- YouTube transcript extraction via [youtube-transcript](https://www.npmjs.com/package/youtube-transcript)

## Support

If you encounter any issues or have questions:

1. Check the existing [Issues](https://github.com/your-repo/issues)
2. Create a new issue with detailed information
3. Make sure your OpenAI API key is properly configured

---

**Note**: This application downloads audio from YouTube videos and transcribes them using OpenAI Whisper. It works with any YouTube video that has audio, regardless of whether captions are available. The quality of transcription depends on audio clarity and the selected language.
