import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';
import { db } from '../db/index.ts';
import {
  battles,
  battlePlayers,
  battleQuestions,
  battleAnswers,
  battleStatistics,
  profiles,
  skills,
} from '../db/schema.ts';
import { eq, and, desc, inArray } from 'drizzle-orm';
import {
  ensureUserBattleStats,
  getUserSkillLevel,
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
  getMatchmakingStatusForUser,
  tryMatchmaking,
  matchWithCampusPeer,
  getSanitizedBattleState,
  markPlayerReady,
  submitPlayerAnswer,
} from '../lib/battleEngine.ts';
import { TECHNOLOGY_SUBTOPICS } from '../lib/battleQuestions.ts';

export const battleRouter = Router();

const CORE_BATTLE_TECHNOLOGIES = [
  'Python',
  'JavaScript',
  'React',
  'Flutter',
  'HTML/CSS',
  'SQL',
  'MongoDB',
  'Java',
  'C++',
];

async function buildFormattedUserStats(userId: string) {
  const stats = await ensureUserBattleStats(userId);
  const played = stats?.battlesPlayed || 0;
  const won = stats?.battlesWon || 0;
  const lost = stats?.battlesLost || 0;
  const draws = stats?.draws || 0;
  const totalPoints = stats?.totalPoints || 0;
  const totalCorrect = stats?.totalCorrectAnswers || 0;
  const totalQuestions = stats?.totalQuestionsAnswered || 0;
  const totalTimeMs = stats?.totalAnswerTimeMs || 0;

  const winRate = played > 0 ? Math.round((won / played) * 1000) / 10 : 0;
  const averageScore = played > 0 ? Math.round(totalPoints / played) : 0;
  const averageAnswerTimeSec =
    totalQuestions > 0 ? Math.round((totalTimeMs / totalQuestions / 1000) * 10) / 10 : 0;
  const accuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;

  return {
    userId,
    battleRating: stats?.battleRating || 1200,
    battlesPlayed: played,
    battlesWon: won,
    battlesLost: lost,
    draws,
    winRate,
    averageScore,
    averageAnswerTimeSec,
    accuracy,
    totalPoints,
    favoriteTechnology: stats?.favoriteTechnology || 'Python',
    bestTechnology: stats?.bestTechnology || 'Python',
  };
}

// 1. GET /api/battle/lobby - Available technologies + user battle stats
battleRouter.get('/lobby', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const dbSkills = await db.select().from(skills);
    const dbSkillNames = dbSkills.map((s) => s.name);

    // Combine core battle technologies with database skills
    const mergedTechs = Array.from(
      new Set([...CORE_BATTLE_TECHNOLOGIES, ...dbSkillNames])
    );

    const technologies = mergedTechs.map((name) => ({
      name,
      subtopics: TECHNOLOGY_SUBTOPICS[name] || [
        'Fundamentals',
        'Syntax & Concepts',
        'Practical Problem Solving',
      ],
    }));

    const myStats = await buildFormattedUserStats(userId);

    res.json({
      technologies,
      stats: myStats,
    });
  } catch (err: any) {
    console.error('Error loading battle lobby:', err);
    res.status(500).json({ error: 'Failed to load Skill Battle lobby.' });
  }
});

