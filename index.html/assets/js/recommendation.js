import { getAgeSegment } from './utils.js';

const BADGE_SCORE = {
  NEW: 18,
  '人気No.1': 14,
  'リピNo.1': 12,
  'おすすめ': 10,
  '限定': 8,
};

const HEAD_OPTION_IDS = new Set([
  'carbonic_head_m',
  'special_head_m',
  'carbonic_head_f',
  'special_head_f',
]);

const SYMPTOM_ROUTE_BOOSTS = {
  hair_removal: {
    vio_aroma: 380,
    mens_aroma: 180,
    mens_recovery: 140,
    mens_max: 40,
  },
  rough_skin: {
    facial_basic_m: 320,
    cinderella_facial: 300,
    facial_special_m: 140,
    facial_royal_m: 110,
    mdna_facial: 160,
    mdna_cinderella: 80,
    little_cinderella: 70,
    cinderella_relax: 50,
    petit_facial_m: 150,
    back_scrub: 100,
    back_pack: 120,
    full_body_scrub: 120,
  },
  beauty_care: {
    facial_special_m: 360,
    facial_royal_m: 340,
    facial_basic_m: 110,
    mdna_facial: 340,
    cinderella_facial: 170,
    mdna_cinderella: 180,
    little_cinderella: 110,
    cinderella_relax: 60,
    full_body_scrub: 70,
    back_pack: 80,
  },
  vitality_recovery: {
    mens_boost: 280,
    mens_recovery: 240,
    mens_max: 190,
    mens_aroma: 70,
    mens_energy: 300,
    sixpad_op30_m: 90,
    sixpad_op15_m: 70,
  },
  better_sleep: {
    mens_recovery: 150,
    mens_boost: 130,
    mens_aroma: 80,
    art_relax_set_m: 20,
    art_relax_set_f: 20,
    carbonic_head_m: 260,
    special_head_m: 300,
    carbonic_head_f: 260,
    special_head_f: 300,
    reiki_healing: 180,
  },
  stress_relief: {
    mens_aroma: 100,
    mens_recovery: 120,
    art_therapy_m: 20,
    art_craft_m: 24,
    art_relax_set_m: 30,
    art_therapy_f: 20,
    art_craft_f: 24,
    art_relax_set_f: 30,
    carbonic_head_m: 260,
    special_head_m: 280,
    carbonic_head_f: 260,
    special_head_f: 280,
    reiki_healing: 180,
  },
  eye_strain: {
    mens_recovery: 120,
    mens_aroma: 60,
    carbonic_head_m: 240,
    special_head_m: 260,
    carbonic_head_f: 240,
    special_head_f: 260,
    facial_basic_m: 50,
    facial_special_m: 80,
    facial_royal_m: 80,
    cinderella_facial: 50,
    mdna_facial: 50,
  },
  postpartum_alignment: {
    relax_chiropractic_f: 340,
    relax_set_f: 220,
    sixpad_course_30_f: 60,
    sixpad_op30_f: 120,
    sixpad_op15_f: 90,
  },
  leg_swelling: {
    reflexology_m: 160,
    reflexology_f: 180,
    hot_reflexology: 220,
    ultrasonic_leg_care: 200,
  },
  cold_poor_circulation: {
    reflexology_m: 150,
    reflexology_f: 180,
    hot_reflexology: 220,
    ultrasonic_leg_care: 150,
  },
  diet_body: {
    slim_intensive_m: 240,
    sixpad_course_30_m: 210,
    sixpad_course_30_f: 210,
    sixpad_op30_m: 150,
    sixpad_op30_f: 150,
    sixpad_op15_m: 90,
    sixpad_op15_f: 90,
  },
};

const CATEGORY_ROUTE_BOOSTS = {
  rough_skin: { facial: 110, total: 20 },
  beauty_care: { facial: 130, total: 20 },
  hair_removal: {},
  vitality_recovery: { recovery: 90, body: 10 },
  better_sleep: { recovery: 55, mental: 4, body: 25 },
  stress_relief: { body: 35, recovery: 45, mental: 0, total: 10 },
  eye_strain: { recovery: 40, facial: 25, total: 10 },
  postpartum_alignment: { body: 50 },
  leg_swelling: { body: 35, total: 30 },
  cold_poor_circulation: { body: 35, total: 30 },
  diet_body: { diet: 90 },
};

