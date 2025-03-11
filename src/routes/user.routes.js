import express from 'express';
import { registerUser } from '../controllers/user.controller.js';  // Ensure this path is correct

const router = express.Router();

// Register User Route
router.post('/newregister', registerUser);

export default router;