// 2. POST /api/battle/matchmaking/join - Enter 1v1 matchmaking queue
battleRouter.post('/matchmaking/join', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const { skill = 'Python', difficulty = 'Medium', questionCount = 5 } = req.body || {};

    const cleanCount = Number(questionCount) === 10 ? 10 : 5;
    const validDiffs = ['Easy', 'Medium', 'Hard', 'Adaptive'];
    const cleanDiff = validDiffs.includes(difficulty) ? difficulty : 'Medium';

    const [prof] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (!prof) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const stats = await ensureUserBattleStats(userId);
    const skillLevel = await getUserSkillLevel(userId, skill);

    const matchedBattleId = await joinMatchmakingQueue({
      userId,
      fullName: prof.fullName,
      avatarUrl: prof.avatarUrl || '',
      skill: String(skill).trim(),
      difficulty: cleanDiff,
      questionCount: cleanCount,
      battleRating: stats?.battleRating || 1200,
      skillLevel,
    });

    if (matchedBattleId) {
      return res.json({
        status: 'MATCHED',
        battleId: matchedBattleId,
      });
    }

    return res.json({
      status: 'SEARCHING',
      battleId: null,
      queue: {
        skill: String(skill).trim(),
        difficulty: cleanDiff,
        questionCount: cleanCount,
        battleRating: stats?.battleRating || 1200,
        skillLevel,
      },
    });
  } catch (err: any) {
    console.error('Error joining matchmaking:', err);
    res.status(500).json({ error: err.message || 'Failed to join matchmaking queue.' });
  }
});

// 3. GET /api/battle/matchmaking/status - Poll matchmaking status
battleRouter.get('/matchmaking/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const matchedId = await tryMatchmaking(userId);
    if (matchedId) {
      return res.json({
        status: 'MATCHED',
        battleId: matchedId,
      });
    }
    const statusInfo = getMatchmakingStatusForUser(userId);
    return res.json(statusInfo);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check matchmaking status.' });
  }
});

// 4. POST /api/battle/matchmaking/cancel - Cancel matchmaking search
battleRouter.post('/matchmaking/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.uid;
  leaveMatchmakingQueue(userId);
  res.json({ status: 'IDLE', message: 'Matchmaking search cancelled.' });
});

// 5. POST /api/battle/matchmaking/campus-peer - Match with an active Campus Peer challenger
battleRouter.post(
  '/matchmaking/campus-peer',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.uid;
      const { skill = 'Python', difficulty = 'Medium', questionCount = 5 } = req.body || {};
      const cleanCount = Number(questionCount) === 10 ? 10 : 5;
      const battleId = await matchWithCampusPeer(userId, {
        skill: String(skill).trim(),
        difficulty: String(difficulty).trim(),
        questionCount: cleanCount,
      });
      res.json({
        status: 'MATCHED',
        battleId,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to match with campus challenger.' });
    }
  }
);

// 6. GET /api/battle/room/:battleId - Get authoritative battle room state (private to participants)
battleRouter.get('/room/:battleId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const battleId = req.params.battleId;
    const state = await getSanitizedBattleState(battleId, userId);
    if (!state) {
      return res.status(404).json({ error: 'Battle room not found.' });
    }

    const isParticipant = state.players.some((p) => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({
        error: 'Forbidden: You do not have access to this private 1v1 battle room.',
      });
    }

    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch battle state.' });
  }
});

// 7. POST /api/battle/room/:battleId/ready - Mark authenticated player as Ready
battleRouter.post('/room/:battleId/ready', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const battleId = req.params.battleId;
    const state = await markPlayerReady(battleId, userId);
    res.json(state);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to mark ready.' });
  }
});

// 8. POST /api/battle/room/:battleId/submit - Submit answer for current question
battleRouter.post(
  '/room/:battleId/submit',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.uid;
      const battleId = req.params.battleId;
      const { questionNumber, selectedAnswer } = req.body || {};

      if (!questionNumber || typeof selectedAnswer !== 'string') {
        return res.status(400).json({ error: 'questionNumber and selectedAnswer are required.' });
      }

      const state = await submitPlayerAnswer({
        battleId,
        userId,
        questionNumber: Number(questionNumber),
        selectedAnswer,
      });

      res.json(state);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to submit answer.' });
    }
  }
);

