import fs from 'fs';
import path from 'path';
import { DatabaseState, generateSeedData } from './seed.ts';

class DatabaseManager {
  private state: DatabaseState;
  private filePath: string;
  private initialized: boolean = false;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'rcsa-db.json');
    this.state = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseState {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.risks && parsed.users && parsed.roles && parsed.units) {
          this.initialized = true;
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse database file, re-seeding default enterprise dataset...', err);
      }
    }

    const seed = generateSeedData();
    this.saveState(seed);
    this.initialized = true;
    return seed;
  }

  private saveState(stateToSave?: DatabaseState) {
    try {
      const state = stateToSave || this.state;
      fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public persist() {
    this.saveState();
  }

  // Generic collection accessors
  public getCollection<T = any>(name: keyof DatabaseState): T[] {
    return (this.state[name] as any) || [];
  }

  public nextId(collectionName: keyof DatabaseState): number {
    const collection = this.getCollection(collectionName);
    if (!collection.length) return 1;
    const maxId = Math.max(...collection.map((item: any) => item.id || 0));
    return maxId + 1;
  }

  public resetToSeed(): DatabaseState {
    this.state = generateSeedData();
    this.saveState();
    return this.state;
  }
}

export const dbManager = new DatabaseManager();
