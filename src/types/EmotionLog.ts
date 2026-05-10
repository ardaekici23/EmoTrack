/**
 * Emotion log type definitions
 */

import { EmotionLabel } from '../utils/constants';

export interface EmotionScores {
  angry: number;
  disgusted: number;
  fearful: number;
  happy: number;
  neutral: number;
  sad: number;
  surprised: number;
}

export interface EmotionLog {
  logId: string;
  userId: string;
  timestamp: Date;
  dominantEmotion: EmotionLabel;
  confidenceScore: number;
  allScores?: EmotionScores;
}

export interface EmotionPrediction {
  dominantEmotion: EmotionLabel;
  confidence: number;
  allScores: EmotionScores;
  faceDetected: boolean;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  loginTime: Date;
  logoutTime?: Date;
  focusDuration?: number; // in minutes
}
