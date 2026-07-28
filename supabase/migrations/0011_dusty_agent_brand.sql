CREATE TABLE "puberty" (
	"id" serial PRIMARY KEY NOT NULL,
	"pubarche" boolean,
	"pubarche_age" integer,
	"thelarche" boolean,
	"thelarche_age" integer,
	"menarche" boolean,
	"menarche_age" integer,
	"voice_change" boolean,
	"voice_change_age" integer,
	"testicular_growth" boolean,
	"testicular_growth_age" integer,
	"additional_notes" text,
	"vital_id" integer NOT NULL,
	CONSTRAINT "puberty_vital_id_unique" UNIQUE("vital_id")
);
--> statement-breakpoint
ALTER TABLE "puberty" ADD CONSTRAINT "puberty_vital_id_vitals_id_fk" FOREIGN KEY ("vital_id") REFERENCES "public"."vitals"("id") ON DELETE cascade ON UPDATE no action;