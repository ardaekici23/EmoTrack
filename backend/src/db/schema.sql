CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(50)  NOT NULL CHECK (role IN ('employee', 'manager')),
  team_id     VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emotion_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp        TIMESTAMP DEFAULT NOW(),
  dominant_emotion VARCHAR(50) NOT NULL,
  confidence_score FLOAT NOT NULL,
  all_scores       JSONB
);

CREATE INDEX IF NOT EXISTS idx_emotion_logs_user_id  ON emotion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_timestamp ON emotion_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_team_id          ON users(team_id);

CREATE TABLE IF NOT EXISTS teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  manager_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);

CREATE TABLE IF NOT EXISTS events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  manager_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id      UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                 CHECK (status IN ('scheduled', 'active', 'ended')),
  scheduled_at TIMESTAMP,
  started_at   TIMESTAMP,
  ended_at     TIMESTAMP,
  created_at   TIMESTAMP   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_manager_id ON events(manager_id);
CREATE INDEX IF NOT EXISTS idx_events_team_id    ON events(team_id);
CREATE INDEX IF NOT EXISTS idx_events_status     ON events(status);

CREATE TABLE IF NOT EXISTS event_participants (
  event_id  UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

ALTER TABLE emotion_logs ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_emotion_logs_event_id ON emotion_logs(event_id);
