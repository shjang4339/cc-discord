/**
 * Task management for cc-discord
 * Handles task creation, status tracking, and queue management
 */

const fs = require('fs');
const path = require('path');
const { getDataDir } = require('./config');

// Priority levels
const PRIORITY = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4
};

// Priority labels for display
const PRIORITY_LABELS = {
  [PRIORITY.LOW]: '🔵 Low',
  [PRIORITY.NORMAL]: '🟢 Normal',
  [PRIORITY.HIGH]: '🟠 High',
  [PRIORITY.URGENT]: '🔴 Urgent'
};

// Task status
const STATUS = {
  READY: 'ready',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Generate a date-based unique task ID
 */
function generateDateBasedId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${dateStr}-${timeStr}-${random}`;
}

/**
 * Get the path to the tasks index file
 */
function getTasksIndexPath() {
  return path.join(getDataDir(), 'tasks.json');
}

/**
 * Get the path to the completed tasks index file
 */
function getCompletedIndexPath() {
  return path.join(getDataDir(), 'completed.json');
}

/**
 * Get the path to the failed tasks index file
 */
function getFailedIndexPath() {
  return path.join(getDataDir(), 'failed.json');
}

/**
 * Read index file (tasks, completed, or failed)
 */
function readIndex(indexPath) {
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(indexPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

/**
 * Write index file atomically
 */
function writeIndex(indexPath, data) {
  const tempPath = indexPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, indexPath);
}

/**
 * Read a single task file
 */
function readTaskFile(taskId, folder = 'tasks') {
  const taskPath = path.join(getDataDir(), folder, `${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(taskPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

/**
 * Write a single task file atomically
 */
function writeTaskFile(taskId, task, folder = 'tasks') {
  const taskDir = path.join(getDataDir(), folder);
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }
  const taskPath = path.join(taskDir, `${taskId}.json`);
  const tempPath = taskPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(task, null, 2));
  fs.renameSync(tempPath, taskPath);
}

/**
 * Delete a task file
 */
function deleteTaskFile(taskId, folder = 'tasks') {
  const taskPath = path.join(getDataDir(), folder, `${taskId}.json`);
  if (fs.existsSync(taskPath)) {
    fs.unlinkSync(taskPath);
  }
}

/**
 * Create a new task
 */
function createTask(options) {
  const {
    requirement,
    completionCriteria = null,
    maxRetries = 15,
    priority = PRIORITY.NORMAL,
    complexity = 'simple',
    attachments = []
  } = options;

  const taskId = generateDateBasedId();
  const task = {
    id: taskId,
    requirement,
    completionCriteria,
    maxRetries,
    currentRetry: 0,
    priority,
    complexity,
    status: STATUS.READY,
    attachments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Write task file
  writeTaskFile(taskId, task);

  // Update index
  const index = readIndex(getTasksIndexPath());
  index.push(taskId);
  writeIndex(getTasksIndexPath(), index);

  return task;
}

/**
 * Get all pending tasks
 */
function getAllPendingTasks() {
  const index = readIndex(getTasksIndexPath());
  const tasks = [];

  for (const taskId of index) {
    const task = readTaskFile(taskId);
    if (task && task.status === STATUS.READY) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Get all in-progress tasks
 */
function getInProgressTasks() {
  const index = readIndex(getTasksIndexPath());
  const tasks = [];

  for (const taskId of index) {
    const task = readTaskFile(taskId);
    if (task && task.status === STATUS.IN_PROGRESS) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Get next tasks to execute (sorted by priority, then by creation time)
 */
function getNextTasks(count = 1) {
  const pendingTasks = getAllPendingTasks();

  // Sort by priority (descending) and creation time (ascending)
  pendingTasks.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return pendingTasks.slice(0, count);
}

/**
 * Start a task (change status to inProgress)
 */
function startTask(taskId) {
  const task = readTaskFile(taskId);
  if (!task) return null;

  task.status = STATUS.IN_PROGRESS;
  task.startedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();

  writeTaskFile(taskId, task);
  return task;
}

/**
 * Complete a task
 */
function completeTask(taskId, output = '') {
  const task = readTaskFile(taskId);
  if (!task) return null;

  task.status = STATUS.COMPLETED;
  task.completedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  task.output = output;

  // Move to completed folder
  writeTaskFile(taskId, task, 'completed');
  deleteTaskFile(taskId, 'tasks');

  // Update indices
  const tasksIndex = readIndex(getTasksIndexPath());
  const newTasksIndex = tasksIndex.filter(id => id !== taskId);
  writeIndex(getTasksIndexPath(), newTasksIndex);

  const completedIndex = readIndex(getCompletedIndexPath());
  completedIndex.push(taskId);
  writeIndex(getCompletedIndexPath(), completedIndex);

  return task;
}

/**
 * Fail a task
 */
function failTask(taskId, error = '') {
  const task = readTaskFile(taskId);
  if (!task) return null;

  task.status = STATUS.FAILED;
  task.failedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  task.error = error;

  // Move to failed folder
  writeTaskFile(taskId, task, 'failed');
  deleteTaskFile(taskId, 'tasks');

  // Update indices
  const tasksIndex = readIndex(getTasksIndexPath());
  const newTasksIndex = tasksIndex.filter(id => id !== taskId);
  writeIndex(getTasksIndexPath(), newTasksIndex);

  const failedIndex = readIndex(getFailedIndexPath());
  failedIndex.push(taskId);
  writeIndex(getFailedIndexPath(), failedIndex);

  return task;
}

/**
 * Increment retry count and reset status if retries remaining
 */
function incrementRetry(taskId) {
  const task = readTaskFile(taskId);
  if (!task) return null;

  task.currentRetry += 1;
  task.updatedAt = new Date().toISOString();

  if (task.currentRetry < task.maxRetries) {
    task.status = STATUS.READY;
    writeTaskFile(taskId, task);
    return { task, canRetry: true };
  } else {
    return { task, canRetry: false };
  }
}

/**
 * Get completed tasks
 */
function getCompletedTasks(limit = 10) {
  const index = readIndex(getCompletedIndexPath());
  const tasks = [];

  // Get most recent first
  const recentIds = index.slice(-limit).reverse();

  for (const taskId of recentIds) {
    const task = readTaskFile(taskId, 'completed');
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Get failed tasks
 */
function getFailedTasks(limit = 10) {
  const index = readIndex(getFailedIndexPath());
  const tasks = [];

  // Get most recent first
  const recentIds = index.slice(-limit).reverse();

  for (const taskId of recentIds) {
    const task = readTaskFile(taskId, 'failed');
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Get a task by ID from any folder
 */
function getTaskById(taskId) {
  let task = readTaskFile(taskId, 'tasks');
  if (task) return task;

  task = readTaskFile(taskId, 'completed');
  if (task) return task;

  task = readTaskFile(taskId, 'failed');
  return task;
}

/**
 * Cancel a task (remove from queue)
 */
function cancelTask(taskId) {
  const task = readTaskFile(taskId);
  if (!task) return false;

  deleteTaskFile(taskId, 'tasks');

  const index = readIndex(getTasksIndexPath());
  const newIndex = index.filter(id => id !== taskId);
  writeIndex(getTasksIndexPath(), newIndex);

  return true;
}

/**
 * Cleanup orphan tasks (tasks stuck in inProgress)
 */
function cleanupOrphanTasks() {
  const index = readIndex(getTasksIndexPath());
  let cleaned = 0;

  for (const taskId of index) {
    const task = readTaskFile(taskId);
    if (task && task.status === STATUS.IN_PROGRESS) {
      task.status = STATUS.READY;
      task.updatedAt = new Date().toISOString();
      writeTaskFile(taskId, task);
      cleaned++;
    }
  }

  return cleaned;
}

module.exports = {
  PRIORITY,
  PRIORITY_LABELS,
  STATUS,
  createTask,
  getAllPendingTasks,
  getInProgressTasks,
  getNextTasks,
  startTask,
  completeTask,
  failTask,
  incrementRetry,
  getCompletedTasks,
  getFailedTasks,
  getTaskById,
  cancelTask,
  cleanupOrphanTasks
};
