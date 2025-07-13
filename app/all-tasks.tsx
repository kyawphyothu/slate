import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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

// Task Item Component
function TaskItem({
  task,
  onToggleTask,
  onToggleSubtask,
  onDeleteTask,
  onDeleteSubtask,
  onEditTask,
  onAddSubtask,
  calculateProgress,
  isCompleted = false
}: {
  task: Task;
  onToggleTask: (id: number, completed: boolean) => void;
  onToggleSubtask: (id: number, completed: boolean, taskId: number) => void;
  onDeleteTask: (id: number) => void;
  onDeleteSubtask: (id: number, taskId: number) => void;
  onEditTask: (id: number, text: string, isSubtask?: boolean, parentId?: number) => void;
  onAddSubtask: (taskId: number) => void;
  calculateProgress: (task: Task) => string | null;
  isCompleted?: boolean;
}) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const progress = calculateProgress(task);
  const title = progress ? `${task.text} (${progress})` : task.text;

  return (
    <View style={[styles.taskItem, isCompleted && styles.completedTaskItem]}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggleTask(task.id, !task.completed)}
        >
          <Text style={styles.checkboxText}>{task.completed ? '✓' : ''}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.taskText, isCompleted && styles.completedTaskText]}>
          {title}
        </Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onEditTask(task.id, task.text)}
        >
          <Text style={styles.iconBtnText}>✎</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onDeleteTask(task.id)}
        >
          <Text style={styles.iconBtnText}>🗑️</Text>
        </TouchableOpacity>

        {task.subtasks.length > 0 && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSubtasks(!showSubtasks)}
          >
            <Text style={styles.iconBtnText}>{showSubtasks ? '▼' : '▶'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onAddSubtask(task.id)}
        >
          <Text style={styles.iconBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {showSubtasks && task.subtasks.length > 0 && (
        <View style={styles.subtaskContainer}>
          {task.subtasks.map(subtask => (
            <View key={subtask.id} style={styles.subtaskItem}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => onToggleSubtask(subtask.id, !subtask.completed, task.id)}
              >
                <Text style={styles.checkboxText}>{subtask.completed ? '✓' : ''}</Text>
              </TouchableOpacity>
              
              <Text style={[styles.subtaskText, subtask.completed && styles.completedTaskText]}>
                {subtask.text}
              </Text>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onEditTask(subtask.id, subtask.text, true, task.id)}
              >
                <Text style={styles.iconBtnText}>✎</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onDeleteSubtask(subtask.id, task.id)}
              >
                <Text style={styles.iconBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AllTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [subtaskModalVisible, setSubtaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id: number; text: string; isSubtask?: boolean; parentId?: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [subtaskText, setSubtaskText] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);

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

  const toggleTaskCompletion = async (taskId: number, completed: boolean) => {
    try {
      await dbOperations.tasks.updateTask(taskId, { completed });
      
      // If task has subtasks, update them too
      const task = tasks.find(t => t.id === taskId);
      if (task && task.subtasks.length > 0) {
        await dbOperations.subtasks.updateAllSubtasksCompletion(taskId, completed);
      }
      
      await loadTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const toggleSubtaskCompletion = async (subtaskId: number, completed: boolean, taskId: number) => {
    try {
      await dbOperations.subtasks.updateSubtask(subtaskId, { completed });
      await dbOperations.combined.checkAndUpdateParentCompletion(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    Alert.alert(
      'Delete Task',
      'Delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbOperations.tasks.deleteTask(taskId);
              await loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
            }
          },
        },
      ]
    );
  };

  const deleteSubtask = async (subtaskId: number, taskId: number) => {
    Alert.alert(
      'Delete Subtask',
      'Delete this subtask?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbOperations.subtasks.deleteSubtask(subtaskId);
              await dbOperations.combined.checkAndUpdateParentCompletion(taskId);
              await loadTasks();
            } catch (error) {
              console.error('Error deleting subtask:', error);
            }
          },
        },
      ]
    );
  };

  const deleteAllCompleted = async () => {
    Alert.alert(
      'Delete All Completed',
      'Delete all completed tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbOperations.tasks.deleteCompletedTasks(today);
              await loadTasks();
            } catch (error) {
              console.error('Error deleting completed tasks:', error);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (id: number, text: string, isSubtask = false, parentId?: number) => {
    setEditingTask({ id, text, isSubtask, parentId });
    setEditText(text);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingTask) return;

    try {
      if (editingTask.isSubtask) {
        await dbOperations.subtasks.updateSubtask(editingTask.id, { text: editText.trim() });
      } else {
        await dbOperations.tasks.updateTask(editingTask.id, { text: editText.trim() });
      }
      
      setEditModalVisible(false);
      setEditingTask(null);
      setEditText('');
      await loadTasks();
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const addSubtask = async (taskId: number) => {
    setCurrentTaskId(taskId);
    setSubtaskModalVisible(true);
  };

  const saveSubtask = async () => {
    if (!subtaskText.trim() || !currentTaskId) return;

    try {
      await dbOperations.subtasks.createSubtask(currentTaskId, subtaskText.trim());
      setSubtaskModalVisible(false);
      setSubtaskText('');
      setCurrentTaskId(null);
      await loadTasks();
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const calculateProgress = (task: Task) => {
    if (!task.subtasks.length) return null;
    const done = task.subtasks.filter(s => s.completed).length;
    return `${done}/${task.subtasks.length}`;
  };

  const todayTasks = tasks.filter(task => task.date === today);
  const uncompletedTasks = todayTasks.filter(t => !t.completed);
  const completedTasks = todayTasks.filter(t => t.completed);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.sectionTitle}>All Tasks (Today)</Text>

        <View style={styles.taskSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Uncompleted Tasks</Text>
          </View>
          <View style={styles.taskList}>
            {uncompletedTasks.length === 0 ? (
              <Text style={styles.emptyMessage}>(No tasks)</Text>
            ) : (
              uncompletedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleTask={toggleTaskCompletion}
                  onToggleSubtask={toggleSubtaskCompletion}
                  onDeleteTask={deleteTask}
                  onDeleteSubtask={deleteSubtask}
                  onEditTask={openEditModal}
                  onAddSubtask={addSubtask}
                  calculateProgress={calculateProgress}
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.taskSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Completed Tasks</Text>
            {completedTasks.length > 0 && (
              <TouchableOpacity style={styles.sectionAction} onPress={deleteAllCompleted}>
                <Text style={styles.buttonText}>Delete All Completed</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.taskList}>
            {completedTasks.length === 0 ? (
              <Text style={styles.emptyMessage}>(No tasks)</Text>
            ) : (
              completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleTask={toggleTaskCompletion}
                  onToggleSubtask={toggleSubtaskCompletion}
                  onDeleteTask={deleteTask}
                  onDeleteSubtask={deleteSubtask}
                  onEditTask={openEditModal}
                  onAddSubtask={addSubtask}
                  calculateProgress={calculateProgress}
                  isCompleted
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity 
            style={styles.bottomButton} 
            onPress={() => router.push('/future-tasks')}
          >
            <Text style={styles.buttonText}>View Future Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bottomButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask?.isSubtask ? 'Edit Subtask' : 'Edit Task'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              placeholder="Enter text..."
              placeholderTextColor="#888"
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subtask Modal */}
      <Modal visible={subtaskModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Subtask</Text>
            <TextInput
              style={styles.modalInput}
              value={subtaskText}
              onChangeText={setSubtaskText}
              placeholder="Enter subtask text..."
              placeholderTextColor="#888"
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setSubtaskModalVisible(false);
                  setSubtaskText('');
                  setCurrentTaskId(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveSubtask}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5f5f5',
    textAlign: 'center',
    marginBottom: 20,
  },
  taskSection: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#8b0000',
    borderRadius: 8,
    marginBottom: 20,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5f5f5',
  },
  sectionAction: {
    backgroundColor: '#8b0000',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  taskList: {
    borderTopWidth: 1,
    borderTopColor: '#8b0000',
    paddingTop: 10,
  },
  emptyMessage: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  taskItem: {
    backgroundColor: '#3a1a40',
    borderWidth: 1,
    borderColor: '#8b0000',
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
  },
  completedTaskItem: {
    backgroundColor: '#1a1a1a',
    borderColor: '#555',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#8b0000',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    color: '#f5f5f5',
    fontSize: 16,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  iconBtn: {
    backgroundColor: '#8b0000',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  iconBtnText: {
    color: '#f5f5f5',
    fontSize: 14,
  },
  subtaskContainer: {
    marginTop: 10,
    paddingLeft: 20,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  subtaskText: {
    flex: 1,
    color: '#f5f5f5',
    fontSize: 14,
  },
  bottomButtons: {
    gap: 10,
    marginTop: 20,
  },
  bottomButton: {
    backgroundColor: '#8b0000',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#8b0000',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5f5f5',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#0d0d0d',
    color: '#f5f5f5',
    marginBottom: 20,
    minHeight: 40,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  saveButton: {
    backgroundColor: '#8b0000',
  },
});
