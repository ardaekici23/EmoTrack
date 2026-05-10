/**
 * Custom hook for emotion detection
 * Manages webcam stream, model loading, and prediction loop
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadFaceDetectionModels } from '../ml/faceDetection';
import { predictEmotion, isVideoReady } from '../ml/emotionPredictor';
import { EmotionPrediction } from '../types/EmotionLog';
import { MODEL_CONFIG, FACE_API_CONFIG } from '../utils/constants';

interface UseEmotionDetectionResult {
  prediction: EmotionPrediction | null;
  isLoading: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
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

  // Load models on mount
  useEffect(() => {
    async function initModels() {
      try {
        setIsLoading(true);
        await loadFaceDetectionModels();
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load models');
        setIsLoading(false);
      }
    }

    initModels();
  }, []);

  // Start webcam and detection
  const startDetection = useCallback(async () => {
    if (isLoading) {
      console.log('Models still loading...');
      return;
    }

    try {
      setError(null);

      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: FACE_API_CONFIG.VIDEO_SIZE.width,
          height: FACE_API_CONFIG.VIDEO_SIZE.height,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });
      }

      setIsActive(true);

      // Start prediction loop
      intervalRef.current = window.setInterval(async () => {
        if (videoRef.current && isVideoReady(videoRef.current)) {
          try {
            const result = await predictEmotion(videoRef.current);
            setPrediction(result);
          } catch (err) {
            console.error('Prediction error:', err);
          }
        }
      }, MODEL_CONFIG.DETECTION_INTERVAL);

      console.log('✓ Emotion detection started');
    } catch (err: any) {
      const errorMessage =
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera access to use emotion detection.'
          : 'Failed to access webcam. Please ensure your camera is connected.';
      setError(errorMessage);
      console.error('Webcam error:', err);
    }
  }, [isLoading]);

  // Stop detection and clean up
  const stopDetection = useCallback(() => {
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop webcam stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setPrediction(null);
    console.log('✓ Emotion detection stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    prediction,
    isLoading,
    error,
    videoRef,
    startDetection,
    stopDetection,
    isActive,
  };
}
