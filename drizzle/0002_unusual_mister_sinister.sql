CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`slot` text NOT NULL,
	`status` text NOT NULL,
	`food_id` integer,
	`grams` real,
	`recipe_id` integer,
	`servings` real,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entries_date` ON `entries` (`date`);--> statement-breakpoint
CREATE TABLE `shopping_checks` (
	`week` text NOT NULL,
	`food_id` integer NOT NULL,
	PRIMARY KEY(`week`, `food_id`)
);
