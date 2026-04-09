import { describe, it, expect } from 'vitest';
import { Mutex } from '../Mutex';

describe('Mutex', () => {
  it('should run tasks sequentially', async () => {
    const mutex = new Mutex();
    const results: number[] = [];

    const task1 = mutex.runExclusive(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      results.push(1);
    });

    const task2 = mutex.runExclusive(async () => {
      results.push(2);
    });

    await Promise.all([task1, task2]);

    expect(results).toEqual([1, 2]);
  });

  it('should handle many concurrent tasks (Race Condition test)', async () => {
    const mutex = new Mutex();
    let counter = 0;
    const numTasks = 100;

    // Simulate tasks that read, delay, then write
    const tasks = Array.from({ length: numTasks }).map(() =>
      mutex.runExclusive(async () => {
        const current = counter;
        // Small random delay to increase chance of race condition if mutex fails
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        counter = current + 1;
      })
    );

    await Promise.all(tasks);

    expect(counter).toBe(numTasks);
  });

  it('should not deadlock if a task throws an error', async () => {
    const mutex = new Mutex();
    const results: string[] = [];

    const errorTask = mutex.runExclusive(async () => {
      results.push('start-error-task');
      throw new Error('Task failed');
    });

    const secondTask = mutex.runExclusive(async () => {
      results.push('second-task');
    });

    await expect(errorTask).rejects.toThrow('Task failed');
    await secondTask;

    expect(results).toEqual(['start-error-task', 'second-task']);
  });

  it('should return the value from the callback', async () => {
    const mutex = new Mutex();
    const result = await mutex.runExclusive(async () => {
      return 'hello world';
    });
    expect(result).toBe('hello world');
  });

  it('should correctly report the lock status', async () => {
    const mutex = new Mutex();
    expect(mutex.isLocked()).toBe(false);

    const task = mutex.runExclusive(async () => {
      expect(mutex.isLocked()).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Check while the task is running
    // We need to wait a tiny bit for the lock to be acquired in the microtask queue
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(mutex.isLocked()).toBe(true);

    await task;
    expect(mutex.isLocked()).toBe(false);
  });
});
