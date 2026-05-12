import { detectFaceWithExpressions, getDominantExpression } from '../../infrastructure/faceDetection/detector';
import { EmotionPrediction, EmotionScores } from './types';
import { EmotionLabel } from '../../shared/constants';

const EMPTY_SCORES: EmotionScores = {
  angry: 0, disgusted: 0, fearful: 0, happy: 0, neutral: 0, sad: 0, surprised: 0,
};

function emptyPrediction(): EmotionPrediction {
  return { dominantEmotion: 'Neutral', confidence: 0, allScores: { ...EMPTY_SCORES }, faceDetected: false };
}

export async function predictEmotion(videoElement: HTMLVideoElement): Promise<EmotionPrediction> {
  try {
    const detection = await detectFaceWithExpressions(videoElement);
    if (!detection) return emptyPrediction();

    const { expressions } = detection;
    const allScores: EmotionScores = {
      angry: expressions.angry,
      disgusted: expressions.disgusted,
      fearful: expressions.fearful,
      happy: expressions.happy,
      neutral: expressions.neutral,
      sad: expressions.sad,
      surprised: expressions.surprised,
    };

    const { expression, confidence } = getDominantExpression(expressions);
    return { dominantEmotion: expression as EmotionLabel, confidence, allScores, faceDetected: true };
  } catch {
    return emptyPrediction();
  }
}

export function isVideoReady(videoElement: HTMLVideoElement | null): boolean {
  if (!videoElement) return false;
  if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) return false;
  return videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
}
