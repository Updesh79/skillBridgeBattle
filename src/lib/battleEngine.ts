import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { db } from '../db/index.ts';
import {
  battles,
  battlePlayers,
  battleQuestions,
  battleAnswers,
  battleEvents,
  battleStatistics,
  profiles,
  userTeachingSkills,
  userLearningSkills,
  skills,
} from '../db/schema.ts';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { verifySignedSessionToken } from '../middleware/auth.ts';
import { adminAuth } from './firebase-admin.ts';
import { generateValidatedBattleQuestions } from './battleQuestions.ts';
import { attachTeachingRoomSocketHandlers } from './teachingRoomSocket.ts';

export type BattleStatus =
  | 'WAITING'
  | 'MATCHED'
  | 'READY'
  | 'COUNTDOWN'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_COMPLETED'
  | 'NEXT_QUESTION'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface QueueEntry {
  userId: string;
  fullName: string;
  avatarUrl: string;
  skill: string;
  difficulty: string;
  questionCount: number;
  battleRating: number;
  skillLevel: string;
  joinedAt: number;
  matchedBattleId?: string;
}

const QUESTION_DURATION_MS = 30_000; // 30 seconds per question
const COUNTDOWN_DURATION_MS = 3_500; // 3...2...1...GO!
const TRANSITION_DURATION_MS = 2_600; // Short "Answer Locked" transition between questions
const DISCONNECT_GRACE_MS = 25_000; // 25s grace period before auto-finalizing disconnected player

// Authoritative server-side timers & matchmaking state
const matchmakingQueue = new Map<string, QueueEntry>();
const userMatchedBattle = new Map<string, { battleId: string; timestamp: number }>();
const battleTimers = new Map<string, NodeJS.Timeout>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();
const peerResponseTimers = new Map<string, NodeJS.Timeout>();
const disconnectedUsersInBattle = new Map<string, Set<string>>(); // battleId -> Set<userId>
const finalizingBattles = new Set<string>();

let ioInstance: SocketIOServer | null = null;

function clearBattleTimer(battleId: string) {
  const existing = battleTimers.get(battleId);
  if (existing) {
    clearTimeout(existing);
    battleTimers.delete(battleId);
  }
}

function clearPeerTimer(battleId: string) {
  const existing = peerResponseTimers.get(battleId);
  if (existing) {
    clearTimeout(existing);
    peerResponseTimers.delete(battleId);
  }
}

async function logBattleEvent(battleId: string, eventType: string, payloadObj: any = {}) {
  try {
    await db.insert(battleEvents).values({
      battleId,
      eventType,
      payload: JSON.stringify(payloadObj),
    });
  } catch (err) {
    console.warn('Failed to log battle event:', err);
  }
}

