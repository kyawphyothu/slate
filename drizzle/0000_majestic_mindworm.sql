CREATE TABLE `subtasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`taskId` integer NOT NULL,
	`text` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`date` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL
);
