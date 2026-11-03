import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import type { User, ProgrammingLanguage, PracticeSession, SessionChallengeData } from './types';


export default function App() {
  // Global auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Visitor Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Landing page interactive snippet tab
  const [heroSnippetTab, setHeroSnippetTab] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');

  // Authenticated Console / Workspace state
  const [workspaceTab, setWorkspaceTab] = useState<'arena' | 'launchpad' | 'matrix' | 'history'>('arena');
  const [selectedTrack, setSelectedTrack] = useState<string>('Python');
  const [selectedMode, setSelectedMode] = useState<'CODING' | 'DEBUG'>('CODING');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE'>('ADAPTIVE');
  const [selectedCount, setSelectedCount] = useState<5 | 10 | 20>(5);

  // Practice Arena state
  const [currentCode, setCurrentCode] = useState<string>('');
  const [showHints, setShowHints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Onboarding state
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingLevel, setOnboardingLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [onboardingLang, setOnboardingLang] = useState('Python');
  const [onboardingSaving, setOnboardingSaving] = useState(false);

  // Catalog & Practice Lifecycle state (Phase 2 & 3)
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [currentSessionChallenge, setCurrentSessionChallenge] = useState<SessionChallengeData | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<PracticeSession[]>([]);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string>('');
  const [sessionType, setSessionType] = useState<'TOPIC' | 'MIXED'>('TOPIC');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionTimer, setSessionTimer] = useState<number>(0);

  // Phase 4: Engineering Analytics & Interactive Telemetry State
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTimeWindow, setAnalyticsTimeWindow] = useState<'7d' | '30d' | 'all'>('30d');
  const [matrixFilter, setMatrixFilter] = useState<'ALL' | 'MASTERED' | 'PROFICIENT' | 'PRACTICING'>('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('');
  const [evidenceTierFilter, setEvidenceTierFilter] = useState<'ALL' | 'OPTIMAL' | 'SOUND' | 'REVIEW'>('ALL');
  const [selectedEvidenceProof, setSelectedEvidenceProof] = useState<any | null>(null);

  // Dynamic Visualizations & 2-Way Simulator State
  const [hoveredTrajectoryIndex, setHoveredTrajectoryIndex] = useState<number | null>(null);
  const [trajectoryMetricView, setTrajectoryMetricView] = useState<'both' | 'rubric' | 'bayesian'>('both');
  const [selectedRadarDimension, setSelectedRadarDimension] = useState<string | null>(null);
  const [showBenchmarkOverlay, setShowBenchmarkOverlay] = useState<boolean>(true);
  const [expandedTopicSlug, setExpandedTopicSlug] = useState<string | null>(null);

  // GitHub-Style Activity Heatmap & Rhythm State
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<any | null>(null);
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

  const loadAnalytics = (track?: string) => {
    setAnalyticsLoading(true);
    api.practice.getAnalytics(track || selectedTrack)
      .then((data) => setAnalyticsData(data))
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setAnalyticsLoading(false));
  };

  // Load Challenge for Active Session
  const loadSessionChallenge = async (sessionId: string) => {
    setIsLoadingChallenge(true);
    try {
      const challengeData = await api.practice.getCurrentChallenge(sessionId);
      if (challengeData.session_finished) {
        setNotification('All challenges in this practice session are completed!');
        setTimeout(() => setNotification(null), 4000);
      } else {
        setCurrentSessionChallenge(challengeData);
        if (challengeData.challenge?.starter_code) {
          setCurrentCode(challengeData.challenge.starter_code);
        }
        setReviewResult(null);
        setShowHints(false);
      }
    } catch (err: any) {
      console.error('Failed to load challenge:', err);
      if (err.details?.error === 'INTERNET_REQUIRED' || err.message?.includes('internet') || err.message?.includes('Internet')) {
        setNotification('⚠️ Internet connection required: Live AI generation requires an active internet connection.');
        setTimeout(() => setNotification(null), 6000);
      }
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const handleNextChallenge = async () => {
    if (!activeSession) return;
    setIsLoadingChallenge(true);
    try {
      const nextData = await api.practice.getNextChallenge(activeSession.id);
      if (nextData.session_finished) {
        setNotification('🎉 Session complete! All requested challenges finished.');
        setTimeout(() => setNotification(null), 5000);
        await handleCompleteSession();
      } else {
        setCurrentSessionChallenge(nextData);
        if (nextData.challenge?.starter_code) {
          setCurrentCode(nextData.challenge.starter_code);
        }
        setReviewResult(null);
        setShowHints(false);
        setNotification(`Progressed to Problem ${nextData.question_order} of ${nextData.total_questions}`);
        setTimeout(() => setNotification(null), 3500);
      }
    } catch (err: any) {
      if (err.details?.error === 'INTERNET_REQUIRED' || err.message?.includes('internet') || err.message?.includes('Internet')) {
        setNotification('⚠️ Internet connection required: Live AI generation requires an active internet connection.');
        setTimeout(() => setNotification(null), 6000);
      } else {
        alert(err.message || 'Could not load next challenge.');
      }
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const handleSkipChallenge = async () => {
    if (!activeSession) return;
    setIsLoadingChallenge(true);
    try {
      const skipData = await api.practice.skipChallenge(activeSession.id);
      if (skipData.session_finished) {
        setNotification('🎉 Session finished! All requested challenges completed.');
        setTimeout(() => setNotification(null), 5000);
        await handleCompleteSession();
      } else {
        setCurrentSessionChallenge(skipData);
        if (skipData.challenge?.starter_code) {
          setCurrentCode(skipData.challenge.starter_code);
        }
        setReviewResult(null);
        setShowHints(false);
        setNotification(`Skipped to Problem ${skipData.question_order} of ${skipData.total_questions}`);
        setTimeout(() => setNotification(null), 3500);
      }
    } catch (err: any) {
      if (err.details?.error === 'INTERNET_REQUIRED' || err.message?.includes('internet') || err.message?.includes('Internet')) {
        setNotification('⚠️ Internet connection required: Live AI generation requires an active internet connection.');
        setTimeout(() => setNotification(null), 6000);
      } else {
        alert(err.message || 'Could not skip challenge.');
      }
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  // Load Catalog Languages & Topics
  useEffect(() => {
    api.catalog.getLanguages()
      .then((langs) => {
        if (langs && langs.length > 0) {
          setLanguages(langs);
          const current = langs.find((l) => l.name.toLowerCase() === selectedTrack.toLowerCase());
          if (current && current.topics.length > 0) {
            setSelectedTopicSlug(current.topics[0].slug);
          }
        }
      })
      .catch((err) => console.error('Catalog load error:', err));
  }, []);

  // Fetch Active Session on login
  const refreshActiveSession = () => {
    if (currentUser) {
      api.practice.getActiveSession()
        .then((res) => {
          setActiveSession(res.active_session);
          if (res.active_session) {
            setSelectedTrack(res.active_session.language_name);
            loadSessionChallenge(res.active_session.id);
          } else {
            setCurrentSessionChallenge(null);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshActiveSession();
    }
  }, [currentUser]);

  // Session timer ticker
  useEffect(() => {
    if (!activeSession || !activeSession.started_at || activeSession.status !== 'IN_PROGRESS') {
      setSessionTimer(0);
      return;
    }
    const startTime = new Date(activeSession.started_at).getTime();
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setSessionTimer(diff);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch session history
  const loadHistory = () => {
    api.practice.listSessions()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res.results || [];
        setSessionHistory(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (workspaceTab === 'history' && currentUser) {
      loadHistory();
      loadAnalytics(selectedTrack);
    }
  }, [workspaceTab, currentUser, selectedTrack]);

  // Handle topic change when track changes
  useEffect(() => {
    const currentLang = languages.find((l) => l.name.toLowerCase() === selectedTrack.toLowerCase());
    if (currentLang && currentLang.topics.length > 0) {
      setSelectedTopicSlug(currentLang.topics[0].slug);
    }
  }, [selectedTrack, languages]);

  // Create new practice session
  const handleStartPracticeSession = async (topicSlug?: string, pType?: 'TOPIC' | 'MIXED') => {
    setIsCreatingSession(true);
    try {
      const targetType = pType || sessionType;
      setSessionType(targetType);
      const targetTopicSlug = topicSlug !== undefined ? topicSlug : (targetType === 'TOPIC' ? selectedTopicSlug : null);
      const langObj = languages.find((l) => l.name.toLowerCase() === selectedTrack.toLowerCase()) || languages[0];
      const newSession = await api.practice.createSession({
        language_slug: langObj ? langObj.slug : selectedTrack.toLowerCase(),
        topic_slug: targetType === 'TOPIC' ? targetTopicSlug : null,
        practice_type: targetType,
        difficulty_mode: selectedDifficulty,
        practice_mode: selectedMode,
        requested_question_count: selectedCount,
      });
      setActiveSession(newSession);
      loadSessionChallenge(newSession.id);
      if (targetTopicSlug) {
        setSelectedTopicSlug(targetTopicSlug);
      }
      setWorkspaceTab('arena');
      setNotification(`Practice session started for ${newSession.language_name} (${newSession.topic_name || 'Mixed Track'})!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to start practice session.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleAbandonSession = async () => {
    if (!activeSession) return;
    if (!confirm('Are you sure you want to abandon the current practice session?')) return;
    try {
      await api.practice.abandonSession(activeSession.id);
      setActiveSession(null);
      setCurrentSessionChallenge(null);
      setNotification('Session abandoned.');
      setTimeout(() => setNotification(null), 3000);
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to abandon session.');
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    try {
      await api.practice.completeSession(activeSession.id);
      setActiveSession(null);
      setCurrentSessionChallenge(null);
      setNotification('Session marked as completed! Great job!');
      setTimeout(() => setNotification(null), 4000);
      setWorkspaceTab('history');
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to complete session.');
    }
  };

  // Reset arena state when track changes and no active session
  useEffect(() => {
    if (!activeSession) {
      setCurrentCode('');
      setReviewResult(null);
      setShowHints(false);
    }
  }, [selectedTrack, activeSession]);

  // Check existing session on load
  useEffect(() => {
    api.auth.initCsrf().catch(() => {});
    api.auth
      .me()
      .then((res) => {
        setCurrentUser(res.user);
        window.location.hash = '#/workspace';
        if (res.user.profile && !res.user.profile.onboarding_completed) {
          setOnboardingOpen(true);
        }
      })
      .catch(() => {
        setCurrentUser(null);
        if (window.location.hash === '#/workspace') {
          window.location.hash = '#/';
        }
      })
      .finally(() => setInitialLoading(false));
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
    setAuthError(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const res = await api.auth.login(email, password);
        setCurrentUser(res.user);
        window.location.hash = '#/workspace';
        closeAuth();
        if (res.user.profile && !res.user.profile.onboarding_completed) {
          setOnboardingOpen(true);
        }
      } else {
        if (password !== passwordConfirm) {
          setAuthError('Passwords do not match.');
          setAuthLoading(false);
          return;
        }
        const res = await api.auth.register(email, password, passwordConfirm, displayName);
        setCurrentUser(res.user);
        window.location.hash = '#/workspace';
        closeAuth();
        setOnboardingOpen(true);
      }
    } catch (err: any) {
      if (err.details && typeof err.details === 'object') {
        const firstKey = Object.keys(err.details)[0];
        const val = err.details[firstKey];
        setAuthError(Array.isArray(val) ? val[0] : String(val));
      } else {
        setAuthError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // 1-Click Instant Demo Login (Zero friction for reviewers and visitors)
  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      let res;
      try {
        res = await api.auth.login('developer@skillforge.io', 'DemoPass123!');
      } catch {
        res = await api.auth.register(
          'developer@skillforge.io',
          'DemoPass123!',
          'DemoPass123!',
          'SkillForge Developer'
        );
      }
      setCurrentUser(res.user);
      window.location.hash = '#/workspace';
      closeAuth();
    } catch (err: any) {
      setAuthError(err.message || 'Instant demo login encountered an issue.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {}
    setCurrentUser(null);
    window.location.hash = '#/';
  };

  const handleCompleteOnboarding = async () => {
    setOnboardingSaving(true);
    try {
      await api.profile.update({
        initial_skill_level: onboardingLevel,
        onboarding_completed: true,
      });
      setSelectedTrack(onboardingLang);
      const res = await api.auth.me();
      setCurrentUser(res.user);
      setOnboardingOpen(false);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to complete onboarding.');
    } finally {
      setOnboardingSaving(false);
    }
  };

  // Submit code for real backend evaluation
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setReviewResult(null);

    try {
      let result: any;
      if (activeSession && currentSessionChallenge?.challenge?.id) {
        // Evaluate in active practice session
        result = await api.practice.submitCode(
          activeSession.id,
          currentSessionChallenge.challenge.id,
          currentCode
        );
        if (result.is_solved) {
          if (result.is_session_finished) {
            setNotification('🎉 Amazing! Session complete! All requested problems solved.');
            setTimeout(() => setNotification(null), 5000);
            await handleCompleteSession();
          } else {
            setNotification(`✓ Solution Verified! Score: ${result.score}/100. Great job!`);
            setTimeout(() => setNotification(null), 5000);
          }
        } else {
          setNotification(`⚠ Solution evaluated. Score: ${result.score}/100. Review issues below.`);
          setTimeout(() => setNotification(null), 5000);
        }
      } else {
        // Standalone challenge evaluation
        const challengeId = currentSessionChallenge?.challenge?.id;
        const langSlug = selectedTrack.toLowerCase();
        result = await api.challenges.submitCode(challengeId, currentCode, langSlug);
        setNotification(`✓ Solution evaluated. Score: ${result.score}/100.`);
        setTimeout(() => setNotification(null), 5000);
      }

      setReviewResult({
        score: result.score,
        status: result.status,
        isSolved: result.is_solved,
        summary: result.summary,
        feedback: result.feedback,
        complexity: result.complexity || 'O(1) execution',
        syntaxIssues: result.syntax_issues || [],
        logicIssues: result.logic_issues || [],
        conceptsDemonstrated: result.concepts_demonstrated || [],
        timestamp: result.timestamp || new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error('Submission error:', err);
      if (err.details?.error === 'INTERNET_REQUIRED' || err.message?.includes('internet') || err.message?.includes('Internet')) {
        setNotification('⚠️ Internet connection required: Live AI evaluation requires an active internet connection.');
        setTimeout(() => setNotification(null), 6000);
      } else {
        alert(err.message || 'Evaluation request failed. Please check backend connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hero snippet preview data
  const snippetData = {
    python: {
      filename: 'config_parser.py',
      lang: 'Python 3.12',
      code: [
        'def parse_database_config(raw_env: dict, defaults: dict) -> dict:',
        '    """Safely extracts DB connection config with fallback defaults."""',
        '    config = defaults.copy()',
        '    for key in ("host", "port", "user", "timeout"):',
        '        if key in raw_env and raw_env[key] is not None:',
        '            config[key] = int(raw_env[key]) if key in ("port", "timeout") else str(raw_env[key])',
        '    return config',
      ],
      score: 99,
      complexity: 'O(1) Dictionary Lookup • Zero Unhandled Exceptions',
      feedback: 'Defensive type conversion, non-mutating copy, and idiomatic key lookup.',
    },
    cpp: {
      filename: 'pointer_lru.cpp',
      lang: 'C++ 20',
      code: [
        'template<typename K, typename V>',
        'class LRUCache {',
        '    size_t capacity;',
        '    std::list<std::pair<K, V>> items;',
        '    std::unordered_map<K, typename std::list<std::pair<K, V>>::iterator> cache;',
        'public:',
        '    LRUCache(size_t cap) : capacity(cap) {}',
        '    V get(const K& key);',
        '};',
      ],
      score: 97,
      complexity: 'O(1) get/put',
      feedback: 'Double-linked list + hashmap iterator splice avoids item reallocation.',
    },
    java: {
      filename: 'ring_buffer.java',
      lang: 'Java 21',
      code: [
        'public class RingBuffer<T> {',
        '    private final AtomicReferenceArray<T> buffer;',
        '    private final AtomicLong head = new AtomicLong(0);',
        '    private final AtomicLong tail = new AtomicLong(0);',
        '    public boolean offer(T element) {',
        '        long curTail = tail.get();',
        '        if (curTail - head.get() >= buffer.length()) return false;',
        '        buffer.set((int) (curTail % buffer.length()), element);',
        '        tail.lazySet(curTail + 1);',
        '        return true;',
        '    }',
        '}',
      ],
      score: 96,
      complexity: 'Lock-free O(1)',
      feedback: 'Lock-free mechanics avoid thread contention under heavy write load.',
    },
    javascript: {
      filename: 'async_pipeline.ts',
      lang: 'TypeScript',
      code: [
        'export async function executePipeline<T>(',
        '  tasks: Array<(input: T) => Promise<T>>,',
        '  initialValue: T',
        '): Promise<T> {',
        '  return tasks.reduce(',
        '    async (acc, task) => task(await acc),',
        '    Promise.resolve(initialValue)',
        '  );',
        '}',
      ],
      score: 94,
      complexity: 'O(k) async chain',
      feedback: 'Clean functional reduction preserving sequential async resolution.',
    },
  };

  const currentSnippet = snippetData[heroSnippetTab];

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

  // =========================================================================
  // VIEW 1: AUTHENTICATED USER CONSOLE (Dedicated Workspace Window, No Landing Scroll)
  // =========================================================================
  if (currentUser) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', overflow: 'hidden' }}>
        <div className="ambient-bg-grid"></div>

        {/* TOP WORKSPACE APPLICATION BAR - CLEAN & PROFESSIONAL */}
        <header
          style={{
            height: 58,
            background: 'rgba(11, 15, 25, 0.96)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            position: 'relative',
            zIndex: 100,
          }}
        >
          {/* Brand & Track Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#ffffff',
                  boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)',
                }}
              >
                ⚡
              </div>
              <span style={{ fontWeight: 800, fontSize: 17, color: '#ffffff', letterSpacing: '-0.02em' }}>
                SkillForge
              </span>
            </div>

            <div style={{ height: 18, width: 1, background: 'rgba(255, 255, 255, 0.1)' }}></div>

            {/* Clean Track Dropdown Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                Track:
              </span>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {(languages.length > 0 ? languages.map((l) => l.name) : ['Python', 'JavaScript', 'Java', 'C++', 'C']).map((lang) => (
                  <option key={lang} value={lang} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Central Workspace Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '3px 4px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              onClick={() => setWorkspaceTab('arena')}
              className={`ws-tab-pill ${workspaceTab === 'arena' ? 'active' : ''}`}
            >
              <span>⚡</span> Practice Studio
            </button>
            <button
              onClick={() => setWorkspaceTab('launchpad')}
              className={`ws-tab-pill ${workspaceTab === 'launchpad' ? 'active' : ''}`}
            >
              <span>📚</span> Curriculum & Topics
            </button>
            <button
              onClick={() => setWorkspaceTab('history')}
              className={`ws-tab-pill ${workspaceTab === 'history' ? 'active' : ''}`}
            >
              <span>📈</span> Engineering Analytics
            </button>
          </div>

          {/* User Profile & Connection Status (No noisy DB badge) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '4px 10px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {(currentUser.profile?.display_name || currentUser.email)[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>
                {currentUser.profile?.display_name || currentUser.email.split('@')[0]}
              </span>
              <span className="tag-badge tag-indigo" style={{ padding: '1px 6px', fontSize: 9 }}>
                {currentUser.profile?.initial_skill_level || 'STUDENT'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#fb7185',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* WORKSPACE MAIN CONTAINER */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
          {/* TAB 1: PRACTICE STUDIO (ARENA) */}
          {workspaceTab === 'arena' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Studio Telemetry & Session Sub-Header */}
              <div
                style={{
                  height: 48,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 24px',
                  flexShrink: 0,
                }}
              >
                {/* Left: Breadcrumbs & Status */}
                {activeSession ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{selectedTrack}</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>/</span>
                      <span style={{ color: '#c0c1ff' }}>
                        {currentSessionChallenge?.challenge.topic_name || activeSession.topic_name || 'Mixed Track'}
                      </span>
                    </div>

                    <span className="tag-badge tag-emerald" style={{ fontSize: 10, padding: '2px 8px' }}>
                      {currentSessionChallenge?.challenge.difficulty || activeSession.difficulty_mode}
                    </span>

                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 8px', borderRadius: 4 }}>
                      Problem {currentSessionChallenge ? currentSessionChallenge.question_order : 1} of {currentSessionChallenge ? currentSessionChallenge.total_questions : activeSession.requested_question_count}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="tag-badge tag-indigo" style={{ fontSize: 10, padding: '3px 8px' }}>
                      {selectedTrack.toUpperCase()} TRACK
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Practice Studio
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>/</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c0c1ff' }}>
                      Free Practice Studio
                    </span>
                  </div>
                )}

                {/* Right: Actions, Timer & Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {activeSession ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          <span className="pulsing-emerald-dot" style={{ width: 6, height: 6 }}></span>
                          <span>{formatTimer(sessionTimer)} elapsed</span>
                        </div>
                        <button
                          onClick={handleAbandonSession}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            color: 'var(--accent-rose)',
                            padding: '3px 8px',
                            borderRadius: 5,
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Abandon
                        </button>
                        <button
                          onClick={handleCompleteSession}
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: 'var(--accent-emerald)',
                            padding: '3px 10px',
                            borderRadius: 5,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Finish Session
                        </button>
                      </div>

                      <button
                        onClick={handleSkipChallenge}
                        disabled={isLoadingChallenge}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          background: 'rgba(245, 158, 11, 0.08)',
                          color: '#fbbf24',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="Skip this question and move to next in the set"
                      >
                        <span>⏩</span> Skip
                      </button>

                      <button
                        onClick={handleNextChallenge}
                        disabled={isLoadingChallenge}
                        className="btn-secondary-glass"
                        style={{
                          padding: '5px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#c0c1ff',
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        title="Advance to next challenge in session"
                      >
                        <span>⏭</span>
                        {isLoadingChallenge ? 'Loading...' : currentSessionChallenge?.is_last_question ? 'Finish Session' : 'Next Question'}
                      </button>

                      <button
                        onClick={() => setCurrentCode(currentSessionChallenge?.challenge.starter_code || '')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--text-muted)',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Reset
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={isSubmitting || isLoadingChallenge}
                        className="btn-primary-gradient"
                        style={{
                          padding: '5px 18px',
                          fontSize: 12,
                          fontWeight: 700,
                          boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
                        }}
                      >
                        {isSubmitting ? 'Evaluating...' : 'Submit Solution →'}
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                      <span className="pulsing-emerald-dot" style={{ width: 6, height: 6 }}></span>
                      <span>✦ Free Live AI Studio Ready</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Dual Split Pane */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Column: Problem & Instructions or Free Practice Launcher */}
              <div
                style={{
                  width: '42%',
                  borderRight: '1px solid var(--border-subtle)',
                  background: 'rgba(8, 12, 26, 0.75)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  padding: '24px 28px',
                }}
              >
                {isLoadingChallenge ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
                    <div className="pulsing-emerald-dot" style={{ width: 10, height: 10 }}></div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      ✦ Calibrating Concept Challenge...
                    </div>
                  </div>
                ) : !activeSession ? (
                  /* INITIATION PANEL: START PRACTICING FOR FREE */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Header */}
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c0c1ff', fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
                        <span>⚡</span> 100% FREE AI PRACTICE STUDIO
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
                        Start Practicing for Free
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                        No LeetCode DSA boilerplate. Solve real-world scenario challenges evaluated live by Gemini AI. Configure your preferences below to launch your session.
                      </p>
                    </div>

                    {/* Step 1: Language Track */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                        1. Select Language Track
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {['Python', 'JavaScript', 'Java', 'C++', 'C'].map((lang) => {
                          const isSel = selectedTrack.toLowerCase() === lang.toLowerCase();
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                setSelectedTrack(lang);
                                const lObj = languages.find((l) => l.name.toLowerCase() === lang.toLowerCase());
                                if (lObj && lObj.topics.length > 0) {
                                  setSelectedTopicSlug(lObj.topics[0].slug);
                                }
                              }}
                              style={{
                                padding: '8px 4px',
                                borderRadius: 8,
                                border: isSel ? '1px solid var(--accent-indigo)' : '1px solid rgba(255, 255, 255, 0.08)',
                                background: isSel ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                color: isSel ? '#ffffff' : 'var(--text-muted)',
                                fontSize: 12,
                                fontWeight: isSel ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'center',
                              }}
                            >
                              {lang}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Practice Mode */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                        2. Practice Mode
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setSessionType('TOPIC')}
                          style={{
                            padding: '12px',
                            borderRadius: 8,
                            border: sessionType === 'TOPIC' ? '1px solid var(--accent-indigo)' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: sessionType === 'TOPIC' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                            color: sessionType === 'TOPIC' ? '#ffffff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>🎯 Foundational Topic</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Deep dive into a specific concept</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSessionType('MIXED')}
                          style={{
                            padding: '12px',
                            borderRadius: 8,
                            border: sessionType === 'MIXED' ? '1px solid var(--accent-indigo)' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: sessionType === 'MIXED' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                            color: sessionType === 'MIXED' ? '#ffffff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>🔀 Mixed Track</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Adaptive mix of core topics</div>
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Choose Topic (if TOPIC mode) */}
                    {sessionType === 'TOPIC' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                          3. Choose Foundational Concept
                        </label>
                        <select
                          value={selectedTopicSlug}
                          onChange={(e) => setSelectedTopicSlug(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {(() => {
                            const curLang = languages.find((l) => l.name.toLowerCase() === selectedTrack.toLowerCase());
                            const topics = curLang?.topics || [];
                            if (topics.length === 0) {
                              return <option value="">Loading topics...</option>;
                            }
                            return topics.map((t) => (
                              <option key={t.slug} value={t.slug}>
                                {t.name}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    )}

                    {/* Step 4: Difficulty & Set Size */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                          Difficulty Level
                        </label>
                        <select
                          value={selectedDifficulty}
                          onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            fontSize: 12,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="ADAPTIVE">Adaptive (Recommended)</option>
                          <option value="EASY">Easy (Beginner Friendly)</option>
                          <option value="MEDIUM">Medium (Intermediate Logic)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                          Challenge Batch Size
                        </label>
                        <select
                          value={selectedCount}
                          onChange={(e) => setSelectedCount(Number(e.target.value) as any)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            fontSize: 12,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value={5}>5 Questions (Fast Batch)</option>
                          <option value={10}>10 Questions</option>
                          <option value={20}>20 Questions</option>
                        </select>
                      </div>
                    </div>

                    {/* Primary CTA Launch Button */}
                    <button
                      type="button"
                      onClick={() => handleStartPracticeSession()}
                      disabled={isCreatingSession}
                      className="btn-primary-gradient"
                      style={{
                        padding: '14px',
                        fontSize: 14,
                        fontWeight: 700,
                        borderRadius: 10,
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                        cursor: isCreatingSession ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isCreatingSession ? (
                        <>
                          <div className="pulsing-emerald-dot" style={{ width: 8, height: 8 }}></div>
                          <span>Generating 5 AI Challenges with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Start Practicing for Free →</span>
                        </>
                      )}
                    </button>

                    {/* Guarantees / Highlights */}
                    <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginBottom: 8, textTransform: 'uppercase' }}>
                        ✦ SkillForge Engine Guarantees
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                        <div>✓ <strong>100% Real-World Scenarios:</strong> University-style foundational programming without DSA gimmicks.</div>
                        <div>✓ <strong>Instant Batch Generation:</strong> 5 questions created in 1 AI call with zero wait between problems.</div>
                        <div>✓ <strong>Live Gemini Evaluation:</strong> Rubric scoring, edge cases & logic analysis without code sandboxes.</div>
                      </div>
                    </div>
                  </div>
                ) : (() => {
                  const challenge = currentSessionChallenge?.challenge;
                  if (!challenge) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
                        <div className="pulsing-emerald-dot" style={{ width: 10, height: 10 }}></div>
                        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                          ✦ Loading Challenge...
                        </div>
                      </div>
                    );
                  }
                  const title = challenge.title;
                  const statement = challenge.statement;
                  const difficulty = challenge.difficulty;
                  const topic = challenge.topic_name || activeSession?.topic_name || 'Foundations';
                  const hints = challenge.hints || [];
                  const constraints = challenge.constraints_text
                    ? challenge.constraints_text.split('\n').filter((c) => c.trim().length > 0)
                    : [];
                  const targetConcepts = challenge.target_concepts || [];
                  const origin = challenge.origin || 'AI_GENERATED';

                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span className="tag-badge tag-indigo">{selectedTrack.toUpperCase()} TRACK</span>
                        <span className="tag-badge tag-emerald">{difficulty}</span>
                        <span className={`tag-badge ${origin === 'AI_GENERATED' ? 'tag-cyan' : 'tag-indigo'}`} style={{ fontSize: 9 }}>
                          {origin === 'AI_GENERATED' ? '✦ GEMINI 2.5' : '✦ FOUNDATION'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                          {topic}
                        </span>
                      </div>

                      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: 16 }}>
                        {title}
                      </h1>

                      {targetConcepts.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                          {targetConcepts.map((concept, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 10,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--accent-cyan)',
                                background: 'rgba(56, 189, 248, 0.08)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-line' }}>
                        {statement}
                      </div>

                      <div style={{ marginBottom: 24 }}>
                        <h4 style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 10 }}>
                          CONSTRAINTS & POLICIES
                        </h4>
                        <ul style={{ paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                          {constraints.map((c, i) => (
                            <li key={i}>{c.replace(/^-\s*/, '')}</li>
                          ))}
                          <li style={{ color: 'var(--accent-cyan)' }}>
                            Zero Sandbox Execution: Evaluated as untrusted text against structured Gemini 2.5 rubric.
                          </li>
                        </ul>
                      </div>

                      {/* Collapsible Hints */}
                      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          onClick={() => setShowHints(!showHints)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            padding: '8px 14px',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span>💡</span> {showHints ? 'Hide Concept Hints' : 'Reveal Concept Hints'}
                        </button>

                        {showHints && (
                          <div style={{ marginTop: 12, padding: 14, borderRadius: 8, background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-subtle)' }}>
                            {hints.length === 0 ? (
                              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                                Focus on class invariants, boundary conditions, and defensive validations.
                              </p>
                            ) : (
                              hints.map((h, i) => (
                                <p key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: i === hints.length - 1 ? 0 : 8 }}>
                                  • {h}
                                </p>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Right Column: Code Editor & Gemini AI Review */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-terminal)', overflow: 'hidden' }}>
                {/* Editor Header Bar */}
                <div
                  style={{
                    height: 40,
                    background: 'rgba(8, 12, 26, 0.95)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.08)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <span>📄</span> solution.{selectedTrack === 'Python' ? 'py' : selectedTrack === 'C++' ? 'cpp' : selectedTrack === 'Java' ? 'java' : selectedTrack === 'C' ? 'c' : 'ts'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {activeSession ? '• Untrusted Text Input Buffer' : '• Standby'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      Gemini 2.5 Rubric Active
                    </span>
                    {activeSession && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentCode);
                          setNotification('Copied code to clipboard');
                          setTimeout(() => setNotification(null), 2500);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Copy Code"
                      >
                        <span>📋</span> Copy
                      </button>
                    )}
                  </div>
                </div>

                {/* Editor Textarea or Standby Initiation State */}
                {!activeSession ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px 32px',
                      textAlign: 'center',
                      background: 'radial-gradient(circle at 50% 45%, rgba(99, 102, 241, 0.08), transparent 70%)',
                    }}
                  >
                    <div
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: 20,
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 30,
                        marginBottom: 18,
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
                      }}
                    >
                      ⌨️
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 10, letterSpacing: '-0.01em' }}>
                      Workspace Standby
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, lineHeight: 1.7, marginBottom: 28 }}>
                      Configure your language track and foundational concept on the left, then click{' '}
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>"Start Practicing for Free"</span> to generate live real-world challenges directly in this editor.
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 14,
                        maxWidth: 620,
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: 16, marginBottom: 6 }}>✦</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Real Invariants</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>Practical domain logic, voting rules, bill totals & validations.</div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: 16, marginBottom: 6 }}>⚡</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Gemini Evaluation</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>Deep rubric evaluation grading edge cases & logical correctness.</div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: 16, marginBottom: 6 }}>⏩</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Fast 5-Q Batches</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>5 problems generated at once with zero wait between skips.</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: reviewResult ? '1 1 50%' : '1 1 100%', position: 'relative', overflow: 'hidden' }}>
                    <textarea
                      value={currentCode}
                      onChange={(e) => setCurrentCode(e.target.value)}
                      className="code-editor-textarea"
                      placeholder="Type or paste your code solution here..."
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Live Real Evaluation Rubric Review Panel */}
                {reviewResult && (
                  <div
                    style={{
                      flex: '1 1 50%',
                      borderTop: '1px solid var(--border-bright)',
                      background: 'rgba(10, 16, 36, 0.96)',
                      padding: '20px 24px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`tag-badge ${reviewResult.isSolved ? 'tag-emerald' : 'tag-amber'}`}>
                          {reviewResult.isSolved ? '✓ SOLUTION VERIFIED (PASSED)' : '⚠ REVISION REQUIRED (NOT PASSING)'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                          Evaluated at {reviewResult.timestamp}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {reviewResult.isSolved && activeSession && (
                          <button
                            onClick={handleNextChallenge}
                            className="btn-primary-gradient"
                            style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700 }}
                          >
                            Next Problem ⏭
                          </button>
                        )}
                        <button
                          onClick={() => setReviewResult(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}
                        >
                          ✕ Close Review
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 16, alignItems: 'center' }}>
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '12px',
                          borderRadius: 10,
                          background: reviewResult.isSolved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${reviewResult.isSolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 36,
                            fontWeight: 900,
                            fontFamily: 'var(--font-heading)',
                            color: reviewResult.isSolved ? 'var(--accent-emerald)' : '#f87171',
                          }}
                        >
                          {reviewResult.score}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: reviewResult.isSolved ? 'var(--accent-emerald)' : '#f87171',
                          }}
                        >
                          RUBRIC SCORE
                        </div>
                      </div>

                      <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginBottom: 4 }}>
                          EVALUATION SUMMARY
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{reviewResult.summary}</div>
                      </div>

                      <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', marginBottom: 4 }}>
                          ANALYTIC COMPLEXITY
                        </div>
                        <div style={{ fontSize: 12, color: '#f1f5f9' }}>{reviewResult.complexity}</div>
                      </div>
                    </div>

                    {/* Syntax Errors Box if any */}
                    {reviewResult.syntaxIssues && reviewResult.syntaxIssues.length > 0 && (
                      <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', fontSize: 13, color: '#fca5a5' }}>
                        <strong style={{ color: '#f87171', display: 'block', marginBottom: 6 }}>🚨 Syntax Error Detected:</strong>
                        {reviewResult.syntaxIssues.map((issue: string, i: number) => (
                          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>• {issue}</div>
                        ))}
                      </div>
                    )}

                    {/* Logic Issues / Missing Conditions Box if any */}
                    {reviewResult.logicIssues && reviewResult.logicIssues.length > 0 && (
                      <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', fontSize: 13, color: '#fcd34d' }}>
                        <strong style={{ color: '#fbbf24', display: 'block', marginBottom: 6 }}>⚠ Logic Issues & Missed Conditions:</strong>
                        {reviewResult.logicIssues.map((issue: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>• {issue}</div>
                        ))}
                      </div>
                    )}

                    {/* Detailed Review Feedback */}
                    <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: 13, color: '#f8fafc' }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>Surgical Review Feedback: </strong>
                      {reviewResult.feedback}
                    </div>

                    {/* Concepts Demonstrated Pills */}
                    {reviewResult.conceptsDemonstrated && reviewResult.conceptsDemonstrated.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                          Concepts Demonstrated:
                        </span>
                        {reviewResult.conceptsDemonstrated.map((c: string, idx: number) => (
                          <span key={idx} className="tag-badge tag-indigo" style={{ fontSize: 10 }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* TAB 2: CURRICULUM & TOPICS */}
          {workspaceTab === 'launchpad' && (
            <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
              <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                {notification && (
                  <div style={{ padding: '12px 20px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', marginBottom: 20 }}>
                    {notification}
                  </div>
                )}

                {activeSession && (
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: 10,
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      marginBottom: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                        Active Session Running: {activeSession.language_name} ({activeSession.topic_name || 'Mixed Track'})
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Status: <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{activeSession.status}</span> • Elapsed: {formatTimer(sessionTimer)} • {activeSession.requested_question_count} Challenges
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={handleAbandonSession}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          background: 'rgba(244, 63, 94, 0.15)',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          color: 'var(--accent-rose)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Abandon Session
                      </button>
                      <button
                        onClick={() => setWorkspaceTab('arena')}
                        className="btn-primary-gradient"
                        style={{ padding: '8px 18px', fontSize: 12 }}
                      >
                        Resume Arena Studio →
                      </button>
                    </div>
                  </div>
                )}

                {/* Track Selector Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="tag-badge tag-indigo">FOUNDATIONS CURRICULUM</span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Language & Concept Mastery</span>
                    </div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                      {selectedTrack} Core Engineering Syllabus
                    </h2>
                  </div>

                  {/* Language Pills */}
                  <div style={{ display: 'flex', gap: 8, background: 'rgba(15, 23, 42, 0.8)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    {['Python', 'C++', 'Java', 'JavaScript', 'C'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedTrack(lang)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: selectedTrack.toLowerCase() === lang.toLowerCase() ? 'var(--gradient-brand)' : 'transparent',
                          border: 'none',
                          color: selectedTrack.toLowerCase() === lang.toLowerCase() ? '#ffffff' : 'var(--text-dim)',
                          fontWeight: 700,
                          fontSize: 13,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {lang === 'Python' ? '🐍 ' : lang === 'C++' ? '⚡ ' : lang === 'Java' ? '☕ ' : lang === 'JavaScript' ? '🌐 ' : '⚙️ '}
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curriculum Hero Banner with 1-Click Mixed Session & Preferences */}
                <div
                  className="forge-card"
                  style={{
                    padding: '24px 28px',
                    marginBottom: 28,
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 20,
                  }}
                >
                  <div style={{ maxWidth: 620 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>
                      {selectedTrack} Practical Concept Framework
                    </div>
                    <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                      No LeetCode algorithms or DSA trivia. Test and sharpen real engineering foundations: syntax rules, memory models, object invariants, safe resource management, and clean error handling.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0, 0, 0, 0.3)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>SESSION:</span>
                      <select
                        value={selectedCount}
                        onChange={(e) => setSelectedCount(Number(e.target.value) as any)}
                        style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                      >
                        <option value={5} style={{ background: '#0f172a' }}>5 Problems</option>
                        <option value={10} style={{ background: '#0f172a' }}>10 Problems</option>
                        <option value={20} style={{ background: '#0f172a' }}>20 Problems</option>
                      </select>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                        style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="ADAPTIVE" style={{ background: '#0f172a' }}>Adaptive Curve</option>
                        <option value="EASY" style={{ background: '#0f172a' }}>Foundation (Easy)</option>
                        <option value="MEDIUM" style={{ background: '#0f172a' }}>Intermediate (Med)</option>
                        <option value="HARD" style={{ background: '#0f172a' }}>Advanced (Hard)</option>
                      </select>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <select
                        value={selectedMode}
                        onChange={(e) => setSelectedMode(e.target.value as any)}
                        style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="CODING" style={{ background: '#0f172a' }}>Coding Mode</option>
                        <option value="DEBUG" style={{ background: '#0f172a' }}>Debug Mode</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleStartPracticeSession(undefined, 'MIXED')}
                      disabled={isCreatingSession}
                      className="btn-primary-gradient"
                      style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
                    >
                      {isCreatingSession ? 'Starting...' : '⚡ Practice Full Track (Mixed)'}
                    </button>
                  </div>
                </div>

                {/* Topic Cards Grid */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 14 }}>
                    FOUNDATION TOPIC MODULES ({selectedTrack.toUpperCase()})
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
                    {(() => {
                      const currentLang = languages.find((l) => l.name.toLowerCase() === selectedTrack.toLowerCase());
                      const topics = currentLang?.topics || [];
                      if (topics.length === 0) {
                        return <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: 24 }}>Loading catalog topics...</div>;
                      }

                      return topics.map((t, idx) => (
                        <div
                          key={t.slug}
                          className="forge-card"
                          style={{
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                            border: selectedTopicSlug === t.slug ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.08)', padding: '2px 8px', borderRadius: 4 }}>
                                MODULE 0{idx + 1}
                              </span>
                              <span className="tag-badge tag-emerald" style={{ fontSize: 10 }}>
                                FOUNDATION
                              </span>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
                              {t.name}
                            </h3>

                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 20 }}>
                              {t.description}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                              Gemini Evaluated
                            </span>
                            <button
                              onClick={() => handleStartPracticeSession(t.slug, 'TOPIC')}
                              disabled={isCreatingSession}
                              className="btn-secondary-glass"
                              style={{
                                padding: '6px 16px',
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#ffffff',
                                background: 'rgba(99, 102, 241, 0.15)',
                                borderColor: 'rgba(99, 102, 241, 0.35)',
                              }}
                            >
                              Practice Topic →
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENGINEERING ANALYTICS & TELEMETRY (Stitch Obsidian Cybernetic Glass) */}
          {workspaceTab === 'history' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
              {/* Sub-Header Status & Context Control Strip */}
              <div
                style={{
                  background: 'rgba(6, 14, 32, 0.85)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                  padding: '16px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                        Engineering Analytics & Adaptive Telemetry
                      </h2>
                      <span className="tag-badge tag-indigo" style={{ fontSize: 10 }}>v4.2.0-rc3</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, margin: 0 }}>
                      Deep skill calibration, Bayesian knowledge tracing & algorithmic invariant telemetry
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Sessions Count Pill */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        color: '#c0c1ff',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span>💾 {sessionHistory.length} Sessions Logged</span>
                    </div>

                    {/* Gemini Live Rubric Sync Pill */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 14px',
                        borderRadius: 999,
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: 'var(--accent-emerald)',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        boxShadow: '0 0 16px rgba(16, 185, 129, 0.15)',
                      }}
                    >
                      <span className="pulsing-emerald-dot" style={{ width: 7, height: 7 }}></span>
                      <span>⚡ GEMINI 2.5 LIVE RUBRIC SYNCED</span>
                    </div>

                    <button
                      onClick={() => {
                        loadAnalytics(selectedTrack);
                        loadHistory();
                      }}
                      disabled={analyticsLoading}
                      className="btn-secondary-glass"
                      style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Refresh Analytics"
                    >
                      <span>↻</span> {analyticsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>

                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(analyticsData || {}, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `skillforge-telemetry-${selectedTrack.toLowerCase()}.json`;
                        a.click();
                        setNotification('Exported Telemetry JSON.');
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="btn-secondary-glass"
                      style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Download Telemetry JSON"
                    >
                      <span>📥</span> Export JSON
                    </button>
                  </div>
                </div>

                {/* Filter Controls Row: Language Switcher & Time Window */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
                  {/* Language Track Switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15, 23, 42, 0.8)', padding: 4, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {['Python', 'JavaScript', 'Java', 'C++', 'C'].map((lang) => {
                      const isSel = selectedTrack.toLowerCase() === lang.toLowerCase();
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setSelectedTrack(lang);
                            loadAnalytics(lang);
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            border: isSel ? '1px solid var(--accent-emerald)' : '1px solid transparent',
                            background: isSel ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            color: isSel ? 'var(--accent-emerald)' : 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            fontWeight: isSel ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSel && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>}
                          {lang}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Window Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(15, 23, 42, 0.8)', padding: 4, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {[
                      { id: '7d', label: 'Last 7 Days' },
                      { id: '30d', label: 'Last 30 Days' },
                      { id: 'all', label: 'All Time' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setAnalyticsTimeWindow(w.id as any)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: analyticsTimeWindow === w.id ? '1px solid var(--accent-indigo)' : '1px solid transparent',
                          background: analyticsTimeWindow === w.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          color: analyticsTimeWindow === w.id ? '#ffffff' : 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: analyticsTimeWindow === w.id ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core Analytics Canvas Container */}
              <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                
                {/* ========================================================================= */}
                {/* 1. PRECISION KPI TILES WITH CIRCULAR RADIAL SVG GAUGES                    */}
                {/* ========================================================================= */}
                {(() => {
                  const displayScore = analyticsData?.kpis?.global_rubric_score ?? 95.0;
                  const circleCircumference = 2 * Math.PI * 34; // r=34 -> ~213.6
                  const strokeOffset = circleCircumference - (circleCircumference * displayScore) / 100;

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                      {/* KPI 1: Global Rubric Score (Interactive Gauge) */}
                      <div
                        className="forge-card"
                        style={{
                          padding: '18px 20px',
                          position: 'relative',
                          overflow: 'hidden',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(78, 222, 163, 0.3)',
                          boxShadow: '0 0 20px -4px rgba(78, 222, 163, 0.12)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Global Rubric Score
                          </span>
                          <span style={{ color: 'var(--accent-emerald)', fontSize: 12 }}>✦</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <span style={{ fontSize: 34, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                                {displayScore}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 600 }}>
                              <span>▲</span> {analyticsData?.kpis?.trend_percentage ?? '+4.8%'} trend
                            </div>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 4 }}>
                              Confidence {analyticsData?.kpis?.confidence_rating ?? '98.6%'}
                            </div>
                          </div>

                          {/* Radial Circular SVG Progress Ring */}
                          <div style={{ position: 'relative', width: 78, height: 78, flexShrink: 0 }}>
                            <svg width="78" height="78" viewBox="0 0 78 78" style={{ transform: 'rotate(-90deg)' }}>
                              <circle
                                cx="39"
                                cy="39"
                                r="34"
                                fill="transparent"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth="6"
                              />
                              <circle
                                cx="39"
                                cy="39"
                                r="34"
                                fill="transparent"
                                stroke="var(--accent-emerald)"
                                strokeWidth="6"
                                strokeDasharray={circleCircumference}
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                              />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
                              {Math.round(displayScore)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* KPI 2: Scenarios Solved */}
                      <div
                        className="forge-card"
                        style={{
                          padding: '18px 20px',
                          position: 'relative',
                          overflow: 'hidden',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Scenarios Solved
                          </span>
                          <span style={{ color: 'var(--accent-indigo)' }}>⚡</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <span style={{ fontSize: 34, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                                {analyticsData?.kpis?.total_scenarios_solved ?? '42'}
                              </span>
                              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                                in {analyticsData?.kpis?.batches_count ?? '10'} sets
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                              <span style={{ color: 'var(--accent-emerald)' }}>28 Optimal</span>
                              <span style={{ color: 'var(--accent-cyan)' }}>12 Sound</span>
                              <span style={{ color: 'var(--text-dim)' }}>2 Review</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              Zero sandbox executions
                            </div>
                          </div>

                          {/* Multi-segment radial preview */}
                          <div style={{ position: 'relative', width: 78, height: 78, flexShrink: 0 }}>
                            <svg width="78" height="78" viewBox="0 0 78 78" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="39" cy="39" r="34" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="6" />
                              <circle cx="39" cy="39" r="34" fill="transparent" stroke="var(--accent-emerald)" strokeWidth="6" strokeDasharray={circleCircumference} strokeDashoffset={circleCircumference * 0.34} strokeLinecap="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                              66%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* KPI 3: Logic & Invariants Accuracy */}
                      <div
                        className="forge-card"
                        style={{
                          padding: '18px 20px',
                          position: 'relative',
                          overflow: 'hidden',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Logic & Invariants
                          </span>
                          <span style={{ color: 'var(--accent-cyan)' }}>✓</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <span style={{ fontSize: 34, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                                {analyticsData?.kpis?.logic_accuracy_percentage ?? '95.2'}%
                              </span>
                              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                                sound
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600, marginTop: 4 }}>
                              Defensive Preconditions Sound
                            </div>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 4 }}>
                              0 unhandled exceptions
                            </div>
                          </div>

                          <div style={{ position: 'relative', width: 78, height: 78, flexShrink: 0 }}>
                            <svg width="78" height="78" viewBox="0 0 78 78" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="39" cy="39" r="34" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="6" />
                              <circle cx="39" cy="39" r="34" fill="transparent" stroke="var(--accent-cyan)" strokeWidth="6" strokeDasharray={circleCircumference} strokeDashoffset={circleCircumference * 0.05} strokeLinecap="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                              95%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* KPI 4: Telemetry Streak & Velocity */}
                      <div
                        className="forge-card"
                        style={{
                          padding: '18px 20px',
                          position: 'relative',
                          overflow: 'hidden',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Telemetry Streak
                          </span>
                          <span style={{ color: '#fbbf24' }}>🔥</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <span style={{ fontSize: 34, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                                {analyticsData?.kpis?.streak_days ?? '7'}
                              </span>
                              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: '#fbbf24', fontWeight: 700 }}>
                                Days
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                              Peak Cadence: {analyticsData?.kpis?.peak_streak_days ?? '14'} Days
                            </div>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginTop: 4 }}>
                              48h Streak Freeze Guard
                            </div>
                          </div>

                          <div style={{ position: 'relative', width: 78, height: 78, flexShrink: 0 }}>
                            <svg width="78" height="78" viewBox="0 0 78 78" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="39" cy="39" r="34" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="6" />
                              <circle cx="39" cy="39" r="34" fill="transparent" stroke="#fbbf24" strokeWidth="6" strokeDasharray={circleCircumference} strokeDashoffset={circleCircumference * 0.4} strokeLinecap="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                              🔥
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ========================================================================= */}
                {/* 2. INTERACTIVE TELEMETRY TRAJECTORY AREA & LINE CHART                     */}
                {/* ========================================================================= */}
                <div
                  className="forge-card"
                  style={{
                    padding: '24px 28px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>📈</span>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                          Continuous Rubric Trajectory & Bayesian Convergence
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, margin: 0 }}>
                        Interactive chronological evaluation curve. Hover over data points to scrub proofs and metrics.
                      </p>
                    </div>

                    {/* View Mode Switcher Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(6, 14, 32, 0.8)', padding: 3, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      {[
                        { id: 'both', label: '✦ Combined Curve' },
                        { id: 'rubric', label: 'Raw Rubric Line' },
                        { id: 'bayesian', label: 'Bayesian Mastery Avg' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setTrajectoryMetricView(v.id as any)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            border: 'none',
                            background: trajectoryMetricView === v.id ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                            color: trajectoryMetricView === v.id ? '#ffffff' : 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: trajectoryMetricView === v.id ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Chart Canvas */}
                  {(() => {
                    const rawSeries = analyticsData?.trajectory_series || [
                      { step: 1, scenario: 'Tax Bracket Bounds Verifier', score: 84, bayesian_avg: 84.0, topic: 'Conditionals', date: 'Oct 18' },
                      { step: 2, scenario: 'Discount Rules & Tiers', score: 91, bayesian_avg: 87.5, topic: 'Conditionals', date: 'Oct 19' },
                      { step: 3, scenario: 'Inventory Stock Level Check', score: 86, bayesian_avg: 87.0, topic: 'Conditionals', date: 'Oct 20' },
                      { step: 4, scenario: 'Transaction Ledger Aggregator', score: 96, bayesian_avg: 89.3, topic: 'Iteration & Loops', date: 'Oct 21' },
                      { step: 5, scenario: 'Payroll Overtime Deductor', score: 89, bayesian_avg: 89.2, topic: 'Iteration & Loops', date: 'Oct 22' },
                      { step: 6, scenario: 'User Auth Session Tokenizer', score: 98, bayesian_avg: 90.7, topic: 'Data Structures', date: 'Oct 23' },
                      { step: 7, scenario: 'Byzantine Quorum Verifier', score: 97, bayesian_avg: 91.6, topic: 'Defensive Edge-Cases', date: 'Oct 24' },
                      { step: 8, scenario: 'Atomic Ring Buffer Bounds', score: 99, bayesian_avg: 92.5, topic: 'Defensive Edge-Cases', date: 'Oct 25' },
                    ];

                    const width = 860;
                    const height = 220;
                    const padLeft = 46;
                    const padRight = 30;
                    const padTop = 20;
                    const padBottom = 34;

                    const count = rawSeries.length;
                    const getX = (i: number) => padLeft + (i / Math.max(1, count - 1)) * (width - padLeft - padRight);
                    const minScore = 70;
                    const maxScore = 100;
                    const getY = (val: number) => padTop + (1 - (val - minScore) / (maxScore - minScore)) * (height - padTop - padBottom);

                    // Build path strings
                    let rubricPoints = rawSeries.map((d: any, i: number) => `${getX(i)},${getY(d.score)}`).join(' ');
                    let bayesianPoints = rawSeries.map((d: any, i: number) => `${getX(i)},${getY(d.bayesian_avg)}`).join(' ');

                    const activeHoverItem = hoveredTrajectoryIndex !== null ? rawSeries[hoveredTrajectoryIndex] : null;

                    return (
                      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          style={{ width: '100%', height: 'auto', minWidth: 640, display: 'block' }}
                          onMouseLeave={() => setHoveredTrajectoryIndex(null)}
                        >
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="bayesianGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.20" />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines */}
                          {[70, 80, 90, 100].map((level) => (
                            <g key={level}>
                              <line
                                x1={padLeft}
                                y1={getY(level)}
                                x2={width - padRight}
                                y2={getY(level)}
                                stroke="rgba(255, 255, 255, 0.06)"
                                strokeDasharray={level === 90 ? '4 4' : 'none'}
                              />
                              <text
                                x={padLeft - 10}
                                y={getY(level) + 4}
                                textAnchor="end"
                                fill="var(--text-dim)"
                                fontSize="10"
                                fontFamily="var(--font-mono)"
                              >
                                {level}%
                              </text>
                            </g>
                          ))}

                          {/* Target Benchmark Line (90% Exemplary) */}
                          <line
                            x1={padLeft}
                            y1={getY(90)}
                            x2={width - padRight}
                            y2={getY(90)}
                            stroke="#6366f1"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={width - padRight - 8}
                            y={getY(90) - 6}
                            textAnchor="end"
                            fill="#818cf8"
                            fontSize="9"
                            fontFamily="var(--font-mono)"
                            fontWeight="600"
                          >
                            90% EXEMPLARY STANDARD
                          </text>

                          {/* Underfill Area */}
                          {(trajectoryMetricView === 'both' || trajectoryMetricView === 'rubric') && (
                            <polygon
                              points={`${padLeft},${height - padBottom} ${rubricPoints} ${width - padRight},${height - padBottom}`}
                              fill="url(#areaGradient)"
                            />
                          )}

                          {/* Raw Rubric Line */}
                          {(trajectoryMetricView === 'both' || trajectoryMetricView === 'rubric') && (
                            <polyline
                              fill="none"
                              stroke="var(--accent-emerald)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={rubricPoints}
                            />
                          )}

                          {/* Bayesian Moving Average Line */}
                          {(trajectoryMetricView === 'both' || trajectoryMetricView === 'bayesian') && (
                            <polyline
                              fill="none"
                              stroke="var(--accent-cyan)"
                              strokeWidth="2.2"
                              strokeDasharray="5 3"
                              strokeLinecap="round"
                              points={bayesianPoints}
                            />
                          )}

                          {/* Interactive Hover Vertical Crosshair */}
                          {hoveredTrajectoryIndex !== null && (
                            <line
                              x1={getX(hoveredTrajectoryIndex)}
                              y1={padTop}
                              x2={getX(hoveredTrajectoryIndex)}
                              y2={height - padBottom}
                              stroke="rgba(255, 255, 255, 0.4)"
                              strokeWidth="1.2"
                              strokeDasharray="2 2"
                            />
                          )}

                          {/* Data Point Circles with invisible capture zones */}
                          {rawSeries.map((d: any, i: number) => {
                            const x = getX(i);
                            const y = getY(d.score);
                            const isHovered = hoveredTrajectoryIndex === i;

                            return (
                              <g
                                key={i}
                                onMouseEnter={() => setHoveredTrajectoryIndex(i)}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setSelectedEvidenceProof({
                                    scenario_name: d.scenario,
                                    score: `${d.score}/100`,
                                    track_topic: `Topic: ${d.topic}`,
                                    timestamp: d.date,
                                    summary: `Direct scenario review point from telemetry convergence curve. Bayesian average: ${d.bayesian_avg}%.`,
                                    proofs: ['#InvariantSound', '#VerifiedTelemetry'],
                                  });
                                }}
                              >
                                {/* Invisible wide hit-target */}
                                <rect
                                  x={x - 22}
                                  y={padTop}
                                  width={44}
                                  height={height - padTop - padBottom}
                                  fill="transparent"
                                />

                                {/* Outer glow ring on hover */}
                                {isHovered && (
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="10"
                                    fill="none"
                                    stroke="var(--accent-emerald)"
                                    strokeWidth="2"
                                    strokeOpacity="0.5"
                                  />
                                )}

                                {/* Inner point dot */}
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isHovered ? '6' : '4.5'}
                                  fill="#0b1326"
                                  stroke={d.score >= 90 ? 'var(--accent-emerald)' : d.score >= 80 ? 'var(--accent-cyan)' : '#fbbf24'}
                                  strokeWidth="2.5"
                                />

                                {/* Bottom X Date Labels */}
                                <text
                                  x={x}
                                  y={height - 12}
                                  textAnchor="middle"
                                  fill={isHovered ? '#ffffff' : 'var(--text-dim)'}
                                  fontSize="10"
                                  fontFamily="var(--font-mono)"
                                  fontWeight={isHovered ? 700 : 400}
                                >
                                  {d.date}
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        {/* Interactive Floating HUD Tooltip */}
                        {activeHoverItem && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${Math.min(75, Math.max(15, (getX(hoveredTrajectoryIndex!) / width) * 100))}%`,
                              top: 14,
                              transform: 'translateX(-50%)',
                              background: 'rgba(6, 14, 32, 0.95)',
                              border: '1px solid rgba(99, 102, 241, 0.5)',
                              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.25)',
                              borderRadius: 8,
                              padding: '10px 14px',
                              zIndex: 20,
                              pointerEvents: 'none',
                              minWidth: 220,
                              backdropFilter: 'blur(12px)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span className="tag-badge tag-indigo" style={{ fontSize: 9 }}>
                                {activeHoverItem.topic}
                              </span>
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                                {activeHoverItem.date}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                              {activeHoverItem.scenario}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 6 }}>
                              <span style={{ color: 'var(--accent-emerald)' }}>
                                Rubric Score: <strong>{activeHoverItem.score}%</strong>
                              </span>
                              <span style={{ color: 'var(--accent-cyan)' }}>
                                Bayesian Avg: <strong>{activeHoverItem.bayesian_avg}%</strong>
                              </span>
                            </div>
                            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textAlign: 'center', marginTop: 6 }}>
                              Click point to open proof audit
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 3, background: 'var(--accent-emerald)', borderRadius: 2 }}></span>
                        <span>Scenario Rubric Score</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 3, background: 'var(--accent-cyan)', borderTop: '1px dashed var(--accent-cyan)', borderRadius: 2 }}></span>
                        <span>Bayesian Moving Average</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 1, background: '#818cf8', borderTop: '1px dashed #818cf8' }}></span>
                        <span>90% Senior Benchmark</span>
                      </span>
                    </div>
                    <span>8 Scenarios Plotted</span>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. 2-COLUMN SPLIT: 5-AXIS RADAR CHART + 2-WAY BAYESIAN CALIBRATION LAB   */}
                {/* ========================================================================= */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: 24, alignItems: 'stretch' }}>
                  
                  {/* PANEL A: 5-AXIS MULTIDIMENSIONAL RADAR / SPIDER CHART */}
                  <div
                    className="forge-card"
                    style={{
                      padding: 24,
                      background: 'rgba(15, 23, 42, 0.85)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>🕸️</span>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                            Engineering Mastery Radar
                          </h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, margin: 0 }}>
                          Multi-dimensional rubric competencies vs industry production benchmarks
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowBenchmarkOverlay(!showBenchmarkOverlay)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: showBenchmarkOverlay ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: showBenchmarkOverlay ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          color: showBenchmarkOverlay ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {showBenchmarkOverlay ? '✓ Benchmark Standard' : '+ Show Benchmark'}
                      </button>
                    </div>

                    {/* SVG Spider Chart */}
                    {(() => {
                      const dimensions = analyticsData?.rubric_dimensions || [
                        { dimension: 'Logic & Invariants', score: 96, benchmark: 85, description: 'Correctness of control flow & state preservation' },
                        { dimension: 'Boundary & Edge Cases', score: 79, benchmark: 80, description: 'Zero, null, max-int, empty collections' },
                        { dimension: 'Asymptotics & Memory', score: 92, benchmark: 82, description: 'Time/Space scaling & allocation efficiency' },
                        { dimension: 'Defensive Guarding', score: 88, benchmark: 78, description: 'Input sanitization & contract preconditions' },
                        { dimension: 'Architecture & Style', score: 94, benchmark: 85, description: 'Naming, clean abstractions, non-mutating purity' }
                      ];

                      const cx = 170;
                      const cy = 135;
                      const maxR = 95;
                      const totalAxes = dimensions.length;

                      // Compute vertex positions
                      const getAxisCoord = (i: number, val: number) => {
                        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / totalAxes;
                        const r = (val / 100) * maxR;
                        return {
                          x: cx + r * Math.cos(angle),
                          y: cy + r * Math.sin(angle),
                        };
                      };

                      const studentPoints = dimensions.map((d: any, i: number) => {
                        const p = getAxisCoord(i, d.score);
                        return `${p.x},${p.y}`;
                      }).join(' ');

                      const benchmarkPoints = dimensions.map((d: any, i: number) => {
                        const p = getAxisCoord(i, d.benchmark);
                        return `${p.x},${p.y}`;
                      }).join(' ');

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <svg viewBox="0 0 340 270" style={{ width: '100%', maxWidth: 360, height: 'auto' }}>
                            <defs>
                              <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
                              </radialGradient>
                            </defs>

                            {/* Concentric Reference Rings (20%, 40%, 60%, 80%, 100%) */}
                            {[20, 40, 60, 80, 100].map((ringLevel) => {
                              const ringPoints = Array.from({ length: totalAxes }).map((_, i) => {
                                const p = getAxisCoord(i, ringLevel);
                                return `${p.x},${p.y}`;
                              }).join(' ');

                              return (
                                <polygon
                                  key={ringLevel}
                                  points={ringPoints}
                                  fill="none"
                                  stroke="rgba(255, 255, 255, 0.08)"
                                  strokeWidth="1"
                                />
                              );
                            })}

                            {/* Radial Spokes */}
                            {Array.from({ length: totalAxes }).map((_, i) => {
                              const outer = getAxisCoord(i, 100);
                              return (
                                <line
                                  key={i}
                                  x1={cx}
                                  y1={cy}
                                  x2={outer.x}
                                  y2={outer.y}
                                  stroke="rgba(255, 255, 255, 0.12)"
                                  strokeWidth="1"
                                />
                              );
                            })}

                            {/* Benchmark Standard Polygon */}
                            {showBenchmarkOverlay && (
                              <polygon
                                points={benchmarkPoints}
                                fill="rgba(56, 189, 248, 0.08)"
                                stroke="var(--accent-cyan)"
                                strokeWidth="1.6"
                                strokeDasharray="4 3"
                              />
                            )}

                            {/* Student Telemetry Polygon */}
                            <polygon
                              points={studentPoints}
                              fill="url(#radarFill)"
                              stroke="var(--accent-emerald)"
                              strokeWidth="2.2"
                              style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' }}
                            />

                            {/* Vertex Points & Interactive Labels */}
                            {dimensions.map((d: any, i: number) => {
                              const p = getAxisCoord(i, d.score);
                              const labelPos = getAxisCoord(i, 122);
                              const isSelected = selectedRadarDimension === d.dimension;

                              return (
                                <g
                                  key={i}
                                  onClick={() => {
                                    setSelectedRadarDimension(isSelected ? null : d.dimension);
                                    if (d.dimension.includes('Edge')) {
                                      setEvidenceFilter('Edge');
                                    } else if (d.dimension.includes('Logic')) {
                                      setEvidenceFilter('Invariant');
                                    } else {
                                      setEvidenceFilter('');
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {/* Vertex dot */}
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isSelected ? '6' : '4'}
                                    fill="#0b1326"
                                    stroke={isSelected ? '#c0c1ff' : 'var(--accent-emerald)'}
                                    strokeWidth="2"
                                  />

                                  {/* Label on outer ring */}
                                  <text
                                    x={labelPos.x}
                                    y={labelPos.y + 4}
                                    textAnchor="middle"
                                    fill={isSelected ? '#ffffff' : d.score < d.benchmark ? '#fbbf24' : 'var(--text-muted)'}
                                    fontSize="9.5"
                                    fontFamily="var(--font-mono)"
                                    fontWeight={isSelected ? 700 : 500}
                                  >
                                    {d.dimension.split(' ')[0]} {d.score}%
                                  </text>
                                </g>
                              );
                            })}
                          </svg>

                          {/* Quick Dimension Pill Legend */}
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                            {dimensions.map((dim: any, i: number) => {
                              const isSelected = selectedRadarDimension === dim.dimension;
                              const isDeficit = dim.score < dim.benchmark;
                              return (
                                <div
                                  key={i}
                                  onClick={() => setSelectedRadarDimension(isSelected ? null : dim.dimension)}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.04)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDeficit ? '#fbbf24' : 'var(--accent-emerald)' }}></span>
                                    <span style={{ fontSize: 12, color: isSelected ? '#ffffff' : '#cbd5e1', fontWeight: isSelected ? 700 : 500 }}>
                                      {dim.dimension}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                                    <span style={{ color: isDeficit ? '#fbbf24' : 'var(--accent-emerald)', fontWeight: 700 }}>
                                      {dim.score}%
                                    </span>
                                    <span style={{ color: 'var(--text-dim)' }}>
                                      / {dim.benchmark}% std
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* PANEL B: GITHUB-STYLE PRACTICE RHYTHM & CONTRIBUTION HEATMAP */}
                  <div
                    className="forge-card"
                    style={{
                      padding: 24,
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <div>
                      {/* Heatmap Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🟩</span>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                              Practice Rhythm & Contribution Heatmap
                            </h3>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, margin: 0 }}>
                            Daily submission density over the last 20 weeks. Hover over any box to inspect day telemetry.
                          </p>
                        </div>

                        {/* Cadence Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="tag-badge tag-emerald" style={{ fontSize: 10 }}>
                            🔥 {analyticsData?.heatmap_meta?.current_streak ?? 7} Day Streak
                          </span>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                            {analyticsData?.heatmap_meta?.total_submissions ?? 124} Submissions
                          </span>
                        </div>
                      </div>

                      {/* Heatmap Grid Rendering */}
                      {(() => {
                        const days = analyticsData?.activity_heatmap || [];
                        // Group days into columns of 7 days (Monday=0 to Sunday=6)
                        const weeks: any[][] = [];
                        for (let i = 0; i < days.length; i += 7) {
                          weeks.push(days.slice(i, i + 7));
                        }

                        // Color mapping based on submission intensity level (0 to 4)
                        const getLevelStyle = (level: number) => {
                          switch (level) {
                            case 1:
                              return { background: 'rgba(16, 185, 129, 0.30)', border: '1px solid rgba(16, 185, 129, 0.40)' };
                            case 2:
                              return { background: 'rgba(16, 185, 129, 0.55)', border: '1px solid rgba(16, 185, 129, 0.65)' };
                            case 3:
                              return { background: 'rgba(16, 185, 129, 0.85)', border: '1px solid #10b981' };
                            case 4:
                              return { background: '#10b981', border: '1px solid #34d399', boxShadow: '0 0 10px rgba(16, 185, 129, 0.7)' };
                            default:
                              return { background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.05)' };
                          }
                        };

                        return (
                          <div style={{ marginTop: 14, overflowX: 'auto', paddingBottom: 6 }}>
                            <div style={{ display: 'inline-flex', gap: 10 }}>
                              {/* Day of Week Labels (Mon, Wed, Fri, Sun) */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 18, fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textAlign: 'right', width: 24, flexShrink: 0 }}>
                                <div style={{ height: 13, lineHeight: '13px' }}>Mon</div>
                                <div style={{ height: 13, lineHeight: '13px' }}></div>
                                <div style={{ height: 13, lineHeight: '13px' }}>Wed</div>
                                <div style={{ height: 13, lineHeight: '13px' }}></div>
                                <div style={{ height: 13, lineHeight: '13px' }}>Fri</div>
                                <div style={{ height: 13, lineHeight: '13px' }}></div>
                                <div style={{ height: 13, lineHeight: '13px' }}>Sun</div>
                              </div>

                              {/* 20 Columns of Weeks */}
                              <div style={{ display: 'flex', gap: 3.5 }}>
                                {weeks.map((week, wIdx) => {
                                  // Show month label above first week of that month
                                  const firstDay = week[0];
                                  let monthLabel = '';
                                  if (firstDay && (wIdx === 0 || new Date(firstDay.date).getDate() <= 7)) {
                                    monthLabel = new Date(firstDay.date).toLocaleDateString('en-US', { month: 'short' });
                                  }

                                  return (
                                    <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      {/* Month header tick */}
                                      <div style={{ height: 15, fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                                        {monthLabel}
                                      </div>

                                      {/* 7 Days in Week */}
                                      {week.map((d: any, dIdx: number) => {
                                        const isHovered = hoveredHeatmapDay?.date === d.date;
                                        const isSelected = selectedHeatmapDate === d.date;
                                        const style = getLevelStyle(d.level);

                                        return (
                                          <div
                                            key={dIdx}
                                            onMouseEnter={() => setHoveredHeatmapDay(d)}
                                            onMouseLeave={() => {
                                              if (!selectedHeatmapDate) {
                                                setHoveredHeatmapDay(null);
                                              }
                                            }}
                                            onClick={() => {
                                              const newSelected = isSelected ? null : d.date;
                                              setSelectedHeatmapDate(newSelected);
                                              setHoveredHeatmapDay(d);
                                              if (d.count > 0 && d.topics && d.topics.length > 0) {
                                                setEvidenceFilter(d.topics[0]);
                                              }
                                            }}
                                            style={{
                                              width: 13,
                                              height: 13,
                                              borderRadius: 2.5,
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                              transform: isHovered || isSelected ? 'scale(1.35)' : 'scale(1)',
                                              zIndex: isHovered || isSelected ? 10 : 1,
                                              ...style,
                                              ...(isHovered ? { border: '1.5px solid #ffffff', boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)' } : {}),
                                              ...(isSelected ? { border: '1.5px solid #6366f1', boxShadow: '0 0 10px rgba(99, 102, 241, 0.9)' } : {}),
                                            }}
                                            title={`${d.count} submissions on ${d.display_date}`}
                                          />
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Interactive Tooltip HUD */}
                    <div style={{ marginTop: 14, minHeight: 48, padding: '10px 14px', borderRadius: 8, background: 'rgba(6, 14, 32, 0.8)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      {(() => {
                        const days = analyticsData?.activity_heatmap || [];
                        const activeDay = hoveredHeatmapDay || (selectedHeatmapDate ? days.find((d: any) => d.date === selectedHeatmapDate) : null);
                        if (activeDay) {
                          return (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                                  {activeDay.display_date}
                                </div>
                                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 2 }}>
                                  {activeDay.count > 0
                                    ? `${activeDay.count} Submissions • Topics: ${(activeDay.topics || []).join(', ') || 'Foundations'}`
                                    : 'No submissions recorded on this date.'}
                                </div>
                              </div>
                              {activeDay.count > 0 && (
                                <span className="tag-badge tag-emerald" style={{ fontSize: 10 }}>
                                  Avg Rubric: {activeDay.avg_score}%
                                </span>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                              ✦ Hover or click any box to inspect date, submission density, and topics practiced
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>
                              {analyticsData?.heatmap_meta?.active_days ?? 38} active practice days
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom Legend: Less to More */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Intensity:</span>
                        <span style={{ color: 'var(--text-dim)' }}>0 (None) → 7+ (Peak)</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 10 }}>Less</span>
                        <span style={{ width: 11, height: 11, borderRadius: 2, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.05)' }}></span>
                        <span style={{ width: 11, height: 11, borderRadius: 2, background: 'rgba(16, 185, 129, 0.30)', border: '1px solid rgba(16, 185, 129, 0.40)' }}></span>
                        <span style={{ width: 11, height: 11, borderRadius: 2, background: 'rgba(16, 185, 129, 0.55)', border: '1px solid rgba(16, 185, 129, 0.65)' }}></span>
                        <span style={{ width: 11, height: 11, borderRadius: 2, background: 'rgba(16, 185, 129, 0.85)', border: '1px solid #10b981' }}></span>
                        <span style={{ width: 11, height: 11, borderRadius: 2, background: '#10b981', border: '1px solid #34d399', boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)' }}></span>
                        <span style={{ fontSize: 10 }}>More</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. ADAPTIVE AI SKILL CALIBRATION MATRIX WITH DEEP-DIVE INSPECTION         */}
                {/* ========================================================================= */}
                <div className="forge-card" style={{ padding: 24, background: 'rgba(15, 23, 42, 0.85)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🧠</span>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                          Adaptive Skill Calibration Matrix & Topic Deep-Dive
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, margin: 0 }}>
                        Click any topic row to expand granular sub-skill benchmarks, edge guards, and launch focused remediation
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(6, 14, 32, 0.8)', padding: 3, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      {(['ALL', 'MASTERED', 'PROFICIENT', 'PRACTICING'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setMatrixFilter(f)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: 'none',
                            background: matrixFilter === f ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                            color: matrixFilter === f ? '#ffffff' : 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: matrixFilter === f ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {f === 'ALL' ? 'All Modules' : f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calibration Topic Rows with Accordion Expansion */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {(() => {
                      const matrix = analyticsData?.calibration_matrix || [];
                      const filtered = matrix.filter((item: any) => {
                        if (matrixFilter === 'ALL') return true;
                        return item.status === matrixFilter;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                            No modules match the selected filter.
                          </div>
                        );
                      }

                      return filtered.map((item: any) => {
                        const isExpanded = expandedTopicSlug === item.topic_slug;
                        const isPracticing = item.status === 'PRACTICING';
                        const badgeColor =
                          item.status === 'MASTERED'
                            ? 'tag-emerald'
                            : item.status === 'PROFICIENT'
                            ? 'tag-cyan'
                            : item.status === 'CALIBRATED'
                            ? 'tag-indigo'
                            : 'tag-amber';

                        const progressColor =
                          item.status === 'MASTERED'
                            ? 'var(--accent-emerald)'
                            : item.status === 'PROFICIENT'
                            ? 'var(--accent-cyan)'
                            : item.status === 'CALIBRATED'
                            ? 'var(--accent-indigo)'
                            : '#fbbf24';

                        return (
                          <div
                            key={item.topic_id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              background: isExpanded ? 'rgba(99, 102, 241, 0.04)' : isPracticing ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div
                              onClick={() => setExpandedTopicSlug(isExpanded ? null : item.topic_slug)}
                              style={{
                                padding: '14px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16,
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                                    {item.name}
                                  </span>
                                  <span className={`tag-badge ${badgeColor}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                                    {item.status}
                                  </span>
                                  {isPracticing && (
                                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 6px', borderRadius: 3 }}>
                                      PRIMARY VECTOR
                                    </span>
                                  )}
                                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                                    Conf: {item.confidence}%
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                  {(item.tags || []).map((t: string, i: number) => (
                                    <span key={i} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.04)', padding: '1px 6px', borderRadius: 4 }}>
                                      {t}
                                    </span>
                                  ))}
                                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                    • {item.solved_count} solved • Last: {item.last_practiced}
                                  </span>
                                </div>
                              </div>

                              <div style={{ width: 170, flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                                  <span style={{ color: 'var(--text-dim)' }}>CALIBRATION</span>
                                  <span style={{ color: progressColor, fontWeight: 700 }}>{item.score}%</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${item.score}%`, background: progressColor }}></div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>

                            {/* Accordion Deep-Dive Inspector */}
                            {isExpanded && (
                              <div
                                style={{
                                  padding: '16px 20px',
                                  margin: '0 10px 14px 10px',
                                  borderRadius: 8,
                                  background: 'rgba(6, 14, 32, 0.8)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 14,
                                }}
                              >
                                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                                  ✦ Granular Sub-Skill Telemetry for {item.name}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                  {(item.sub_skills || [
                                    { name: `${item.name} Invariants`, score: 95 },
                                    { name: 'Boundary Conditions', score: 78 },
                                    { name: 'Defensive Input Guarding', score: 91 },
                                  ]).map((sub: any, si: number) => (
                                    <div key={si} style={{ padding: 10, borderRadius: 6, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                                        <span style={{ color: '#ffffff' }}>{sub.name}</span>
                                        <span style={{ color: sub.score >= 85 ? 'var(--accent-emerald)' : '#fbbf24', fontWeight: 700 }}>
                                          {sub.score}%
                                        </span>
                                      </div>
                                      <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${sub.score}%`, background: sub.score >= 85 ? 'var(--accent-emerald)' : '#fbbf24' }}></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Target 5-question AI session focused on {item.name} edge-cases
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleStartPracticeSession(item.topic_slug, 'TOPIC')}
                                    className="btn-primary-gradient"
                                    style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
                                  >
                                    ⚡ Practice {item.name} →
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 5. LIVE RUBRIC EVIDENCE LOG WITH TIER FILTERS & SEARCH                    */}
                {/* ========================================================================= */}
                <div className="forge-card" style={{ padding: 24, background: 'rgba(15, 23, 42, 0.85)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>📜</span>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                          Live Rubric Evidence Log & Proof Audit
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, margin: 0 }}>
                        Verifiable audit trail of AI evaluation scores, invariant proofs, and asymptotic execution telemetry
                      </p>
                    </div>

                    {/* Tier Filters & Search Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 4, background: 'rgba(6, 14, 32, 0.8)', padding: 3, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        {(['ALL', 'OPTIMAL', 'SOUND', 'REVIEW'] as const).map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setEvidenceTierFilter(tier)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              border: 'none',
                              background: evidenceTierFilter === tier ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                              color: evidenceTierFilter === tier ? '#ffffff' : 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10.5,
                              fontWeight: evidenceTierFilter === tier ? 700 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Filter proofs..."
                        value={evidenceFilter}
                        onChange={(e) => setEvidenceFilter(e.target.value)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          background: 'rgba(6, 14, 32, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          outline: 'none',
                          width: 140,
                        }}
                      />
                    </div>
                  </div>

                  {/* Evidence Table */}
                  <div style={{ overflowX: 'auto', marginTop: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                          <th style={{ padding: '8px 10px' }}>SCENARIO & INVARIANT FOCUS</th>
                          <th style={{ padding: '8px 10px' }}>SCORE</th>
                          <th style={{ padding: '8px 10px' }}>ASYMPTOTICS</th>
                          <th style={{ padding: '8px 10px' }}>PROOFS</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const logs = analyticsData?.evidence_log || [];
                          const filtered = logs.filter((l: any) => {
                            // Text filter
                            if (evidenceFilter) {
                              const match =
                                l.scenario_name.toLowerCase().includes(evidenceFilter.toLowerCase()) ||
                                l.track_topic.toLowerCase().includes(evidenceFilter.toLowerCase());
                              if (!match) return false;
                            }
                            // Tier filter
                            if (evidenceTierFilter === 'ALL') return true;
                            const scoreNum = parseInt(l.score) || 0;
                            if (evidenceTierFilter === 'OPTIMAL') return scoreNum >= 95;
                            if (evidenceTierFilter === 'SOUND') return scoreNum >= 80 && scoreNum < 95;
                            if (evidenceTierFilter === 'REVIEW') return scoreNum < 80;
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
                                  No evidence proofs match the current criteria.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((row: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                                {row.timestamp}
                              </td>
                              <td style={{ padding: '12px 10px' }}>
                                <div style={{ color: '#ffffff', fontWeight: 600 }}>{row.scenario_name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{row.track_topic}</div>
                              </td>
                              <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                <span className={`tag-badge ${parseInt(row.score) >= 90 ? 'tag-emerald' : parseInt(row.score) >= 80 ? 'tag-cyan' : 'tag-amber'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                                  {row.score}
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: 11, whiteSpace: 'nowrap' }}>
                                {row.complexity}
                              </td>
                              <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {(row.proofs || []).map((p: string, pi: number) => (
                                    <span key={pi} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.08)', padding: '1px 6px', borderRadius: 4 }}>
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedEvidenceProof(row)}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: '#c0c1ff',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Inspect Proof
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 6. GEMINI 2.5 ADAPTIVE DIAGNOSTIC & REMEDIATION LAUNCHER                 */}
                {/* ========================================================================= */}
                <div
                  className="forge-card"
                  style={{
                    padding: 24,
                    background: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.15), rgba(15, 23, 42, 0.95) 70%)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    boxShadow: '0 0 30px -4px rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>⚡</span>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {analyticsData?.diagnostic_insight?.title || 'Gemini 2.5 Adaptive Remediation'}
                      </h3>
                    </div>
                    <span className="tag-badge tag-emerald" style={{ fontSize: 9 }}>CLOSED-LOOP AI FEEDBACK</span>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    {analyticsData?.diagnostic_insight?.analysis ||
                      'High proficiency in conditional branching and defensive validation. Primary growth vector: Boundary conditions on empty collection slicing and defensive invariant boundary guards.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="tag-badge tag-indigo" style={{ padding: '4px 10px', fontSize: 11 }}>
                        Target: {analyticsData?.diagnostic_insight?.target_topic_name || 'Defensive Edge-Cases'}
                      </span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        Estimated time: ~12 mins • 5 Custom Problems
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetTopic = analyticsData?.diagnostic_insight?.target_topic_slug || selectedTopicSlug;
                        handleStartPracticeSession(targetTopic, 'TOPIC');
                      }}
                      disabled={isCreatingSession}
                      className="btn-primary-gradient"
                      style={{
                        padding: '12px 24px',
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                        cursor: isCreatingSession ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isCreatingSession ? 'Generating 5 AI Challenges...' : (analyticsData?.diagnostic_insight?.remediation_cta || '⚡ Launch 5-Question Adaptive Remediation Session')}
                    </button>
                  </div>
                </div>

              </div>

              {/* SLIDE-OVER EVIDENCE REVIEW MODAL */}
              {selectedEvidenceProof && (
                <div className="modal-overlay" onClick={() => setSelectedEvidenceProof(null)}>
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: 640, padding: 28, background: 'rgba(10, 16, 36, 0.98)', border: '1px solid rgba(99, 102, 241, 0.4)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <span className="tag-badge tag-emerald" style={{ marginBottom: 6 }}>
                          RUBRIC SCORE: {selectedEvidenceProof.score}
                        </span>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                          {selectedEvidenceProof.scenario_name}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, margin: 0 }}>
                          {selectedEvidenceProof.track_topic} • Evaluated {selectedEvidenceProof.timestamp}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedEvidenceProof(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 18, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ padding: '14px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginBottom: 4 }}>
                        EVALUATION SUMMARY & INVARIANTS
                      </div>
                      <p style={{ color: '#ffffff', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                        {selectedEvidenceProof.summary}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                      {(selectedEvidenceProof.proofs || []).map((p: string, idx: number) => (
                        <span key={idx} className="tag-badge tag-cyan" style={{ fontSize: 11 }}>
                          {p}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setSelectedEvidenceProof(null)}
                      className="btn-secondary-glass"
                      style={{ width: '100%', padding: '10px', fontSize: 13 }}
                    >
                      Close Review Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ONBOARDING MODAL IF NEEDED */}
        {onboardingOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 560, padding: 36 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span className="tag-badge tag-indigo" style={{ marginBottom: 10 }}>QUICK SETUP</span>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>Welcome to SkillForge</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  Personalize your adaptive curve. Select your primary track and baseline level.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    PRIMARY TRACK
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {['Python', 'C++', 'Java', 'JavaScript', 'C'].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setOnboardingLang(l)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: onboardingLang === l ? 'var(--gradient-brand)' : 'rgba(18, 26, 56, 0.7)',
                          border: onboardingLang === l ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                          color: '#ffffff',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    STARTING SKILL LEVEL
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setOnboardingLevel(lvl)}
                        style={{
                          padding: '12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: onboardingLevel === lvl ? 'rgba(16, 185, 129, 0.25)' : 'rgba(18, 26, 56, 0.7)',
                          border: onboardingLevel === lvl ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                          color: onboardingLevel === lvl ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCompleteOnboarding}
                  className="btn-primary-gradient"
                  disabled={onboardingSaving}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {onboardingSaving ? 'Configuring...' : 'Enter Workspace Console →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: VISITOR LANDING PAGE (Only shown to Unauthenticated Visitors)
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Ambience */}
      <div className="ambient-bg-grid"></div>
      <div className="glow-orb-primary"></div>
      <div className="glow-orb-secondary"></div>

      {/* Navigation */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
          <a href="#tracks" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Practice Tracks
          </a>
          <a href="#interactive-demo" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            AI Review Rubric
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleDemoLogin} className="btn-secondary-glass" style={{ padding: '9px 16px', fontSize: 13, color: 'var(--accent-cyan)' }}>
            ⚡ 1-Click Demo Access
          </button>
          <button onClick={() => openAuth('signin')} className="btn-secondary-glass" style={{ padding: '9px 18px', fontSize: 13 }}>
            Sign In
          </button>
          <button onClick={() => openAuth('signup')} className="btn-primary-gradient" style={{ padding: '9px 20px', fontSize: 13 }}>
            Start Practicing Free →
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 10, padding: '70px 24px 50px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto 40px' }}>
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
              fontSize: 'clamp(34px, 5vw, 60px)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.035em',
              color: '#ffffff',
              marginBottom: 20,
            }}
          >
            Master Coding Through{' '}
            <span className="text-gradient-brand">Adaptive AI Reviews,</span>{' '}
            Not Compiler Frustration.
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: 700,
              margin: '0 auto 32px',
            }}
          >
            Practice Python, C++, Java, JavaScript, and C with intelligent problem synthesis, surgical Gemini code analysis, and evidence-based adaptive skill calibration.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={handleDemoLogin} className="btn-primary-gradient" style={{ fontSize: 15, padding: '15px 32px' }}>
              ⚡ 1-Click Instant Demo Login
            </button>
            <button onClick={() => openAuth('signup')} className="btn-secondary-glass" style={{ fontSize: 15, padding: '15px 28px' }}>
              Create Free Account →
            </button>
          </div>
        </div>

        {/* Hero Interactive Code & Review Showcase */}
        <div id="interactive-demo" className="forge-card forge-card-glow" style={{ padding: 0, overflow: 'hidden' }}>
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

            <div style={{ display: 'flex', gap: 6, background: 'rgba(18, 26, 56, 0.7)', padding: 3, borderRadius: 8 }}>
              {(['python', 'cpp', 'java', 'javascript'] as const).map((langKey) => (
                <button
                  key={langKey}
                  onClick={() => setHeroSnippetTab(langKey)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: heroSnippetTab === langKey ? 'var(--gradient-brand)' : 'transparent',
                    color: heroSnippetTab === langKey ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {langKey.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', background: 'var(--bg-terminal)' }}>
            <div style={{ padding: '28px', borderRight: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 12, color: 'var(--text-dim)' }}>
                <span>📄 {currentSnippet.filename}</span>
                <span style={{ color: 'var(--accent-cyan)' }}>{currentSnippet.lang}</span>
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

            <div style={{ padding: '28px', background: 'rgba(11, 17, 38, 0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span className="tag-badge tag-emerald">✦ GEMINI RUBRIC EVALUATION</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    Confidence 98.4%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
                    {currentSnippet.score}
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
                    ADAPTIVE PROGRESSION
                  </div>
                  <div style={{ fontSize: 13, color: '#f1f5f9' }}>
                    Linear complexity mastered. Calibrating next adaptive challenge toward Hard-tier space-constrained variants.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)' }}>
                <span>Estimated Score (Review Rubric)</span>
                <span style={{ color: 'var(--accent-cyan)' }}>Evidence Recorded to Topic Skill</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS SECTION */}
      <section id="tracks" style={{ position: 'relative', zIndex: 10, padding: '50px 24px 70px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span className="tag-badge tag-indigo" style={{ marginBottom: 12 }}>
            LANGUAGES & TOPIC TAXONOMY
          </span>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em' }}>
            5 Core Engineering Tracks
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Topic skills are language-isolated. C pointers and Python references are tracked independently.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          {[
            { name: 'Python', icon: '🐍', desc: 'Core syntax, dictionaries, OOP principles, exception handling & file I/O' },
            { name: 'C++', icon: '⚡', desc: 'Pass-by-reference, class invariants, RAII smart pointers & STL' },
            { name: 'Java', icon: '☕', desc: 'Encapsulation, interfaces, checked exceptions & collections' },
            { name: 'JavaScript', icon: '🌐', desc: 'Closures, prototype chain, async/promises & modern ES6+' },
            { name: 'C', icon: '⚙️', desc: 'Pointer arithmetic, address dereferencing, structs & memory safety' },
          ].map((track) => (
            <div key={track.name} className="forge-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{track.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>{track.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>{track.desc}</p>
              </div>
              <button onClick={() => openAuth('signup')} className="btn-secondary-glass" style={{ width: '100%', fontSize: 12 }}>
                Practice {track.name} →
              </button>
            </div>
          ))}
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
          <span>Django REST Framework</span>
        </div>
      </footer>

      {/* SIMPLE AUTH MODAL (Sign In / Register / 1-Click Demo) */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={closeAuth}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ height: 3, width: '100%', background: 'var(--gradient-brand)' }}></div>

            <div style={{ padding: '32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {authMode === 'signin' ? 'Sign In to SkillForge' : 'Create Free Developer Account'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    {authMode === 'signin' ? 'Access your workspace & adaptive progress.' : 'Get personalized AI code reviews today.'}
                  </p>
                </div>
                <button onClick={closeAuth} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 22, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>

              {/* Instant Demo Access Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid var(--border-active)',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  marginBottom: 18,
                  transition: 'all 0.2s',
                }}
              >
                <span>⚡</span> 1-Click Instant Demo Access (No Password Needed)
              </button>

              {/* Tab Switcher */}
              <div style={{ display: 'flex', background: 'rgba(8, 12, 28, 0.8)', padding: 4, borderRadius: 8, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setAuthError(null); }}
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
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
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
                  }}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', fontSize: 13, marginBottom: 16 }}>
                  {authError}
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
                    placeholder="developer@skillforge.io"
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

                <button type="submit" className="btn-primary-gradient" disabled={authLoading} style={{ marginTop: 10 }}>
                  {authLoading
                    ? 'Processing...'
                    : authMode === 'signin'
                    ? 'Sign In to Workspace →'
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