const OPTION_COURSE_BOOSTS = {
  mens_aroma: {
    carbonic_head_m: 24,
    special_head_m: 32,
    petit_facial_m: 36,
    back_scrub: 42,
    back_pack: 48,
    full_body_scrub: 42,
    mens_energy: 52,
  },
  mens_recovery: {
    carbonic_head_m: 28,
    special_head_m: 38,
    petit_facial_m: 28,
    back_scrub: 38,
    back_pack: 44,
    full_body_scrub: 38,
    mens_energy: 56,
  },
  mens_boost: {
    special_head_m: 20,
    sixpad_op15_m: 28,
    sixpad_op30_m: 38,
  },
  slim_intensive_m: {
    sixpad_op15_m: 36,
    sixpad_op30_m: 48,
  },
  mens_max: {
    special_head_m: 24,
    back_scrub: 38,
    back_pack: 44,
    full_body_scrub: 38,
    sixpad_op15_m: 28,
    sixpad_op30_m: 38,
    mens_energy: 56,
  },
  relax_set_f: {
    hot_reflexology: 58,
    ultrasonic_leg_care: 52,
    carbonic_head_f: 22,
    special_head_f: 28,
    sixpad_op15_f: 24,
    sixpad_op30_f: 34,
  },
  relax_chiropractic_f: {
    hot_reflexology: 44,
    ultrasonic_leg_care: 44,
    carbonic_head_f: 16,
    special_head_f: 22,
    sixpad_op15_f: 28,
    sixpad_op30_f: 38,
  },
  reflexology_f: {
    hot_reflexology: 64,
    ultrasonic_leg_care: 64,
  },
  cinderella_relax: {
    hot_reflexology: 42,
    carbonic_head_f: 20,
    special_head_f: 24,
    sixpad_op15_f: 20,
    sixpad_op30_f: 26,
  },
  little_cinderella: {
    hot_reflexology: 36,
    carbonic_head_f: 16,
    special_head_f: 20,
    sixpad_op15_f: 16,
    sixpad_op30_f: 22,
  },
  mdna_cinderella: {
    hot_reflexology: 36,
    carbonic_head_f: 16,
    special_head_f: 20,
    sixpad_op15_f: 16,
    sixpad_op30_f: 22,
  },
};

function matchesGender(item, gender) {
  if (!item.gender || !item.gender.length || item.gender.includes('all')) return true;
  return item.gender.includes(gender);
}

function matchesAge(item, age) {
  if (typeof item.ageMin === 'number' && age < item.ageMin) return false;
  if (typeof item.ageMax === 'number' && age > item.ageMax) return false;
  return true;
}

function evaluateCondition(condition, context) {
  const { user, selectedSymptoms, selectedCourseIds } = context;
  const values = condition.values || [];

  switch (condition.type) {
    case 'symptomAny':
      return values.some(value => selectedSymptoms.includes(value));
    case 'symptomAll':
      return values.every(value => selectedSymptoms.includes(value));
    case 'symptomNone':
      return values.every(value => !selectedSymptoms.includes(value));
    case 'genderIn':
      return values.includes(user.gender);
    case 'ageLTE':
      return user.age <= Number(condition.value);
    case 'ageGTE':
      return user.age >= Number(condition.value);
    case 'courseIn':
      return values.some(value => selectedCourseIds.includes(value));
    default:
      return true;
  }
}

function matchesConditions(item, context) {
  if (!item.conditions || !item.conditions.length) return true;
  return item.conditions.every(condition => evaluateCondition(condition, context));
}

function getSymptomMatchStats(item, selectedSymptoms = []) {
  const symptomWeights = item.symptomWeights || {};
  return selectedSymptoms.reduce(
    (stats, symptomId) => {
      const score = Number(symptomWeights[symptomId] || 0);
      return {
        total: stats.total + score,
        strongest: Math.max(stats.strongest, score),
        exactHitCount: stats.exactHitCount + (score >= 10 ? 1 : 0),
        partialHitCount: stats.partialHitCount + (score >= 6 ? 1 : 0),
      };
    },
    { total: 0, strongest: 0, exactHitCount: 0, partialHitCount: 0 }
  );
}

function getDirectRouteBoost(item, user, selectedSymptoms = []) {
  let boost = 0;

  selectedSymptoms.forEach(symptomId => {
    boost += Number(SYMPTOM_ROUTE_BOOSTS[symptomId]?.[item.id] || 0);
    boost += Number(CATEGORY_ROUTE_BOOSTS[symptomId]?.[item.category] || 0);
  });

  if (selectedSymptoms.includes('vitality_recovery') && item.id === 'mens_boost' && user.age > 49) {
    boost -= 9999;
  }

  return boost;
}

function getOptionCourseBoost(item, selectedCourseIds = []) {
  if (!item.compatibleCourseIds || !item.compatibleCourseIds.length || !selectedCourseIds.length) return 0;
  return selectedCourseIds.reduce((sum, courseId) => sum + Number(OPTION_COURSE_BOOSTS[courseId]?.[item.id] || 0), 0);
}

