import mongoose from 'mongoose';

const { Schema } = mongoose;

const sourceSchema = new Schema(
  {
    id: { type: String, required: true },
    citation: { type: String, required: true },
    url: { type: String, required: true },
    access: { type: String, default: '' }
  },
  { _id: false }
);

const conceptSchema = new Schema(
  {
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    worked_example: { type: String, default: '' },
    source_refs: { type: [String], default: [] }
  },
  { _id: false }
);

const miniLessonSchema = new Schema(
  {
    ml: { type: Number, required: true },
    title: { type: String, required: true },
    bloom: { type: String, default: '' },
    companion_mini_quiz: { type: String, default: '' },
    concepts: { type: [conceptSchema], default: [] }
  },
  { _id: false }
);

/**
 * A learning module ("-L" file). Mirrors the authored JSON one-to-one so that
 * content authors can keep working in JSON and the database stays a faithful
 * projection of the source of truth in content/.
 */
const moduleSchema = new Schema(
  {
    module_id: { type: String, required: true, unique: true, index: true },
    module_title: { type: String, required: true },
    type: { type: String, enum: ['learning'], default: 'learning' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true, index: true },
    duration_min: { type: Number, required: true, min: 1 },
    bloom_levels_covered: { type: [String], default: [] },
    companion_quiz: { type: String, default: '' },
    sources: { type: [sourceSchema], default: [] },
    learning_objectives: { type: [String], default: [] },
    mini_lessons: { type: [miniLessonSchema], default: [] },

    // Catalogue-facing fields, merged from catalogue.json during ingestion.
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    what_you_learn: { type: [String], default: [] },
    thumb: { type: String, default: '' },
    affiliate_url: { type: String, default: '' },
    price_cents: { type: Number, default: 0, min: 0 },

    order: { type: Number, default: 999, index: true },
    published: { type: Boolean, default: true, index: true },
    contentHash: { type: String, default: '' },
    ingestedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

moduleSchema.index({ published: 1, order: 1 });
moduleSchema.index({ module_title: 'text', tagline: 'text', description: 'text' });

/** Catalogue card projection - deliberately excludes full lesson bodies. */
moduleSchema.methods.toCardJSON = function toCardJSON() {
  return {
    module_id: this.module_id,
    module_title: this.module_title,
    tagline: this.tagline,
    difficulty: this.difficulty,
    duration_min: this.duration_min,
    price_cents: this.price_cents,
    thumb: this.thumb,
    bloom_levels_covered: this.bloom_levels_covered,
    miniLessonCount: this.mini_lessons.length,
    companion_quiz: this.companion_quiz
  };
};

export const Module = mongoose.model('Module', moduleSchema);
