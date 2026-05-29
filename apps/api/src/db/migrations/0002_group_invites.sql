CREATE TABLE IF NOT EXISTS "group_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"room_code" text NOT NULL,
	"email" text NOT NULL,
	"invited_by_uid" text NOT NULL,
	"group_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
