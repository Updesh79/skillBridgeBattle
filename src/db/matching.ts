export interface SkillEntry {
  id: number;
  skillId: number;
  name: string;
  categoryId: number;
  categoryName: string;
  level: string;
}

export interface PeerMatchResult {
  score: number;
  isMutualExchange: boolean;
  peerCanTeachMe: SkillEntry[];
  iCanTeachPeer: SkillEntry[];
  categoryOverlap: boolean;
  availabilityOverlap: boolean;
  summaryLines: string[];
  breakdown: {
    teachesMePoints: number;
    learnsFromMePoints: number;
    categoryPoints: number;
    availabilityPoints: number;
  };
}

function checkAvailabilityOverlap(availA?: string | null, availB?: string | null): boolean {
  const a = (availA || 'Weekdays & Weekends').toLowerCase();
  const b = (availB || 'Weekdays & Weekends').toLowerCase();
  if (a.includes('flexible') || b.includes('flexible')) return true;
  if (a.includes('weekday') && b.includes('weekday')) return true;
  if (a.includes('weekend') && b.includes('weekend')) return true;
  if (a.includes('evening') && b.includes('evening')) return true;
  return a === b;
}

export function calculateRuleBasedMatch(
  currentUserTeaching: SkillEntry[],
  currentUserLearning: SkillEntry[],
  currentUserAvailability: string | null | undefined,
  peerFirstName: string,
  peerTeaching: SkillEntry[],
  peerLearning: SkillEntry[],
  peerAvailability: string | null | undefined
): PeerMatchResult {
  // 1. +50 if peer can teach a skill the current student wants to learn
  const myWantedIds = new Set(currentUserLearning.map((s) => s.skillId));
  const peerCanTeachMe = peerTeaching.filter((s) => myWantedIds.has(s.skillId));
  const teachesMePoints = peerCanTeachMe.length > 0 ? 50 : 0;

  // 2. +30 if current student can teach something the peer wants to learn
  const peerWantedIds = new Set(peerLearning.map((s) => s.skillId));
  const iCanTeachPeer = currentUserTeaching.filter((s) => peerWantedIds.has(s.skillId));
  const learnsFromMePoints = iCanTeachPeer.length > 0 ? 30 : 0;

  // 3. +10 if skill category matches (same category taught by both or learned by both)
  const myTeachCategories = new Set(currentUserTeaching.map((s) => s.categoryId));
  const peerTeachCategories = new Set(peerTeaching.map((s) => s.categoryId));
  let categoryOverlap = false;
  for (const catId of myTeachCategories) {
    if (peerTeachCategories.has(catId)) {
      categoryOverlap = true;
      break;
    }
  }
  const categoryPoints = categoryOverlap ? 10 : 0;

  // 4. +10 if availability overlaps
  const availabilityOverlap = checkAvailabilityOverlap(currentUserAvailability, peerAvailability);
  const availabilityPoints = availabilityOverlap ? 10 : 0;

  const rawScore = teachesMePoints + learnsFromMePoints + categoryPoints + availabilityPoints;
  const score = Math.min(100, rawScore);
  const isMutualExchange = peerCanTeachMe.length > 0 && iCanTeachPeer.length > 0;

  const summaryLines: string[] = [];
  if (peerCanTeachMe.length > 0) {
    const names = peerCanTeachMe.map((s) => s.name).join(', ');
    summaryLines.push(`You can learn ${names} from ${peerFirstName}.`);
  }
  if (iCanTeachPeer.length > 0) {
    const names = iCanTeachPeer.map((s) => s.name).join(', ');
    summaryLines.push(`${peerFirstName} can learn ${names} from you.`);
  }
  if (summaryLines.length === 0 && categoryOverlap) {
    summaryLines.push(`Shares academic skill category interests with ${peerFirstName}.`);
  }

  return {
    score,
    isMutualExchange,
    peerCanTeachMe,
    iCanTeachPeer,
    categoryOverlap,
    availabilityOverlap,
    summaryLines,
    breakdown: {
      teachesMePoints,
      learnsFromMePoints,
      categoryPoints,
      availabilityPoints,
    },
  };
}