// 9. GET /api/battle/result/:battleId - Full post-battle breakdown & winner verification
battleRouter.get('/result/:battleId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const battleId = req.params.battleId;

    const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found.' });
    }

    const playersRows = await db
      .select()
      .from(battlePlayers)
      .where(eq(battlePlayers.battleId, battleId));

    const isParticipant = playersRows.some((p) => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({
        error: 'Forbidden: Only participants of this battle can view its detailed result.',
      });
    }

    const playerIds = playersRows.map((p) => p.userId);
    const profilesList =
      playerIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, playerIds))
        : [];
    const profileMap = new Map(profilesList.map((p) => [p.id, p]));

    const questionsRows = await db
      .select()
      .from(battleQuestions)
      .where(eq(battleQuestions.battleId, battleId))
      .orderBy(battleQuestions.questionNumber);

    const answersRows = await db
      .select()
      .from(battleAnswers)
      .where(eq(battleAnswers.battleId, battleId));

    const formattedPlayers = playersRows.map((p) => {
      const prof = profileMap.get(p.userId);
      const pAnswers = answersRows.filter((a) => a.userId === p.userId);
      const avgTimeSec =
        battle.questionCount > 0
          ? Math.round((p.totalAnswerTime / battle.questionCount / 1000) * 10) / 10
          : 0;

      return {
        userId: p.userId,
        fullName: prof?.fullName || 'Student Peer',
        avatarUrl: prof?.avatarUrl || '',
        college: prof?.college || 'University Campus',
        score: p.score,
        correctAnswers: p.correctAnswers,
        incorrectAnswers: Math.max(0, battle.questionCount - p.correctAnswers),
        totalQuestions: battle.questionCount,
        averageAnswerTimeSec: avgTimeSec,
        ratingBefore: p.ratingBefore,
        ratingAfter: p.ratingAfter,
        ratingDelta: p.ratingAfter - p.ratingBefore,
        answersCount: pAnswers.length,
      };
    });

    const myBreakdown = questionsRows.map((q) => {
      const myAns = answersRows.find(
        (a) => a.userId === userId && a.questionNumber === q.questionNumber
      );
      const oppAns = answersRows.find(
        (a) => a.userId !== userId && a.questionNumber === q.questionNumber
      );

      let options: string[] = [];
      try {
        options = JSON.parse(q.options);
      } catch {
        options = [];
      }

      return {
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        selectedAnswer: myAns?.selectedAnswer || 'Time Out',
        isCorrect: Boolean(myAns?.isCorrect),
        points: myAns?.points || 0,
        timeTakenSec: myAns ? Math.round((myAns.timeTaken / 1000) * 10) / 10 : 30.0,
        opponentPoints: oppAns?.points || 0,
        opponentCorrect: Boolean(oppAns?.isCorrect),
        opponentTimeSec: oppAns ? Math.round((oppAns.timeTaken / 1000) * 10) / 10 : 30.0,
      };
    });

    res.json({
      battleId: battle.id,
      skill: battle.skill,
      difficulty: battle.difficulty,
      questionCount: battle.questionCount,
      status: battle.status,
      winnerId: battle.winnerId,
      isDraw: battle.isDraw,
      startedAt: battle.startedAt,
      endedAt: battle.endedAt,
      players: formattedPlayers,
      questionBreakdown: myBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load battle result.' });
  }
});

