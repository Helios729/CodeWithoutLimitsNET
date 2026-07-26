import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true
    },
    // Argon2id hash. `select: false` means the hash is never included in a
    // query result unless a caller explicitly asks for it, which removes a
    // whole class of accidental-leak bugs in controllers that spread a user
    // document into a response body.
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, enum: ['learner', 'facilitator', 'admin'], default: 'learner', index: true },

    // Cohort support for classroom and community deployments.
    cohort: { type: String, trim: true, maxlength: 64, default: null, index: true },
    preferredLanguage: { type: String, enum: ['en', 'fr', 'ht', 'es'], default: 'en' },

    // Low-bandwidth first: learners on constrained connections can opt out of
    // the hero artwork and prefetching entirely.
    lowBandwidthMode: { type: Boolean, default: false },

    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },

    // Credential-stuffing defence. Counter resets on any successful sign-in.
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

    // Bumped on password change and on "sign out everywhere". Access tokens
    // carry this value, so raising it invalidates every outstanding token
    // without needing a token blocklist.
    tokenVersion: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ deletedAt: 1, createdAt: -1 });

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    displayName: this.displayName,
    role: this.role,
    cohort: this.cohort,
    preferredLanguage: this.preferredLanguage,
    lowBandwidthMode: this.lowBandwidthMode,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', userSchema);