export async function ensureUserBattleStats(userId: string) {
  const [existing] = await db
    .select()
    .from(battleStatistics)
    .where(eq(battleStatistics.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(battleStatistics)
    .values({
      userId,
      battleRating: 1200,
      battlesPlayed: 0,
      battlesWon: 0,
      battlesLost: 0,
      draws: 0,
      totalPoints: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      totalAnswerTimeMs: 0,
      favoriteTechnology: 'Python',
      bestTechnology: 'Python',
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [refetched] = await db
    .select()
    .from(battleStatistics)
    .where(eq(battleStatistics.userId, userId))
    .limit(1);
  return refetched;
}

export async function getUserSkillLevel(userId: string, skillName: string): Promise<string> {
  try {
    const [sk] = await db
      .select()
      .from(skills)
      .where(eq(skills.name, skillName))
      .limit(1);
    if (!sk) return 'Intermediate';

    const [teach] = await db
      .select()
      .from(userTeachingSkills)
      .where(and(eq(userTeachingSkills.userId, userId), eq(userTeachingSkills.skillId, sk.id)))
      .limit(1);
    if (teach) return teach.level;

    const [learn] = await db
      .select()
      .from(userLearningSkills)
      .where(and(eq(userLearningSkills.userId, userId), eq(userLearningSkills.skillId, sk.id)))
      .limit(1);
    if (learn) return learn.level;
  } catch {
    // fallback
  }
  return 'Intermediate';
}

/**
 * Speed-Based Scoring Formula (Section 14)
 * - Incorrect / Time Out: 0 points
 * - Correct: 100 base points + up to 50 speed bonus points
 */
export function calculateSpeedPoints(isCorrect: boolean, timeTakenMs: number): number {
  if (!isCorrect) return 0;
  const clampedMs = Math.max(0, Math.min(QUESTION_DURATION_MS, timeTakenMs));
  const speedRatio = (QUESTION_DURATION_MS - clampedMs) / QUESTION_DURATION_MS;
  const speedBonus = Math.round(50 * speedRatio);
  return 100 + speedBonus;
}

/**
 * Builds the sanitized, client-safe battle state for a specific user.
 * NEVER exposes unsubmitted correct answers!
 */
export async function getSanitizedBattleState(battleId: string, requestingUserId?: string) {
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle) return null;

  const playersRows = await db
    .select()
    .from(battlePlayers)
    .where(eq(battlePlayers.battleId, battleId));

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

  const disconnectedSet = disconnectedUsersInBattle.get(battleId) || new Set<string>();

  const players = await Promise.all(
    playersRows.map(async (p) => {
      const prof = profileMap.get(p.userId);
      const skillLevel = await getUserSkillLevel(p.userId, battle.skill);
      const currentQAnswer = answersRows.find(
        (a) => a.userId === p.userId && a.questionNumber === battle.currentQuestionNumber
      );

      return {
        userId: p.userId,
        fullName: prof?.fullName || 'Student Peer',
        avatarUrl: prof?.avatarUrl || '',
        college: prof?.college || 'University Campus',
        isDemo: Boolean(prof?.isDemo),
        skillLevel,
        battleRating: p.ratingAfter !== p.ratingBefore && battle.status === 'COMPLETED' ? p.ratingAfter : p.ratingBefore,
        ratingBefore: p.ratingBefore,
        ratingAfter: p.ratingAfter,
        score: p.score,
        correctAnswers: p.correctAnswers,
        totalAnswerTimeMs: p.totalAnswerTime,
        isReady: p.isReady,
        status: disconnectedSet.has(p.userId) ? 'DISCONNECTED' : p.status,
        hasSubmittedCurrentQuestion: Boolean(currentQAnswer),
      };
    })
  );

  const currentQuestionRow = questionsRows.find(
    (q) => q.questionNumber === battle.currentQuestionNumber
  );

  // Check if requesting user has already submitted an answer for the current question
  const myCurrentAnswer = requestingUserId
    ? answersRows.find(
        (a) =>
          a.userId === requestingUserId && a.questionNumber === battle.currentQuestionNumber
      )
    : undefined;

  const canRevealCurrentAnswer =
    battle.status === 'QUESTION_COMPLETED' ||
    battle.status === 'NEXT_QUESTION' ||
    battle.status === 'FINALIZING' ||
    battle.status === 'COMPLETED' ||
    Boolean(myCurrentAnswer);

  let activeQuestion: any = null;
  if (currentQuestionRow) {
    let parsedOptions: string[] = [];
    try {
      parsedOptions = JSON.parse(currentQuestionRow.options);
    } catch {
      parsedOptions = [];
    }

    activeQuestion = {
      id: currentQuestionRow.id,
      uniqueQuestionId: currentQuestionRow.uniqueQuestionId,
      questionNumber: currentQuestionRow.questionNumber,
      totalQuestions: battle.questionCount,
      questionText: currentQuestionRow.questionText,
      options: parsedOptions,
      difficulty: currentQuestionRow.difficulty,
      skill: currentQuestionRow.skill,
      topic: currentQuestionRow.topic,
      // Only reveal correctAnswer and explanation to a player AFTER they have locked their answer or round ended
      ...(canRevealCurrentAnswer
        ? {
            correctAnswer: currentQuestionRow.correctAnswer,
            explanation: currentQuestionRow.explanation,
          }
        : {}),
    };
  }

  return {
    battleId: battle.id,
    skill: battle.skill,
    difficulty: battle.difficulty,
    questionCount: battle.questionCount,
    status: battle.status as BattleStatus,
    currentQuestionNumber: battle.currentQuestionNumber,
    countdownEndsAt: battle.countdownEndsAt ? battle.countdownEndsAt.toISOString() : null,
    questionStartedAt: battle.questionStartedAt ? battle.questionStartedAt.toISOString() : null,
    questionEndsAt: battle.questionEndsAt ? battle.questionEndsAt.toISOString() : null,
    startedAt: battle.startedAt ? battle.startedAt.toISOString() : null,
    endedAt: battle.endedAt ? battle.endedAt.toISOString() : null,
    winnerId: battle.winnerId,
    isDraw: battle.isDraw,
    serverNow: new Date().toISOString(),
    players,
    activeQuestion,
    myCurrentSubmission: myCurrentAnswer
      ? {
          selectedAnswer: myCurrentAnswer.selectedAnswer,
          isCorrect: myCurrentAnswer.isCorrect,
          points: myCurrentAnswer.points,
          timeTakenMs: myCurrentAnswer.timeTaken,
        }
      : null,
  };
}

async function emitBattleStateToRoom(battleId: string, eventName = 'battle:state', extra: any = {}) {
  if (!ioInstance) return;
  const sockets = await ioInstance.in(`battle:${battleId}`).fetchSockets();
  for (const sock of sockets) {
    const uid = (sock.data as any)?.userId;
    const state = await getSanitizedBattleState(battleId, uid);
    if (state) {
      sock.emit(eventName, { ...state, ...extra });
      if (eventName !== 'battle:state') {
        sock.emit('battle:state', state);
      }
    }
  }
}

/**
 * Creates a new battle in PostgreSQL with a validated question set generated ONCE for both players.
 */
export async function createBattleRoom(params: {
  playerAId: string;
  playerBId: string;
  skill: string;
  difficulty: string;
  questionCount: number;
  autoReadyPlayerB?: boolean;
}): Promise<string> {
  const {
    playerAId,
    playerBId,
    skill,
    difficulty,
    questionCount,
    autoReadyPlayerB = false,
  } = params;

  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const battleId = `BATTLE-${randomDigits}`;

  const statsA = await ensureUserBattleStats(playerAId);
  const statsB = await ensureUserBattleStats(playerBId);
  const avgRating = Math.round(((statsA?.battleRating || 1200) + (statsB?.battleRating || 1200)) / 2);

  // Generate & validate the question set ONCE for the battle
  const validatedQuestions = await generateValidatedBattleQuestions({
    skill,
    difficulty,
    questionCount,
    averageRating: avgRating,
  });

  await db.insert(battles).values({
    id: battleId,
    skill,
    difficulty,
    questionCount: validatedQuestions.length,
    status: 'MATCHED',
    currentQuestionNumber: 1,
  });

  await db.insert(battlePlayers).values([
    {
      battleId,
      userId: playerAId,
      score: 0,
      correctAnswers: 0,
      totalAnswerTime: 0,
      status: 'MATCHED',
      isReady: false,
      ratingBefore: statsA?.battleRating || 1200,
      ratingAfter: statsA?.battleRating || 1200,
    },
    {
      battleId,
      userId: playerBId,
      score: 0,
      correctAnswers: 0,
      totalAnswerTime: 0,
      status: autoReadyPlayerB ? 'READY' : 'MATCHED',
      isReady: autoReadyPlayerB,
      ratingBefore: statsB?.battleRating || 1200,
      ratingAfter: statsB?.battleRating || 1200,
    },
  ]);

  await db.insert(battleQuestions).values(
    validatedQuestions.map((q, idx) => ({
      battleId,
      uniqueQuestionId: q.uniqueQuestionId,
      questionNumber: idx + 1,
      questionText: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      skill: q.skill,
      topic: q.topic,
    }))
  );

  userMatchedBattle.set(playerAId, { battleId, timestamp: Date.now() });
  userMatchedBattle.set(playerBId, { battleId, timestamp: Date.now() });

  await logBattleEvent(battleId, 'battle:matched', {
    playerAId,
    playerBId,
    skill,
    difficulty,
    questionCount: validatedQuestions.length,
  });

  if (ioInstance) {
    ioInstance.to(`user:${playerAId}`).emit('battle:matched', { battleId });
    ioInstance.to(`user:${playerBId}`).emit('battle:matched', { battleId });
  }

  return battleId;
}

/**
 * Attempts to match compatible players in the matchmaking queue.
 */
export async function tryMatchmaking(userId: string): Promise<string | null> {
  const recentMatch = userMatchedBattle.get(userId);
  if (recentMatch && Date.now() - recentMatch.timestamp < 45_000) {
    const [b] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, recentMatch.battleId))
      .limit(1);
    if (b && b.status !== 'COMPLETED' && b.status !== 'CANCELLED') {
      matchmakingQueue.delete(userId);
      return recentMatch.battleId;
    }
  }

  const me = matchmakingQueue.get(userId);
  if (!me) return null;

  let bestCandidate: QueueEntry | null = null;
  let bestScore = -1;

  for (const [otherId, candidate] of matchmakingQueue.entries()) {
    if (otherId === userId) continue;

    // Must match same selected skill
    if (candidate.skill.toLowerCase() !== me.skill.toLowerCase()) continue;

    // Must match same question count (or if waiting > 8s, allow any question count)
    const waitMs = Date.now() - Math.min(me.joinedAt, candidate.joinedAt);
    if (candidate.questionCount !== me.questionCount && waitMs < 8_000) continue;

    let compatibility = 100;
    if (candidate.difficulty.toLowerCase() === me.difficulty.toLowerCase()) {
      compatibility += 50;
    } else if (waitMs < 5_000) {
      continue;
    }

    const ratingDiff = Math.abs(candidate.battleRating - me.battleRating);
    compatibility += Math.max(0, 30 - Math.floor(ratingDiff / 25));

    if (compatibility > bestScore) {
      bestScore = compatibility;
      bestCandidate = candidate;
    }
  }

  if (!bestCandidate) return null;

  // Remove both from queue immediately to prevent race conditions
  matchmakingQueue.delete(me.userId);
  matchmakingQueue.delete(bestCandidate.userId);

  const battleId = await createBattleRoom({
    playerAId: me.userId,
    playerBId: bestCandidate.userId,
    skill: me.skill,
    difficulty: me.difficulty,
    questionCount: me.questionCount,
    autoReadyPlayerB: false,
  });

  return battleId;
}

/**
 * Matches a waiting user with a verified Campus Challenger from the database when requested.
 */
export async function matchWithCampusPeer(userId: string, params: {
  skill: string;
  difficulty: string;
  questionCount: number;
}): Promise<string> {
  matchmakingQueue.delete(userId);

  const demoPeers = await db
    .select()
    .from(profiles)
    .where(eq(profiles.isDemo, true));

  const availablePeers = demoPeers.filter((p) => p.id !== userId);
  const chosenPeer =
    availablePeers[Math.floor(Math.random() * availablePeers.length)] || demoPeers[0];

  if (!chosenPeer) {
    throw new Error('No campus opponent available right now.');
  }

  const battleId = await createBattleRoom({
    playerAId: userId,
    playerBId: chosenPeer.id,
    skill: params.skill,
    difficulty: params.difficulty,
    questionCount: params.questionCount,
    autoReadyPlayerB: true,
  });

  return battleId;
}

/**
 * Marks a player as Ready in a battle room. Once both players are Ready, starts the 3-2-1-GO server countdown.
 */
export async function markPlayerReady(battleId: string, userId: string) {
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle) throw new Error('Battle not found.');

  if (battle.status !== 'MATCHED' && battle.status !== 'READY' && battle.status !== 'WAITING') {
    return getSanitizedBattleState(battleId, userId);
  }

  const players = await db
    .select()
    .from(battlePlayers)
    .where(eq(battlePlayers.battleId, battleId));

  const me = players.find((p) => p.userId === userId);
  if (!me) throw new Error('You are not a participant in this battle.');

  await db
    .update(battlePlayers)
    .set({ isReady: true, status: 'READY' })
    .where(and(eq(battlePlayers.battleId, battleId), eq(battlePlayers.userId, userId)));

  await logBattleEvent(battleId, 'battle:ready', { userId });

  const updatedPlayers = await db
    .select()
    .from(battlePlayers)
    .where(eq(battlePlayers.battleId, battleId));

  const allReady = updatedPlayers.length === 2 && updatedPlayers.every((p) => p.isReady);

  if (allReady) {
    const countdownEndsAt = new Date(Date.now() + COUNTDOWN_DURATION_MS);
    await db
      .update(battles)
      .set({
        status: 'COUNTDOWN',
        countdownEndsAt,
      })
      .where(eq(battles.id, battleId));

    await emitBattleStateToRoom(battleId, 'battle:started', {
      countdownEndsAt: countdownEndsAt.toISOString(),
    });

    clearBattleTimer(battleId);
    const timer = setTimeout(() => {
      startQuestionRound(battleId, 1).catch((err) =>
        console.error('Error starting question 1:', err)
      );
    }, COUNTDOWN_DURATION_MS);
    battleTimers.set(battleId, timer);
  } else {
    await db.update(battles).set({ status: 'READY' }).where(eq(battles.id, battleId));
    await emitBattleStateToRoom(battleId, 'battle:ready', { userId });
  }

  return getSanitizedBattleState(battleId, userId);
}

