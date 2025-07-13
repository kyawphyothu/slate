import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
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
import { Dropdown } from 'react-native-element-dropdown';
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
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;
  const progress = calculateProgress(task);
  const title = progress ? `${task.text} (${progress})` : task.text;

  const taskActions = [
    { label: 'Complete', value: 'complete', icon: 'checkmark' },
    { label: 'Edit', value: 'edit', icon: 'create' },
    { label: 'Delete', value: 'delete', icon: 'trash' },
    { label: 'Add Subtask', value: 'addSubtask', icon: 'add' },
  ];

  const subtaskActions = [
    { label: 'Complete', value: 'complete', icon: 'checkmark' },
    { label: 'Edit', value: 'edit', icon: 'create' },
    { label: 'Delete', value: 'delete', icon: 'trash' },
  ];

  const handleTaskAction = (action: string) => {
    switch (action) {
      case 'complete':
        onToggleTask(task.id, !task.completed);
        break;
      case 'edit':
        onEditTask(task.id, task.text);
        break;
      case 'delete':
        onDeleteTask(task.id);
        break;
      case 'addSubtask':
        onAddSubtask(task.id);
        break;
    }
  };

  const handleSubtaskAction = (action: string, subtaskId: number, subtaskText: string) => {
    switch (action) {
      case 'complete':
        onToggleSubtask(subtaskId, !task.subtasks.find(s => s.id === subtaskId)?.completed, task.id);
        break;
      case 'edit':
        onEditTask(subtaskId, subtaskText, true, task.id);
        break;
      case 'delete':
        onDeleteSubtask(subtaskId, task.id);
        break;
    }
  };

  return (
    <View style={[styles.taskItem, isCompleted && styles.completedTaskItem]}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          style={[styles.checkbox, task.completed && styles.checkedCheckbox]}
          onPress={() => onToggleTask(task.id, !task.completed)}
        >
          {task.completed ? (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          ) : null}
        </TouchableOpacity>
        
        <Text style={[styles.taskText, isCompleted && styles.completedTaskText]}>
          {title}
        </Text>

        {/* Desktop/Tablet Actions */}
        {!isMobile && (
          <>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onEditTask(task.id, task.text)}
            >
              <Ionicons name="create-outline" size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onDeleteTask(task.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
            </TouchableOpacity>
            {task.subtasks.length > 0 && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setShowSubtasks(!showSubtasks)}
              >
                <Ionicons 
                  name={showSubtasks ? "chevron-down" : "chevron-forward"} 
                  size={16} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onAddSubtask(task.id)}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
            </TouchableOpacity>
          </>
        )}

        {/* Mobile Dropdown */}
        {isMobile && (
          <View style={styles.dropdownWrapper}>
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              data={taskActions}
              labelField="label"
              valueField="value"
              placeholder=""
              value={null}
              onChange={(item) => handleTaskAction(item.value)}
              renderRightIcon={() => (
                <Ionicons name="ellipsis-vertical" size={18} color="#ffffff" />
              )}
              renderItem={(item) => (
                <View style={styles.dropdownItem}>
                  <Ionicons name={item.icon as any} size={16} color="#ffffff" />
                  <Text style={styles.dropdownItemText}>{item.label}</Text>
                </View>
              )}
            />
            {task.subtasks.length > 0 && (
              <TouchableOpacity
                style={[styles.iconBtn, { marginLeft: 8 }]}
                onPress={() => setShowSubtasks(!showSubtasks)}
              >
                <Ionicons 
                  name={showSubtasks ? "chevron-down" : "chevron-forward"} 
                  size={16} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {showSubtasks && task.subtasks.length > 0 && (
        <View style={styles.subtaskContainer}>
          {task.subtasks.map(subtask => (
            <View key={subtask.id} style={styles.subtaskItem}>
              <TouchableOpacity
                style={[styles.subtaskCheckbox, subtask.completed && styles.checkedSubtaskCheckbox]}
                onPress={() => onToggleSubtask(subtask.id, !subtask.completed, task.id)}
              >
                {subtask.completed ? (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                ) : null}
              </TouchableOpacity>
              
              <Text style={[styles.subtaskText, subtask.completed && styles.completedTaskText]}>
                {subtask.text}
              </Text>

              {/* Desktop/Tablet Subtask Actions */}
              {!isMobile && (
                <View style={styles.subtaskActions}>
                  <TouchableOpacity
                    style={styles.subtaskActionButton}
                    onPress={() => onEditTask(subtask.id, subtask.text, true, task.id)}
                  >
                    <Ionicons name="create-outline" size={12} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.subtaskActionButton}
                    onPress={() => onDeleteSubtask(subtask.id, task.id)}
                  >
                    <Ionicons name="trash-outline" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Mobile Subtask Dropdown */}
              {isMobile && (
                <View style={styles.dropdownWrapper}>
                  <Dropdown
                    style={styles.dropdown}
                    containerStyle={styles.dropdownContainer}
                    data={subtaskActions}
                    labelField="label"
                    valueField="value"
                    placeholder=""
                    value={null}
                    onChange={(item) => handleSubtaskAction(item.value, subtask.id, subtask.text)}
                    renderRightIcon={() => (
                      <Ionicons name="ellipsis-vertical" size={16} color="#ffffff" />
                    )}
                    renderItem={(item) => (
                      <View style={styles.dropdownItem}>
                        <Ionicons name={item.icon as any} size={14} color="#ffffff" />
                        <Text style={styles.dropdownItemText}>{item.label}</Text>
                      </View>
                    )}
                  />
                </View>
              )}
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
  const [deleteTaskModalVisible, setDeleteTaskModalVisible] = useState(false);
  const [deleteSubtaskModalVisible, setDeleteSubtaskModalVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [subtaskToDelete, setSubtaskToDelete] = useState<{ subtaskId: number; taskId: number } | null>(null);
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
    setTaskToDelete(taskId);
    setDeleteTaskModalVisible(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await dbOperations.tasks.deleteTask(taskToDelete);
      await loadTasks();
      setDeleteTaskModalVisible(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteSubtask = async (subtaskId: number, taskId: number) => {
    setSubtaskToDelete({ subtaskId, taskId });
    setDeleteSubtaskModalVisible(true);
  };

  const confirmDeleteSubtask = async () => {
    if (!subtaskToDelete) return;

    try {
      await dbOperations.subtasks.deleteSubtask(subtaskToDelete.subtaskId);
      await dbOperations.combined.checkAndUpdateParentCompletion(subtaskToDelete.taskId);
      await loadTasks();
      setDeleteSubtaskModalVisible(false);
      setSubtaskToDelete(null);
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const deleteAllCompleted = async () => {
    setDeleteAllModalVisible(true);
  };

  const confirmDeleteAllCompleted = async () => {
    try {
      await dbOperations.tasks.deleteCompletedTasks(today);
      await loadTasks();
      setDeleteAllModalVisible(false);
    } catch (error) {
      console.error('Error deleting completed tasks:', error);
    }
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
                <Ionicons name="trash-outline" size={16} color="#ffffff" style={styles.actionIcon} />
                <Text style={styles.actionText}>Clear Completed</Text>
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
            <Ionicons name="calendar" size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>View Future Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bottomButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="home" size={20} color="#ffffff" style={styles.buttonIcon} />
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

      {/* Delete Task Modal */}
      <Modal visible={deleteTaskModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#ef4444" />
              <Text style={styles.modalTitle}>Delete Task</Text>
            </View>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this task? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteTaskModalVisible(false);
                  setTaskToDelete(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteTask}
              >
                <Ionicons name="trash" size={16} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Subtask Modal */}
      <Modal visible={deleteSubtaskModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#ef4444" />
              <Text style={styles.modalTitle}>Delete Subtask</Text>
            </View>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this subtask? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteSubtaskModalVisible(false);
                  setSubtaskToDelete(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteSubtask}
              >
                <Ionicons name="trash" size={16} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete All Completed Modal */}
      <Modal visible={deleteAllModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#ef4444" />
              <Text style={styles.modalTitle}>Delete All Completed</Text>
            </View>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete all completed tasks? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteAllModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteAllCompleted}
              >
                <Ionicons name="trash" size={16} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Delete All</Text>
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
  sectionAction: {
    backgroundColor: '#8b0000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
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
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedTaskItem: {
    backgroundColor: '#1e293b',
    borderColor: '#64748b',
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
    borderColor: '#64748b',
    borderRadius: 14,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkedCheckbox: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
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
    borderTopColor: '#475569',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingVertical: 4,
    backgroundColor: '#475569',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#64748b',
    borderRadius: 4,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkedSubtaskCheckbox: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  subtaskText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  subtaskActions: {
    flexDirection: 'row',
    gap: 6,
  },
  subtaskActionButton: {
    backgroundColor: '#6366f1',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    minHeight: 28,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#334155',
    color: '#f1f5f9',
    marginBottom: 24,
    minHeight: 44,
    fontWeight: '400',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#64748b',
  },
  saveButton: {
    backgroundColor: '#8b0000',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minWidth: 36,
    maxWidth: 36,
    borderWidth: 1,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    maxHeight: 200,
    minWidth: 140,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#374151',
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
});
