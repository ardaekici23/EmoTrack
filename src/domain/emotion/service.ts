import { logEmotion } from '../../infrastructure/api/emotionLogs';
import { EmotionPrediction } from './types';
import { MODEL_CONFIG } from '../../shared/constants';

export async function saveEmotionLog(userId: string, prediction: EmotionPrediction, eventId?: string): Promise<void> {
  if (!prediction.faceDetected) return;
  if (prediction.confidence < MODEL_CONFIG.MIN_CONFIDENCE_THRESHOLD) return;
  try {
    await logEmotion(userId, prediction.dominantEmotion, prediction.confidence, prediction.allScores, eventId);
  } catch (error) {
    console.error('Failed to save emotion log:', error);
  }
}

export function calculateAverageConfidence(predictions: EmotionPrediction[]): number {
  if (predictions.length === 0) return 0;
  return predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length;
}

export function shouldSuggestBreak(recentPredictions: EmotionPrediction[]): boolean {
  if (recentPredictions.length < 5) return false;
  const negative = new Set(['Angry', 'Disgusted', 'Fearful', 'Sad']);
  const negCount = recentPredictions.filter(p => negative.has(p.dominantEmotion)).length;
  return negCount / recentPredictions.length > 0.6;
}
