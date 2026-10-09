CREATE TYPE "public"."broadcast_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"severity" "broadcast_severity" DEFAULT 'info' NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL
);
