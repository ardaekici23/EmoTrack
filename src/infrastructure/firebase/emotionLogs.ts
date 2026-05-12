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
import { db } from './client';
import { EmotionLog, EmotionScores } from '../../domain/emotion/types';
import { FIREBASE_COLLECTIONS } from '../../shared/constants';

export async function logEmotion(
  userId: string,
  dominantEmotion: string,
  confidenceScore: number,
  allScores: EmotionScores
): Promise<string> {
  const ref = await addDoc(collection(db, FIREBASE_COLLECTIONS.EMOTION_LOGS), {
    userId,
    timestamp: Timestamp.now(),
    dominantEmotion,
    confidenceScore,
    allScores,
  });
  return ref.id;
}

function toLog(id: string, data: ReturnType<typeof Object.create>): EmotionLog {
  return {
    logId: id,
    userId: data.userId,
    timestamp: data.timestamp.toDate(),
    dominantEmotion: data.dominantEmotion,
    confidenceScore: data.confidenceScore,
    allScores: data.allScores,
  };
}

function filterByDateRange(logs: EmotionLog[], startDate?: Date, endDate?: Date): EmotionLog[] {
  if (!startDate && !endDate) return logs;
  return logs.filter(log => {
    if (startDate && log.timestamp < startDate) return false;
    if (endDate && log.timestamp > endDate) return false;
    return true;
  });
}

export async function getUserEmotionHistory(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  limit = 100
): Promise<EmotionLog[]> {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    firestoreLimit(limit),
  ];
  const snap = await getDocs(query(collection(db, FIREBASE_COLLECTIONS.EMOTION_LOGS), ...constraints));
  const logs = snap.docs.map(d => toLog(d.id, d.data()));
  return filterByDateRange(logs, startDate, endDate);
}

export async function getTeamEmotionLogs(
  teamId: string,
  startDate?: Date,
  endDate?: Date
): Promise<EmotionLog[]> {
  const usersSnap = await getDocs(
    query(collection(db, FIREBASE_COLLECTIONS.USERS), where('teamId', '==', teamId))
  );
  const userIds = usersSnap.docs.map(d => d.id);
  if (userIds.length === 0) return [];

  const allLogs: EmotionLog[] = [];
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    const snap = await getDocs(
      query(
        collection(db, FIREBASE_COLLECTIONS.EMOTION_LOGS),
        where('userId', 'in', batch),
        orderBy('timestamp', 'desc')
      )
    );
    snap.docs.forEach(d => allLogs.push(toLog(d.id, d.data())));
  }

  return filterByDateRange(allLogs, startDate, endDate);
}

export function getEmotionStatistics(logs: EmotionLog[]): Record<string, number> {
  return logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.dominantEmotion] = (acc[log.dominantEmotion] || 0) + 1;
    return acc;
  }, {});
}

export function getMostCommonEmotion(logs: EmotionLog[]): string | null {
  if (logs.length === 0) return null;
  const stats = Object.entries(getEmotionStatistics(logs));
  if (stats.length === 0) return null;
  return stats.reduce((max, entry) => entry[1] > max[1] ? entry : max)[0];
}
