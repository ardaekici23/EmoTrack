import * as faceapi from 'face-api.js';
import { FACE_API_CONFIG } from '../../shared/constants';

let modelsLoaded = false;

// The chain .detectSingleFace().withFaceLandmarks().withFaceExpressions() produces this type.
// WithFaceDescriptor is excluded because we don't call .withFaceDescriptors().
type DetectionResult = faceapi.WithFaceExpressions<
  faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>
>;

export async function loadFaceDetectionModels(): Promise<void> {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_CONFIG.MODEL_PATH),
    faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_CONFIG.MODEL_PATH),
    faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_CONFIG.MODEL_PATH),
  ]);
  modelsLoaded = true;
}

export async function detectFaceWithExpressions(
  videoElement: HTMLVideoElement
): Promise<DetectionResult | null> {
  if (!modelsLoaded) throw new Error('Face detection models not loaded');
  try {
    const result = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions(FACE_API_CONFIG.DETECTION_OPTIONS))
      .withFaceLandmarks()
      .withFaceExpressions();
    return result ?? null;
  } catch {
    return null;
  }
}

export function areFaceModelsLoaded(): boolean {
  return modelsLoaded;
}

export function getDominantExpression(
  expressions: faceapi.FaceExpressions
): { expression: string; confidence: number } {
  const scores: Record<string, number> = {
    neutral: expressions.neutral,
    happy: expressions.happy,
    sad: expressions.sad,
    angry: expressions.angry,
    fearful: expressions.fearful,
    disgusted: expressions.disgusted,
    surprised: expressions.surprised,
  };

  let maxEmotion = 'neutral';
  let maxScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) { maxScore = score; maxEmotion = emotion; }
  }

  return {
    expression: maxEmotion.charAt(0).toUpperCase() + maxEmotion.slice(1),
    confidence: maxScore,
  };
}
