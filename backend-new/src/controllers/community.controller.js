/**
 * ==============================================================================
 * COMMUNITY FORUM CONTROLLER (src/controllers/community.controller.js)
 * ==============================================================================
 * Manages community discussion posts, comments, atomic post likes, and search.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

// User summary projection
const userSelect = {
  id: true,
  name: true,
  avatar: true,
  role: true,
  stream: true,
  specialization: true,
};

// Relation inclusion for post queries
const postInclude = {
  user: { select: userSelect },
  comments: {
    orderBy: { createdAt: 'asc' },
    include: { user: { select: userSelect } },
  },
  postLikes: {
    select: { userId: true },
  },
};

/**
 * Decorates post object with `likedByMe` boolean and `likeCount` aggregate
 */
const decoratePost = (post, userId) => ({
  ...post,
  likedByMe: post.postLikes.some((like) => like.userId === userId),
  likeCount: post.likes,
});

/**
 * List / Search Forum Posts (`GET /api/community/posts`)
 * Supports `search` (title/content/category) and `category` filters.
 * Appends `likedByMe` boolean relative to requesting user.
 */
export const listPosts = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filters = [];

    if (category) {
      filters.push({ category });
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const posts = await prisma.post.findMany({
      where: filters.length ? { AND: filters } : undefined,
      include: postInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ posts: posts.map((post) => decoratePost(post, req.user.id)) });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Forum Post (`POST /api/community/posts`)
 * Protected route (`authenticate` required).
 * Inserts post record and returns decorated post object.
 */
export const createPost = async (req, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';

    if (!content) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        title: title || null,
        content,
        category: category || null,
      },
      include: postInclude,
    });

    res.status(201).json({ post: decoratePost(post, req.user.id) });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Forum Post (`PUT /api/community/posts/:id`)
 * Verifies author ownership before allowing edits.
 */
export const updatePost = async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Ownership check
    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';

    if (!content) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: title || null,
        content,
        category: category || null,
      },
      include: postInclude,
    });

    res.json({ post: decoratePost(updatedPost, req.user.id) });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Forum Post (`DELETE /api/community/posts/:id`)
 * Verifies author ownership, then performs an atomic Prisma transaction (`$transaction`)
 * to delete all child comments, child post likes, and the parent post record.
 */
export const deletePost = async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Ownership check
    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Atomic multi-table cascading delete via transaction
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { postId } }),
      prisma.postLike.deleteMany({ where: { postId } }),
      prisma.post.delete({ where: { id: postId } }),
    ]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Post Like (`POST /api/community/posts/:id/like`)
 * Atomically toggles user like state using a Prisma Transaction (`$transaction`):
 * - If already liked: deletes `PostLike` record and decrements post `likes` count.
 * - If not liked: creates `PostLike` record and increments post `likes` count.
 */
export const toggleLike = async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check existing like status
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike transaction
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existingLike.id } }),
        prisma.post.update({ where: { id: postId }, data: { likes: { decrement: 1 } } }),
      ]);
    } else {
      // Like transaction
      await prisma.$transaction([
        prisma.postLike.create({ data: { postId, userId: req.user.id } }),
        prisma.post.update({ where: { id: postId }, data: { likes: { increment: 1 } } }),
      ]);
    }

    // Return updated post state
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: postInclude,
    });

    res.json({ post: decoratePost(updatedPost, req.user.id) });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Post Comment (`POST /api/community/posts/:id/comments`)
 * Inserts comment linked to post and user.
 */
export const addComment = async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: req.user.id,
        content,
      },
      include: { user: { select: userSelect } },
    });

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};
