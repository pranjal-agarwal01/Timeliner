import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompleted } from '../api';
import toast from 'react-hot-toast';

export default function Completed() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [sort, setSort] = useState('newest');

    const fetchCompleted = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (difficulty) params.difficulty = difficulty;
            // Only send sort if it's not the default
            if (sort && sort !== 'newest') params.sort = sort;
            const res = await getCompleted(params);
            setQuestions(res.data.questions);
        } catch {
            toast.error('Failed to load completed questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [difficulty, sort]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCompleted();
    };

    const handleClearSearch = () => {
        setSearch('');
        // trigger refetch with empty search
        setTimeout(fetchCompleted, 0);
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
                    <div className="brand">
                        <div className="brand-icon">✅</div>
                        Completed Revisions
                    </div>
                </div>
                <div className="topbar-right"></div>
            </header>

            <main className="completed-main">
                {/* Filters */}
                <div className="filters-bar">
                    <form onSubmit={handleSearch} className="search-form">
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                placeholder="Search by title or tag..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-input"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Search</button>
                    </form>
                    <div className="filter-controls">
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            <option value="">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Loading questions...</span>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <p style={{ fontWeight: 700 }}>
                            {search || difficulty ? 'No matches found' : 'Nothing here yet'}
                        </p>
                        <p className="empty-sub">
                            {search || difficulty
                                ? 'Try adjusting your filters'
                                : 'Complete both Day 3 and Day 10 revisions to see questions here.'}
                        </p>
                        {(search || difficulty) && (
                            <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => { setSearch(''); setDifficulty(''); }}>
                                Clear Filters
                            </button>
                        )}
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
                                    <span>Solved: {new Date(q.solvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span>Done: {new Date(q.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && questions.length > 0 && (
                    <p className="completed-count">
                        {questions.length} question{questions.length !== 1 ? 's' : ''} mastered 🏆
                    </p>
                )}
            </main>
        </div>
    );
}
