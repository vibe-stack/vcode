// Browser polyfill for Node.js async_hooks module
// This is a minimal implementation for browser compatibility

export class AsyncLocalStorage {
  private _store: Map<string, any>;

  constructor() {
    this._store = new Map();
  }

  getStore() {
    return this._store.get('current') || undefined;
  }

  run(store: any, callback: (...args: any[]) => any, ...args: any[]) {
    const previous = this._store.get('current');
    this._store.set('current', store);
    try {
      return callback(...args);
    } finally {
      if (previous !== undefined) {
        this._store.set('current', previous);
      } else {
        this._store.delete('current');
      }
    }
  }

  enterWith(store: any) {
    this._store.set('current', store);
  }

  exit(callback: (...args: any[]) => any, ...args: any[]) {
    return this.run(undefined, callback, ...args);
  }
}
