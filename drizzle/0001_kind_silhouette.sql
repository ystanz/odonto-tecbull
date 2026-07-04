PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_equipments` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`location_id` text,
	`serial_number` text,
	`installation_date` text,
	`manufacturer` text,
	`warranty_until` text,
	`status` text DEFAULT 'Ativo' NOT NULL,
	`next_service_date` text,
	`created_at` text,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_equipments`("id", "code", "name", "location_id", "serial_number", "installation_date", "manufacturer", "warranty_until", "status", "next_service_date", "created_at") SELECT "id", "code", "name", "location_id", "serial_number", "installation_date", "manufacturer", "warranty_until", "status", "next_service_date", "created_at" FROM `equipments`;--> statement-breakpoint
DROP TABLE `equipments`;--> statement-breakpoint
ALTER TABLE `__new_equipments` RENAME TO `equipments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `equipments_code_unique` ON `equipments` (`code`);