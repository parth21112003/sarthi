/**
 * ==============================================================================
 * AI CONTROLLER (src/controllers/ai.controller.js)
 * ==============================================================================
 */

import prisma from '../config/prisma.js';
import { chatWithAiCompanion, generateCareerRoadmap } from '../services/ai.service.js';

/**
 * Chat with AI Companion (POST /api/ai/chat)
 * Request body: { message: string, chatHistory: Array<{ role: 'user'|'assistant', content: string }> }
 */
export const chat = async (req, res, next) => {
  try {
    const { message, chatHistory } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const reply = await chatWithAiCompanion({
      user: req.user,
      message: message.trim(),
      chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
    });

    res.json({ reply });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate AI Roadmap from Aptitude Assessment (POST /api/ai/roadmap)
 * Request body: { resultId?: number } (optional, defaults to latest attempt)
 */
export const roadmap = async (req, res, next) => {
  try {
    let result = null;

    if (req.body.resultId) {
      result = await prisma.aptitudeResult.findFirst({
        where: { id: Number(req.body.resultId), userId: req.user.id },
      });
    } else {
      result = await prisma.aptitudeResult.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!result) {
      return res.status(404).json({
        error: 'No aptitude assessment found. Please complete an assessment test first to generate an AI roadmap.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, stream: true },
    });

    const aiRoadmap = await generateCareerRoadmap({ user, aptitudeResult: result });

    res.json({ roadmap: aiRoadmap });
  } catch (error) {
    next(error);
  }
};
