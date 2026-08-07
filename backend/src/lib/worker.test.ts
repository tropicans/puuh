import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from './prisma';
import { processNextTask, startWorker, stopWorker } from './worker';
import { TaskStatus, TaskType } from '@prisma/client';

vi.mock('./prisma', () => {
  return {
    prisma: {
      processTask: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
    default: {
      processTask: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('Background Worker Engine', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    stopWorker();
  });

  it('should skip processing if no pending task is found', async () => {
    vi.mocked(prisma.processTask.findFirst).mockResolvedValueOnce(null);

    await processNextTask();

    expect(prisma.processTask.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.processTask.update).not.toHaveBeenCalled();
  });

  it('should process a pending task successfully', async () => {
    const mockTask = {
      id: 'task-123',
      type: TaskType.UPLOAD_PDF,
      status: TaskStatus.PENDING,
      progress: 0,
      payload: { filename: 'test.pdf' },
      result: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.processTask.findFirst).mockResolvedValueOnce(mockTask);
    vi.mocked(prisma.processTask.update).mockResolvedValue({} as any);

    await processNextTask();

    expect(prisma.processTask.findFirst).toHaveBeenCalledTimes(1);
    // Should update twice: 1) status to PROCESSING, 2) status to SUCCESS
    expect(prisma.processTask.update).toHaveBeenCalledTimes(2);

    expect(prisma.processTask.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'task-123' },
      data: {
        status: TaskStatus.PROCESSING,
        progress: 10,
      },
    });

    expect(prisma.processTask.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'task-123' },
      data: {
        status: TaskStatus.SUCCESS,
        progress: 100,
        result: { message: 'UPLOAD_PDF stub executed successfully', payload: { filename: 'test.pdf' } },
      },
    });
  });

  it('should handle errors and update task status to FAILED', async () => {
    const mockTask = {
      id: 'task-456',
      type: TaskType.UPLOAD_PDF,
      status: TaskStatus.PENDING,
      progress: 0,
      payload: { filename: 'test.pdf' },
      result: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.processTask.findFirst).mockResolvedValueOnce(mockTask);
    
    // First update (to PROCESSING) succeeds, second update (to SUCCESS) fails
    vi.mocked(prisma.processTask.update)
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error('Mock handler execution failure'));

    await processNextTask();

    // The catch block update should be called to set status to FAILED
    expect(prisma.processTask.update).toHaveBeenLastCalledWith({
      where: { id: 'task-456' },
      data: {
        status: TaskStatus.FAILED,
        error: 'Mock handler execution failure',
      },
    });
  });
});