// 10. GET /api/battle/history - User's completed battle history
battleRouter.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    const myEntries = await db
      .select()
      .from(battlePlayers)
      .where(eq(battlePlayers.userId, userId));

    const battleIds = myEntries.map((e) => e.battleId);
    if (battleIds.length === 0) {
      return res.json({ history: [] });
    }

    const battleRows = await db
      .select()
      .from(battles)
      .where(inArray(battles.id, battleIds))
      .orderBy(desc(battles.createdAt));

    const completedBattles = battleRows.filter((b) => b.status === 'COMPLETED');
    if (completedBattles.length === 0) {
      return res.json({ history: [] });
    }

    const compIds = completedBattles.map((b) => b.id);
    const allPlayers = await db
      .select()
      .from(battlePlayers)
      .where(inArray(battlePlayers.battleId, compIds));

    const allUserIds = Array.from(new Set(allPlayers.map((p) => p.userId)));
    const allProfiles =
      allUserIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, allUserIds))
        : [];
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    const history = completedBattles.map((b) => {
      const bPlayers = allPlayers.filter((p) => p.battleId === b.id);
      const me = bPlayers.find((p) => p.userId === userId);
      const opp = bPlayers.find((p) => p.userId !== userId);
      const oppProfile = opp ? profileMap.get(opp.userId) : undefined;

      const result: 'Won' | 'Lost' | 'Draw' = b.isDraw
        ? 'Draw'
        : b.winnerId === userId
        ? 'Won'
        : 'Lost';

      const accuracy =
        b.questionCount > 0 && me
          ? Math.round((me.correctAnswers / b.questionCount) * 100)
          : 0;
      const avgTimeSec =
        b.questionCount > 0 && me
          ? Math.round((me.totalAnswerTime / b.questionCount / 1000) * 10) / 10
          : 0;

      return {
        battleId: b.id,
        skill: b.skill,
        difficulty: b.difficulty,
        questionCount: b.questionCount,
        date: (b.endedAt || b.createdAt).toISOString(),
        myScore: me?.score || 0,
        opponentScore: opp?.score || 0,
        myCorrectAnswers: me?.correctAnswers || 0,
        accuracy,
        averageTimeSec: avgTimeSec,
        result,
        opponent: {
          userId: opp?.userId || '',
          fullName: oppProfile?.fullName || 'Student Peer',
          avatarUrl: oppProfile?.avatarUrl || '',
          college: oppProfile?.college || 'University Campus',
        },
      };
    });

    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load battle history.' });
  }
});

// 11. GET /api/battle/stats - User's Battle Statistics
battleRouter.get('/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const stats = await buildFormattedUserStats(userId);
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load battle statistics.' });
  }
});

