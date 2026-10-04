CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`profile` text NOT NULL,
	`target_overrides` text NOT NULL,
	`allergies` text NOT NULL,
	`profile_saved` integer NOT NULL,
	`updated_at` integer NOT NULL
);
