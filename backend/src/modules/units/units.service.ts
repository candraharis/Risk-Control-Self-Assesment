import { dbManager } from '../../database/db.ts';

export class UnitsService {
  public getAllUnits() {
    return dbManager.getCollection('units');
  }

  public getAllCategories() {
    return dbManager.getCollection('risk_categories');
  }

  public getAllRoles() {
    return dbManager.getCollection('roles');
  }
}

export const unitsService = new UnitsService();
