CREATE TYPE "public"."email_status" AS ENUM('pending', 'scheduled', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subject" varchar(998) NOT NULL,
	"body" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"delay_ms" integer NOT NULL,
	"hourly_limit" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(998) NOT NULL,
	"body" text NOT NULL,
	"sender_id" varchar(100),
	"scheduled_for" timestamp NOT NULL,
	"status" "email_status" DEFAULT 'scheduled' NOT NULL,
	"bull_job_id" varchar(255),
	"sent_at" timestamp,
	"error" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_emails_bull_job_id_unique" UNIQUE("bull_job_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
