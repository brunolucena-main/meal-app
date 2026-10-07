CREATE TABLE `custom_foods` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`category` text,
	`nutrients` text NOT NULL,
	`portions` text NOT NULL,
	`allergens` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
