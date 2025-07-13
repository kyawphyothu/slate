import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasksTable = sqliteTable("tasks", {
  id: int().primaryKey(),
  text: text().notNull(),
  date: text().notNull(), // ISO date string format (YYYY-MM-DD)
  completed: int({ mode: "boolean" }).notNull().default(false),
});

export const subtasksTable = sqliteTable("subtasks", {
  id: int().primaryKey(),
  taskId: int().notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  text: text().notNull(),
  completed: int({ mode: "boolean" }).notNull().default(false),
});
