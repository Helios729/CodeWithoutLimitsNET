import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Append-only record of security-relevant events. Kept separate from the
 * application log because Railway log retention is short and these entries
 * need to survive long enough to investigate an incident.
 */
const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'auth.register',
        'auth.login.success',
        'auth.login.failure',
        'auth.login.locked',
        'auth.logout',
        'auth.refresh.reuse_detected',
        'auth.password.change',
        'content.ingest',
        'admin.role.change'
      ],
      index: true
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    // Hashed, not raw. Enough to correlate repeated attempts from one source
    // without storing a directly identifying network address.
    ipHash: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
    meta: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Retain for 400 days, then expire automatically.
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
