# AI System Design Interview Assistant

An interactive application that provides real-time assistance during system design interviews using AI-powered suggestions, architecture visualization, and performance analysis.

## Features

- **Real-time Interview Assistance**: Get AI-powered suggestions during your system design interview
- **Voice Recognition**: Automatic transcription of interview conversations
- **Architecture Visualization**: Visualize system design components and relationships
- **Performance Analysis**: Receive feedback and scoring on your interview performance
- **Session Review**: Review past interview sessions with detailed feedback
- **Common System Design Topics**: Access a library of common system design interview topics

## Tech Stack

- **Frontend**: React with Material UI
- **Voice Processing**: Web Speech API and OpenAI Whisper
- **AI Integration**: OpenAI GPT models
- **Desktop Application**: Electron
- **Build Tool**: Vite

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (for AI features)

## Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/interview-copilot.git
cd interview-copilot
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your OpenAI API key

```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

## Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the Vite development server and open the application in your default browser.

## Building for Production

Build the application for production:

```bash
npm run build
# or
yarn build
```

This will generate a production-ready build in the `dist` directory and package the Electron application.

## Usage

1. **Start a New Interview**: Click on "Start New Interview" on the dashboard to begin a new interview session
2. **Record Your Interview**: Use the microphone button to start/stop recording your interview conversation
3. **Review Suggestions**: View real-time AI suggestions, potential follow-up questions, and architecture notes
4. **Save and Review**: Save your session and review it later with detailed feedback and scores

## Settings

You can customize the application through the Settings page:

- **Audio Settings**: Configure microphone input and audio quality
- **AI Settings**: Select AI models and adjust response parameters
- **Privacy Settings**: Control data retention and sharing options
- **UI Settings**: Toggle dark mode and select language

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the AI models
- Material UI for the component library
- Electron for enabling desktop application functionality