/**
 * Starts Question N for both players simultaneously using authoritative server timestamps.
 */
export async function startQuestionRound(battleId: string, questionNumber: number) {
  clearBattleTimer(battleId);
  clearPeerTimer(battleId);

  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle || battle.status === 'COMPLETED' || battle.status === 'CANCELLED') return;

  const now = new Date();
  const endsAt = new Date(now.getTime() + QUESTION_DURATION_MS);

  await db
    .update(battles)
    .set({
      status: 'QUESTION_ACTIVE',
      currentQuestionNumber: questionNumber,
      questionStartedAt: now,
      questionEndsAt: endsAt,
      startedAt: battle.startedAt || now,
    })
    .where(eq(battles.id, battleId));

  await db
    .update(battleQuestions)
    .set({ startedAt: now })
    .where(
      and(
        eq(battleQuestions.battleId, battleId),
        eq(battleQuestions.questionNumber, questionNumber)
      )
    );

  await db
    .update(battlePlayers)
    .set({ status: 'PLAYING' })
    .where(eq(battlePlayers.battleId, battleId));

  await logBattleEvent(battleId, 'question:started', {
    questionNumber,
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
  });

  await emitBattleStateToRoom(battleId, 'question:started', {
    questionNumber,
    questionStartedAt: now.toISOString(),
    questionEndsAt: endsAt.toISOString(),
  });

  // Schedule server-side 30s expiration timer
  const timer = setTimeout(() => {
    handleQuestionTimeout(battleId, questionNumber).catch((err) =>
      console.error('Error handling question timeout:', err)
    );
  }, QUESTION_DURATION_MS + 150);
  battleTimers.set(battleId, timer);

  // If opponent is a Campus Challenger (isDemo = true), schedule a realistic server-timed submission
  // so single-player testing experiences real-time opponent submissions without ending the question early!
  const playersRows = await db
    .select()
    .from(battlePlayers)
    .where(eq(battlePlayers.battleId, battleId));
  for (const p of playersRows) {
    const [prof] = await db.select().from(profiles).where(eq(profiles.id, p.userId)).limit(1);
    if (prof?.isDemo) {
      const delayMs = Math.floor(8_500 + Math.random() * 14_000); // 8.5s to 22.5s
      const pTimer = setTimeout(async () => {
        try {
          const [qRow] = await db
            .select()
            .from(battleQuestions)
            .where(
              and(
                eq(battleQuestions.battleId, battleId),
                eq(battleQuestions.questionNumber, questionNumber)
              )
            )
            .limit(1);
          if (!qRow) return;
          const opts: string[] = JSON.parse(qRow.options);
          // 72% chance campus challenger picks correct answer, 28% distractor
          const isPeerCorrect = Math.random() < 0.72;
          const wrongOpts = opts.filter((o) => o !== qRow.correctAnswer);
          const chosen = isPeerCorrect
            ? qRow.correctAnswer
            : wrongOpts[Math.floor(Math.random() * wrongOpts.length)] || opts[0];
          await submitPlayerAnswer({
            battleId,
            userId: p.userId,
            questionNumber,
            selectedAnswer: chosen,
          });
        } catch {
          // ignore if round already completed
        }
      }, delayMs);
      peerResponseTimers.set(battleId, pTimer);
    }
  }
}

