CREATE TYPE "public"."definition_source" AS ENUM('dictionary', 'llm');--> statement-breakpoint
CREATE TYPE "public"."import_job_status" AS ENUM('pending', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "definition_cache" (
	"term" text PRIMARY KEY NOT NULL,
	"definition" text NOT NULL,
	"examples" jsonb NOT NULL,
	"source" "definition_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "import_job_status" DEFAULT 'pending' NOT NULL,
	"total_terms" integer NOT NULL,
	"added_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"grade" integer NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srs_state" (
	"word_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"examples" jsonb NOT NULL,
	"source" "definition_source" NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_state" ADD CONSTRAINT "srs_state_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_state" ADD CONSTRAINT "srs_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_user_time_idx" ON "review_log" USING btree ("user_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "srs_due_idx" ON "srs_state" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "words_user_term_idx" ON "words" USING btree ("user_id","term");--> statement-breakpoint
CREATE INDEX "words_user_idx" ON "words" USING btree ("user_id");