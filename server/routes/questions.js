const express = require("express");
const router = express.Router();
const { body, query, param } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const Question = require("../models/Question");

// Helper: normalize a date to midnight UTC (YYYY-MM-DD)
function toMidnightUTC(date) {
    const d = new Date(date);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function addDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

// ─── Add Question ────────────────────────────────────────────────────────────
router.post(
    "/",
    auth,
    [
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("link").trim().isURL().withMessage("A valid URL is required"),
        body("tags").optional(),
        body("notes").optional().trim(),
        body("difficulty")
            .optional()
            .isIn(["Easy", "Medium", "Hard", ""])
            .withMessage("Difficulty must be Easy, Medium, or Hard"),
    ],
    validate,
    async (req, res) => {
        try {
            const { title, link, tags, notes, difficulty, solvedDate: clientDate } = req.body;

            // Parse tags: accept array or comma-separated string
            let parsedTags = [];
            if (Array.isArray(tags)) {
                parsedTags = tags.map((t) => t.trim()).filter(Boolean);
            } else if (typeof tags === "string" && tags.trim()) {
                parsedTags = tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
            }

            // Use client-provided date if available (handles timezone correctly)
            // Otherwise fall back to server time
            const solvedDate = clientDate
                ? toMidnightUTC(clientDate)
                : toMidnightUTC(new Date());
            const revision3Date = addDays(solvedDate, 3);
            const revision10Date = addDays(solvedDate, 10);

            const question = await Question.create({
                userId: req.userId,
                title,
                link,
                tags: parsedTags,
                notes: notes || "",
                difficulty: difficulty || "",
                solvedDate,
                revision3Date,
                revision10Date,
            });

            res.status(201).json({ message: "Question added & scheduled", question });
        } catch (err) {
            console.error("Create question error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Get Due Today ───────────────────────────────────────────────────────────
router.get(
    "/today",
    auth,
    [
        query("date")
            .optional()
            .matches(/^\d{4}-\d{2}-\d{2}$/)
            .withMessage("Date must be YYYY-MM-DD format"),
    ],
    validate,
    async (req, res) => {
        try {
            const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
            const targetDate = toMidnightUTC(dateStr);
            const nextDay = addDays(targetDate, 1);

            // .lean() skips Mongoose document hydration — returns plain JS objects.
            // Safe here because we never call .save() on these results.

            // Day 3 due
            const day3Due = await Question.find({
                userId: req.userId,
                revision3Date: { $gte: targetDate, $lt: nextDay },
                revision3Done: false,
            }).sort({ createdAt: -1 }).lean();

            // Day 10 due
            const day10Due = await Question.find({
                userId: req.userId,
                revision10Date: { $gte: targetDate, $lt: nextDay },
                revision10Done: false,
            }).sort({ createdAt: -1 }).lean();

            res.json({ day3: day3Due, day10: day10Due });
        } catch (err) {
            console.error("Get today error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Mark Revision 3 Done ────────────────────────────────────────────────────
router.patch(
    "/:id/revision3",
    auth,
    [param("id").isMongoId().withMessage("Invalid question ID")],
    validate,
    async (req, res) => {
        try {
            const question = await Question.findOne({
                _id: req.params.id,
                userId: req.userId,
            });

            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }

            question.revision3Done = true;
            question.revision3DoneAt = new Date();

            // Auto-complete if both revisions done
            if (question.revision10Done) {
                question.completed = true;
                question.completedAt = new Date();
            }

            await question.save();
            res.json({ message: "Revision 3 marked done", question });
        } catch (err) {
            console.error("Revision3 error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Mark Revision 10 Done ───────────────────────────────────────────────────
router.patch(
    "/:id/revision10",
    auth,
    [param("id").isMongoId().withMessage("Invalid question ID")],
    validate,
    async (req, res) => {
        try {
            const question = await Question.findOne({
                _id: req.params.id,
                userId: req.userId,
            });

            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }

            question.revision10Done = true;
            question.revision10DoneAt = new Date();

            // Auto-complete if both revisions done
            if (question.revision3Done) {
                question.completed = true;
                question.completedAt = new Date();
            }

            await question.save();
            res.json({ message: "Revision 10 marked done", question });
        } catch (err) {
            console.error("Revision10 error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Get Completed ───────────────────────────────────────────────────────────
router.get("/completed", auth, async (req, res) => {
    try {
        const { search, difficulty, tag, sort } = req.query;

        // Pagination: default page 1, 20 items per page
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const skip  = (page - 1) * limit;

        const filter = { userId: req.userId, completed: true };

        if (search) {
            // $text uses the title text index — fast inverted-index lookup
            // instead of a slow full-collection $regex scan
            filter.$text = { $search: search };
        }
        if (difficulty) {
            filter.difficulty = difficulty;
        }
        if (tag) {
            filter.tags = { $in: [tag] };
        }

        let sortOption = { completedAt: -1 }; // default: newest first
        if (sort === "oldest") {
            sortOption = { completedAt: 1 };
        }
        // When using $text search, also sort by text relevance score
        if (search) {
            sortOption = { score: { $meta: "textScore" }, ...sortOption };
        }

        // .lean() for read-only query — skips Mongoose document hydration
        const [questions, total] = await Promise.all([
            Question.find(filter, search ? { score: { $meta: "textScore" } } : {})
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            Question.countDocuments(filter),
        ]);

        res.json({
            questions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (err) {
        console.error("Completed error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
