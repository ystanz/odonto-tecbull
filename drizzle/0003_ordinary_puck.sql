PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`room` text,
	`address` text,
	`contact` text,
	`notes` text,
	`created_at` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_locations`("id", "client_id", "name", "room", "address", "contact", "notes", "created_at") SELECT "id", "client_id", "name", "room", "address", "contact", "notes", "created_at" FROM `locations`;--> statement-breakpoint
DROP TABLE `locations`;--> statement-breakpoint
ALTER TABLE `__new_locations` RENAME TO `locations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `clients` ADD `responsible_name` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `email` text;