import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A single question. `answer` and `explanation` are marked `select: false`.
 *
 * This is the most important security decision in the data layer. The authored
 * JSON stores the correct key and the rationale alongside the stem. If those
 * fields ever reach the browser, every quiz in the catalogue is solvable by
 * opening the network tab, and the assessment data becomes worthless for
 * measuring mastery. Excluding them at the schema level means a controller has
 * to opt in explicitly and visibly, rather than remembering to strip them.
 */
const questionSchema = new Schema(
  {
    q_id: { type: String, required: true },
    bloom: { type: String, enum: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'], required: true, index: true },
    skill: { type: String, default: '' },
    stem: { type: String, required: true },
    options: {
      type: Map,
      of: String,
      required: true
    },
    answer: { type: String, required: true, select: false },
    explanation: { type: String, default: '', select: false },
    source: { type: String, default: '' }
  },
  { _id: false }
);

const miniQuizSchema = new Schema(
  {
    mq: { type: Number, required: true },
    title: { type: String, required: true },
    source_lesson: { type: String, default: '' },
    questions: { type: [questionSchema], default: [] }
  },
  { _id: false }
);

const quizSchema = new Schema(
  {
    module_id: { type: String, required: true, index: true },
    module_title: { type: String, required: true },
    type: { type: String, enum: ['quiz'], default: 'quiz' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    companion_learning: { type: String, default: '' },
    superquiz_pool: { type: [String], default: [] },
    bloom_distribution: { type: Map, of: Number, default: {} },
    mini_quizzes: { type: [miniQuizSchema], default: [] },
    table_of_contents: { type: Array, default: [] },
    totals: { type: Map, of: Number, default: {} },
    published: { type: Boolean, default: true, index: true },
    contentHash: { type: String, default: '' },
    ingestedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

quizSchema.index({ module_id: 1, published: 1 }, { unique: true });

/**
 * Learner-facing projection: stems and options only, answers withheld.
 * Option order is preserved as authored so that a stem referring to
 * "option B" stays correct.
 */
quizSchema.methods.toLearnerJSON = function toLearnerJSON({ miniQuiz = null } = {}) {
  const pool = miniQuiz
    ? this.mini_quizzes.filter((mq) => mq.mq === Number(miniQuiz))
    : this.mini_quizzes;

  return {
    module_id: this.module_id,
    module_title: this.module_title,
    difficulty: this.difficulty,
    companion_learning: this.companion_learning,
    bloom_distribution: Object.fromEntries(this.bloom_distribution || []),
    totals: Object.fromEntries(this.totals || []),
    mini_quizzes: pool.map((mq) => ({
      mq: mq.mq,
      title: mq.title,
      source_lesson: mq.source_lesson,
      questions: mq.questions.map((q) => ({
        q_id: q.q_id,
        bloom: q.bloom,
        skill: q.skill,
        stem: q.stem,
        options: Object.fromEntries(q.options)
      }))
    }))
  };
};

export const Quiz = mongoose.model('Quiz', quizSchema);
