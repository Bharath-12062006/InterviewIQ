import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function protect(req, res, next) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'interviewiq_jwt_secret_campus_placement_2026',
      );
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, account not found.' });
      }
      req.user = user;
      return next();
    } catch (err) {
      console.error('Auth verification error:', err.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired.' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, please log in or sign up.' });
}
