import { prisma } from './prisma';
import { logger } from '../utils/logger';
import { ProcessTask, TaskStatus, TaskType } from '@prisma/client';

let workerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

// Task registry for extensible execution
type TaskHandler = (task: ProcessTask) => Promise<any>;
const taskHandlers: Record<TaskType, TaskHandler> = {
  UPLOAD_PDF: async (task: ProcessTask) => {
    logger.info(`Running UPLOAD_PDF placeholder for task ${task.id}`);
    return { message: 'UPLOAD_PDF stub executed successfully', payload: task.payload };
  },
  SYNC_JR: async (task: ProcessTask) => {
    logger.info(`Running SYNC_JR placeholder for task ${task.id}`);
    return { message: 'SYNC_JR stub executed successfully', payload: task.payload };
  }
};

/**
 * Polls the database for the next PENDING task, marks it as PROCESSING,
 * and processes it with the appropriate handler.
 */
export async function processNextTask(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  // Track current task we are processing to update its failure state if needed
  let activeTaskId: string | null = null;

  try {
    // Find the oldest pending task
    const task = await prisma.processTask.findFirst({
      where: { status: TaskStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    if (!task) {
      isProcessing = false;
      return;
    }

    activeTaskId = task.id;
    logger.info(`Starting background task ${task.id} (${task.type})`);

    // Atomically mark the task as PROCESSING
    await prisma.processTask.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.PROCESSING,
        progress: 10, // Start progress at 10%
      },
    });

    const handler = taskHandlers[task.type];
    if (!handler) {
      throw new Error(`No handler registered for task type: ${task.type}`);
    }

    // Execute the task handler
    const result = await handler(task);

    // Update status to SUCCESS
    await prisma.processTask.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.SUCCESS,
        progress: 100,
        result: result ?? null,
      },
    });

    logger.info(`Task ${task.id} completed successfully`);
  } catch (error: any) {
    logger.error('Error executing background task:', error);
    
    // Attempt to mark the current task as FAILED
    if (activeTaskId) {
      try {
        await prisma.processTask.update({
          where: { id: activeTaskId },
          data: {
            status: TaskStatus.FAILED,
            error: error?.message || String(error),
          },
        });
      } catch (updateError) {
        logger.error(`Failed to update task status to FAILED for task ${activeTaskId}:`, updateError);
      }
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Starts the background worker loop using recursive setTimeout.
 */
export function startWorker(intervalMs = 3000): void {
  if (workerInterval) {
    logger.warn('Background worker is already running.');
    return;
  }

  logger.info('Starting background task worker...');

  async function tick() {
    await processNextTask();
    if (workerInterval !== null) {
      workerInterval = setTimeout(tick, intervalMs);
    }
  }

  workerInterval = setTimeout(tick, intervalMs);
}

/**
 * Stops the background worker loop.
 */
export function stopWorker(): void {
  if (workerInterval) {
    clearTimeout(workerInterval);
    workerInterval = null;
    logger.info('Background task worker stopped.');
  }
}