/**
 * Processes a player's answer submission with strict server-side anti-cheat & timer validation.
 */
export async function submitPlayerAnswer(params: {
  battleId: string;
  userId: string;
  questionNumber: number;
  selectedAnswer: string;
}) {
  const { battleId, userId, questionNumber, selectedAnswer } = params;

  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle) throw new Error('Battle not found.');

  if (battle.status !== 'QUESTION_ACTIVE') {
    return getSanitizedBattleState(battleId, userId);
  }

  if (battle.currentQuestionNumber !== questionNumber) {
    throw new Error('Invalid question number for current round.');
  }

  const playersRows = await db
    .select()
    .from(battlePlayers)
    .where(eq(battlePlayers.battleId, battleId));
  const playerRow = playersRows.find((p) => p.userId === userId);
  if (!playerRow) {
    throw new Error('Unauthorized: You are not a participant in this battle.');
  }

  // Prevent duplicate submission for the same question
  const [existingAnswer] = await db
    .select()
    .from(battleAnswers)
    .where(
      and(
        eq(battleAnswers.battleId, battleId),
        eq(battleAnswers.questionNumber, questionNumber),
        eq(battleAnswers.userId, userId)
      )
    )
    .limit(1);

  if (existingAnswer) {
    return getSanitizedBattleState(battleId, userId);
  }

  const [questionRow] = await db
    .select()
    .from(battleQuestions)
    .where(
      and(
        eq(battleQuestions.battleId, battleId),
        eq(battleQuestions.questionNumber, questionNumber)
      )
    )
    .limit(1);

  if (!questionRow) throw new Error('Battle question not found.');

  const now = Date.now();
  const startedMs = battle.questionStartedAt ? battle.questionStartedAt.getTime() : now;
  const elapsedMs = Math.max(250, Math.min(QUESTION_DURATION_MS, now - startedMs));

  // Verify correctness on the server
  const isTimedOut = selectedAnswer === 'Time Out';
  const isCorrect =
    !isTimedOut &&
    selectedAnswer.trim().toLowerCase() === questionRow.correctAnswer.trim().toLowerCase();

  const points = calculateSpeedPoints(isCorrect, elapsedMs);

  await db.insert(battleAnswers).values({
    battleId,
    questionId: questionRow.id,
    questionNumber,
    userId,
    selectedAnswer,
    isCorrect,
    points,
    timeTaken: elapsedMs,
  });

  // Update player's cumulative battle score, correctAnswers, and totalAnswerTime
  await db
    .update(battlePlayers)
    .set({
      score: playerRow.score + points,
      correctAnswers: playerRow.correctAnswers + (isCorrect ? 1 : 0),
      totalAnswerTime: playerRow.totalAnswerTime + elapsedMs,
    })
    .where(eq(battlePlayers.id, playerRow.id));

  await logBattleEvent(battleId, 'answer:submitted', {
    userId,
    questionNumber,
    timeTakenMs: elapsedMs,
  });

  // Check if BOTH players have now submitted for this question
  const allRoundAnswers = await db
    .select()
    .from(battleAnswers)
    .where(
      and(
        eq(battleAnswers.battleId, battleId),
        eq(battleAnswers.questionNumber, questionNumber)
      )
    );

  if (allRoundAnswers.length >= 2) {
    await completeQuestionRound(battleId, questionNumber);
  } else {
    // Only one player submitted early — notify room that a submission happened (without leaking the answer!)
    await emitBattleStateToRoom(battleId, 'answer:submitted', {
      submittedUserId: userId,
      questionNumber,
    });
  }

  return getSanitizedBattleState(battleId, userId);
}

