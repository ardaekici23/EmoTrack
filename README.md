# EmoTrack 🎭

> A privacy-first emotion tracking system for remote teams

EmoTrack helps remote teams maintain emotional intelligence and prevent burnout by providing real-time emotion detection and analytics. All video processing happens in the browser - no video data is ever transmitted to servers.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-9-orange.svg)

## ✨ Features

### For Employees
- **Real-Time Emotion Detection**: Webcam-based emotion tracking using face-api.js
- **Personal Dashboard**: View your emotion history with interactive charts
- **Privacy-First**: All processing happens in your browser - no video transmission
- **Break Reminders**: Get notified when sustained stress is detected

### For Managers
- **Team Analytics**: Aggregated, anonymous emotion data for the entire team
- **Date Range Filtering**: Analyze trends over specific time periods
- **Burnout Prevention**: Early warning signs of team stress
- **Privacy-Respecting**: No individual tracking - only aggregate data

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- A Firebase project (free tier works fine)
- A modern web browser with webcam access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ardaekici23/EmoTrack.git
   cd emotrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase** - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📖 Full Documentation

See the complete setup guide, Firebase configuration, security rules, and deployment instructions at:
**[https://github.com/ardaekici23/EmoTrack](https://github.com/ardaekici23/EmoTrack)**

## 🏗️ Tech Stack

- React 18 + TypeScript
- Firebase (Auth + Firestore)
- face-api.js (browser-based emotion detection)
- Recharts (data visualization)
- React Router v6

## 🔒 Privacy

- ✅ All emotion detection happens in the browser
- ✅ Only emotion labels + timestamps are stored
- ✅ No video data is ever transmitted
- ✅ Anonymous team analytics
- ✅ Role-based access control

## 📧 Contact

GitHub: [@ardaekici23](https://github.com/ardaekici23)

---

Built with ❤️ using Create React App
