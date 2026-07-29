import mongoose from 'mongoose';

const { Schema } = mongoose;

const responseSchema = new Schema(
  {
    q_id: { type: String, required: true },
    selected: { type: String, required: true },
    correct: { type: Boolean, required: true },
    bloom: { type: String, required: true },
    answeredAt: { type: Date, default: Date.now },
    // Milliseconds from question render to submission, sent by the client.
    // Treated as telemetry only; it never affects scoring, because a value
    // supplied by the client must never be trusted with anything that matters.
    timeOnTaskMs: { type: Number, default: null, min: 0 }
  },
  { _id: false }
);

/**
 * One sitting of a mini-quiz, a full module quiz, or a superquiz.
 * Grading always happens server-side against the withheld `answer` field.
 */
const attemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module_id: { type: String, required: true, index: true },
    scope: { type: String, enum: ['mini', 'module', 'superquiz'], required: true },
    miniQuiz: { type: Number, default: null },

    // Question ids issued at attempt start. Submissions for any q_id outside
    // this list are rejected, which blocks a client from grading arbitrary
    // questions to farm the answer key one request at a time.
    issuedQuestionIds: { type: [String], default: [], required: true },

    responses: { type: [responseSchema], default: [] },

    status: { type: String, enum: ['in_progress', 'submitted', 'abandoned'], default: 'in_progress', index: true },
    score: { type: Number, default: null, min: 0 },
    total: { type: Number, required: true, min: 1 },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    passed: { type: Boolean, default: null },
    bloomBreakdown: { type: Map, of: new Schema({ correct: Number, total: Number }, { _id: false }), default: {} },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

attemptSchema.index({ user: 1, module_id: 1, createdAt: -1 });
attemptSchema.index({ user: 1, status: 1 });
// Abandoned in-progress attempts clean themselves up rather than accumulating.
attemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'in_progress' } });

export const Attempt = mongoose.model('Attempt', attemptSchema);
