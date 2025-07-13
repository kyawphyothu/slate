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
      </View>

      <View style={styles.todoForm}>
        <TextInput
          style={styles.inputBox}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Add Today's Task"
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.inputButton} onPress={addTask}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          Completed: <Text style={styles.counterNumber}>{completedCount}</Text> | 
          Uncompleted: <Text style={styles.counterNumber}>{uncompletedCount}</Text>
        </Text>
      </View>

      {todayTasks.some(t => !t.completed) && (
        <Text style={styles.reminderMessage}>You assigned some tasks for today!</Text>
      )}

      {leftoverTasks.length > 0 && (
        <Text style={styles.leftoverMessage}>Leftover from yesterday!</Text>
      )}

      <TouchableOpacity 
        style={styles.showListButton} 
        onPress={() => router.push('/all-tasks')}
      >
        <Text style={styles.buttonText}>Show All Tasks</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryView: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f5f5f5',
    marginBottom: 20,
  },
  todoForm: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 10,
  },
  inputBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    fontSize: 18,
    backgroundColor: '#1a1a1a',
    color: '#f5f5f5',
  },
  inputButton: {
    backgroundColor: '#8b0000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  counterContainer: {
    marginBottom: 20,
  },
  counterText: {
    color: '#f5f5f5',
    fontSize: 16,
    textAlign: 'center',
  },
  counterNumber: {
    fontWeight: 'bold',
  },
  reminderMessage: {
    color: '#f5f5f5',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  leftoverMessage: {
    color: '#ff6b6b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  showListButton: {
    backgroundColor: '#8b0000',
    padding: 15,
    borderRadius: 5,
    marginTop: 30,
  },
});