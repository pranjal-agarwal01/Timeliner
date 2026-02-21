import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="landing">
            {/* Nav */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="brand">
                        <span className="brand-icon">📋</span> DSA Tracker
                    </div>
                    <div className="landing-nav-links">
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary">
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost">
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-glow"></div>
                <div className="hero-content">
                    <span className="hero-badge">🔥 Spaced Repetition for DSA</span>
                    <h1 className="hero-title">
                        Never Forget a<br />
                        <span className="hero-gradient">DSA Solution</span> Again
                    </h1>
                    <p className="hero-desc">
                        Track your solved problems and get automatic revision reminders
                        on <strong>Day 3</strong> and <strong>Day 10</strong> — powered by the
                        proven 1-3-10 spaced repetition rule.
                    </p>
                    <div className="hero-actions">
                        <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
                            🎯 Start Tracking Free
                        </Link>
                        <a href="#how-it-works" className="btn btn-glass btn-lg">
                            Learn More ↓
                        </a>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-number">1-3-10</span>
                            <span className="hero-stat-label">Revision Rule</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat">
                            <span className="hero-stat-number">100%</span>
                            <span className="hero-stat-label">Free Forever</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat">
                            <span className="hero-stat-number">∞</span>
                            <span className="hero-stat-label">Questions</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features" id="features">
                <h2 className="section-title">Why DSA Tracker?</h2>
                <p className="section-desc">Built for serious programmers who want to ace interviews</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📅</div>
                        <h3>Smart Scheduling</h3>
                        <p>Auto-schedules Day 3 and Day 10 revisions the moment you add a question. No manual tracking needed.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3>Science-Backed</h3>
                        <p>Uses the 1-3-10 spaced repetition method — proven to boost long-term retention by up to 200%.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🏷️</div>
                        <h3>Tag & Organize</h3>
                        <p>Categorize by difficulty, topics, and personal notes. Search and filter your entire question bank.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure & Private</h3>
                        <p>Email OTP verification, JWT auth, and encrypted passwords. Your data stays yours.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Track Progress</h3>
                        <p>See completed revisions at a glance. Filter by difficulty, browse by date, and celebrate your wins.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Lightning Fast</h3>
                        <p>Minimal, focused UI. Add a question in seconds, mark revisions in one click. No clutter.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works" id="how-it-works">
                <h2 className="section-title">How It Works</h2>
                <p className="section-desc">Three simple steps to never forget a solution</p>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h3>Solve & Add</h3>
                            <p>Solve a DSA problem on LeetCode, GFG, or anywhere. Add it to your tracker with the title, link, tags, and notes about your approach.</p>
                        </div>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h3>Get Reminded</h3>
                            <p>On <strong>Day 3</strong> and <strong>Day 10</strong>, the question appears on your dashboard as "Due for Revision." Open the link and re-solve it.</p>
                        </div>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h3>Mark & Master</h3>
                            <p>After revising, mark it done. Once both Day 3 and Day 10 revisions are complete, the question moves to your <strong>Completed</strong> list. 🎉</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="cta-card">
                    <h2>Ready to Ace Your Next Interview?</h2>
                    <p>Join and start building your revision habit today. It's completely free.</p>
                    <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
                        🚀 Get Started Now
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>Built with 💜 for DSA Enthusiasts</p>
            </footer>
        </div>
    );
}
