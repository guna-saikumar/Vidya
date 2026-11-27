-- Learning engagement features: XP/streaks/goals, doubts, assignments and glossary.
-- Binary uploads stay on disk under uploads/doubts; only metadata lives in Postgres.

CREATE TABLE IF NOT EXISTS learning_xp_events (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "points" INTEGER NOT NULL CHECK ("points" > 0),
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS "learning_xp_events_user_id_idx"
  ON learning_xp_events ("user_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS learning_badges (
  "code" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'emoji-events',
  "points" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS learning_student_badges (
  "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "badge_code" TEXT NOT NULL REFERENCES learning_badges("code") ON DELETE CASCADE,
  "earned_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  PRIMARY KEY ("user_id", "badge_code")
);

CREATE TABLE IF NOT EXISTS learning_weekly_goals (
  "user_id" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "week_start" DATE NOT NULL,
  "target_minutes" INTEGER NOT NULL DEFAULT 120 CHECK ("target_minutes" > 0),
  "progress_minutes" INTEGER NOT NULL DEFAULT 0 CHECK ("progress_minutes" >= 0),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE IF NOT EXISTS learning_doubts (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "class_id" TEXT REFERENCES "SchoolClass"("id") ON DELETE SET NULL,
  "subject_id" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
  "chapter_id" TEXT REFERENCES "Chapter"("id") ON DELETE SET NULL,
  "section_id" TEXT REFERENCES "Section"("id") ON DELETE SET NULL,
  "question" TEXT NOT NULL,
  "details" TEXT NOT NULL DEFAULT '',
  "photo_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open'
    CHECK ("status" IN ('open', 'escalated', 'answered', 'resolved')),
  "teacher_note" TEXT NOT NULL DEFAULT '',
  "escalated_at" TIMESTAMP(3),
  "answered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS "learning_doubts_user_id_idx"
  ON learning_doubts ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "learning_doubts_status_idx"
  ON learning_doubts ("status", "created_at" DESC);

CREATE TABLE IF NOT EXISTS learning_assignments (
  "id" TEXT PRIMARY KEY,
  -- Admin console may authenticate with the shared token ("admin-root"), which
  -- is not a User row; keep this as a plain audit label rather than a FK.
  "teacher_id" TEXT NOT NULL,
  "class_id" TEXT REFERENCES "SchoolClass"("id") ON DELETE CASCADE,
  "subject_id" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
  "chapter_id" TEXT REFERENCES "Chapter"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "due_at" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'published'
    CHECK ("status" IN ('draft', 'published', 'archived')),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS "learning_assignments_class_idx"
  ON learning_assignments ("class_id", "due_at");

CREATE TABLE IF NOT EXISTS learning_assignment_submissions (
  "id" TEXT PRIMARY KEY,
  "assignment_id" TEXT NOT NULL REFERENCES learning_assignments("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'submitted', 'late', 'graded')),
  "note" TEXT NOT NULL DEFAULT '',
  "submitted_at" TIMESTAMP(3),
  "score" INTEGER,
  "feedback" TEXT NOT NULL DEFAULT '',
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  UNIQUE ("assignment_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "learning_assignment_submissions_user_idx"
  ON learning_assignment_submissions ("user_id", "status");

CREATE TABLE IF NOT EXISTS learning_glossary (
  "term" TEXT PRIMARY KEY,
  "english" TEXT NOT NULL,
  "hindi" TEXT NOT NULL,
  "pronunciation" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL DEFAULT 'general'
);

INSERT INTO learning_badges ("code", "name", "description", "icon", "points") VALUES
  ('first-step', 'First Step', 'Completed your first learning activity', 'check-circle', 10),
  ('streak-7', 'Week Warrior', 'Studied for 7 days in a row', 'local-fire-department', 40),
  ('curious-mind', 'Curious Mind', 'Asked your first doubt', 'question-answer', 15),
  ('assignment-star', 'Assignment Star', 'Submitted a teacher assignment', 'assignment', 25)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "points" = EXCLUDED."points";

INSERT INTO learning_glossary ("term", "english", "hindi", "pronunciation", "category") VALUES
  ('Rational number', 'A number that can be written as p/q, where p and q are integers and q is not zero.', 'एक संख्या जिसे p/q के रूप में लिखा जा सकता है, जहाँ p और q पूर्णांक हैं और q शून्य नहीं है।', 'rash-nul number', 'Mathematics'),
  ('Numerator', 'The top number in a fraction; it tells how many parts are taken.', 'भिन्न के ऊपर वाली संख्या, जो बताती है कि कितने भाग लिए गए हैं।', 'nyoo-marey-ter', 'Mathematics'),
  ('Denominator', 'The bottom number in a fraction; it tells how many equal parts make the whole.', 'भिन्न के नीचे वाली संख्या, जो बताती है कि पूरे को कितने बराबर भागों में बाँटा गया है।', 'di-nom-i-net-er', 'Mathematics'),
  ('Photosynthesis', 'The process by which green plants make food using sunlight, water and carbon dioxide.', 'हरित पौधों द्वारा सूर्य प्रकाश, जल और कार्बन डाइऑक्साइड का उपयोग करके भोजन बनाने की प्रक्रिया।', 'foh-toh-sin-thuh-sis', 'Science'),
  ('Ecosystem', 'A community of living organisms interacting with each other and with their physical environment.', 'जीवों का समुदाय जो आपस में और अपने भौतिक पर्यावरण के साथ परस्पर क्रिया करता है।', 'ee-koh-sis-tem', 'Science'),
  ('Force', 'A push or pull that can change the motion or shape of an object.', 'धक्का या खिंचाव जो किसी वस्तु की गति या आकार बदल सकता है।', 'fors', 'Science'),
  ('Democracy', 'A system of government where citizens choose their representatives through free elections.', 'शासन की वह प्रणाली जिसमें नागरिक स्वतंत्र चुनावों के माध्यम से अपने प्रतिनिधि चुनते हैं।', 'di-mok-ruh-see', 'Social Science'),
  ('Constitution', 'The supreme law of a country that defines the organisation and powers of government.', 'देश का सर्वोच्च कानून जो सरकार के गठन और शक्तियों को परिभाषित करता है।', 'kon-sti-tyoo-shun', 'Social Science'),
  ('Noun', 'A word that names a person, place, thing, or idea.', 'ऐसा शब्द जो किसी व्यक्ति, स्थान, वस्तु या विचार का नाम बताता है।', 'noun', 'English'),
  ('Metaphor', 'A figure of speech that compares two things directly without using “like” or “as”.', 'ऐसा अलंकार जो बिना “जैसे” का उपयोग किए दो चीज़ों की सीधी तुलना करता है।', 'met-uh-for', 'English')
ON CONFLICT ("term") DO UPDATE SET
  "english" = EXCLUDED."english",
  "hindi" = EXCLUDED."hindi",
  "pronunciation" = EXCLUDED."pronunciation",
  "category" = EXCLUDED."category";