/**
 * Called when the 30-second server timer expires for Question N.
 * Records "Time Out" (0 points) for any player who has not submitted, then advances.
 */
async function handleQuestionTimeout(battleId: string, questionNumber: number) {
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle || battle.status !== 'QUESTION_ACTIVE' || battle.currentQuestionNumber !== questionNumber) {
    return;
  }

  const playersRows = await db
    .select()
    .from(battlePlayers)
    .where(eq(battlePlayers.battleId, battleId));

  const existingAnswers = await db
    .select()
    .from(battleAnswers)
    .where(
      and(
        eq(battleAnswers.battleId, battleId),
        eq(battleAnswers.questionNumber, questionNumber)
      )
    );

  const answeredUserIds = new Set(existingAnswers.map((a) => a.userId));

  const [questionRow] = await db
    .select()
    .from(battleQuestions)
    .where(
      and(
        eq(battleQuestions.battleId, battleId),
        eq(battleQuestions.questionNumber, questionNumber)
      )
    )
    .limit(1);

  if (questionRow) {
    for (const p of playersRows) {
      if (!answeredUserIds.has(p.userId)) {
        await db.insert(battleAnswers).values({
          battleId,
          questionId: questionRow.id,
          questionNumber,
          userId: p.userId,
          selectedAnswer: 'Time Out',
          isCorrect: false,
          points: 0,
          timeTaken: QUESTION_DURATION_MS,
        });

        await db
          .update(battlePlayers)
          .set({
            totalAnswerTime: p.totalAnswerTime + QUESTION_DURATION_MS,
          })
          .where(eq(battlePlayers.id, p.id));
      }
    }
  }

  await logBattleEvent(battleId, 'question:expired', { questionNumber });
  await emitBattleStateToRoom(battleId, 'question:expired', { questionNumber });
  await completeQuestionRound(battleId, questionNumber);
}

