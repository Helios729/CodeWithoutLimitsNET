import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Refresh tokens are stored as SHA-256 digests, never in plaintext, so a
 * database read alone does not hand an attacker a working session.
 *
 * Rotation with reuse detection: each refresh issues a new token and marks the
 * old one used. If a token that has already been used is presented again, the
 * whole family is revoked, because that pattern means the token was captured
 * and replayed by someone other than the legitimate holder.
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    family: { type: String, required: true, index: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    userAgent: { type: String, default: '', maxlength: 300 },
    ipHash: { type: String, default: '' },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
