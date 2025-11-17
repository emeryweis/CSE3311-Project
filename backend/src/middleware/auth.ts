import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req: any, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: any = new Error('No token provided');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env['JWT_SECRET'] as string);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err: any) {
    err.statusCode = 401;
    next(err);
  }
};

export const optionalAuth = async (req: any, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env['JWT_SECRET'] as string);

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    // Optional auth never blocks, just logs error
    next();
  }
};

export const requireAdmin = async (req: any, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: any = new Error('No token provided');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env['JWT_SECRET'] as string);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 401;
      return next(error);
    }

    // Check if user is admin
    if (!user.isAdmin) {  // or user.role !== 'ADMIN'
      const error: any = new Error('Admin access required');
      error.statusCode = 403;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err: any) {
    err.statusCode = 401;
    next(err);
  }
};