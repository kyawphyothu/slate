import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { dbOperations } from '../db/operations';

interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

interface Task {
  id: number;
  text: string;
  date: string;
  completed: boolean;
  subtasks: Subtask[];
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const allTasks = await dbOperations.tasks.getAllTasks();
      const tasksWithSubtasks = await Promise.all(
        allTasks.map(async (task) => {
          const subtasks = await dbOperations.subtasks.getSubtasksByTaskId(task.id);
          return { ...task, subtasks };
        })
      );
      setTasks(tasksWithSubtasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const addTask = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please write a task.');
      return;
    }

    try {
      await dbOperations.tasks.createTask(inputText.trim(), today);
      setInputText('');
      await loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  // Debug function to add yesterday task for testing leftover functionality
  const addYesterdayTask = async () => {
    try {
      await dbOperations.tasks.createTask('Yesterday test task', yesterday);
      await loadTasks();
      console.log('Added yesterday task for testing');
    } catch (error) {
      console.error('Error adding yesterday task:', error);
    }
  };

  // Filter functions
  const getTodayTasks = () => tasks.filter(task => task.date === today);
  const getLeftoverTasks = () => tasks.filter(task => task.date === yesterday && !task.completed);

  const todayTasks = getTodayTasks();
  const leftoverTasks = getLeftoverTasks();
  const completedCount = todayTasks.filter(t => t.completed).length;
  const uncompletedCount = todayTasks.length - completedCount;

  return (
    <ScrollView style={styles.summaryView}>
      <View style={styles.header}>
        <Text style={styles.title}>To Do List</Text>
        <Text style={styles.subtitle}>Stay organized, stay productive</Text>
      </View>

      <View style={styles.todoForm}>
        <View style={styles.inputContainer}>
          <Ionicons name="create-outline" size={20} color="#6366f1" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Add today's task..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.inputButton} onPress={addTask}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={24} color="#6366f1" />
          </View>
          <Text style={styles.statNumber}>{uncompletedCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statNumber}>{leftoverTasks.length}</Text>
          <Text style={styles.statLabel}>Leftover</Text>
        </View>
      </View>

      {todayTasks.some(t => !t.completed) && (
        <View style={styles.reminderCard}>
          <Ionicons name="notifications" size={20} color="#6366f1" />
          <Text style={styles.reminderMessage}>You have tasks to complete today!</Text>
        </View>
      )}

      {leftoverTasks.length > 0 && (
        <View style={styles.leftoverCard}>
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text style={styles.leftoverMessage}>Unfinished tasks from yesterday</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.showListButton} 
        onPress={() => router.push('/all-tasks')}
      >
        <Ionicons name="list" size={20} color="#ffffff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>View All Tasks</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryView: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  todoForm: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputBox: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '500',
  },
  inputButton: {
    backgroundColor: '#8b0000',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    minWidth: 100,
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    marginBottom: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderMessage: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  leftoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftoverMessage: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  showListButton: {
    backgroundColor: '#8b0000',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});