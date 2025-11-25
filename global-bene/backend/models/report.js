const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema({
    reporter_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    target_type: {
        type: String,
        enum: ['Comment', 'User', 'Post'],
        required: true
    },
    target_id: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'target_type'
    },
    reason: {
        type: String,
        required: true,
        maxlength: [500, "Reason cannot be more than 500 characters"]
    },
    status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open'
    },
    handled_by: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    label: { // Optional: From spam detector
        type: String
    }
}, {
    timestamps: true
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;