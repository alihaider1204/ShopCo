import mongoose from "mongoose";

const campaignLogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ["email", "sms", "social", "ads", "other"],
      default: "email",
    },
    segment: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 8000 },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "cancelled"],
      default: "draft",
    },
    scheduledFor: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const CampaignLog = mongoose.model("CampaignLog", campaignLogSchema);

export default CampaignLog;
