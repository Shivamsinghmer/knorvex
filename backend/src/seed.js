/**
 * Knorvex Demo Seed Script
 * Creates 3 demo users with skills, sessions, posts, and coin ledger entries
 *
 * Run: node src/seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './config/database.js';
import User from './models/User.js';
import Skill from './models/Skill.js';
import Session from './models/Session.js';
import Post from './models/Post.js';
import Rating from './models/Rating.js';
import CoinLedger from './models/CoinLedger.js';

const seed = async () => {
  await connectDB();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('🌱 Starting seed...');

  // Clear existing demo data
  await User.deleteMany({ email: { $in: ['alice@knorvex.demo', 'bob@knorvex.demo', 'carol@knorvex.demo'] } });

  const hash = await bcrypt.hash('Demo1234!', 12);

  // ─── Create Users ────────────────────────────────────────────────────────────
  const alice = await User.create({
    name: 'Alice Sharma',
    email: 'alice@knorvex.demo',
    passwordHash: hash,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=alice',
    bio: 'Full-stack dev and music producer from Bengaluru',
    aiSummary: 'Alice is a full-stack developer who specialises in React and Node.js, and is looking to learn music production techniques to blend tech with creativity.',
    skillCoinBalance: 250,
    rankScore: 450,
    rank: 'Explorer',
    avgRating: 4.8,
    ratingCount: 6,
    totalSessionsTaught: 5,
    totalSessionsLearned: 3,
    location: 'Bengaluru, India',
    timezone: 'Asia/Kolkata',
    languages: ['English', 'Hindi', 'Kannada'],
  });

  const bob = await User.create({
    name: 'Bob Menon',
    email: 'bob@knorvex.demo',
    passwordHash: hash,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=bob',
    bio: 'Music producer & guitarist, learning to code',
    aiSummary: 'Bob is a professional music producer and guitarist from Mumbai who wants to learn web development to build his own music portfolio platform.',
    skillCoinBalance: 180,
    rankScore: 820,
    rank: 'Mentor',
    isProUser: true,
    avgRating: 4.6,
    ratingCount: 8,
    totalSessionsTaught: 7,
    totalSessionsLearned: 4,
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    languages: ['English', 'Hindi', 'Malayalam'],
  });

  const carol = await User.create({
    name: 'Carol Patel',
    email: 'carol@knorvex.demo',
    passwordHash: hash,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=carol',
    bio: 'UX Designer learning data science',
    aiSummary: 'Carol is an experienced UX designer from Ahmedabad who is learning data science and Python to transition into a product analytics role.',
    skillCoinBalance: 320,
    rankScore: 300,
    rank: 'Explorer',
    avgRating: 4.9,
    ratingCount: 4,
    totalSessionsTaught: 3,
    totalSessionsLearned: 5,
    location: 'Ahmedabad, India',
    timezone: 'Asia/Kolkata',
    languages: ['English', 'Hindi', 'Gujarati'],
  });

  console.log('✅ Created 3 demo users');

  // ─── Create Skills ────────────────────────────────────────────────────────────
  await Skill.insertMany([
    // Alice teaches
    { userId: alice._id, name: 'React.js', category: 'Programming', direction: 'teach', level: 'Expert', description: 'Modern React with hooks, context, and Next.js', tags: ['react', 'javascript', 'frontend'] },
    { userId: alice._id, name: 'Node.js', category: 'Programming', direction: 'teach', level: 'Expert', description: 'REST APIs, Express, MongoDB', tags: ['nodejs', 'backend'] },
    // Alice learns
    { userId: alice._id, name: 'Music Production', category: 'Music', direction: 'learn', level: 'Beginner', description: 'Want to learn Ableton and basic music theory' },
    // Bob teaches
    { userId: bob._id, name: 'Music Production', category: 'Music', direction: 'teach', level: 'Expert', description: 'Ableton Live, mixing, mastering, music theory', tags: ['music', 'ableton', 'production'] },
    { userId: bob._id, name: 'Guitar', category: 'Music', direction: 'teach', level: 'Expert', description: 'Acoustic and electric, all styles', tags: ['guitar', 'music'] },
    // Bob learns
    { userId: bob._id, name: 'React.js', category: 'Programming', direction: 'learn', level: 'Beginner', description: 'Want to build a web app for my music portfolio' },
    // Carol teaches
    { userId: carol._id, name: 'UI/UX Design', category: 'Design', direction: 'teach', level: 'Expert', description: 'Figma, design systems, user research', tags: ['ux', 'figma', 'design'] },
    { userId: carol._id, name: 'Figma', category: 'Design', direction: 'teach', level: 'Expert', tags: ['figma', 'design'] },
    // Carol learns
    { userId: carol._id, name: 'Python', category: 'Programming', direction: 'learn', level: 'Beginner', description: 'For data science and automation' },
    { userId: carol._id, name: 'Data Science', category: 'Science', direction: 'learn', level: 'Beginner' },
  ]);

  console.log('✅ Created skills');

  // ─── Create Past Sessions ─────────────────────────────────────────────────────
  const pastDate = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const session1 = await Session.create({
    hostId: alice._id,
    learnerId: bob._id,
    skillTag: 'React.js',
    scheduledAt: pastDate(5),
    status: 'completed',
    coinsReward: 50,
    hostRated: true,
    learnerRated: true,
    aiSummary: '## Session Summary: React.js\n\n**Key Concepts Covered:**\n- Component lifecycle and hooks (useState, useEffect)\n- State management patterns\n- API integration with fetch and axios\n\n**Next Steps for Bob:**\n- Build a simple portfolio page\n- Explore React Router\n- Try the official React docs tutorial\n\n**Resources:**\n- [react.dev](https://react.dev)\n- [Josh Comeau\'s CSS for React Devs](https://www.joshwcomeau.com/)',
    participants: [
      { userId: alice._id, role: 'host', joinedAt: pastDate(5) },
      { userId: bob._id, role: 'learner', joinedAt: pastDate(5) },
    ],
  });

  const session2 = await Session.create({
    hostId: bob._id,
    learnerId: alice._id,
    skillTag: 'Music Production',
    scheduledAt: pastDate(3),
    status: 'completed',
    coinsReward: 50,
    hostRated: true,
    learnerRated: true,
    aiSummary: '## Session Summary: Music Production\n\n**Key Concepts Covered:**\n- DAW fundamentals in Ableton Live\n- MIDI basics and chord progressions\n- Basic mixing: EQ and compression\n\n**Next Steps for Alice:**\n- Practice making a 4-bar loop daily\n- Learn music theory basics on musictheory.net\n- Try recreating a favourite song\n\n**Resources:**\n- [Ableton Learning Music](https://learningmusic.ableton.com/)\n- [Point Blank Music School YouTube](https://www.youtube.com/pointblankmusic)',
    participants: [
      { userId: bob._id, role: 'host', joinedAt: pastDate(3) },
      { userId: alice._id, role: 'learner', joinedAt: pastDate(3) },
    ],
  });

  // Upcoming session (tomorrow)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session3 = await Session.create({
    hostId: carol._id,
    learnerId: alice._id,
    skillTag: 'UI/UX Design',
    scheduledAt: tomorrow,
    status: 'confirmed',
    coinsReward: 50,
    participants: [
      { userId: carol._id, role: 'host' },
      { userId: alice._id, role: 'learner' },
    ],
  });

  console.log('✅ Created sessions');

  // ─── Create Ratings ───────────────────────────────────────────────────────────
  await Rating.insertMany([
    // Session 1: Alice taught Bob React
    { sessionId: session1._id, raterId: bob._id, rateeId: alice._id, clarity: 5, punctuality: 5, engagement: 5, overall: 5, comment: 'Alice is an amazing teacher! Very clear explanations.' },
    { sessionId: session1._id, raterId: alice._id, rateeId: bob._id, clarity: 4, punctuality: 5, engagement: 5, overall: 5, comment: 'Bob is a great learner, asks excellent questions!' },
    // Session 2: Bob taught Alice Music
    { sessionId: session2._id, raterId: alice._id, rateeId: bob._id, clarity: 5, punctuality: 4, engagement: 5, overall: 5, comment: 'Bob made music production so accessible. Loved it!' },
    { sessionId: session2._id, raterId: bob._id, rateeId: alice._id, clarity: 5, punctuality: 5, engagement: 4, overall: 5, comment: 'Quick learner, very enthusiastic!' },
  ]);

  console.log('✅ Created ratings');

  // ─── Create Coin Ledger ───────────────────────────────────────────────────────
  await CoinLedger.insertMany([
    { userId: alice._id, delta: 100, reason: 'Welcome bonus', balanceAfter: 100 },
    { userId: alice._id, delta: 50, reason: 'Session completed: React.js', sessionId: session1._id, balanceAfter: 150 },
    { userId: alice._id, delta: 50, reason: 'Session completed: Music Production', sessionId: session2._id, balanceAfter: 200 },
    { userId: alice._id, delta: -50, reason: 'Session booking: UI/UX Design', sessionId: session3._id, balanceAfter: 150 },
    { userId: bob._id, delta: 100, reason: 'Welcome bonus', balanceAfter: 100 },
    { userId: bob._id, delta: 50, reason: 'Session completed: React.js', sessionId: session1._id, balanceAfter: 150 },
    { userId: bob._id, delta: 50, reason: 'Session completed: Music Production', sessionId: session2._id, balanceAfter: 200 },
    { userId: carol._id, delta: 100, reason: 'Welcome bonus', balanceAfter: 100 },
    { userId: carol._id, delta: 50, reason: 'Session completed: UI/UX Design', balanceAfter: 150 },
  ]);

  console.log('✅ Created coin ledger entries');

  // ─── Create Posts ─────────────────────────────────────────────────────────────
  await Post.insertMany([
    {
      authorId: alice._id,
      content: '🚀 Just had an incredible session teaching React.js to @Bob! He built his first component from scratch in under 30 minutes. This is what Knorvex is all about — real peer learning, no fluff. Who wants to learn React next? I\'ve got 2 slots open this week! 💪',
      skillTag: 'React.js',
      likeCount: 14,
    },
    {
      authorId: bob._id,
      content: '🎵 Mind = blown. Just learned the basics of music production from a complete beginner\'s perspective. Alice asked the most brilliant questions that made me think deeply about WHY we do what we do in music. Teaching teaches you too. SkillCoins well spent! #SkillExchange #KnorvexLife',
      skillTag: 'Music Production',
      likeCount: 22,
    },
    {
      authorId: carol._id,
      content: '📐 Hot take: UI/UX is the most underrated skill in the developer toolkit. I\'ve seen technically brilliant apps fail because the user journey was confusing. I\'m teaching a session on Figma this week — come learn how to think like a designer! DM me or book on Knorvex. 🎨',
      skillTag: 'UI/UX Design',
      likeCount: 31,
    },
    {
      authorId: alice._id,
      content: 'PSA: Knorvex now has a Skill Request Board 🙌 If you\'re looking for someone to teach you something specific, post a request and let the community find you. Currently looking for someone to teach me data visualization — anyone? 📊',
      skillTag: '',
      likeCount: 8,
    },
  ]);

  console.log('✅ Created posts');

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts (password for all: Demo1234!):');
  console.log('  alice@knorvex.demo — Explorer rank, React.js teacher');
  console.log('  bob@knorvex.demo   — Mentor rank (Pro), Music Production teacher');
  console.log('  carol@knorvex.demo — Explorer rank, UI/UX Design teacher\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
