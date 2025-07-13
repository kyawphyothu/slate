import { and, eq, gt } from 'drizzle-orm';
import { db, subtasksTable, tasksTable } from './index';

// Task operations
export const taskOperations = {
  // Get all tasks
  async getAllTasks() {
    return await db.select().from(tasksTable);
  },

  // Get tasks by date
  async getTasksByDate(date: string) {
    return await db.select().from(tasksTable).where(eq(tasksTable.date, date));
  },

  // Get future tasks
  async getFutureTasks(currentDate: string) {
    return await db.select().from(tasksTable).where(gt(tasksTable.date, currentDate));
  },

  // Create a new task
  async createTask(text: string, date: string, completed: boolean = false) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    return await db.insert(tasksTable).values({
      id,
      text,
      date,
      completed,
    }).returning();
  },

  // Update task
  async updateTask(id: number, updates: Partial<{ text: string; completed: boolean; date: string }>) {
    return await db.update(tasksTable)
      .set(updates)
      .where(eq(tasksTable.id, id))
      .returning();
  },

  // Delete task
  async deleteTask(id: number) {
    return await db.delete(tasksTable).where(eq(tasksTable.id, id));
  },

  // Delete all completed tasks for a specific date
  async deleteCompletedTasks(date: string) {
    return await db.delete(tasksTable)
      .where(and(eq(tasksTable.date, date), eq(tasksTable.completed, true)));
  },
};

// Subtask operations
export const subtaskOperations = {
  // Get all subtasks for a task
  async getSubtasksByTaskId(taskId: number) {
    return await db.select().from(subtasksTable).where(eq(subtasksTable.taskId, taskId));
  },

  // Create a new subtask
  async createSubtask(taskId: number, text: string, completed: boolean = false) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    return await db.insert(subtasksTable).values({
      id,
      taskId,
      text,
      completed,
    }).returning();
  },

  // Update subtask
  async updateSubtask(id: number, updates: Partial<{ text: string; completed: boolean }>) {
    return await db.update(subtasksTable)
      .set(updates)
      .where(eq(subtasksTable.id, id))
      .returning();
  },

  // Delete subtask
  async deleteSubtask(id: number) {
    return await db.delete(subtasksTable).where(eq(subtasksTable.id, id));
  },

  // Update all subtasks completion status for a task
  async updateAllSubtasksCompletion(taskId: number, completed: boolean) {
    return await db.update(subtasksTable)
      .set({ completed })
      .where(eq(subtasksTable.taskId, taskId));
  },
};

// Combined operations
export const combinedOperations = {
  // Get task with its subtasks
  async getTaskWithSubtasks(taskId: number) {
    const task = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    if (task.length === 0) return null;

    const subtasks = await subtaskOperations.getSubtasksByTaskId(taskId);
    return {
      ...task[0],
      subtasks,
    };
  },

  // Get all tasks for a date with their subtasks
  async getTasksWithSubtasksByDate(date: string) {
    const tasks = await taskOperations.getTasksByDate(date);
    const tasksWithSubtasks = await Promise.all(
      tasks.map(async (task) => {
        const subtasks = await subtaskOperations.getSubtasksByTaskId(task.id);
        return { ...task, subtasks };
      })
    );
    return tasksWithSubtasks;
  },

  // Check and update parent task completion based on subtasks
  async checkAndUpdateParentCompletion(taskId: number) {
    const subtasks = await subtaskOperations.getSubtasksByTaskId(taskId);
    if (subtasks.length === 0) return;

    const allCompleted = subtasks.every(subtask => subtask.completed);
    await taskOperations.updateTask(taskId, { completed: allCompleted });
  },
};

// Export all operations
export const dbOperations = {
  tasks: taskOperations,
  subtasks: subtaskOperations,
  combined: combinedOperations,
};