/**
 * Transitions a round to QUESTION_COMPLETED ("Answer Locked") and schedules either the next question or battle finalization.
 */
async function completeQuestionRound(battleId: string, questionNumber: number) {
  clearBattleTimer(battleId);
  clearPeerTimer(battleId);

  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle || battle.status === 'COMPLETED' || battle.status === 'FINALIZING') return;

  const isLastQuestion = questionNumber >= battle.questionCount;

  await db
    .update(battles)
    .set({
      status: isLastQuestion ? 'FINALIZING' : 'QUESTION_COMPLETED',
    })
    .where(eq(battles.id, battleId));

  await logBattleEvent(battleId, 'question:completed', { questionNumber });
  await emitBattleStateToRoom(battleId, 'question:completed', { questionNumber });

  if (isLastQuestion) {
    const timer = setTimeout(() => {
      finalizeBattle(battleId).catch((err) => console.error('Error finalizing battle:', err));
    }, 1_600);
    battleTimers.set(battleId, timer);
  } else {
    const timer = setTimeout(async () => {
      await db
        .update(battles)
        .set({ status: 'NEXT_QUESTION' })
        .where(eq(battles.id, battleId));
      await emitBattleStateToRoom(battleId, 'next_question', {
        nextQuestionNumber: questionNumber + 1,
      });
      await startQuestionRound(battleId, questionNumber + 1);
    }, TRANSITION_DURATION_MS);
    battleTimers.set(battleId, timer);
  }
}

/**
 * Finalizes the battle, calculates authoritative scores & winner/draw, updates ratings, statistics, history & leaderboard.
 */
