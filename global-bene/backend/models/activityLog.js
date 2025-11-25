const mongoose = require('mongoose');
const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    event_type: {
      type: String,
      required: true,
      enum: [
        "upload",
        "delete",
        "download",
        "analytics",
        "update",
        "login",
        "logout",
        "register",
        "reset-password",
        "change-password",
        "update-profile",
        "avatar",
        "delete-user",
        "verify-otp",
        "post",
        "update-post",
        "delete-post",
        "reply",
        "update-reply",
        "delete-reply",
        "admin-update-profile",
        "admin-update-avatar",
        "admin-delete-user",
        "clear-logs",
        "community",
        "update-community",
        "delete-community",
        "join-community",
        "leave-community",
        "save-post",
        "unsave-post",
        "upvote",
        "downvote",
        "read-notification",
        "delete-notification",
        "view",
        "click",
        "share",
        "button-click",
        "modal-open",
        "modal-close",
        "form-submit",
        "search-query"
      ],
    },
    description: { type: String, default: "" },
    entity_type: { type: String }, // 'post', 'comment', 'community', etc.
    entity_id: { type: Schema.Types.ObjectId }, // id of the entity
    session_id: { type: String }, // access token
    props: {
      geo_location: { type: String },
      ip_address: { type: String },
      device: { type: String },
      browser: { type: String },
      platform: { type: String }
    },
  },
  { timestamps: true }
);

const activityLogSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one log doc per user
    },
    activities: [activitySchema], // array of activities
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = ActivityLog;