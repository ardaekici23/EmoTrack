/**
 * Emotion service
 * Handles emotion detection and logging
 */

import { logEmotion } from './firestore.service';
import { EmotionPrediction } from '../types/EmotionLog';
import { MODEL_CONFIG } from '../utils/constants';

/**
 * Save an emotion prediction to the database
 * Only logs if face was detected and confidence is above threshold
 */
export async function saveEmotionLog(
  userId: string,
  prediction: EmotionPrediction
): Promise<void> {
  // Validate prediction
  if (!prediction.faceDetected) {
    console.log('Skipping log: No face detected');
    return;
  }

  if (prediction.confidence < MODEL_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
    console.log(
      `Skipping log: Confidence too low (${(prediction.confidence * 100).toFixed(1)}%)`
    );
    return;
  }

  try {
    await logEmotion(
      userId,
      prediction.dominantEmotion,
      prediction.confidence,
      prediction.allScores
    );
  } catch (error) {
    console.error('Failed to save emotion log:', error);
    // Don't throw - we don't want to break the detection loop
  }
}

/**
 * Calculate average confidence from recent predictions
 */
export function calculateAverageConfidence(predictions: EmotionPrediction[]): number {
  if (predictions.length === 0) return 0;

  const sum = predictions.reduce((acc, pred) => acc + pred.confidence, 0);
  return sum / predictions.length;
}

/**
 * Determine if user should take a break based on stress indicators
 * Returns true if sustained negative emotions are detected
 */
export function shouldSuggestBreak(recentPredictions: EmotionPrediction[]): boolean {
  if (recentPredictions.length < 5) return false;

  // Count negative emotions (Angry, Disgusted, Fearful, Sad)
  const negativeEmotions = ['Angry', 'Disgusted', 'Fearful', 'Sad'];
  const negativeCount = recentPredictions.filter((pred) =>
    negativeEmotions.includes(pred.dominantEmotion)
  ).length;

  // Suggest break if more than 60% of recent predictions are negative
  const threshold = 0.6;
  return negativeCount / recentPredictions.length > threshold;
}
