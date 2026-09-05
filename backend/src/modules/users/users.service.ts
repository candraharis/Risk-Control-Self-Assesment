import bcrypt from 'bcryptjs';
import { dbManager } from '../../database/db.ts';
import { auditService } from '../audit/audit.service.ts';

export class UsersService {
  public getAllUsers() {
    const users = dbManager.getCollection('users');
    const roles = dbManager.getCollection('roles');
    const units = dbManager.getCollection('units');

    return users.map(u => {
      const role = roles.find(r => r.id === u.role_id);
      const unit = units.find(unit => unit.id === u.unit_id);
      return {
        id: u.id,
        uuid: u.uuid,
        name: u.name,
        email: u.email,
        role_id: u.role_id,
        role: role ? { id: role.id, name: role.name, description: role.description } : null,
        unit_id: u.unit_id,
        unit: unit ? { id: unit.id, code: unit.code, name: unit.name } : null,
        manager_id: u.manager_id,
        is_active: u.is_active,
        created_at: u.created_at
      };
    });
  }

  public createUser(userData: {
    name: string;
    email: string;
    password?: string;
    role_id: number;
    unit_id?: number | null;
    manager_id?: number | null;
    creatorUserId?: number;
  }) {
    const users = dbManager.getCollection('users');
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    const id = dbManager.nextId('users');
    const password = userData.password || 'Password123!';
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = {
      id,
      uuid: `usr-${Date.now().toString(36)}`,
      name: userData.name,
      email: userData.email,
      password_hash: passwordHash,
      role_id: Number(userData.role_id),
      unit_id: userData.unit_id ? Number(userData.unit_id) : null,
      manager_id: userData.manager_id ? Number(userData.manager_id) : null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    dbManager.getState().users.push(newUser);
    dbManager.persist();

    auditService.logActivity({
      userId: userData.creatorUserId || 1,
      entity: 'User',
      entityId: newUser.email,
      action: 'CREATE',
      newValue: `Created user ${newUser.name} with role ID ${newUser.role_id}`
    });

    return this.getUserById(id);
  }

  public getUserById(id: number) {
    const users = this.getAllUsers();
    return users.find(u => u.id === id);
  }
}

export const usersService = new UsersService();
