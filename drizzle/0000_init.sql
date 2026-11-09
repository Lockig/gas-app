CREATE TABLE "fuel_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"fuel_type" text,
	"price_per_liter" double precision NOT NULL,
	"price_source" text DEFAULT 'manual' NOT NULL,
	"amount" double precision NOT NULL,
	"liters" double precision NOT NULL,
	"odometer" double precision,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