export async function finalizeBattle(battleId: string, forcedDisconnectLoserId?: string) {
  if (finalizingBattles.has(battleId)) return;
  finalizingBattles.add(battleId);
  clearBattleTimer(battleId);
  clearPeerTimer(battleId);

  try {
    const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
    if (!battle || battle.status === 'COMPLETED') return;

    const playersRows = await db
      .select()
      .from(battlePlayers)
      .where(eq(battlePlayers.battleId, battleId));

    const allAnswers = await db
      .select()
      .from(battleAnswers)
      .where(eq(battleAnswers.battleId, battleId));

    // Recalculate authoritative totals from battle_answers
    const recomputedPlayers = playersRows.map((p) => {
      const pAnswers = allAnswers.filter((a) => a.userId === p.userId);
      const totalScore = pAnswers.reduce((sum, a) => sum + a.points, 0);
      const totalCorrect = pAnswers.filter((a) => a.isCorrect).length;
      const totalTimeMs =
        pAnswers.reduce((sum, a) => sum + a.timeTaken, 0) +
        Math.max(0, battle.questionCount - pAnswers.length) * QUESTION_DURATION_MS;

      return {
        ...p,
        score: totalScore,
        correctAnswers: totalCorrect,
        totalAnswerTime: totalTimeMs,
      };
    });

    let winnerId: string | null = null;
    let isDraw = false;

    if (recomputedPlayers.length === 2) {
      const [pA, pB] = recomputedPlayers;

      if (forcedDisconnectLoserId) {
        if (pA.userId === forcedDisconnectLoserId) {
          winnerId = pB.userId;
        } else if (pB.userId === forcedDisconnectLoserId) {
          winnerId = pA.userId;
        }
      } else {
        // Section 16 Winner Logic:
        // 1. Highest total points wins
        // 2. If equal, compare number of correct answers
        // 3. If still equal, compare total answer time (lower is faster)
        // 4. If still equal, declare Draw
        if (pA.score > pB.score) {
          winnerId = pA.userId;
        } else if (pB.score > pA.score) {
          winnerId = pB.userId;
        } else if (pA.correctAnswers > pB.correctAnswers) {
          winnerId = pA.userId;
        } else if (pB.correctAnswers > pA.correctAnswers) {
          winnerId = pB.userId;
        } else if (pA.totalAnswerTime < pB.totalAnswerTime) {
          winnerId = pA.userId;
        } else if (pB.totalAnswerTime < pA.totalAnswerTime) {
          winnerId = pB.userId;
        } else {
          isDraw = true;
          winnerId = null;
        }
      }
    }

    // Update each player's battle_players record and battle_statistics
    for (const p of recomputedPlayers) {
      const stats = await ensureUserBattleStats(p.userId);
      const currentRating = stats?.battleRating || 1200;
      const won = !isDraw && winnerId === p.userId;
      const lost = !isDraw && winnerId !== null && winnerId !== p.userId;

      const ratingDelta = isDraw ? 5 : won ? 20 : -15;
      const newRating = Math.max(800, currentRating + ratingDelta);

      await db
        .update(battlePlayers)
        .set({
          score: p.score,
          correctAnswers: p.correctAnswers,
          totalAnswerTime: p.totalAnswerTime,
          status: 'COMPLETED',
          ratingBefore: currentRating,
          ratingAfter: newRating,
        })
        .where(eq(battlePlayers.id, p.id));

      // Compute favorite and best technology for this player across all completed battles
      const userAllBattlePlayers = await db
        .select({
          battleId: battlePlayers.battleId,
          score: battlePlayers.score,
        })
        .from(battlePlayers)
        .where(eq(battlePlayers.userId, p.userId));

      const userBattleIds = userAllBattlePlayers.map((ub) => ub.battleId);
      const userBattles =
        userBattleIds.length > 0
          ? await db.select().from(battles).where(inArray(battles.id, userBattleIds))
          : [];

      const skillCounts = new Map<string, number>();
      const skillWins = new Map<string, number>();
      for (const bRow of userBattles) {
        skillCounts.set(bRow.skill, (skillCounts.get(bRow.skill) || 0) + 1);
        if (bRow.winnerId === p.userId || (bRow.id === battleId && won)) {
          skillWins.set(bRow.skill, (skillWins.get(bRow.skill) || 0) + 1);
        }
      }

      let favoriteTech = battle.skill;
      let maxCount = 0;
      for (const [skName, cnt] of skillCounts.entries()) {
        if (cnt > maxCount) {
          maxCount = cnt;
          favoriteTech = skName;
        }
      }

      let bestTech = favoriteTech;
      let maxWins = 0;
      for (const [skName, wCnt] of skillWins.entries()) {
        if (wCnt > maxWins) {
          maxWins = wCnt;
          bestTech = skName;
        }
      }

      await db
        .update(battleStatistics)
        .set({
          battleRating: newRating,
          battlesPlayed: (stats?.battlesPlayed || 0) + 1,
          battlesWon: (stats?.battlesWon || 0) + (won ? 1 : 0),
          battlesLost: (stats?.battlesLost || 0) + (lost ? 1 : 0),
          draws: (stats?.draws || 0) + (isDraw ? 1 : 0),
          totalPoints: (stats?.totalPoints || 0) + p.score,
          totalCorrectAnswers: (stats?.totalCorrectAnswers || 0) + p.correctAnswers,
          totalQuestionsAnswered:
            (stats?.totalQuestionsAnswered || 0) + battle.questionCount,
          totalAnswerTimeMs: (stats?.totalAnswerTimeMs || 0) + p.totalAnswerTime,
          favoriteTechnology: favoriteTech,
          bestTechnology: bestTech,
          updatedAt: new Date(),
        })
        .where(eq(battleStatistics.userId, p.userId));
    }

    const endedAt = new Date();
    await db
      .update(battles)
      .set({
        status: 'COMPLETED',
        winnerId,
        isDraw,
        endedAt,
      })
      .where(eq(battles.id, battleId));

    await logBattleEvent(battleId, 'battle:completed', {
      winnerId,
      isDraw,
      endedAt: endedAt.toISOString(),
    });

    await emitBattleStateToRoom(battleId, 'battle:completed', {
      winnerId,
      isDraw,
    });
  } finally {
    finalizingBattles.delete(battleId);
  }
}

