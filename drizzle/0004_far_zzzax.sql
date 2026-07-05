CREATE TABLE `work_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`os_id` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`os_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade
);
