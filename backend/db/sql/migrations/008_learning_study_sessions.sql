-- 002_pdf_scope dropped the original "StudySession" table. Streaks and the
-- weekly goal need one row per student/day, so recreate a dedicated table for
-- the learning features instead of reintroducing the removed dashboard table.

CREATE TABLE IF NOT EXISTS learning_study_sessions (
  "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "day" DATE NOT NULL,
  "minutes" INTEGER NOT NULL CHECK ("minutes" > 0),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  PRIMARY KEY ("user_id", "day")
);

CREATE INDEX IF NOT EXISTS "learning_study_sessions_user_day_idx"
  ON learning_study_sessions ("user_id", "day" DESC);
