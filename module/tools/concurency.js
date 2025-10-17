export class Semaphore {
  constructor(maxConcurrent = 1) {
    this.maxConcurrent = maxConcurrent; // How many keys you have (default is 1)
    this.inUse = 0; // How many keys are currently in use
    this.waitQueue = [];
  }

  // Ask for a resource
  async acquire() {
    // If we have an available resource
    if (this.inUse < this.maxConcurrent) {
      this.inUse++;
      return Promise.resolve();
    }

    // If max concurent access is reached
    return new Promise((resolve) => {
      this.waitQueue.push(resolve); // add to queue
    });
  }

  // Return resource
  release() {
    if (this.inUse > 0) {
      this.inUse--;
      if (this.waitQueue.length > 0 && this.inUse < this.maxConcurrent) {
        this.inUse++;
        const next = this.waitQueue.shift();
        next();
      }
    }
  }
}

// exclusive access
export class Mutex {
  constructor() {
    this.semaphore = new Semaphore(1);
  }

  async lock() {
    return this.semaphore.acquire();
  }

  unlock() {
    this.semaphore.release();
  }

  // Combine the 2
  async withLock(fn) {
    await this.lock();
    try {
      return await fn();
    } finally {
      this.unlock();
    }
  }
}
