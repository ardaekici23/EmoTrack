-- Run this against an existing emotrack database to add team management and events support.
-- All statements are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

ALTER TABLE users ALTER COLUMN team_id DROP NOT NULL;

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
