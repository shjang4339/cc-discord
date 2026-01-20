/**
 * Claude Code executor for cc-discord
 * Handles task execution, output streaming, and result processing
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadConfig, getDataDir } = require('./config');
const { getNextTasks, startTask, completeTask, failTask, incrementRetry, getInProgressTasks } = require('./tasks');
const { sendMessage, updateClaudeOutput, clearClaudeOutput } = require('./discord/client');
const { t } = require('./i18n');

// Running processes map (taskId -> process)
const runningProcesses = new Map();

// Executor state
let isRunning = false;
let executorInterval = null;

/**
 * Detect Claude command path
 */
function detectClaudeCommand() {
  const config = loadConfig();

  if (config && config.claudeCommand) {
    return config.claudeCommand;
  }

  // Try to find claude in PATH
  const isWindows = process.platform === 'win32';

  // Common paths
  const possiblePaths = isWindows
    ? [
        'claude',
        path.join(process.env.APPDATA || '', 'npm', 'claude.cmd'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'claude', 'claude.exe')
      ]
    : [
        'claude',
        '/usr/local/bin/claude',
        path.join(process.env.HOME || '', '.npm-global', 'bin', 'claude')
      ];

  for (const cmdPath of possiblePaths) {
    try {
      if (fs.existsSync(cmdPath)) {
        return cmdPath;
      }
    } catch (e) {
      // Ignore
    }
  }

  return 'claude'; // Default to PATH lookup
}

/**
 * Build the Claude command arguments
 */
function buildClaudeArgs(task) {
  const args = ['--dangerously-skip-permissions'];

  // Use plan mode for complex tasks
  if (task.complexity === 'complex' && task.completionCriteria) {
    args.push('--permission-mode', 'plan');
  }

  // Add the prompt
  let prompt = task.requirement;

  if (task.completionCriteria) {
    prompt += `\n\nCompletion criteria: ${task.completionCriteria}`;
    prompt += '\n\nWhen the task is complete, output <promise>COMPLETE</promise>';
    prompt += '\nIf the task fails, output <promise>FAILED</promise>';
  }

  args.push('--print', prompt);

  return args;
}

/**
 * Execute a single task
 */
async function executeTask(task) {
  const config = loadConfig();
  const claudeCmd = detectClaudeCommand();
  const args = buildClaudeArgs(task);
  const timeout = config?.taskTimeout || 1800000; // 30 minutes default

  console.log(`Starting task: ${task.id}`);

  // Notify user
  await sendMessage(t('executor.starting', { taskId: task.id }));

  // Mark task as started
  startTask(task.id);

  return new Promise((resolve) => {
    let output = '';
    let hasExplicitResult = false;
    let isComplete = false;
    let isFailed = false;

    // Spawn process
    const isWindows = process.platform === 'win32';
    const spawnOptions = {
      cwd: process.cwd(),
      shell: isWindows,
      env: { ...process.env, FORCE_COLOR: '0' }
    };

    const proc = spawn(claudeCmd, args, spawnOptions);

    // Store process reference
    runningProcesses.set(task.id, proc);

    // Set timeout
    const timeoutId = setTimeout(async () => {
      console.log(`Task ${task.id} timed out`);
      await sendMessage(t('executor.timeout', { taskId: task.id }));

      // Kill process
      killProcess(task.id);

      // Handle as failure
      const { canRetry } = incrementRetry(task.id);
      if (canRetry) {
        await sendMessage(t('executor.retrying', {
          taskId: task.id,
          current: task.currentRetry + 1,
          max: task.maxRetries
        }));
      } else {
        failTask(task.id, 'Task timed out');
        await sendMessage(t('executor.failed', { taskId: task.id }));
      }

      resolve({ success: false, timedOut: true });
    }, timeout);

    // Handle stdout
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;

      // Update Claude output for status command
      updateClaudeOutput(task.id, text);

      // Check for explicit completion signals
      if (text.includes('<promise>COMPLETE</promise>')) {
        hasExplicitResult = true;
        isComplete = true;
      }
      if (text.includes('<promise>FAILED</promise>')) {
        hasExplicitResult = true;
        isFailed = true;
      }
    });

    // Handle stderr
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      updateClaudeOutput(task.id, text);
    });

    // Handle process exit
    proc.on('close', async (code) => {
      clearTimeout(timeoutId);
      runningProcesses.delete(task.id);
      clearClaudeOutput(task.id);

      // Determine success/failure
      let success = false;

      if (hasExplicitResult) {
        // Use explicit signal
        success = isComplete && !isFailed;
      } else {
        // Fallback: use exit code and pattern matching
        if (code === 0) {
          // Check for error patterns in output
          const errorPatterns = [
            /error:/i,
            /failed:/i,
            /exception:/i,
            /fatal:/i
          ];

          const hasErrors = errorPatterns.some(pattern => pattern.test(output));
          success = !hasErrors;
        } else {
          success = false;
        }
      }

      if (success) {
        completeTask(task.id, output);
        await sendMessage(t('executor.completed', { taskId: task.id }));
        resolve({ success: true });
      } else {
        const { canRetry } = incrementRetry(task.id);

        if (canRetry) {
          await sendMessage(t('executor.retrying', {
            taskId: task.id,
            current: task.currentRetry + 1,
            max: task.maxRetries
          }));
          resolve({ success: false, canRetry: true });
        } else {
          failTask(task.id, output.slice(-1000)); // Save last 1000 chars as error
          await sendMessage(t('executor.failed', { taskId: task.id }));
          resolve({ success: false, canRetry: false });
        }
      }
    });

    // Handle process error
    proc.on('error', async (error) => {
      clearTimeout(timeoutId);
      runningProcesses.delete(task.id);
      clearClaudeOutput(task.id);

      console.error(`Process error for task ${task.id}:`, error);

      const { canRetry } = incrementRetry(task.id);

      if (canRetry) {
        await sendMessage(t('executor.retrying', {
          taskId: task.id,
          current: task.currentRetry + 1,
          max: task.maxRetries
        }));
        resolve({ success: false, canRetry: true });
      } else {
        failTask(task.id, error.message);
        await sendMessage(t('executor.failed', { taskId: task.id }));
        resolve({ success: false, canRetry: false });
      }
    });
  });
}

