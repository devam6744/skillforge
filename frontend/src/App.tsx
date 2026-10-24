import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import type { User } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Onboarding form state
  const [preferredLang, setPreferredLang] = useState('Python');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Check existing session on load
  useEffect(() => {
    api.auth.initCsrf().catch(() => {});
    api.auth
      .me()
      .then((res) => setCurrentUser(res.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setInitialLoading(false));
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'signin') {
        const res = await api.auth.login(email, password);
        setCurrentUser(res.user);
      } else {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const res = await api.auth.register(email, password, passwordConfirm, displayName);
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      if (err.details && typeof err.details === 'object') {
        const firstKey = Object.keys(err.details)[0];
        const val = err.details[firstKey];
        setError(Array.isArray(val) ? val[0] : String(val));
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      // In local dev/testing mode, we pass a test token that backend safely validates
      const mockGoogleToken = `mock_token_${email ? email.split('@')[0] : 'devam'}`;
      const res = await api.auth.google(mockGoogleToken);
      setCurrentUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {}
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingLoading(true);
    try {
      await api.profile.update({
        initial_skill_level: skillLevel,
        onboarding_completed: true,
      });
      // Refresh current user state
      const res = await api.auth.me();
      setCurrentUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to save onboarding preferences.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="pulse-dot"></div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
            INITIALIZING CYBERNETIC WORKSPACE...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient background glows */}
      <div className="cyber-grid-background"></div>
      <div className="ambient-glow-indigo"></div>
      <div className="ambient-glow-emerald"></div>

      {/* Top Navigation Bar */}
      <header
        style={{
          height: 64,
          borderBottom: '1px solid var(--border-hairline)',
          background: 'rgba(11, 19, 38, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)',
              border: '1px solid var(--border-hairline-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'var(--color-primary-bright)', fontSize: 16 }}>⚡</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: '#ffffff' }}>
            SkillForge
          </span>
          <span className="badge-mono badge-indigo" style={{ marginLeft: 4 }}>
            v1.0-sdlc
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <div className="pulse-dot"></div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-secondary-bright)', fontWeight: 600 }}>
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>

          {currentUser && (
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--color-error)',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ width: '100%', maxWidth: 1100 }}>
          {/* STATE 1: Authenticated & Needs Onboarding */}
          {currentUser && !currentUser.profile?.onboarding_completed && (
            <div className="glass-panel" style={{ padding: 40, maxWidth: 650, margin: '0 auto' }}>
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <span className="badge-mono badge-indigo" style={{ marginBottom: 12, display: 'inline-block' }}>
                  STEP 2 OF 2 • ONBOARDING
                </span>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Customize Your Skill Curve
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
                  SkillForge tailors your code reviews and challenge progression based on your primary language and self-reported level.
                </p>
              </div>

              <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    PRIMARY PRACTICE LANGUAGE
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 }}>
                    {['C', 'C++', 'Java', 'Python', 'JavaScript'].map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => setPreferredLang(lang)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: preferredLang === lang ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                          border: preferredLang === lang ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                          color: preferredLang === lang ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    INITIAL SELF-REPORTED PROFICIENCY
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setSkillLevel(lvl)}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: skillLevel === lvl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                          border: skillLevel === lvl ? '1px solid var(--color-secondary)' : '1px solid var(--border-glass)',
                          color: skillLevel === lvl ? 'var(--color-secondary-bright)' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-cyber-primary" disabled={onboardingLoading} style={{ marginTop: 10 }}>
                  {onboardingLoading ? 'Configuring Adaptive Engine...' : 'Complete Setup & Launch Console 🚀'}
                </button>
              </form>
            </div>
          )}

          {/* STATE 2: Authenticated & Onboarding Complete */}
          {currentUser && currentUser.profile?.onboarding_completed && (
            <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
              <div className="badge-mono badge-emerald" style={{ display: 'inline-block', marginBottom: 14 }}>
                AUTHENTICATED WORKSPACE READY
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Welcome, {currentUser.profile.display_name || currentUser.email}!
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>
                Your adaptive practice environment is primed. Challenge generation & Gemini review pipeline (Phase 2 & 3) will launch next.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  maxWidth: 700,
                  margin: '32px auto 0',
                }}
              >
                <div style={{ padding: 20, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>CURRENT LEVEL</div>
                  <div style={{ color: 'var(--color-secondary-bright)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                    {currentUser.profile.initial_skill_level}
                  </div>
                </div>

                <div style={{ padding: 20, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>PRIMARY ENGINE</div>
                  <div style={{ color: 'var(--color-primary-bright)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                    Gemini 2.5 Flash
                  </div>
                </div>

                <div style={{ padding: 20, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>DATABASE</div>
                  <div style={{ color: 'var(--color-tertiary)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                    Supabase PG 17
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: Unauthenticated - Stitch "Obsidian Cybernetic Glass" Auth Showcase */}
          {!currentUser && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {/* Subtle top luminescence line */}
              <div style={{ height: 1, width: '100%', background: 'linear-gradient(90deg, transparent, #8083ff 50%, #10b981 100%)' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
                {/* LEFT COLUMN: Auth Form */}
                <div style={{ padding: '40px 36px', borderRight: '1px solid var(--border-hairline)' }}>
                  {/* Tab Switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: 4,
                        borderRadius: 8,
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => { setActiveTab('signin'); setError(null); }}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 6,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: activeTab === 'signin' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                          border: activeTab === 'signin' ? '1px solid var(--color-primary)' : 'none',
                          color: activeTab === 'signin' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('signup'); setError(null); }}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 6,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: activeTab === 'signup' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                          border: activeTab === 'signup' ? '1px solid var(--color-primary)' : 'none',
                          color: activeTab === 'signup' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                      >
                        Create Account
                      </button>
                    </div>

                    <span className="badge-mono" style={{ color: 'var(--text-dim)', border: '1px solid var(--border-glass)' }}>
                      TLS v1.3
                    </span>
                  </div>

                  {/* Header */}
                  <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.025em' }}>
                      {activeTab === 'signin' ? 'Welcome back, Architect' : 'Initialize Your Console'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
                      {activeTab === 'signin'
                        ? 'Authenticate your workspace to access adaptive coding challenges and instant AI code review.'
                        : 'Join SkillForge for evidence-based coding practice and AI-guided mastery.'}
                    </p>
                  </div>

                  {/* Google OAuth Button */}
                  <button type="button" onClick={handleGoogleSignIn} className="btn-sso" style={{ marginBottom: 20 }}>
                    <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
                      <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
                      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.35 24 12 24z" fill="#34A853" />
                      <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 14 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }}></div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      or with developer credentials
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }}></div>
                  </div>

                  {/* Error Banner */}
                  {error && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        background: 'var(--color-error-bg)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: 'var(--color-error)',
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {activeTab === 'signup' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                          DISPLAY NAME
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Linus Torvalds"
                          className="cyber-input"
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        WORKSTATION EMAIL *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@kernel.io"
                        className="cyber-input"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                          KEYPHRASE (PASSWORD) *
                        </label>
                        {activeTab === 'signin' && (
                          <span style={{ fontSize: 12, color: 'var(--color-secondary-bright)', cursor: 'pointer' }}>
                            Forgot password?
                          </span>
                        )}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="cyber-input"
                          style={{ paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          {showPassword ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>
                    </div>

                    {activeTab === 'signup' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                          CONFIRM KEYPHRASE *
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="cyber-input"
                        />
                      </div>
                    )}

                    <button type="submit" className="btn-cyber-primary" disabled={loading} style={{ marginTop: 8 }}>
                      {loading
                        ? 'Authenticating...'
                        : activeTab === 'signin'
                        ? 'Sign in to Console →'
                        : 'Create Free Account →'}
                    </button>
                  </form>
                </div>

                {/* RIGHT COLUMN: Feature Showcase & Developer Telemetry */}
                <div
                  style={{
                    padding: '40px 36px',
                    background: 'rgba(7, 11, 20, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span className="badge-mono badge-indigo">✦ SKILLFORGE AI ENGINE v1.0</span>
                    </div>

                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                      Adaptive Coding Intelligence
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
                      Dynamic algorithmic benchmarks in C, C++, Java, Python, and JavaScript reviewed by Google Gemini against strict evaluation rubrics.
                    </p>

                    {/* Mock syntax code terminal */}
                    <div
                      style={{
                        margin: '24px 0',
                        borderRadius: 8,
                        background: 'var(--bg-terminal)',
                        border: '1px solid var(--border-hairline)',
                        overflow: 'hidden',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          borderBottom: '1px solid var(--border-hairline)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                        </div>
                        <span style={{ color: 'var(--text-dim)' }}>binary_search.py</span>
                        <span style={{ color: 'var(--color-primary-bright)', fontSize: 11 }}>Python 3.14</span>
                      </div>

                      <div style={{ padding: 14, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                        <div><span style={{ color: 'var(--color-tertiary)' }}>def</span> <span style={{ color: 'var(--color-primary-bright)' }}>binary_search</span>(arr, target):</div>
                        <div style={{ paddingLeft: 16 }}>low, high = 0, len(arr) - 1</div>
                        <div style={{ paddingLeft: 16 }}><span style={{ color: 'var(--color-tertiary)' }}>while</span> low &lt;= high:</div>
                        <div style={{ paddingLeft: 32 }}>mid = (low + high) // 2</div>
                        <div style={{ paddingLeft: 32 }}><span style={{ color: 'var(--color-tertiary)' }}>if</span> arr[mid] == target:</div>
                        <div style={{ paddingLeft: 48 }}><span style={{ color: 'var(--color-secondary-bright)' }}>return</span> mid</div>
                      </div>

                      <div
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 11,
                        }}
                      >
                        <span style={{ color: 'var(--color-secondary-bright)', fontWeight: 600 }}>
                          ✓ AI Review: Complexity verified at O(log n)
                        </span>
                        <span style={{ color: 'var(--text-dim)' }}>Confidence 0.98</span>
                      </div>
                    </div>

                    {/* Social proof metrics bento */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div style={{ padding: '10px 8px', borderRadius: 6, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>120k+</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 2 }}>ENGINEERS</div>
                      </div>
                      <div style={{ padding: '10px 8px', borderRadius: 6, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary-bright)' }}>4.2M</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 2 }}>SUBMISSIONS</div>
                      </div>
                      <div style={{ padding: '10px 8px', borderRadius: 6, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-secondary-bright)' }}>99.98%</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 2 }}>PRECISION</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
                    <span>Zero Runtime Execution Policy</span>
                    <span style={{ color: 'var(--color-secondary-bright)' }}>100% Free Tier Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-hairline)',
          background: 'rgba(11, 19, 38, 0.85)',
          padding: '16px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div>© 2026 SkillForge Inc. Cryptographically secured developer environment.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>PostgreSQL (Supabase)</span>
          <span>•</span>
          <span>Google Gemini AI</span>
          <span>•</span>
          <span>React + TypeScript</span>
        </div>
      </footer>
    </div>
  );
}
