/**
 * ==============================================================================
 * COMMUNITY FORUM ROUTES (src/routes/community.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/community`
 * 
 * ENDPOINTS:
 * - GET    /api/community/posts             : List/search community posts
 * - POST   /api/community/posts             : Create a new discussion post
 * - PUT    /api/community/posts/:id         : Edit existing post (Author only)
 * - DELETE /api/community/posts/:id         : Delete post (Author only)
 * - POST   /api/community/posts/:id/like    : Toggle like status on a post
 * - POST   /api/community/posts/:id/comments: Add comment to a post
 * ==============================================================================
 */

import express from 'express';
import {
  addComment,
  createPost,
  deletePost,
  listPosts,
  toggleLike,
  updatePost,
} from '../controllers/community.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: List & search community discussion posts
router.get('/posts', authenticate, listPosts);

// Protected: Create a new discussion post
router.post('/posts', authenticate, createPost);

// Protected: Edit existing post
router.put('/posts/:id', authenticate, updatePost);

// Protected: Delete post and all associated comments/likes
router.delete('/posts/:id', authenticate, deletePost);

// Protected: Toggle like status on post
router.post('/posts/:id/like', authenticate, toggleLike);

// Protected: Add a comment to a post
router.post('/posts/:id/comments', authenticate, addComment);

export default router;