/**
 * Kill a running process
 */
function killProcess(taskId) {
  const proc = runningProcesses.get(taskId);

  if (!proc) return false;

  try {
    if (process.platform === 'win32') {
      // On Windows, use taskkill to kill the process tree
      spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
    } else {
      proc.kill('SIGTERM');
    }

    runningProcesses.delete(taskId);
    return true;
  } catch (e) {
    console.error(`Failed to kill process for task ${taskId}:`, e);
    return false;
  }
}

/**
 * Get running tasks info
 */
function getRunningTasks() {
  const tasks = [];

  for (const [taskId, proc] of runningProcesses) {
    tasks.push({
      taskId,
      pid: proc.pid
    });
  }

  return tasks;
}

/**
 * Cancel a running task
 */
async function cancelRunningTask(taskId) {
  if (runningProcesses.has(taskId)) {
    killProcess(taskId);
    clearClaudeOutput(taskId);
    return true;
  }
  return false;
}

/**
 * Main executor loop
 */
async function executorLoop() {
  if (!isRunning) return;

  const config = loadConfig();
  const parallelExecution = config?.parallelExecution || false;
  const maxParallel = config?.maxParallel || 1;

  // Get current running count
  const currentRunning = getInProgressTasks().length;

  // Calculate how many more tasks we can run
  const canRun = parallelExecution
    ? Math.max(0, maxParallel - currentRunning)
    : (currentRunning === 0 ? 1 : 0);

  if (canRun > 0) {
    // Get next tasks
    const tasks = getNextTasks(canRun);

    // Execute tasks
    for (const task of tasks) {
      // Don't await - run in background
      executeTask(task).catch(err => {
        console.error(`Error executing task ${task.id}:`, err);
      });

      // Small delay between starting tasks
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

/**
 * Start the executor
 */
function startExecutor() {
  if (isRunning) {
    console.log('Executor already running');
    return;
  }

  isRunning = true;

  // Run loop every 5 seconds
  executorInterval = setInterval(() => {
    executorLoop().catch(err => {
      console.error('Executor loop error:', err);
    });
  }, 5000);

  console.log('Executor started');
}

/**
 * Stop the executor
 */
async function stopExecutor() {
  isRunning = false;

  if (executorInterval) {
    clearInterval(executorInterval);
    executorInterval = null;
  }

  // Kill all running processes
  for (const taskId of runningProcesses.keys()) {
    killProcess(taskId);
  }

  console.log('Executor stopped');
}

/**
 * Check if executor is running
 */
function isExecutorRunning() {
  return isRunning;
}

module.exports = {
  startExecutor,
  stopExecutor,
  isExecutorRunning,
  getRunningTasks,
  cancelRunningTask,
  executeTask
};
