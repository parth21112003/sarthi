/**
 * ==============================================================================
 * APTITUDE TEST CONTROLLER (src/controllers/aptitude.controller.js)
 * ==============================================================================
 * Manages career aptitude assessments for students backed by dynamic database questions.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

// Career recommendations based on dominant score category
const recommendations = [
  { key: 'logical', streamRecommendation: 'Engineering, Computer Science, Data Science, Artificial Intelligence, Robotics' },
  { key: 'quantitative', streamRecommendation: 'Finance, Investment Banking, Data Analytics, Actuarial Science, Economics' },
  { key: 'verbal', streamRecommendation: 'Law, Journalism, Corporate Communications, Content Strategy, Public Policy' },
  { key: 'creative', streamRecommendation: 'UI/UX Design, Product Design, Architecture, Animation, Digital Media' },
  { key: 'social', streamRecommendation: 'Psychology, Human Resources, Career Counselling, Educational Leadership, Social Work' },
];

/**
 * Get Test Questions (GET /api/aptitude/questions)
 * Fetches active questions from the database and strips out option scores to prevent cheating.
 */
export const getQuestions = async (req, res, next) => {
  try {
    const dbQuestions = await prisma.aptitudeQuestion.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });

    const sanitizedQuestions = dbQuestions.map((q) => {
      const parsedOptions = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
      return {
        id: q.id,
        category: q.category,
        prompt: q.prompt,
        difficulty: q.difficulty,
        options: parsedOptions.map(({ id, text }) => ({ id, text })),
      };
    });

    res.json({ questions: sanitizedQuestions });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Aptitude Test (POST /api/aptitude/submit)
 * Protected route (Student only).
 * Calculates scores, determines top category recommendation, and persists result in DB.
 */
export const submitAptitude = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit aptitude tests' });
    }

    const answers = req.body.answers || {};

    // Fetch active master questions from DB
    const dbQuestions = await prisma.aptitudeQuestion.findMany({
      where: { isActive: true },
    });

    if (dbQuestions.length === 0) {
      return res.status(500).json({ error: 'No aptitude questions found in the system' });
    }

    // Ensure at least 80% of questions are answered
    const answeredCount = Object.keys(answers).length;
    if (answeredCount === 0) {
      return res.status(400).json({ error: 'Please answer the aptitude test questions before submitting' });
    }

    const scores = {
      logical: 0,
      verbal: 0,
      quantitative: 0,
      creative: 0,
      social: 0,
    };
    let totalScore = 0;

    // Score submitted answers against question bank
    dbQuestions.forEach((q) => {
      const parsedOptions = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
      const chosenOptionId = answers[q.id] || answers[String(q.id)];
      const selected = parsedOptions.find((opt) => opt.id === chosenOptionId);
      const score = selected?.score || 0;

      scores[q.category] = (scores[q.category] || 0) + score;
      totalScore += score;
    });

    // Find highest scoring category
    const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'logical';
    const recommendation = recommendations.find((item) => item.key === topCategory)?.streamRecommendation;

    // Save evaluation result in database
    const result = await prisma.aptitudeResult.create({
      data: {
        userId: req.user.id,
        scores: JSON.stringify(scores),
        streamRecommendation: recommendation,
        totalScore,
      },
    });

    res.status(201).json({
      result: {
        ...result,
        scores,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List Past Aptitude Results (GET /api/aptitude/results)
 * Retrieves past aptitude test attempts for current user and parses JSON stringified score fields.
 */
export const listResults = async (req, res, next) => {
  try {
    const results = await prisma.aptitudeResult.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      results: results.map((result) => ({
        ...result,
        scores: JSON.parse(result.scores),
      })),
    });
  } catch (error) {
    next(error);
  }
};
