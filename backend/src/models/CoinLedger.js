import mongoose from 'mongoose';

const coinLedgerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    delta: { type: Number, required: true }, // Positive = credit, negative = debit
    reason: { type: String, required: true, maxlength: 200 },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    balanceAfter: { type: Number, required: true }, // Snapshot of balance after transaction
  },
  { timestamps: true }
);

coinLedgerSchema.index({ userId: 1, createdAt: -1 });

const CoinLedger = mongoose.model('CoinLedger', coinLedgerSchema);
export default CoinLedger;
