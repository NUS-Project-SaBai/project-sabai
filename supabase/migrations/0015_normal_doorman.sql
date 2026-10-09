CREATE TABLE "child_vitals" (
	"id" serial PRIMARY KEY NOT NULL,
	"gross_motor" text,
	"red_reflex" text,
	"scoliosis" text,
	"pallor" boolean,
	"oral_cavity" text,
	"heart" text,
	"abdomen" text,
	"lungs" text,
	"hernial_orifices" text,
	"vital_id" integer NOT NULL,
	CONSTRAINT "child_vitals_vital_id_unique" UNIQUE("vital_id")
);
--> statement-breakpoint
ALTER TABLE "child_vitals" ADD CONSTRAINT "child_vitals_vital_id_vitals_id_fk" FOREIGN KEY ("vital_id") REFERENCES "public"."vitals"("id") ON DELETE cascade ON UPDATE no action;