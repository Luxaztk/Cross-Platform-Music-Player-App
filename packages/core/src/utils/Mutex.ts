/**
 * A simple Mutex implementation to handle asynchronous locks.
 * This ensures that only one task can execute a specific block of code at a time.
 */
export class Mutex {
  private mutex = Promise.resolve();
  private _isLocked = false;

  /**
   * Runs the provided callback exclusively.
   * If another task is already running, it will wait for the previous task to finish.
   */
  public async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    let release: (value: void | PromiseLike<void>) => void;
    const nextTask = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previousTask = this.mutex;
    this.mutex = nextTask;

    try {
      // Wait for the previous task to complete
      await previousTask;
      this._isLocked = true;
      // Execute the current callback
      return await callback();
    } finally {
      this._isLocked = false;
      // Always release the lock for the next task in the queue
      release!();
    }
  }

  /**
   * Returns true if the mutex is currently locked.
   */
  public isLocked(): boolean {
    return this._isLocked;
  }
}
