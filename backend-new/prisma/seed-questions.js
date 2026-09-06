/**
 * Seed script for 25 comprehensive aptitude questions across 5 core categories:
 * - Logical Reasoning (5)
 * - Verbal Ability (5)
 * - Quantitative Aptitude (5)
 * - Creative & Design (5)
 * - Social & Leadership (5)
 */

import prisma from '../src/config/prisma.js';

const questions = [
  // --- 1. LOGICAL REASONING (5 questions) ---
  {
    category: 'logical',
    prompt: 'When faced with a complex breakdown in a software system or machine, your natural instinct is to:',
    options: [
      { id: 'a', text: 'Methodically isolate components step-by-step until the root cause is found', score: 4 },
      { id: 'b', text: 'Brainstorm creative workarounds without digging deep into the technical cause', score: 2 },
      { id: 'c', text: 'Gather teammates to discuss how everyone feels about the timeline impact', score: 1 },
      { id: 'd', text: 'Wait for instructions or read documentation before touching anything', score: 2 },
    ],
    difficulty: 'medium',
  },
  {
    category: 'logical',
    prompt: 'In a city, all electric vehicles produce zero tailpipe emissions. Some vehicles with zero tailpipe emissions are hydrogen-powered. What can be concluded logically?',
    options: [
      { id: 'a', text: 'All zero tailpipe emission vehicles are electric', score: 1 },
      { id: 'b', text: 'Electric vehicles in this city do not produce tailpipe emissions', score: 4 },
      { id: 'c', text: 'Hydrogen vehicles are electric', score: 1 },
      { id: 'd', text: 'Hydrogen vehicles do not exist in this city', score: 0 },
    ],
    difficulty: 'hard',
  },
  {
    category: 'logical',
    prompt: 'Which kind of hobby or activity sounds most inherently enjoyable to you?',
    options: [
      { id: 'a', text: 'Playing chess, Sudoku, strategy board games, or coding algorithms', score: 4 },
      { id: 'b', text: 'Writing fiction stories, poetry, or opinion articles', score: 2 },
      { id: 'c', text: 'Sketching, 3D modeling, interior layout design, or photography', score: 2 },
      { id: 'd', text: 'Hosting social events, mentoring youth, or community volunteering', score: 1 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'logical',
    prompt: 'If A is faster than B, B is faster than C, and D is faster than A, who is the slowest?',
    options: [
      { id: 'a', text: 'C', score: 4 },
      { id: 'b', text: 'B', score: 1 },
      { id: 'c', text: 'A', score: 1 },
      { id: 'd', text: 'D', score: 0 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'logical',
    prompt: 'When learning a completely new scientific topic, what helps you grasp it fastest?',
    options: [
      { id: 'a', text: 'Understanding the first-principles logic and algorithmic flowchart', score: 4 },
      { id: 'b', text: 'Listening to an impassioned speech or narrative about its history', score: 1 },
      { id: 'c', text: 'Looking at colorful infographics and metaphorical illustrations', score: 2 },
      { id: 'd', text: 'Working in a study group and talking through key takeaways', score: 2 },
    ],
    difficulty: 'medium',
  },

  // --- 2. VERBAL ABILITY (5 questions) ---
  {
    category: 'verbal',
    prompt: 'Select the pair of words that best exhibits a relationship similar to ARCHITECT : BLUEPRINT:',
    options: [
      { id: 'a', text: 'Author : Novel', score: 4 },
      { id: 'b', text: 'Painter : Canvas', score: 2 },
      { id: 'c', text: 'Doctor : Hospital', score: 1 },
      { id: 'd', text: 'Musician : Guitar', score: 2 },
    ],
    difficulty: 'medium',
  },
  {
    category: 'verbal',
    prompt: 'When you read an ambiguous policy or legal document, what do you notice first?',
    options: [
      { id: 'a', text: 'Subtle nuances in wording, implied clauses, and rhetorical precision', score: 4 },
      { id: 'b', text: 'The numerical figures and monetary allocations mentioned', score: 2 },
      { id: 'c', text: 'The typographic layout and formatting style of the pages', score: 1 },
      { id: 'd', text: 'The emotional tone of the signatories', score: 1 },
    ],
    difficulty: 'hard',
  },
  {
    category: 'verbal',
    prompt: 'Which role would you feel most confident stepping into tomorrow?',
    options: [
      { id: 'a', text: 'Editor-in-chief or spokesperson delivering a major public address', score: 4 },
      { id: 'b', text: 'Data analyst writing automated SQL data pipelines', score: 1 },
      { id: 'c', text: 'Cost estimator reviewing financial balance sheets', score: 1 },
      { id: 'd', text: 'Lead designer selecting brand color palettes', score: 1 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'verbal',
    prompt: 'Choose the word that means the opposite of EPHEMERAL:',
    options: [
      { id: 'a', text: 'Perpetual', score: 4 },
      { id: 'b', text: 'Transient', score: 0 },
      { id: 'c', text: 'Fleeting', score: 0 },
      { id: 'd', text: 'Incidental', score: 1 },
    ],
    difficulty: 'medium',
  },
  {
    category: 'verbal',
    prompt: 'In a group project presentation, which contribution do you naturally gravitate toward?',
    options: [
      { id: 'a', text: 'Writing the persuasive script, speeches, and executive narrative', score: 4 },
      { id: 'b', text: 'Crunching the numbers and running the statistical simulations', score: 1 },
      { id: 'c', text: 'Designing the slide animations, visual themes, and logos', score: 2 },
      { id: 'd', text: 'Managing conflicts and keeping team members motivated', score: 2 },
    ],
    difficulty: 'easy',
  },

  // --- 3. QUANTITATIVE APTITUDE (5 questions) ---
  {
    category: 'quantitative',
    prompt: 'A store increases the price of an item by 20%, then during a holiday sale discounts it by 20%. The final price is:',
    options: [
      { id: 'a', text: '4% lower than original', score: 4 },
      { id: 'b', text: 'Exactly the same as original', score: 1 },
      { id: 'c', text: '4% higher than original', score: 0 },
      { id: 'd', text: '2% lower than original', score: 1 },
    ],
    difficulty: 'medium',
  },
  {
    category: 'quantitative',
    prompt: 'When evaluating which university or job offer to accept, your primary evaluation tool is:',
    options: [
      { id: 'a', text: 'A spreadsheet comparing compensation, ROI, cost of living, and metrics', score: 4 },
      { id: 'b', text: 'A gut feeling based on campus aesthetics and vibe', score: 1 },
      { id: 'c', text: 'How prestigious the company logo looks on a resume', score: 1 },
      { id: 'd', text: 'Recommendations and stories from personal friends and family', score: 2 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'quantitative',
    prompt: 'If 6 people can complete a task in 8 days, how many people are needed to complete it in 4 days assuming equal productivity?',
    options: [
      { id: 'a', text: '12 people', score: 4 },
      { id: 'b', text: '10 people', score: 1 },
      { id: 'c', text: '14 people', score: 1 },
      { id: 'd', text: '16 people', score: 0 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'quantitative',
    prompt: 'Which topic catches your attention fastest when reading news headlines?',
    options: [
      { id: 'a', text: 'Stock market trends, inflation rates, venture capital valuations, and GDP data', score: 4 },
      { id: 'b', text: 'Literary awards, book launches, and opinion essays', score: 1 },
      { id: 'c', text: 'Art exhibitions, fashion runways, and architectural triumphs', score: 1 },
      { id: 'd', text: 'Social justice movements, community initiatives, and mental wellness', score: 2 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'quantitative',
    prompt: 'What is the compound probability of rolling two consecutive sixes on a standard fair six-sided die?',
    options: [
      { id: 'a', text: '1 / 36', score: 4 },
      { id: 'b', text: '1 / 12', score: 1 },
      { id: 'c', text: '1 / 6', score: 0 },
      { id: 'd', text: '2 / 36', score: 1 },
    ],
    difficulty: 'medium',
  },

  // --- 4. CREATIVE & DESIGN (5 questions) ---
  {
    category: 'creative',
    prompt: 'When visiting a new website or app for the first time, what stands out to you immediately?',
    options: [
      { id: 'a', text: 'Visual hierarchy, typography, color harmony, and micro-interactions', score: 4 },
      { id: 'b', text: 'Backend speed, query latency, and technical architecture', score: 2 },
      { id: 'c', text: 'The financial pricing plans and checkout monetization model', score: 1 },
      { id: 'd', text: 'Whether the copywriting tone is grammatically flawless', score: 2 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'creative',
    prompt: 'Given a blank canvas or room, how do you prefer to approach filling it?',
    options: [
      { id: 'a', text: 'Experimenting with bold conceptual themes, materials, lighting, and textures', score: 4 },
      { id: 'b', text: 'Following a strict functional checklist of minimum required furniture', score: 1 },
      { id: 'c', text: 'Calculating the exact square-footage cost optimization', score: 1 },
      { id: 'd', text: 'Consulting what others in the neighborhood have done', score: 2 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'creative',
    prompt: 'Which problem-solving style describes your work best?',
    options: [
      { id: 'a', text: 'Divergent thinking: exploring multiple unconventional ideas before converging', score: 4 },
      { id: 'b', text: 'Rigid deductive logic: only moving from established axioms', score: 1 },
      { id: 'c', text: 'Pure statistical extrapolation of historic numbers', score: 1 },
      { id: 'd', text: 'Following a standard operating manual step-by-step', score: 0 },
    ],
    difficulty: 'medium',
  },
  {
    category: 'creative',
    prompt: 'When someone shows you an ordinary everyday object (like a paperclip or brick), you can easily:',
    options: [
      { id: 'a', text: 'Imagine dozens of alternative, novel uses, artistic forms, and metaphors', score: 4 },
      { id: 'b', text: 'Weigh it to determine its structural load density', score: 2 },
      { id: 'c', text: 'Look up its manufacturing patent classification', score: 1 },
      { id: 'd', text: 'Think of its standard single purpose only', score: 0 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'creative',
    prompt: 'Which career environment excites your imagination most?',
    options: [
      { id: 'a', text: 'A fast-paced creative studio creating brand identities, animations, or video games', score: 4 },
      { id: 'b', text: 'An accounting firm auditing corporate tax returns', score: 0 },
      { id: 'c', text: 'A research laboratory calibrating spectrometry sensors', score: 2 },
      { id: 'd', text: 'A corporate boardroom reviewing weekly sales metrics', score: 1 },
    ],
    difficulty: 'easy',
  },

  // --- 5. SOCIAL & LEADERSHIP (5 questions) ---
  {
    category: 'social',
    prompt: 'When two of your closest peers have an escalating personal disagreement, you usually:',
    options: [
      { id: 'a', text: 'Act as an empathetic mediator, listening to both sides to find common ground', score: 4 },
      { id: 'b', text: 'Ignore it completely because interpersonal dynamics are messy', score: 0 },
      { id: 'c', text: 'Draft a logical deduction sheet proving which party is mathematically wrong', score: 1 },
      { id: 'd', text: 'Pick a side immediately based on personal convenience', score: 0 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'social',
    prompt: 'In a team setting, which contribution gives you the deepest sense of fulfillment?',
    options: [
      { id: 'a', text: 'Empowering colleagues, mentoring junior teammates, and fostering team morale', score: 4 },
      { id: 'b', text: 'Working in isolation without needing to communicate with anyone', score: 0 },
      { id: 'c', text: 'Being the sole person who understands a proprietary algorithm', score: 2 },
      { id: 'd', text: 'Auditing timesheets and resource allocations strictly', score: 2 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'social',
    prompt: 'You notice a classmate or colleague seems stressed, withdrawn, and unusually quiet. You:',
    options: [
      { id: 'a', text: 'Reach out discreetly, ask gentle open-ended questions, and offer sincere support', score: 4 },
      { id: 'b', text: 'Assume it is none of your business and continue with your work', score: 1 },
      { id: 'c', text: 'Send them an automated calendar invite to catch up on deliverables', score: 1 },
      { id: 'd', text: 'Wonder if their slowness will affect your own deadlines', score: 0 },
    ],
    difficulty: 'medium',
  },
  {
    category: 'social',
    prompt: 'Which role would you find most rewarding over a 10-year career horizon?',
    options: [
      { id: 'a', text: 'Professional Counselor, Psychologist, HR Director, or Community Leader', score: 4 },
      { id: 'b', text: 'Solo Financial Quantitative Trader', score: 1 },
      { id: 'c', text: 'Independent Patent Examiner', score: 1 },
      { id: 'd', text: 'Assembly Line Quality Inspector', score: 0 },
    ],
    difficulty: 'easy',
  },
  {
    category: 'social',
    prompt: 'When pitching an ambitious project to stakeholders, your greatest strength is:',
    options: [
      { id: 'a', text: 'Connecting with their values, inspiring empathy, and rallying emotional buy-in', score: 4 },
      { id: 'b', text: 'Presenting raw mathematical proof without smiling or making eye contact', score: 1 },
      { id: 'c', text: 'Relying exclusively on complex jargon to sound authoritative', score: 0 },
      { id: 'd', text: 'Showing intricate design mockups and avoiding speaking', score: 2 },
    ],
    difficulty: 'easy',
  },
];

async function seed() {
  console.log('Seeding aptitude questions...');
  await prisma.aptitudeQuestion.deleteMany();
  
  for (const q of questions) {
    await prisma.aptitudeQuestion.create({
      data: {
        category: q.category,
        prompt: q.prompt,
        options: q.options,
        difficulty: q.difficulty,
        isActive: true,
      },
    });
  }
  
  const count = await prisma.aptitudeQuestion.count();
  console.log(`Successfully seeded ${count} aptitude questions!`);
}

seed()
  .catch((e) => {
    console.error('Error seeding questions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
