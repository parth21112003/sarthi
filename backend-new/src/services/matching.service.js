/**
 * ==============================================================================
 * SMART COUNSELOR MATCHING SERVICE (src/services/matching.service.js)
 * ==============================================================================
 * Calculates multi-dimensional compatibility scores between students and counselors.
 * 
 * SCORING DIMENSIONS:
 * 1. Stream & Specialization Fit (35% weight)
 * 2. Aptitude Evaluation Alignment (30% weight)
 * 3. Counselor Rating & Review Quality (20% weight)
 * 4. Experience & Domain Seniority (15% weight)
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

// Mapping between aptitude dominant streams and counselor specialization keywords
const streamKeywordMap = {
  logical: ['engineering', 'computer science', 'technology', 'data science', 'software', 'ai', 'robotics'],
  quantitative: ['finance', 'banking', 'analytics', 'economics', 'commerce', 'business', 'actuarial'],
  verbal: ['law', 'journalism', 'arts', 'humanities', 'literature', 'policy', 'communications'],
  creative: ['design', 'ui/ux', 'media', 'architecture', 'fashion', 'animation', 'arts', 'product'],
  social: ['psychology', 'counselling', 'hr', 'management', 'social work', 'education', 'healthcare'],
};

/**
 * Compute compatibility score (0 to 100) between a student and a counselor.
 */
export const computeCompatibility = (student, counselor, latestAptitudeResult = null) => {
  let score = 0;
  const matchFactors = [];

  const counselorSpec = (counselor.specialization || '').toLowerCase();
  const counselorStream = (counselor.stream || '').toLowerCase();
  const studentStream = (student.stream || '').toLowerCase();

  // 1. Direct Academic Stream Match (Max 35 pts)
  if (studentStream && (counselorSpec.includes(studentStream) || counselorStream.includes(studentStream))) {
    score += 35;
    matchFactors.push(`Direct stream match in ${student.stream}`);
  } else if (studentStream && counselorStream && studentStream === counselorStream) {
    score += 30;
    matchFactors.push(`Matching academic background in ${student.stream}`);
  } else {
    // Partial baseline score
    score += 10;
  }

  // 2. Aptitude Result Alignment (Max 30 pts)
  if (latestAptitudeResult) {
    let dominantCategory = 'logical';
    try {
      const parsedScores = typeof latestAptitudeResult.scores === 'string'
        ? JSON.parse(latestAptitudeResult.scores)
        : latestAptitudeResult.scores;

      dominantCategory = Object.entries(parsedScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'logical';
    } catch {
      // fallback
    }

    const keywords = streamKeywordMap[dominantCategory] || [];
    const matchesKeyword = keywords.some(
      (kw) => counselorSpec.includes(kw) || counselorStream.includes(kw) || (counselor.bio || '').toLowerCase().includes(kw)
    );

    if (matchesKeyword) {
      score += 30;
      matchFactors.push(`Top match for your ${dominantCategory.toUpperCase()} aptitude strengths`);
    } else {
      score += 12;
    }
  } else {
    score += 15; // default aptitude neutral weight
  }

  // 3. Rating & Community Reputation (Max 20 pts)
  const rating = counselor.rating || 0;
  const totalReviews = counselor.totalRatings || 0;
  // Normalized rating score: 5 stars = 16 pts, reviews count bonus = up to 4 pts
  const ratingScore = Math.min(16, (rating / 5) * 16);
  const volumeBonus = Math.min(4, Math.log2(totalReviews + 1));
  const reviewScore = Math.round(ratingScore + volumeBonus);
  score += reviewScore;
  if (rating >= 4.5) {
    matchFactors.push(`Highly rated counselor (${rating.toFixed(1)} ★)`);
  }

  // 4. Professional Experience (Max 15 pts)
  const exp = counselor.experience || 0;
  let expScore = 5;
  if (exp >= 10) {
    expScore = 15;
    matchFactors.push(`${exp}+ years seasoned industry expert`);
  } else if (exp >= 5) {
    expScore = 12;
    matchFactors.push(`${exp} years professional counseling experience`);
  } else if (exp >= 2) {
    expScore = 8;
  }
  score += expScore;

  const finalMatchPercentage = Math.min(99, Math.max(50, Math.round(score)));

  return {
    matchPercentage: finalMatchPercentage,
    matchFactors,
  };
};

/**
 * Get personalized recommendations for a student.
 */
export const getRecommendedCounselors = async (studentId, limit = 6) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      aptitudeResults: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!student) return [];

  const latestAptitude = student.aptitudeResults[0] || null;

  const counselors = await prisma.user.findMany({
    where: { role: 'counselor' },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      stream: true,
      gender: true,
      experience: true,
      specialization: true,
      rating: true,
      totalRatings: true,
      availabilitySlots: {
        where: { isActive: true },
      },
    },
  });

  const scoredCounselors = counselors.map((counselor) => {
    const { matchPercentage, matchFactors } = computeCompatibility(student, counselor, latestAptitude);
    return {
      ...counselor,
      matchPercentage,
      matchFactors,
    };
  });

  // Sort descending by match percentage, then by rating
  scoredCounselors.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return (b.rating || 0) - (a.rating || 0);
  });

  return scoredCounselors.slice(0, limit);
};
