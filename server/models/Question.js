const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        link: {
            type: String,
            required: true,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        notes: {
            type: String,
            default: "",
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard", ""],
            default: "",
        },
        solvedDate: {
            type: Date,
            required: true,
        },
        revision3Date: {
            type: Date,
            required: true,
        },
        revision10Date: {
            type: Date,
            required: true,
        },
        revision3Done: {
            type: Boolean,
            default: false,
        },
        revision3DoneAt: {
            type: Date,
            default: null,
        },
        revision10Done: {
            type: Boolean,
            default: false,
        },
        revision10DoneAt: {
            type: Date,
            default: null,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound indexes for efficient "due today" queries
questionSchema.index({ userId: 1, revision3Date: 1, revision3Done: 1 });
questionSchema.index({ userId: 1, revision10Date: 1, revision10Done: 1 });

// Compound index covering /completed filter + default sort (newest first).
// Including completedAt in the index means MongoDB can sort without a separate
// in-memory sort pass.
questionSchema.index({ userId: 1, completed: 1, completedAt: -1 });

// Text index on title to power fast $text search in /completed.
// Replaces the slow full-collection $regex scan with an inverted index lookup.
questionSchema.index({ title: "text" });

module.exports = mongoose.model("Question", questionSchema);