export function getMatchmakingStatusForUser(userId: string) {
  const recentMatch = userMatchedBattle.get(userId);
  if (recentMatch && Date.now() - recentMatch.timestamp < 45_000) {
    return {
      status: 'MATCHED' as const,
      battleId: recentMatch.battleId,
      queueEntry: null,
    };
  }
  const entry = matchmakingQueue.get(userId);
  if (entry) {
    return {
      status: 'SEARCHING' as const,
      battleId: null,
      queueEntry: entry,
    };
  }
  return {
    status: 'IDLE' as const,
    battleId: null,
    queueEntry: null,
  };
}

export async function joinMatchmakingQueue(entry: Omit<QueueEntry, 'joinedAt'>) {
  userMatchedBattle.delete(entry.userId);
  matchmakingQueue.set(entry.userId, {
    ...entry,
    joinedAt: Date.now(),
  });
  const matchedBattleId = await tryMatchmaking(entry.userId);
  return matchedBattleId;
}

export function leaveMatchmakingQueue(userId: string) {
  matchmakingQueue.delete(userId);
  userMatchedBattle.delete(userId);
}

/**
 * Attaches Socket.IO server to the HTTP server and handles real-time battle rooms,
 * matchmaking, answer submissions, and disconnect/reconnect recovery.
 */
export function attachBattleSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance = io;

  // Attach Teaching Room real-time WebRTC and room management handlers
  attachTeachingRoomSocketHandlers(io);

  // Authenticate Socket.IO connections using the existing SkillBridge token system
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || '').replace('Bearer ', '');
      if (!token) {
        return next(new Error('Unauthorized: Missing token'));
      }

      if (token.startsWith('sb_tok.')) {
        const sessionUser = verifySignedSessionToken(token);
        if (!sessionUser) return next(new Error('Unauthorized: Invalid session token'));
        socket.data.userId = sessionUser.uid;
        return next();
      }

      const decoded = await adminAuth.verifyIdToken(token);
      socket.data.userId = decoded.uid;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    if (!userId) return;

    socket.join(`user:${userId}`);

    socket.on('battle:join_room', async ({ battleId }: { battleId: string }) => {
      if (!battleId) return;
      socket.join(`battle:${battleId}`);
      socket.data.currentBattleId = battleId;

      // Check if user was marked disconnected and restore them
      const discSet = disconnectedUsersInBattle.get(battleId);
      if (discSet && discSet.has(userId)) {
        discSet.delete(userId);
        const dKey = `${battleId}:${userId}`;
        const dTimer = disconnectTimers.get(dKey);
        if (dTimer) {
          clearTimeout(dTimer);
          disconnectTimers.delete(dKey);
        }
        await logBattleEvent(battleId, 'player:reconnected', { userId });
        io.to(`battle:${battleId}`).emit('player:reconnected', { userId });
      }

      const state = await getSanitizedBattleState(battleId, userId);
      if (state) {
        socket.emit('battle:state', state);
      }
    });

    socket.on('battle:ready', async ({ battleId }: { battleId: string }) => {
      try {
        await markPlayerReady(battleId, userId);
      } catch (err: any) {
        socket.emit('battle:error', { message: err.message || 'Failed to mark ready' });
      }
    });

    socket.on(
      'answer:submit',
      async ({
        battleId,
        questionNumber,
        selectedAnswer,
      }: {
        battleId: string;
        questionNumber: number;
        selectedAnswer: string;
      }) => {
        try {
          await submitPlayerAnswer({
            battleId,
            userId,
            questionNumber,
            selectedAnswer,
          });
        } catch (err: any) {
          socket.emit('battle:error', { message: err.message || 'Failed to submit answer' });
        }
      }
    );

    socket.on('disconnect', async () => {
      matchmakingQueue.delete(userId);
      const battleId = socket.data.currentBattleId as string | undefined;
      if (!battleId) return;

      const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
      if (
        !battle ||
        battle.status === 'COMPLETED' ||
        battle.status === 'CANCELLED'
      ) {
        return;
      }

      if (!disconnectedUsersInBattle.has(battleId)) {
        disconnectedUsersInBattle.set(battleId, new Set());
      }
      disconnectedUsersInBattle.get(battleId)!.add(userId);

      await logBattleEvent(battleId, 'player:disconnected', { userId });
      io.to(`battle:${battleId}`).emit('player:disconnected', {
        userId,
        message: 'Opponent disconnected. Waiting for reconnection...',
      });

      const dKey = `${battleId}:${userId}`;
      const existingTimer = disconnectTimers.get(dKey);
      if (existingTimer) clearTimeout(existingTimer);

      const graceTimer = setTimeout(async () => {
        const stillDisconnected = disconnectedUsersInBattle.get(battleId)?.has(userId);
        if (stillDisconnected) {
          await finalizeBattle(battleId, userId);
        }
      }, DISCONNECT_GRACE_MS);

      disconnectTimers.set(dKey, graceTimer);
    });
  });

  return io;
}
