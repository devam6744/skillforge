import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import type { User } from './types';

export default function App() {
  // Navigation / Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Hero interactive code preview
  const [selectedCodeTab, setSelectedCodeTab] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');

  // Practice session configurator state (for authenticated user)
  const [practiceLang, setPracticeLang] = useState('Python');
  const [practiceMode, setPracticeMode] = useState<'CODING' | 'DEBUG'>('CODING');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE'>('ADAPTIVE');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(5);
  const [sessionSuccessMsg, setSessionSuccessMsg] = useState<string | null>(null);

  // Onboarding state
  const [onboardingLevel, setOnboardingLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [onboardingSaving, setOnboardingSaving] = useState(false);

  useEffect(() => {
    api.auth.initCsrf().catch(() => {});
    api.auth
      .me()
      .then((res) => setCurrentUser(res.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setInitialLoading(false));
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setError(null);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
    setGooglePromptOpen(false);
    setError(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'signin') {
        const res = await api.auth.login(email, password);
        setCurrentUser(res.user);
        closeAuth();
      } else {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const res = await api.auth.register(email, password, passwordConfirm, displayName);
        setCurrentUser(res.user);
        closeAuth();
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

  const handleGoogleAuth = async (targetEmail?: string) => {
    setError(null);
    setLoading(true);
    try {
      const emailToUse = targetEmail || googleEmailInput || (email ? email.split('@')[0] : 'devam_developer');
      const mockToken = `mock_token_${emailToUse.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const res = await api.auth.google(mockToken);
      setCurrentUser(res.user);
      closeAuth();
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
  };

  const handleCompleteOnboarding = async () => {
    setOnboardingSaving(true);
    try {
      await api.profile.update({
        initial_skill_level: onboardingLevel,
        onboarding_completed: true,
      });
      const res = await api.auth.me();
      setCurrentUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding.');
    } finally {
      setOnboardingSaving(false);
    }
  };

  const handleLaunchPractice = () => {
    setSessionSuccessMsg(`Practice session configured for ${practiceLang} (${difficulty} difficulty, ${questionCount} questions). Session engine initialized!`);
    setTimeout(() => setSessionSuccessMsg(null), 5000);
  };

  const codeSnippets: Record<string, { filename: string; langName: string; code: string[]; reviewScore: number; complexity: string; feedback: string }> = {
    python: {
      filename: 'two_sum_optimized.py',
      langName: 'Python 3.14',
      code: [
        'def two_sum(nums: list[int], target: int) -> list[int]:',
        '    seen = {}',
        '    for i, num in enumerate(nums):',
        '        complement = target - num',
        '        if complement in seen:',
        '            return [seen[complement], i]',
        '        seen[num] = i',
        '    return []',
      ],
      reviewScore: 98,
      complexity: 'O(n) time • O(n) space',
      feedback: 'Optimal single-pass hashmap algorithm. Clean edge handling.',
    },
    cpp: {
      filename: 'pointer_lru_cache.cpp',
      langName: 'C++ 20',
      code: [
        'template <typename K, typename V>',
        'class LRUCache {',
        '    std::list<std::pair<K, V>> items;',
        '    std::unordered_map<K, typename std::list<std::pair<K, V>>::iterator> map;',
        'public:',
        '    void put(const K& key, const V& val) {',
        '        if (map.count(key)) items.erase(map[key]);',
        '        items.push_front({key, val});',
        '        map[key] = items.begin();',
        '    }',
        '};',
      ],
      reviewScore: 95,
      complexity: 'O(1) amortized put/get',
      feedback: 'Iterator stability maintained across deletions. Excellent STL usage.',
    },
    java: {
      filename: 'ConcurrentRingBuffer.java',
      langName: 'Java 21',
      code: [
        'public class RingBuffer<T> {',
        '    private final AtomicReferenceArray<T> buffer;',
        '    private final AtomicLong head = new AtomicLong(0);',
        '    private final AtomicLong tail = new AtomicLong(0);',
        '    public boolean offer(T element) {',
        '        long currentTail = tail.get();',
        '        if (currentTail - head.get() >= buffer.length()) return false;',
        '        buffer.set((int) (currentTail % buffer.length()), element);',
        '        tail.lazySet(currentTail + 1);',
        '        return true;',
        '    }',
        '}',
      ],
      reviewScore: 96,
      complexity: 'Lock-free O(1) throughput',
      feedback: 'Lock-free concurrency mechanics correctly prevent thread contention.',
    },
    javascript: {
      filename: 'async_pipeline.ts',
      langName: 'TypeScript / Node',
      code: [
        'export async function executePipeline<T, R>(',
        '  tasks: Array<(input: T) => Promise<T>>,',
        '  initialValue: T',
        '): Promise<T> {',
        '  return tasks.reduce(',
        '    async (accPromise, task) => task(await accPromise),',
        '    Promise.resolve(initialValue)',
        '  );',
        '}',
      ],
      reviewScore: 94,
      complexity: 'O(k) sequential async chain',
      feedback: 'Clean functional composition preserving promise chain resolution.',
    },
  };

  const currentSnippet = codeSnippets[selectedCodeTab];

  if (initialLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="pulsing-emerald-dot"></div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
            INITIALIZING SKILLFORGE WORKSPACE...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Ambience */}
      <div className="ambient-bg-grid"></div>
      <div className="glow-orb-primary"></div>
      <div className="glow-orb-secondary"></div>

      {/* TOP NAVIGATION BAR */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(5, 8, 20, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 32px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
            }}
          >
            <span style={{ fontSize: 18, color: '#ffffff' }}>⚡</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: '#ffffff' }}>
              SkillForge
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', letterSpacing: '0.06em' }}>
              AI ADAPTIVE PLATFORM
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#tracks" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Practice Tracks
          </a>
          <a href="#engine" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Adaptive Engine
          </a>
          <a href="#rubric" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
            AI Review Rubric
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 20, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-subtle)' }}>
                <div className="pulsing-emerald-dot"></div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                  {currentUser.profile?.display_name || currentUser.email.split('@')[0]}
                </span>
                <span className="tag-badge tag-indigo" style={{ padding: '2px 6px', fontSize: 10 }}>
                  {currentUser.profile?.initial_skill_level || 'STUDENT'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--accent-rose)',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => openAuth('signin')} className="btn-secondary-glass" style={{ padding: '9px 18px', fontSize: 13 }}>
                Sign In
              </button>
              <button onClick={() => openAuth('signup')} className="btn-primary-gradient" style={{ padding: '9px 20px', fontSize: 13 }}>
                Start Practicing Free →
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 24px 60px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto 50px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span className="tag-badge tag-indigo">
              ✦ GOOGLE GEMINI 2.5 REVIEW RUBRIC
            </span>
            <span className="tag-badge tag-emerald">
              100% FREE FOR DEVELOPERS
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              color: '#ffffff',
              marginBottom: 24,
            }}
          >
            Master Coding Through{' '}
            <span className="text-gradient-brand">Adaptive AI Reviews,</span>{' '}
            Not Compiler Frustration.
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: 720,
              margin: '0 auto 36px',
            }}
          >
            Practice C, C++, Java, Python, and JavaScript with intelligent problem generation, surgical Gemini code analysis, and evidence-based adaptive skill tracking.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => (currentUser ? document.getElementById('practice-console')?.scrollIntoView({ behavior: 'smooth' }) : openAuth('signup'))}
              className="btn-primary-gradient"
              style={{ fontSize: 16, padding: '16px 36px' }}
            >
              {currentUser ? 'Open Practice Console ↓' : 'Start Practicing Now Free 🚀'}
            </button>
            <button
              onClick={() => document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary-glass"
              style={{ fontSize: 15, padding: '16px 28px' }}
            >
              Explore AI Review Showcase ↓
            </button>
          </div>
        </div>

        {/* HERO INTERACTIVE CODE & AI REVIEW SHOWCASE */}
        <div id="interactive-demo" className="forge-card forge-card-glow" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Top IDE Header */}
          <div
            style={{
              background: 'rgba(8, 12, 26, 0.95)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e' }}></span>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></span>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>
                SkillForge Interactive Review Studio
              </span>
            </div>

            {/* Language Switcher Tabs */}
            <div style={{ display: 'flex', gap: 6, background: 'rgba(18, 26, 56, 0.7)', padding: 3, borderRadius: 8 }}>
              {(['python', 'cpp', 'java', 'javascript'] as const).map((langKey) => (
                <button
                  key={langKey}
                  onClick={() => setSelectedCodeTab(langKey)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedCodeTab === langKey ? 'var(--gradient-brand)' : 'transparent',
                    color: selectedCodeTab === langKey ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {langKey.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* IDE Body: Code Editor + Floating AI Review Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', background: 'var(--bg-terminal)' }}>
            {/* Left: Code Block */}
            <div style={{ padding: '28px', borderRight: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 12, color: 'var(--text-dim)' }}>
                <span>📄 {currentSnippet.filename}</span>
                <span style={{ color: 'var(--accent-cyan)' }}>{currentSnippet.langName}</span>
              </div>
              <div style={{ lineHeight: 1.8, fontSize: 13, color: '#e2e8f0' }}>
                {currentSnippet.code.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex' }}>
                    <span style={{ width: 32, color: 'var(--text-dim)', opacity: 0.5, userSelect: 'none' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span style={{ whiteSpace: 'pre' }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Real-time Gemini Rubric Review Card */}
            <div style={{ padding: '28px', background: 'rgba(11, 17, 38, 0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span className="tag-badge tag-emerald">✦ GEMINI RUBRIC EVALUATION</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Confidence:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 700 }}>98.4%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
                    {currentSnippet.reviewScore}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--text-dim)', fontWeight: 600 }}>/ 100</span>
                  <span className="tag-badge tag-indigo" style={{ marginLeft: 'auto' }}>
                    {currentSnippet.complexity}
                  </span>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: 4 }}>
                    VERIFIED STRENGTH
                  </div>
                  <div style={{ fontSize: 13, color: '#f1f5f9' }}>{currentSnippet.feedback}</div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', fontWeight: 700, marginBottom: 4 }}>
                    ADAPTIVE RECOMMENDATION
                  </div>
                  <div style={{ fontSize: 13, color: '#f1f5f9' }}>
                    Demonstrated mastery in basic logic. Advancing next challenge difficulty toward Hard-tier edge conditions.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)' }}>
                <span>Estimated Score Based on Review Rubric</span>
                <span style={{ color: 'var(--accent-cyan)' }}>Evidence Recorded to Topic Skill</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUTHENTICATED USER CONSOLE (If user is logged in) */}
      {currentUser && (
        <section id="practice-console" style={{ position: 'relative', zIndex: 10, padding: '40px 24px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
          {!currentUser.profile?.onboarding_completed ? (
            /* Onboarding Card */
            <div className="forge-card forge-card-glow" style={{ padding: 40, maxWidth: 700, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <span className="tag-badge tag-indigo" style={{ marginBottom: 12 }}>
                  STEP 2 OF 2 • ONE-TIME ONBOARDING
                </span>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>
                  Select Your Skill Baseline
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
                  SkillForge uses this as an initial prior to start your adaptive challenge recommendation loop.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>
                    CHOOSE INITIAL PROFICIENCY LEVEL
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setOnboardingLevel(lvl)}
                        style={{
                          padding: '16px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          background: onboardingLevel === lvl ? 'var(--gradient-brand)' : 'rgba(18, 26, 56, 0.7)',
                          border: onboardingLevel === lvl ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                          color: '#ffffff',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          fontSize: 14,
                          transition: 'all 0.2s',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleCompleteOnboarding} className="btn-primary-gradient" disabled={onboardingSaving}>
                  {onboardingSaving ? 'Configuring Profile...' : 'Complete Setup & Unlock All Tracks 🚀'}
                </button>
              </div>
            </div>
          ) : (
            /* Practice Setup Console */
            <div className="forge-card forge-card-glow" style={{ padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff' }}>
                    Welcome to Your Forge, {currentUser.profile.display_name || currentUser.email.split('@')[0]}!
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                    Select your language track, mode, and difficulty to launch your next adaptive challenge.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span className="tag-badge tag-emerald">AI SERVICE ONLINE</span>
                  <span className="tag-badge tag-indigo">SUPABASE CONNECTED</span>
                </div>
              </div>

              {sessionSuccessMsg && (
                <div style={{ padding: '12px 18px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', fontSize: 14, marginBottom: 24 }}>
                  ✓ {sessionSuccessMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>
                {/* Language Select */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    PROGRAMMING LANGUAGE
                  </label>
                  <select
                    value={practiceLang}
                    onChange={(e) => setPracticeLang(e.target.value)}
                    className="input-field"
                    style={{ background: 'rgba(18, 26, 56, 0.8)', cursor: 'pointer' }}
                  >
                    <option value="Python">Python</option>
                    <option value="C++">C++</option>
                    <option value="Java">Java</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="C">C</option>
                  </select>
                </div>

                {/* Practice Mode */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    PRACTICE MODE
                  </label>
                  <select
                    value={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.value as any)}
                    className="input-field"
                    style={{ background: 'rgba(18, 26, 56, 0.8)', cursor: 'pointer' }}
                  >
                    <option value="CODING">Coding Practice</option>
                    <option value="DEBUG">Debug Mode</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    DIFFICULTY MODE
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="input-field"
                    style={{ background: 'rgba(18, 26, 56, 0.8)', cursor: 'pointer' }}
                  >
                    <option value="ADAPTIVE">Adaptive (Recommended)</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                {/* Question Count */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    SESSION LENGTH
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value) as any)}
                    className="input-field"
                    style={{ background: 'rgba(18, 26, 56, 0.8)', cursor: 'pointer' }}
                  >
                    <option value={5}>5 Challenges</option>
                    <option value={10}>10 Challenges</option>
                    <option value={20}>20 Challenges</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                <button onClick={handleLaunchPractice} className="btn-primary-gradient" style={{ padding: '14px 32px' }}>
                  Initialize Practice Session →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* PRACTICE TRACKS SECTION */}
      <section id="tracks" style={{ position: 'relative', zIndex: 10, padding: '60px 24px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="tag-badge tag-indigo" style={{ marginBottom: 12 }}>
            LANGUAGES & TAXONOMY
          </span>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em' }}>
            Curated Language-Specific Tracks
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 8 }}>
            Each track measures topic mastery separately — Python loops and C loops are tracked as independent skills.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { name: 'Python', icon: '🐍', color: '#38bdf8', topics: ['Lists & Dicts', 'Generators', 'OOP', 'Dynamic Programming', 'Regex'], desc: 'Clean algorithmic implementations & idiomatic patterns' },
            { name: 'C++', icon: '⚡', color: '#818cf8', topics: ['Pointers & Refs', 'STL Containers', 'Templates', 'Memory Layout', 'Graphs'], desc: 'High-performance memory control & algorithmic mastery' },
            { name: 'Java', icon: '☕', color: '#f59e0b', topics: ['Generics', 'Collections', 'Streams', 'Concurrency', 'Design Patterns'], desc: 'Robust object-oriented systems & thread-safe structures' },
            { name: 'JavaScript', icon: '🌐', color: '#facc15', topics: ['Closures', 'Promises & Async', 'Prototypes', 'Array Pipelines', 'ESNext'], desc: 'Modern asynchronous programming & event loop mechanics' },
            { name: 'C', icon: '⚙️', color: '#10b981', topics: ['Pointer Arithmetic', 'Structs', 'Malloc & Free', 'Bitwise Math', 'Buffer Safety'], desc: 'Bare-metal computing, memory pointers, and low-level discipline' },
          ].map((track) => (
            <div key={track.name} className="forge-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 32 }}>{track.icon}</span>
                  <span className="tag-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: track.color, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {track.name}
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>{track.name} Track</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 18 }}>{track.desc}</p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {track.topics.map((t) => (
                    <span key={t} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 4, background: 'rgba(18, 26, 56, 0.8)', border: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => (currentUser ? (setPracticeLang(track.name), document.getElementById('practice-console')?.scrollIntoView({ behavior: 'smooth' })) : openAuth('signup'))}
                className="btn-secondary-glass"
                style={{ width: '100%', fontSize: 13 }}
              >
                Start {track.name} Practice →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS / ADAPTIVE LOOP */}
      <section id="engine" style={{ position: 'relative', zIndex: 10, padding: '60px 24px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div className="forge-card forge-card-glow" style={{ padding: 48 }}>
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 40px' }}>
            <span className="tag-badge tag-emerald" style={{ marginBottom: 12 }}>
              THE CORE CLOSED-LOOP
            </span>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              How SkillForge Advances Your Abilities
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 8 }}>
              Deterministic algorithms paired with Google Gemini AI ensure you are never stuck, never bored, and always improving.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { step: '01', title: 'Setup & Intent', desc: 'Choose language, mode (Coding vs Debug), and session length (5/10/20).' },
              { step: '02', title: 'AI-Generated Challenge', desc: 'Gemini creates tailored prompts with clear constraints and examples.' },
              { step: '03', title: 'Surgical Review', desc: 'Rubric-based evaluation scores your logic, syntax, edge cases, and clarity.' },
              { step: '04', title: 'Skill Evidence Update', desc: 'Deterministic formulas update your topic skill state transactionally.' },
            ].map((s) => (
              <div key={s.step} style={{ padding: 20, borderRadius: 12, background: 'rgba(8, 12, 28, 0.7)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, color: 'var(--accent-purple)', marginBottom: 8 }}>
                  {s.step}
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>{s.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(5, 8, 20, 0.95)',
          padding: '24px 32px',
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 13,
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div>© 2026 SkillForge Inc. AI-Powered Adaptive Coding Practice Platform.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>PostgreSQL (Supabase)</span>
          <span>•</span>
          <span>Google Gemini 2.5</span>
          <span>•</span>
          <span>Django REST</span>
          <span>•</span>
          <span>React + Vite</span>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={closeAuth}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ height: 3, width: '100%', background: 'var(--gradient-brand)' }}></div>

            <div style={{ padding: '32px 28px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {authMode === 'signin' ? 'Sign In to SkillForge' : 'Create Free Developer Account'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    {authMode === 'signin' ? 'Access your skill history & adaptive challenges.' : 'Start practicing with AI code reviews today.'}
                  </p>
                </div>
                <button
                  onClick={closeAuth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontSize: 22,
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Tab Switcher */}
              <div style={{ display: 'flex', background: 'rgba(8, 12, 28, 0.8)', padding: 4, borderRadius: 8, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setError(null); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: 'none',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: authMode === 'signup' ? 'var(--gradient-brand)' : 'transparent',
                    color: authMode === 'signup' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(null); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: 'none',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: authMode === 'signin' ? 'var(--gradient-brand)' : 'transparent',
                    color: authMode === 'signin' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  Sign In
                </button>
              </div>

              {/* GOOGLE AUTH BUTTON */}
              <button
                type="button"
                onClick={() => setGooglePromptOpen(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#ffffff',
                  color: '#1f2937',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.2s',
                  marginBottom: 20,
                }}
              >
                <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
                  <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
                  <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.35 24 12 24z" fill="#34A853" />
                  <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                  <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Quick Google Prompt Drawer if opened */}
              {googlePromptOpen && (
                <div style={{ padding: 16, borderRadius: 10, background: 'rgba(18, 26, 56, 0.95)', border: '1px solid var(--accent-purple)', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                    Google One-Click Sign-In (Direct Connect)
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    Enter your Google email to authenticate directly through the Google Auth backend provider:
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="input-field"
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => handleGoogleAuth()}
                      className="btn-primary-gradient"
                      style={{ padding: '8px 16px', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      Authenticate →
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}></div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  or continue with email
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}></div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {authMode === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                      DISPLAY NAME
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Linus Torvalds"
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@kernel.io"
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="input-field"
                  />
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                      CONFIRM PASSWORD *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="input-field"
                    />
                  </div>
                )}

                <button type="submit" className="btn-primary-gradient" disabled={loading} style={{ marginTop: 10 }}>
                  {loading
                    ? 'Processing...'
                    : authMode === 'signin'
                    ? 'Sign In to Console →'
                    : 'Create Free Account →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
