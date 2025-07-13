import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

// Task Item Component (reused from all-tasks)
function TaskItem({
  task,
  onToggleTask,
  onToggleSubtask,
  onDeleteTask,
  onDeleteSubtask,
  onEditTask,
  onAddSubtask,
  calculateProgress,
}: {
  task: Task;
  onToggleTask: (id: number, completed: boolean) => void;
  onToggleSubtask: (id: number, completed: boolean, taskId: number) => void;
  onDeleteTask: (id: number) => void;
  onDeleteSubtask: (id: number, taskId: number) => void;
  onEditTask: (id: number, text: string, isSubtask?: boolean, parentId?: number) => void;
  onAddSubtask: (taskId: number) => void;
  calculateProgress: (task: Task) => string | null;
}) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const progress = calculateProgress(task);
  const title = progress ? `${task.text} (${progress})` : task.text;

  return (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggleTask(task.id, !task.completed)}
        >
          {task.completed ? (
            <Ionicons name="checkmark" size={16} color="#f5f5f5" />
          ) : null}
        </TouchableOpacity>
        <Text style={[styles.taskText, task.completed && styles.completedTaskText]}>
          {title}
        </Text>
        <Text style={styles.dateText}>({task.date})</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onEditTask(task.id, task.text)}
        >
          <Ionicons name="create-outline" size={16} color="#f5f5f5" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onDeleteTask(task.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#f5f5f5" />
        </TouchableOpacity>
        {task.subtasks.length > 0 && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSubtasks(!showSubtasks)}
          >
            <Ionicons
              name={showSubtasks ? "chevron-down" : "chevron-forward"}
              size={16}
              color="#f5f5f5"
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onAddSubtask(task.id)}
        >
          <Ionicons name="add" size={16} color="#f5f5f5" />
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
                {subtask.completed ? (
                  <Ionicons name="checkmark" size={14} color="#f5f5f5" />
                ) : null}
              </TouchableOpacity>
              <Text style={[styles.subtaskText, subtask.completed && styles.completedTaskText]}>
                {subtask.text}
              </Text>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onEditTask(subtask.id, subtask.text, true, task.id)}
              >
                <Ionicons name="create-outline" size={14} color="#f5f5f5" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onDeleteSubtask(subtask.id, task.id)}
              >
                <Ionicons name="trash-outline" size={14} color="#f5f5f5" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function FutureTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [futureInputText, setFutureInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const addFutureTask = async () => {
    if (!futureInputText.trim()) {
      Alert.alert('Error', 'Enter task text!');
      return;
    }

    try {
      const dateString = selectedDate.toISOString().slice(0, 10);
      await dbOperations.tasks.createTask(futureInputText.trim(), dateString);
      setFutureInputText('');
      setSelectedDate(new Date());
      await loadTasks();
    } catch (error) {
      console.error('Error adding future task:', error);
      Alert.alert('Error', 'Failed to add future task');
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
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

  const futureTasks = tasks.filter(task => task.date > today);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Future Assigned Tasks</Text>

        <View style={styles.futureForm}>
          <TextInput
            style={styles.futureInput}
            value={futureInputText}
            onChangeText={setFutureInputText}
            placeholder="Add Future Task"
            placeholderTextColor="#888"
          />
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8b0000" />
            <Text style={styles.datePickerText}>
              {selectedDate.toLocaleDateString()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
              textColor="#f5f5f5"
              themeVariant="dark"
            />
          )}
          
          <TouchableOpacity style={styles.futureAddButton} onPress={addFutureTask}>
            <Ionicons name="add-circle-outline" size={20} color="#f5f5f5" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Add Future Task</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taskSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Future Task List</Text>
          </View>
          <View style={styles.taskList}>
            {futureTasks.length === 0 ? (
              <Text style={styles.emptyMessage}>(No tasks)</Text>
            ) : (
              futureTasks.map(task => (
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

        <View style={styles.bottomButtons}>
          <TouchableOpacity 
            style={styles.bottomButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#f5f5f5" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Back to All Tasks</Text>
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
                <Ionicons name="close-outline" size={18} color="#f5f5f5" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Ionicons name="checkmark-outline" size={18} color="#f5f5f5" style={styles.buttonIcon} />
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
                <Ionicons name="close-outline" size={18} color="#f5f5f5" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveSubtask}
              >
                <Ionicons name="add-outline" size={18} color="#f5f5f5" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  futureForm: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  futureInput: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    backgroundColor: '#334155',
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '400',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    backgroundColor: '#334155',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  futureAddButton: {
    backgroundColor: '#8b0000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  taskSection: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    marginBottom: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  taskList: {
    paddingTop: 5,
  },
  emptyMessage: {
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  taskItem: {
    backgroundColor: '#2a1a30',
    borderWidth: 1,
    borderColor: '#8b0000',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completedTaskItem: {
    backgroundColor: '#1f1f1f',
    borderColor: '#555',
    opacity: 0.8,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#8b0000',
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
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
    fontWeight: '500',
    lineHeight: 22,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  iconBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 36,
    alignItems: 'center',
  },
  iconBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtaskContainer: {
    marginTop: 15,
    paddingLeft: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingVertical: 4,
  },
  subtaskText: {
    flex: 1,
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bottomButtons: {
    gap: 15,
    marginTop: 30,
  },
  bottomButton: {
    backgroundColor: '#8b0000',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#8b0000',
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f5f5f5',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#0d0d0d',
    color: '#f5f5f5',
    marginBottom: 24,
    minHeight: 44,
    fontWeight: '400',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  saveButton: {
    backgroundColor: '#8b0000',
  },
  dateText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 8,
  },
});
