import mongoose from 'mongoose';

const { Schema } = mongoose;

const progressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module_id: { type: String, required: true, index: true },

    completedMiniLessons: { type: [Number], default: [] },
    completedMiniQuizzes: { type: [Number], default: [] },

    bestModuleScorePct: { type: Number, default: null, min: 0, max: 100 },
    attemptCount: { type: Number, default: 0, min: 0 },

    // Mastery is recorded per Bloom level so a facilitator can see whether a
    // learner is losing marks on recall or on application - the two call for
    // very different interventions.
    bloomMastery: {
      type: Map,
      of: new Schema({ correct: Number, total: Number }, { _id: false }),
      default: {}
    },

    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lastAccessedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, module_id: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
