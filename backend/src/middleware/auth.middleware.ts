import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { RoleName } from '../../../shared/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_rcsa_jwt_secret_super_secure_key_2026';

export interface AuthenticatedUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  roleId: number;
  role: RoleName;
  unitId?: number | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: user.role,
      unitId: user.unitId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
  } catch (err) {
    return null;
  }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }

  req.user = decoded;
  next();
}

/**
 * RBAC Role authorization guard
 */
export function authorize(...allowedRoles: RoleName[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Not logged in' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted. Requires one of roles: [${allowedRoles.join(', ')}]`,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}
