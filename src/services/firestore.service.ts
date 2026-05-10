/**
 * Firestore service
 * Handles database operations for emotion logs and team data
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit as firestoreLimit,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { EmotionLog, EmotionScores } from '../types/EmotionLog';
import { FIREBASE_COLLECTIONS } from '../utils/constants';

/**
 * Log an emotion detection result to Firestore
 */
export async function logEmotion(
  userId: string,
  dominantEmotion: string,
  confidenceScore: number,
  allScores: EmotionScores
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.EMOTION_LOGS), {
      userId,
      timestamp: Timestamp.now(),
      dominantEmotion,
      confidenceScore,
      allScores,
    });

    console.log('✓ Emotion logged:', dominantEmotion, `(${(confidenceScore * 100).toFixed(1)}%)`);
    return docRef.id;
  } catch (error) {
    console.error('Error logging emotion:', error);
    throw error;
  }
}

/**
 * Get emotion history for a specific user
 */
export async function getUserEmotionHistory(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<EmotionLog[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit),
    ];

    const q = query(collection(db, FIREBASE_COLLECTIONS.EMOTION_LOGS), ...constraints);
    const querySnapshot = await getDocs(q);

    const logs: EmotionLog[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        logId: doc.id,
        userId: data.userId,
        timestamp: data.timestamp.toDate(),
        dominantEmotion: data.dominantEmotion,
        confidenceScore: data.confidenceScore,
        allScores: data.allScores,
      };
    });

    // Client-side filtering for date range (or use Firestore composite indexes)
    let filteredLogs = logs;
    if (startDate || endDate) {
      filteredLogs = logs.filter((log) => {
        if (startDate && log.timestamp < startDate) return false;
        if (endDate && log.timestamp > endDate) return false;
        return true;
      });
    }

    console.log(`✓ Retrieved ${filteredLogs.length} emotion logs for user ${userId}`);
    return filteredLogs;
  } catch (error) {
    console.error('Error fetching user emotion history:', error);
    throw error;
  }
}

/**
 * Get emotion logs for all users in a team (for manager dashboard)
 */
export async function getTeamEmotionLogs(
  teamId: string,
  startDate?: Date,
  endDate?: Date
): Promise<EmotionLog[]> {
  try {
    // First, get all users in the team
    const usersQuery = query(
      collection(db, FIREBASE_COLLECTIONS.USERS),
      where('teamId', '==', teamId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const userIds = usersSnapshot.docs.map((doc) => doc.id);

    if (userIds.length === 0) {
      console.log('No users found in team:', teamId);
      return [];
    }

    console.log(`Found ${userIds.length} users in team ${teamId}`);

    // Fetch emotion logs for all team members
    // Note: Firestore 'in' queries are limited to 10 items, so we batch if needed
    const allLogs: EmotionLog[] = [];

    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const logsQuery = query(
        collection(db, FIREBASE_COLLECTIONS.EMOTION_LOGS),
        where('userId', 'in', batch),
        orderBy('timestamp', 'desc')
      );

      const logsSnapshot = await getDocs(logsQuery);
      const logs = logsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          logId: doc.id,
          userId: data.userId,
          timestamp: data.timestamp.toDate(),
          dominantEmotion: data.dominantEmotion,
          confidenceScore: data.confidenceScore,
          allScores: data.allScores,
        };
      });

      allLogs.push(...logs);
    }

    // Filter by date range
    let filteredLogs = allLogs;
    if (startDate || endDate) {
      filteredLogs = allLogs.filter((log) => {
        if (startDate && log.timestamp < startDate) return false;
        if (endDate && log.timestamp > endDate) return false;
        return true;
      });
    }

    console.log(`✓ Retrieved ${filteredLogs.length} emotion logs for team ${teamId}`);
    return filteredLogs;
  } catch (error) {
    console.error('Error fetching team emotion logs:', error);
    throw error;
  }
}

/**
 * Get aggregated emotion statistics for a user
 */
export function getEmotionStatistics(logs: EmotionLog[]): Record<string, number> {
  const stats: Record<string, number> = {};

  logs.forEach((log) => {
    const emotion = log.dominantEmotion;
    stats[emotion] = (stats[emotion] || 0) + 1;
  });

  return stats;
}

/**
 * Get the most common emotion from logs
 */
export function getMostCommonEmotion(logs: EmotionLog[]): string | null {
  if (logs.length === 0) return null;

  const stats = getEmotionStatistics(logs);
  const entries = Object.entries(stats);

  if (entries.length === 0) return null;

  return entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max))[0];
}
