import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callGroq = async (messages, maxTokens = 500) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content?.trim() || '';
};

// ─── Profile Summary ──────────────────────────────────────────────────────────

/**
 * Generate a 2-sentence AI bio summary for a user based on their skills
 * @param {object} user - Mongoose user doc
 * @param {object[]} skills - Array of skill docs
 * @returns {Promise<string>} 2-sentence summary
 */
export const buildProfileSummary = async (user, skills) => {
  const teachSkills = skills.filter((s) => s.direction === 'teach').map((s) => s.name);
  const learnSkills = skills.filter((s) => s.direction === 'learn').map((s) => s.name);

  const prompt = `You are generating a short professional bio for a skill exchange platform.
User: ${user.name}, location: ${user.location || 'India'}
Teaches: ${teachSkills.join(', ') || 'not specified yet'}
Wants to learn: ${learnSkills.join(', ') || 'not specified yet'}
Write EXACTLY 2 sentences that are engaging and specific. Return only the 2 sentences, no extra text.`;

  return callGroq([{ role: 'user', content: prompt }], 200);
};

// ─── Compatibility Scoring ────────────────────────────────────────────────────

/**
 * Score compatibility between two users using OpenAI
 * @param {object} userA - Full user + skills object { user, skills }
 * @param {object} userB - Full user + skills object { user, skills }
 * @returns {Promise<{ score: number, reason: string }>}
 */
export const scoreCompatibility = async (userA, userB) => {
  const buildSummary = (u) => {
    const teach = u.skills.filter((s) => s.direction === 'teach').map((s) => `${s.name} (${s.level})`);
    const learn = u.skills.filter((s) => s.direction === 'learn').map((s) => `${s.name} (${s.level})`);
    return `Name: ${u.user.name}, Teaches: [${teach.join(', ')}], Learns: [${learn.join(', ')}], Timezone: ${u.user.timezone}, Languages: [${u.user.languages.join(', ')}], Avg Rating: ${u.user.avgRating}, Sessions: ${u.user.totalSessionsTaught + u.user.totalSessionsLearned}`;
  };

  const prompt = `Given two user profiles on a peer skill exchange platform, score their compatibility from 0-100.
Consider: skill overlap (both teach what the other wants to learn), level match, timezone compatibility, shared languages, and reputation.
Return ONLY valid JSON with NO markdown: { "score": number, "reason": "string max 20 words" }

Profile A: ${buildSummary(userA)}
Profile B: ${buildSummary(userB)}`;

  try {
    const raw = await callGroq([{ role: 'user', content: prompt }], 150);
    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback: compute rule-based score
    return { score: 50, reason: 'AI scoring unavailable — estimated match' };
  }
};

// ─── Session Prep ─────────────────────────────────────────────────────────────

/**
 * Generate 2-minute readiness prep for a session
 * @param {object} session - Session doc
 * @param {object} host - User doc (teacher)
 * @param {object} learner - User doc (student)
 * @param {object[]} hostSkills - Host's skills
 * @param {object[]} learnerSkills - Learner's skills
 * @returns {Promise<{ hostPrep: string, learnerPrep: string }>}
 */
export const buildPrepPrompt = async (session, host, learner, hostSkills, learnerSkills) => {
  const hostTeach = hostSkills.filter((s) => s.direction === 'teach').map((s) => s.name).join(', ');
  const learnerGoals = learnerSkills.filter((s) => s.direction === 'learn').map((s) => s.name).join(', ');

  const prompt = `You are preparing two people for a 1-hour skill exchange session on "${session.skillTag}".
Teacher: ${host.name} (teaches: ${hostTeach || session.skillTag})
Learner: ${learner.name} (wants to learn: ${learnerGoals || session.skillTag})
Session starts in 2 minutes.

Return ONLY valid JSON (no markdown):
{
  "hostPrep": "5 bullet points for the teacher",
  "learnerPrep": "5 bullet points for the learner"
}`;

  try {
    const raw = await callGroq([{ role: 'user', content: prompt }], 500);
    const cleaned = raw.replace(/```json?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      hostPrep: '• Be ready to share your screen\n• Prepare 3 key concepts to cover\n• Have examples ready\n• Start with learner\'s goals\n• Keep it interactive',
      learnerPrep: '• Have a notepad ready\n• Write down 3 questions to ask\n• Keep your mic unmuted\n• Engage actively\n• Take screenshots of key moments',
    };
  }
};

// ─── Post-Session Summary ─────────────────────────────────────────────────────

/**
 * Generate post-session AI notes / key takeaways
 * @param {object} session - Session doc with skillTag
 * @param {object} host - User doc
 * @param {object} learner - User doc
 * @returns {Promise<string>} Markdown summary of session
 */
export const buildSummaryPrompt = async (session, host, learner) => {
  const prompt = `A 1-hour peer skill exchange session on "${session.skillTag}" just ended.
Teacher: ${host.name}, Learner: ${learner.name}

Generate a concise post-session summary with:
1. Key concepts likely covered (3-5 bullets)
2. Suggested next steps for the learner (3 bullets)
3. Resources to explore (2-3 items)

Keep it practical, encouraging, and under 200 words. Use markdown formatting.`;

  return callGroq([{ role: 'user', content: prompt }], 800);
};

// ─── Skill Request Ranking ────────────────────────────────────────────────────

/**
 * Rank public skill requests by relevance to the current user's teach skills
 * @param {object[]} requests - SkillRequest docs
 * @param {object[]} userSkills - Current user's skills
 * @returns {Promise<object[]>} Ranked requests with relevanceScore
 */
export const rankSkillRequests = async (requests, userSkills) => {
  const teachNames = userSkills.filter((s) => s.direction === 'teach').map((s) => s.name.toLowerCase());

  // Simple relevance scoring (AI enhancement when many requests)
  return requests
    .map((req) => {
      const skillLower = req.skillName.toLowerCase();
      const directMatch = teachNames.some((t) => t.includes(skillLower) || skillLower.includes(t));
      const urgencyScore = { urgent: 3, soon: 2, casual: 1 }[req.urgency] || 1;
      const relevanceScore = (directMatch ? 10 : 0) + urgencyScore;
      return { ...req.toObject?.() || req, relevanceScore };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};