// 12. GET /api/battle/leaderboard - Global & per-skill Battle Leaderboard
battleRouter.get('/leaderboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const skillFilter = typeof req.query.skill === 'string' ? req.query.skill.trim() : '';

    // Ensure campus demo students have initial battle statistics seeded so the leaderboard is populated
    const allProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.isActive, true));

    const allStats = await db.select().from(battleStatistics);
    const statsByUser = new Map(allStats.map((s) => [s.userId, s]));

    for (const prof of allProfiles) {
      if (prof.isDemo && !statsByUser.has(prof.id)) {
        const seedPreset: Record<
          string,
          {
            rating: number;
            played: number;
            won: number;
            lost: number;
            draws: number;
            points: number;
            fav: string;
            best: string;
          }
        > = {
          'demo-rahul-sharma': {
            rating: 1340,
            played: 18,
            won: 13,
            lost: 4,
            draws: 1,
            points: 10420,
            fav: 'Python',
            best: 'Python',
          },
          'demo-priya-patel': {
            rating: 1295,
            played: 15,
            won: 10,
            lost: 4,
            draws: 1,
            points: 8650,
            fav: 'React',
            best: 'HTML/CSS',
          },
          'demo-aman-verma': {
            rating: 1270,
            played: 14,
            won: 9,
            lost: 4,
            draws: 1,
            points: 7890,
            fav: 'Flutter',
            best: 'Flutter',
          },
          'demo-neha-gupta': {
            rating: 1310,
            played: 16,
            won: 11,
            lost: 4,
            draws: 1,
            points: 9320,
            fav: 'SQL',
            best: 'SQL',
          },
          'demo-arjun-nair': {
            rating: 1235,
            played: 11,
            won: 6,
            lost: 4,
            draws: 1,
            points: 6120,
            fav: 'JavaScript',
            best: 'JavaScript',
          },
        };

        const preset = seedPreset[prof.id] || {
          rating: 1220,
          played: 8,
          won: 4,
          lost: 3,
          draws: 1,
          points: 4400,
          fav: 'Python',
          best: 'Python',
        };

        const [inserted] = await db
          .insert(battleStatistics)
          .values({
            userId: prof.id,
            battleRating: preset.rating,
            battlesPlayed: preset.played,
            battlesWon: preset.won,
            battlesLost: preset.lost,
            draws: preset.draws,
            totalPoints: preset.points,
            totalCorrectAnswers: preset.played * 4,
            totalQuestionsAnswered: preset.played * 5,
            totalAnswerTimeMs: preset.played * 5 * 11500,
            favoriteTechnology: preset.fav,
            bestTechnology: preset.best,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted) {
          statsByUser.set(prof.id, inserted);
        }
      }
    }

    const refreshedStats = await db
      .select()
      .from(battleStatistics)
      .orderBy(desc(battleStatistics.battleRating), desc(battleStatistics.totalPoints));

    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    // If a specific technology filter is applied, calculate skill-specific stats or filter by technology
    let completedBattlesForSkill: any[] = [];
    let battlePlayersForSkill: any[] = [];
    if (skillFilter && skillFilter.toLowerCase() !== 'all') {
      const allCompleted = await db
        .select()
        .from(battles)
        .where(eq(battles.status, 'COMPLETED'));
      completedBattlesForSkill = allCompleted.filter(
        (b) => b.skill.toLowerCase() === skillFilter.toLowerCase()
      );
      const bIds = completedBattlesForSkill.map((b) => b.id);
      if (bIds.length > 0) {
        battlePlayersForSkill = await db
          .select()
          .from(battlePlayers)
          .where(inArray(battlePlayers.battleId, bIds));
      }
    }

    const rows = refreshedStats
      .map((st) => {
        const prof = profileMap.get(st.userId);
        if (!prof) return null;

        if (skillFilter && skillFilter.toLowerCase() !== 'all') {
          const userSkillBattles = battlePlayersForSkill.filter(
            (bp) => bp.userId === st.userId
          );
          const matchesFavorite =
            st.favoriteTechnology.toLowerCase() === skillFilter.toLowerCase() ||
            st.bestTechnology.toLowerCase() === skillFilter.toLowerCase();

          if (userSkillBattles.length === 0 && !matchesFavorite) {
            return null;
          }

          if (userSkillBattles.length > 0) {
            const played = userSkillBattles.length;
            const wins = completedBattlesForSkill.filter(
              (b) => b.winnerId === st.userId
            ).length;
            const pts = userSkillBattles.reduce((sum, bp) => sum + bp.score, 0);
            const winRate = played > 0 ? Math.round((wins / played) * 1000) / 10 : 0;

            return {
              userId: st.userId,
              fullName: prof.fullName,
              avatarUrl: prof.avatarUrl || '',
              college: prof.college || 'University Campus',
              battleRating: st.battleRating,
              battlesWon: wins,
              battlesPlayed: played,
              winRate,
              totalPoints: pts,
              favoriteTechnology: skillFilter,
            };
          }
        }

        const winRate =
          st.battlesPlayed > 0
            ? Math.round((st.battlesWon / st.battlesPlayed) * 1000) / 10
            : 0;

        return {
          userId: st.userId,
          fullName: prof.fullName,
          avatarUrl: prof.avatarUrl || '',
          college: prof.college || 'University Campus',
          battleRating: st.battleRating,
          battlesWon: st.battlesWon,
          battlesPlayed: st.battlesPlayed,
          winRate,
          totalPoints: st.totalPoints,
          favoriteTechnology: st.favoriteTechnology,
        };
      })
      .filter(Boolean) as any[];

    rows.sort((a, b) => {
      if (b.battleRating !== a.battleRating) return b.battleRating - a.battleRating;
      return b.totalPoints - a.totalPoints;
    });

    const leaderboard = rows.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    res.json({ leaderboard });
  } catch (err: any) {
    console.error('Error loading battle leaderboard:', err);
    res.status(500).json({ error: 'Failed to load leaderboard.' });
  }
});
