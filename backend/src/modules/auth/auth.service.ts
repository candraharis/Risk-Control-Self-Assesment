import bcrypt from 'bcryptjs';
import { dbManager } from '../../database/db.ts';
import { generateToken, AuthenticatedUser } from '../../middleware/auth.middleware.ts';
import { auditService } from '../audit/audit.service.ts';
import { RoleName } from '../../../../shared/types.ts';

export class AuthService {
  public async login(email: string, password?: string): Promise<{ token: string; user: any }> {
    const users = dbManager.getCollection('users');
    const roles = dbManager.getCollection('roles');
    const units = dbManager.getCollection('units');

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account has been deactivated. Please contact your system administrator.');
    }

    // Password validation (if provided)
    if (password) {
      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }
    }

    const role = roles.find(r => r.id === user.role_id);
    const unit = units.find(u => u.id === user.unit_id);

    const authUser: AuthenticatedUser = {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      roleId: user.role_id,
      role: (role ? role.name : 'RISK_OWNER') as RoleName,
      unitId: user.unit_id
    };

    const token = generateToken(authUser);

    auditService.logActivity({
      userId: user.id,
      entity: 'Auth',
      entityId: user.email,
      action: 'LOGIN',
      newValue: `Logged in as ${authUser.role}`
    });

    return {
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: authUser.role,
        roleId: user.role_id,
        unitId: user.unit_id,
        unit: unit ? { id: unit.id, code: unit.code, name: unit.name } : null
      }
    };
  }

  public getMe(userId: number) {
    const users = dbManager.getCollection('users');
    const roles = dbManager.getCollection('roles');
    const units = dbManager.getCollection('units');

    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const role = roles.find(r => r.id === user.role_id);
    const unit = units.find(u => u.id === user.unit_id);

    return {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: role ? role.name : 'RISK_OWNER',
      roleId: user.role_id,
      unitId: user.unit_id,
      unit: unit ? { id: unit.id, code: unit.code, name: unit.name } : null
    };
  }
}

export const authService = new AuthService();
