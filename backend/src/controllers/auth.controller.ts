import { Request, Response } from 'express';
import { db } from '../database/memory-db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class AuthController {
  register = async (req: Request, res: Response) => {
    try {
      const { username, email, password, phone, companyName, role } = req.body;

      const existingUser = db.users.find(u => u.username === username || u.email === email);

      if (existingUser) {
        return res.status(400).json({ message: '用户名或邮箱已存在' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: uuid(),
        username,
        email,
        password: hashedPassword,
        phone,
        companyName,
        role: role || 'merchant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      db.users.push(user);

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: '注册成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('注册失败:', error);
      res.status(500).json({ message: '注册失败' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const user = db.users.find(u => u.username === username);

      if (!user) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('登录失败:', error);
      res.status(500).json({ message: '登录失败' });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const user = db.users.find(u => u.id === userId);

      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      res.status(500).json({ message: '获取用户信息失败' });
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { phone, companyName, address } = req.body;

      const user = db.users.find(u => u.id === userId);
      if (user) {
        user.phone = phone;
        user.companyName = companyName;
        user.address = address;
        user.updatedAt = new Date();
      }

      res.json({ message: '更新成功' });
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      res.status(500).json({ message: '更新用户信息失败' });
    }
  };
}