function hasCompatibleCourse(item, selectedCourseIds = []) {
  if (!selectedCourseIds.length) return true;
  if (!item.compatibleCourseIds || !item.compatibleCourseIds.length) return true;
  return selectedCourseIds.some(id => item.compatibleCourseIds.includes(id));
}

function isRelevantCourse(item, user, selectedSymptoms = []) {
  const stats = getSymptomMatchStats(item, selectedSymptoms);
  const directRouteBoost = getDirectRouteBoost(item, user, selectedSymptoms);

  if (!selectedSymptoms.length) return true;
  if (stats.partialHitCount >= 1) return true;
  if (stats.total >= 10) return true;
  if (directRouteBoost >= 60) return true;

  return false;
}

function isRelevantOption(item, user, selectedSymptoms = [], selectedCourseIds = []) {
  if (!hasCompatibleCourse(item, selectedCourseIds)) return false;

  const stats = getSymptomMatchStats(item, selectedSymptoms);
  const directRouteBoost = getDirectRouteBoost(item, user, selectedSymptoms);
  const courseBoost = getOptionCourseBoost(item, selectedCourseIds);
  const beautyOnly = selectedSymptoms.length > 0 && selectedSymptoms.every(symptomId => ['rough_skin', 'beauty_care'].includes(symptomId));

  if (beautyOnly && HEAD_OPTION_IDS.has(item.id) && stats.strongest < 6 && directRouteBoost < 80) {
    return false;
  }

  if (stats.strongest >= 8) return true;
  if (stats.total >= 12) return true;
  if (directRouteBoost >= 80) return true;
  if (courseBoost >= 60 && (stats.strongest >= 6 || directRouteBoost >= 40)) return true;

  return false;
}

export function canDisplayItem(item, user, selectedSymptoms = [], selectedCourseIds = []) {
  if (item.active === false) return false;
  if (!matchesGender(item, user.gender)) return false;
  if (!matchesAge(item, user.age)) return false;
  if (!matchesConditions(item, { user, selectedSymptoms, selectedCourseIds })) return false;
  if (selectedCourseIds.length && item.compatibleCourseIds && !hasCompatibleCourse(item, selectedCourseIds)) return false;
  return true;
}

export function calculateItemScore(item, user, selectedSymptoms = [], selectedCourseIds = []) {
  const segmentKey = `${user.gender}_${getAgeSegment(user.age)}`;
  const stats = getSymptomMatchStats(item, selectedSymptoms);
  const segmentScore = Number(item.segmentWeights?.[segmentKey] || 0);
  const badgeScore = (item.badges || []).reduce((sum, badge) => sum + Number(BADGE_SCORE[badge] || 0), 0);
  const priorityScore = Number(item.displayPriority || 0);
  const directRouteBoost = getDirectRouteBoost(item, user, selectedSymptoms);
  const courseBoost = getOptionCourseBoost(item, selectedCourseIds);
  const compatibleScore = selectedCourseIds.length && item.compatibleCourseIds
    ? hasCompatibleCourse(item, selectedCourseIds) ? 120 : -400
    : 0;
  const noSymptomPenalty = selectedSymptoms.length && stats.total === 0 ? -160 : 0;
  const weakMatchPenalty = selectedSymptoms.length && stats.total > 0 && stats.strongest < 6 ? -40 : 0;

  return stats.total * 26
    + stats.exactHitCount * 90
    + stats.partialHitCount * 24
    + segmentScore * 5
    + badgeScore
    + priorityScore
    + directRouteBoost
    + courseBoost
    + compatibleScore
    + noSymptomPenalty
    + weakMatchPenalty;
}

export function sortByRecommendation(items, user, selectedSymptoms = [], selectedCourseIds = []) {
  return items
    .filter(item => canDisplayItem(item, user, selectedSymptoms, selectedCourseIds))
    .map(item => ({
      ...item,
      _score: calculateItemScore(item, user, selectedSymptoms, selectedCourseIds),
    }))
    .sort((a, b) => b._score - a._score);
}

export function pickRecommendedCourses(courses, user, selectedSymptoms = []) {
  return sortByRecommendation(courses, user, selectedSymptoms, []).filter(course => isRelevantCourse(course, user, selectedSymptoms));
}

export function pickRecommendedOptions(options, user, selectedSymptoms = [], selectedCourseIds = []) {
  return sortByRecommendation(options, user, selectedSymptoms, selectedCourseIds).filter(option => isRelevantOption(option, user, selectedSymptoms, selectedCourseIds));
}
