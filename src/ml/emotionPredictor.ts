/**
 * Emotion predictor
 * Orchestrates face detection and emotion prediction
 */

import {
  detectFaceWithExpressions,
  getDominantExpression,
} from './faceDetection';
import { EmotionPrediction, EmotionScores } from '../types/EmotionLog';
import { EmotionLabel } from '../utils/constants';

/**
 * Predict emotion from video element
 */
export async function predictEmotion(
  videoElement: HTMLVideoElement
): Promise<EmotionPrediction> {
  try {
    // Detect face with expressions
    const detection = await detectFaceWithExpressions(videoElement);

    if (!detection) {
      // No face detected
      return createEmptyPrediction();
    }

    // Get expressions
    const expressions = detection.expressions;

    // face-api.js returns expressions as lowercase, but we need proper casing
    const allScores: EmotionScores = {
      angry: expressions.angry,
      disgusted: expressions.disgusted,
      fearful: expressions.fearful,
      happy: expressions.happy,
      neutral: expressions.neutral,
      sad: expressions.sad,
      surprised: expressions.surprised,
    };

    // Get dominant emotion
    const { expression, confidence } = getDominantExpression(expressions);

    return {
      dominantEmotion: expression as EmotionLabel,
      confidence,
      allScores,
      faceDetected: true,
    };
  } catch (error) {
    console.error('Error predicting emotion:', error);
    return createEmptyPrediction();
  }
}

/**
 * Create an empty prediction (no face detected)
 */
function createEmptyPrediction(): EmotionPrediction {
  return {
    dominantEmotion: 'Neutral',
    confidence: 0,
    allScores: {
      angry: 0,
      disgusted: 0,
      fearful: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
      surprised: 0,
    },
    faceDetected: false,
  };
}

/**
 * Validate video element is ready for detection
 */
export function isVideoReady(videoElement: HTMLVideoElement | null): boolean {
  if (!videoElement) return false;
  if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) return false;
  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) return false;
  return true;
}
