import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadFaceDetectionModels } from '../../infrastructure/faceDetection/detector';
import { predictEmotion, isVideoReady } from '../../domain/emotion/predictor';
import { EmotionPrediction } from '../../domain/emotion/types';
import { MODEL_CONFIG, FACE_API_CONFIG } from '../../shared/constants';

export interface UseEmotionDetectionResult {
  prediction: EmotionPrediction | null;
  isLoading: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  isActive: boolean;
}

export function useEmotionDetection(): UseEmotionDetectionResult {
  const [prediction, setPrediction] = useState<EmotionPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadFaceDetectionModels()
      .then(() => { setIsLoading(false); setError(null); })
      .catch((err: Error) => { setError(err.message || 'Failed to load models'); setIsLoading(false); });
  }, []);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    setPrediction(null);
  }, []);

  const startDetection = useCallback(async () => {
    if (isLoading) return;
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: FACE_API_CONFIG.VIDEO_SIZE.width, height: FACE_API_CONFIG.VIDEO_SIZE.height },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>(resolve => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); resolve(); };
          }
        });
      }

      setIsActive(true);
      intervalRef.current = window.setInterval(async () => {
        if (videoRef.current && isVideoReady(videoRef.current)) {
          try { setPrediction(await predictEmotion(videoRef.current)); } catch { /* non-fatal */ }
        }
      }, MODEL_CONFIG.DETECTION_INTERVAL);
    } catch (err: unknown) {
      const denied = err instanceof Error && err.name === 'NotAllowedError';
      setError(denied
        ? 'Camera access denied. Please allow camera access to use emotion detection.'
        : 'Failed to access webcam. Please ensure your camera is connected.');
    }
  }, [isLoading]);

  useEffect(() => () => stopDetection(), [stopDetection]);

  return { prediction, isLoading, error, videoRef, startDetection, stopDetection, isActive };
}
