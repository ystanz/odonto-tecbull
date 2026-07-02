CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `equipments` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
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
CREATE UNIQUE INDEX `equipments_code_unique` ON `equipments` (`code`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text,
	`name` text NOT NULL,
	`room` text,
	`created_at` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`client_id` text,
	`equipment_id` text,
	`status` text DEFAULT 'ABERTA' NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`defect_reported` text NOT NULL,
	`parts_used` text,
	`work_notes` text,
	`image_url` text,
	`service_date` text,
	`technician_name` text,
	`created_at` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_orders_code_unique` ON `work_orders` (`code`);