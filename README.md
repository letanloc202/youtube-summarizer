# YouTube Content Summarizer

A Next.js application that uses Langchain and OpenAI to provide AI-powered summaries of YouTube videos with real-time streaming responses.

## Features

- 🎥 **YouTube Video Analysis**: Extract and analyze content from any YouTube video with captions
- 🤖 **AI-Powered Summarization**: Uses OpenAI's GPT models via Langchain for intelligent content summarization
- ⚡ **Streaming Responses**: Real-time streaming of AI responses for immediate feedback
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- 📱 **Mobile Friendly**: Optimized for all device sizes

## How It Works

1. **Input YouTube URL**: Paste any YouTube video URL that has captions/subtitles available
2. **Transcript Extraction**: The app extracts the video transcript using the YouTube Transcript API
3. **AI Processing**: Langchain processes the transcript with OpenAI's GPT model
4. **Streaming Summary**: Get a structured summary with real-time streaming responses

## Prerequisites

- Node.js 18+
- OpenAI API key

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd youtube-summarizer
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser**:
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
- **AI/ML**: Langchain, OpenAI GPT-3.5-turbo
- **Video Processing**: YouTube Transcript API
- **Streaming**: ReadableStream API for real-time responses

## Project Structure

```
youtube-summarizer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── summarize/
│   │   │       └── route.js          # Streaming API endpoint
│   │   ├── globals.css               # Global styles
│   │   ├── layout.js                 # App layout
│   │   └── page.js                   # Home page
│   └── components/
│       └── YouTubeSummarizer.js      # Main component
├── .env.local                        # Environment variables
├── package.json                      # Dependencies
└── README.md                         # This file
```

## API Endpoints

### `POST /api/summarize`

Summarizes YouTube video content with streaming response.

**Request Body:**

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
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

**Note**: This application requires YouTube videos to have captions/subtitles available. Videos without transcripts cannot be summarized.
