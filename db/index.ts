import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

class DatabaseManager {
  private static instance: DatabaseManager;
  private _db: ReturnType<typeof drizzle> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public get db() {
    if (!this._db) {
      this.initializeDatabase();
    }
    return this._db!;
  }

  private initializeDatabase() {
    try {
      // Open SQLite database
      const expo = openDatabaseSync('todo-thihathu.db');
      
      // Create Drizzle instance
      this._db = drizzle(expo, { schema });

      // Initialize tables if they don't exist
      this.initializeTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private initializeTables() {
    try {
      // Create tables if they don't exist
      this._db!.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY NOT NULL,
          text TEXT NOT NULL,
          date TEXT NOT NULL,
          completed INTEGER DEFAULT 0 NOT NULL
        );
      `);

      this._db!.run(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id INTEGER PRIMARY KEY NOT NULL,
          taskId INTEGER NOT NULL,
          text TEXT NOT NULL,
          completed INTEGER DEFAULT 0 NOT NULL,
          FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `);

      console.log('Tables initialized successfully');
    } catch (error) {
      console.error('Table initialization failed:', error);
    }
  }

  public async closeConnection() {
    if (this._db) {
      // Note: expo-sqlite doesn't have an explicit close method
      // The connection will be managed by the SQLite driver
      this._db = null;
      console.log('Database connection closed');
    }
  }

  // Health check method
  public async isConnected(): Promise<boolean> {
    try {
      if (!this._db) return false;
      
      // Simple query to test connection
      await this._db.select().from(schema.tasksTable).limit(1);
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  // Reconnect method for error recovery
  public async reconnect() {
    console.log('Attempting to reconnect to database...');
    this._db = null;
    this.initializeDatabase();
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();

// Export the database instance for direct use
export const db = dbManager.db;

// Export schema for convenience
export * from './schema';

// Export types
export type Database = typeof db;
