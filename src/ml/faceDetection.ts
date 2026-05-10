/**
 * Face detection module using face-api.js
 */

import * as faceapi from 'face-api.js';
import { FACE_API_CONFIG } from '../utils/constants';

let modelsLoaded = false;

/**
 * Load face-api.js models
 * Loads: Tiny Face Detector, Face Landmarks, Face Expression (emotion) models
 */
export async function loadFaceDetectionModels(): Promise<void> {
  if (modelsLoaded) {
    console.log('Face detection models already loaded');
    return;
  }

  try {
    console.log('Loading face detection models...');

    const modelPath = FACE_API_CONFIG.MODEL_PATH;

    // Load required models in parallel
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
    ]);

    modelsLoaded = true;
    console.log('✓ Face detection models loaded successfully');
  } catch (error) {
    console.error('Failed to load face detection models:', error);
    throw new Error('Failed to load face detection models. Check model files exist.');
  }
}

/**
 * Detect face and expressions from video element
 */
export async function detectFaceWithExpressions(
  videoElement: HTMLVideoElement
): Promise<faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<faceapi.WithFaceDescriptor<faceapi.FaceDetection>>> | null> {
  if (!modelsLoaded) {
    throw new Error('Face detection models not loaded. Call loadFaceDetectionModels() first.');
  }

  try {
    // Detect single face with landmarks and expressions
    const detection = await faceapi
      .detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions(FACE_API_CONFIG.DETECTION_OPTIONS)
      )
      .withFaceLandmarks()
      .withFaceExpressions();

    return detection || null;
  } catch (error) {
    console.error('Error detecting face:', error);
    return null;
  }
}

/**
 * Check if face detection models are loaded
 */
export function areFaceModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Get the dominant expression from face-api.js expressions
 */
export function getDominantExpression(
  expressions: faceapi.FaceExpressions
): { expression: string; confidence: number } {
  // face-api.js provides: neutral, happy, sad, angry, fearful, disgusted, surprised
  const emotionScores = {
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

  Object.entries(emotionScores).forEach(([emotion, score]) => {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  });

  // Capitalize first letter to match our EmotionLabel format
  const formattedEmotion =
    maxEmotion.charAt(0).toUpperCase() + maxEmotion.slice(1);

  return {
    expression: formattedEmotion,
    confidence: maxScore,
  };
}
