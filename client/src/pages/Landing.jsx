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
                        <div className="brand-icon">📋</div>
                        Timeliner
                        <span className="brand-dot"></span>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features" className="btn btn-ghost">Features</a>
                        <a href="#how-it-works" className="btn btn-ghost">How it works</a>
                        <a href="#contact" className="btn btn-ghost">Contact</a>
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary">
                                Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost">
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-glow"></div>
                <div className="hero-glow-2"></div>
                <div className="hero-content">
                    <span className="hero-badge">
                        <span className="hero-badge-dot"></span>
                        Spaced Repetition for DSA
                    </span>
                    <h1 className="hero-title">
                        Master Every DSA<br />
                        <span className="hero-gradient">Problem You Solve</span>
                    </h1>
                    <p className="hero-desc">
                        Track your solved problems and get automatic revision reminders
                        on <strong>Day 3</strong> and <strong>Day 10</strong> — powered by the
                        proven 1-3-10 spaced repetition method.
                    </p>
                    <div className="hero-actions">
                        <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
                            🎯 Start Tracking Free
                        </Link>
                        <a href="#how-it-works" className="btn btn-ghost btn-lg">
                            See how it works ↓
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
                <h2 className="section-title">Why Timeliner?</h2>
                <p className="section-desc">Built for serious programmers who want to ace interviews</p>
                <div className="features-grid">
                    {[
                        { icon: '📅', title: 'Smart Scheduling', desc: 'Auto-schedules Day 3 and Day 10 revisions the moment you add a question. No manual tracking needed.' },
                        { icon: '🧠', title: 'Science-Backed', desc: 'Uses the 1-3-10 spaced repetition method — proven to boost long-term retention by up to 200%.' },
                        { icon: '💡', title: 'Active Recall', desc: 'Before revealing your notes, type out what you remember from the problem. Scientifically improves retention.' },
                        { icon: '🏷️', title: 'Tag & Organize', desc: 'Categorize by difficulty, topics, and personal notes. Search and filter your entire question bank.' },
                        { icon: '🔒', title: 'Secure & Private', desc: 'Email OTP verification, JWT auth, and encrypted passwords. Your data stays yours.' },
                        { icon: '⚡', title: 'Lightning Fast', desc: 'Minimal, focused UI. Add a question in seconds, mark revisions in one click. No clutter.' },
                    ].map(({ icon, title, desc }) => (
                        <div className="feature-card" key={title}>
                            <div className="feature-icon-wrap">{icon}</div>
                            <h3>{title}</h3>
                            <p>{desc}</p>
                        </div>
                    ))}
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
                            <h3>Solve &amp; Add</h3>
                            <p>Solve a DSA problem on LeetCode, GFG, or anywhere. Add it to your tracker with the title, link, tags, difficulty, and your approach notes.</p>
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
                            <h3>Recall &amp; Master</h3>
                            <p>Use the Active Recall feature — write what you remember, then reveal your original notes. Once both revisions are done, the question moves to <strong>Completed</strong>. 🎉</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="cta-card">
                    <h2>Ready to Ace Your Next Interview?</h2>
                    <p>Start building your revision habit today. Join and track every problem you solve for free.</p>
                    <Link to={user ? "/dashboard" : "/register"} className="btn-cta">
                        🚀 Get Started Now
                    </Link>
                </div>
            </section>

            {/* Contact */}
            <section className="contact-section" id="contact">
                <h2 className="section-title">Get In Touch</h2>
                <p className="section-desc">Have feedback, questions, or just want to say hi?</p>
                <div className="contact-cards">
                    <a href="mailto:agarwalpranjal2006@gmail.com" className="contact-card" target="_blank" rel="noopener noreferrer">
                        <div className="contact-icon">✉️</div>
                        <h3>Email</h3>
                        <p>agarwalpranjal2006@gmail.com</p>
                    </a>
                    <a href="https://wa.me/918532012613" className="contact-card" target="_blank" rel="noopener noreferrer">
                        <div className="contact-icon">💬</div>
                        <h3>WhatsApp</h3>
                        <p>Send a message directly</p>
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>
                    Built with 💜 for DSA Enthusiasts by <strong>Pranjal Agarwal</strong>
                    {' '}
                    <a href="https://www.linkedin.com/in/pranjal-agarwal01/" target="_blank" rel="noopener noreferrer" className="footer-linkedin" title="LinkedIn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </a>
                </p>
            </footer>
        </div>
    );
}
