import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompleted } from '../api';
import toast from 'react-hot-toast';

export default function Completed() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [sort, setSort] = useState('');

    const fetchCompleted = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (difficulty) params.difficulty = difficulty;
            if (sort) params.sort = sort;
            const res = await getCompleted(params);
            setQuestions(res.data.questions);
        } catch (err) {
            toast.error('Failed to load completed questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompleted();
    }, [difficulty, sort]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCompleted();
    };

    return (
        <div className="completed-page">
            <header className="topbar">
                <div className="topbar-left">
                    <Link to="/dashboard" className="btn btn-glass">
                        ← Dashboard
                    </Link>
                </div>
                <div className="topbar-center">
                    <h2 className="brand">✅ Completed Revisions</h2>
                </div>
                <div className="topbar-right"></div>
            </header>

            <main className="completed-main">
                {/* Filters */}
                <div className="filters-bar">
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" className="btn btn-primary btn-sm">Search</button>
                    </form>
                    <div className="filter-controls">
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            <option value="">All Difficulty</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <p>No completed questions yet.</p>
                        <p className="empty-sub">Complete both Day 3 and Day 10 revisions to see questions here.</p>
                    </div>
                ) : (
                    <div className="completed-grid">
                        {questions.map((q) => (
                            <div key={q._id} className="completed-card card">
                                <div className="completed-card-header">
                                    <a href={q.link} target="_blank" rel="noopener noreferrer" className="completed-title">
                                        {q.title}
                                    </a>
                                    {q.difficulty && (
                                        <span className={`diff-badge diff-${q.difficulty.toLowerCase()}`}>
                                            {q.difficulty}
                                        </span>
                                    )}
                                </div>
                                <div className="completed-card-meta">
                                    {q.tags?.map((tag) => (
                                        <span key={tag} className="tag-badge">{tag}</span>
                                    ))}
                                </div>
                                {q.notes && <p className="completed-notes">{q.notes}</p>}
                                <div className="completed-card-footer">
                                    <span className="completed-date">
                                        Solved: {new Date(q.solvedDate).toLocaleDateString()}
                                    </span>
                                    <span className="completed-date">
                                        Completed: {new Date(q.completedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <p className="completed-count">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} completed
                </p>
            </main>
        </div>
    );
}
