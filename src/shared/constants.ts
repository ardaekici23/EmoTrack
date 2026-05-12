export const EMOTION_LABELS = [
  'Angry', 'Disgusted', 'Fearful', 'Happy', 'Neutral', 'Sad', 'Surprised',
] as const;

export type EmotionLabel = typeof EMOTION_LABELS[number];

export const MODEL_CONFIG = {
  INPUT_SIZE: 48,
  NUM_CLASSES: 7,
  MODEL_PATH: '/models/model.json',
  DETECTION_INTERVAL: 3000,
  MIN_CONFIDENCE_THRESHOLD: 0.3,
};

export const FACE_API_CONFIG = {
  MODEL_PATH: '/models/face-api-models/',
  DETECTION_OPTIONS: {
    inputSize: 224,
    scoreThreshold: 0.5,
  },
  VIDEO_SIZE: {
    width: 640,
    height: 480,
  },
};

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  EMOTION_LOGS: 'emotionLogs',
  SESSION_DATA: 'sessionData',
};

export const USER_ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  EMPLOYEE_DASHBOARD: '/employee-dashboard',
  MANAGER_DASHBOARD: '/manager-dashboard',
  UNAUTHORIZED: '/unauthorized',
};

export const EMOTION_COLORS: Record<EmotionLabel, string> = {
  Angry: '#ff4444',
  Disgusted: '#9c27b0',
  Fearful: '#ff9800',
  Happy: '#4caf50',
  Neutral: '#2196f3',
  Sad: '#607d8b',
  Surprised: '#ffeb3b',
};

export const DATE_RANGE_PRESETS = {
  TODAY: 'today',
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  CUSTOM: 'custom',
} as const;

export type DateRangePreset = typeof DATE_RANGE_PRESETS[keyof typeof DATE_RANGE_PRESETS];
