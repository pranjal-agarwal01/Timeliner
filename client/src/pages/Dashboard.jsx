import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addQuestion, getTodayQuestions, markRevision3, markRevision10, logout as apiLogout } from '../api';
import toast from 'react-hot-toast';

function formatDate(d) {
    return new Date(d).toISOString().slice(0, 10);
}

export default function Dashboard() {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();
    const today = formatDate(new Date());

    // Form state
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Due state
    const [day3, setDay3] = useState([]);
    const [day10, setDay10] = useState([]);
    const [loadingDue, setLoadingDue] = useState(true);

    const fetchDue = useCallback(async () => {
        try {
            setLoadingDue(true);
            const res = await getTodayQuestions(today);
            setDay3(res.data.day3);
            setDay10(res.data.day10);
        } catch (err) {
            toast.error('Failed to load due revisions');
        } finally {
            setLoadingDue(false);
        }
    }, [today]);

    useEffect(() => {
        fetchDue();
    }, [fetchDue]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addQuestion({ title, link, tags, notes, difficulty });
            toast.success('Added & scheduled! 🎯');
            setTitle('');
            setLink('');
            setTags('');
            setNotes('');
            setDifficulty('');
            fetchDue();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add question');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevise = async (id, type) => {
        try {
            if (type === 3) {
                await markRevision3(id);
            } else {
                await markRevision10(id);
            }
            toast.success('Revision marked! ✅');
            fetchDue();
        } catch (err) {
            toast.error('Failed to mark revision');
        }
    };

    const handleLogout = async () => {
        try {
            await apiLogout();
        } catch { }
        logoutUser();
        navigate('/login');
    };

    const totalDue = day3.length + day10.length;

    return (
        <div className="dashboard">
            {/* Top Bar */}
            <header className="topbar">
                <div className="topbar-left">
                    <h2 className="brand">
                        <span className="brand-icon">📋</span> DSA Tracker
                    </h2>
                </div>
                <div className="topbar-center">
                    <span className="today-badge">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="topbar-right">
                    <Link to="/completed" className="btn btn-glass">
                        ✅ Completed
                    </Link>
                    <button className="btn btn-ghost" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Left: Add Form */}
                <section className="card add-card">
                    <h3 className="card-title">
                        <span className="card-icon">➕</span> Add Today&apos;s Question
                    </h3>
                    <form onSubmit={handleAdd} className="add-form">
                        <div className="form-group">
                            <label htmlFor="q-title">Title *</label>
                            <input
                                id="q-title"
                                type="text"
                                placeholder="e.g. Two Sum"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="q-link">Link *</label>
                            <input
                                id="q-link"
                                type="url"
                                placeholder="https://leetcode.com/problems/..."
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label htmlFor="q-tags">Tags</label>
                                <input
                                    id="q-tags"
                                    type="text"
                                    placeholder="Array, HashMap"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="q-diff">Difficulty</label>
                                <select
                                    id="q-diff"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="q-notes">Notes</label>
                            <textarea
                                id="q-notes"
                                placeholder="Key insights, approach used..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                            {submitting ? <span className="spinner-sm"></span> : '🎯 Add & Schedule'}
                        </button>
                    </form>
                </section>

                {/* Right: Due Today */}
                <section className="card due-card">
                    <h3 className="card-title">
                        <span className="card-icon">📅</span> Due Today
                        {totalDue > 0 && <span className="count-badge">{totalDue}</span>}
                    </h3>

                    {loadingDue ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                        </div>
                    ) : totalDue === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎉</div>
                            <p>No revisions due today!</p>
                            <p className="empty-sub">You&apos;re all caught up.</p>
                        </div>
                    ) : (
                        <div className="due-list">
                            {day3.length > 0 && (
                                <div className="due-group">
                                    <h4 className="due-heading">
                                        <span className="badge badge-day3">Day 3</span>
                                        <span className="due-count">{day3.length} item{day3.length > 1 ? 's' : ''}</span>
                                    </h4>
                                    {day3.map((q) => (
                                        <DueItem key={q._id} question={q} type={3} onRevise={handleRevise} />
                                    ))}
                                </div>
                            )}
                            {day10.length > 0 && (
                                <div className="due-group">
                                    <h4 className="due-heading">
                                        <span className="badge badge-day10">Day 10</span>
                                        <span className="due-count">{day10.length} item{day10.length > 1 ? 's' : ''}</span>
                                    </h4>
                                    {day10.map((q) => (
                                        <DueItem key={q._id} question={q} type={10} onRevise={handleRevise} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

function DueItem({ question, type, onRevise }) {
    const [marking, setMarking] = useState(false);

    const handleClick = async () => {
        setMarking(true);
        await onRevise(question._id, type);
        setMarking(false);
    };

    return (
        <div className="due-item">
            <div className="due-item-info">
                <a href={question.link} target="_blank" rel="noopener noreferrer" className="due-item-title">
                    {question.title}
                </a>
                <div className="due-item-meta">
                    {question.difficulty && (
                        <span className={`diff-badge diff-${question.difficulty.toLowerCase()}`}>
                            {question.difficulty}
                        </span>
                    )}
                    {question.tags?.map((tag) => (
                        <span key={tag} className="tag-badge">{tag}</span>
                    ))}
                </div>
                {question.notes && <p className="due-item-notes">{question.notes}</p>}
            </div>
            <button
                className="btn btn-accent btn-sm"
                onClick={handleClick}
                disabled={marking}
            >
                {marking ? '...' : '✓ Revised'}
            </button>
        </div>
    );
}
