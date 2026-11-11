import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onNotification: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'devices'>('general');

  // General profile state
  const [displayName, setDisplayName] = useState(currentUser.profile?.display_name || '');
  const [username, setUsername] = useState(currentUser.profile?.username || '');
  const [bio, setBio] = useState(currentUser.profile?.bio || '');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(
    currentUser.profile?.initial_skill_level || 'BEGINNER'
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security / Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Multi-device sessions state
  const [sessionInfo, setSessionInfo] = useState<{
    other_active_devices_count: number;
    total_active_devices: number;
  } | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null);

  // Sync state whenever modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser.profile?.display_name || '');
      setUsername(currentUser.profile?.username || '');
      setBio(currentUser.profile?.bio || '');
      setSkillLevel(currentUser.profile?.initial_skill_level || 'BEGINNER');
      setProfileError(null);
      setPasswordError(null);
      setPasswordSuccess(null);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      loadSessionInfo();
    }
  }, [isOpen, currentUser]);

  const loadSessionInfo = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await api.auth.getMultiDeviceSessions();
      setSessionInfo({
        other_active_devices_count: data.other_active_devices_count,
        total_active_devices: data.total_active_devices,
      });
    } catch (err) {
      console.error('Failed to load session info:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const updatedProfile = await api.profile.update({
        display_name: displayName.trim(),
        username: username.trim() || undefined,
        bio: bio.trim(),
        initial_skill_level: skillLevel,
      });

      const updatedUser: User = {
        ...currentUser,
        profile: {
          ...currentUser.profile,
          ...updatedProfile,
        },
      };

      onUpdateUser(updatedUser);
      onNotification('✅ Profile details updated successfully!');
      onClose();
    } catch (err: any) {
      console.error('Profile update failed:', err);
      const msg = err.details?.username?.[0] || err.message || 'Failed to update profile.';
      setProfileError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await api.auth.changePassword(currentPassword, newPassword, newPasswordConfirm);
      setPasswordSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      onNotification('🔒 Password changed successfully!');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      console.error('Password change failed:', err);
      const msg =
        err.details?.current_password?.[0] ||
        err.details?.new_password?.[0] ||
        err.message ||
        'Password change failed.';
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutOtherDevices = async () => {
    if (!window.confirm('Are you sure you want to log out from all other devices? Your current device will stay logged in.')) {
      return;
    }

    setIsLoggingOutOthers(true);
    try {
      const res = await api.auth.logoutOtherDevices();
      setDeviceNotice(res.message);
      onNotification(`📱 ${res.message}`);
      loadSessionInfo();
      setTimeout(() => setDeviceNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to logout other devices:', err);
      setDeviceNotice('Failed to log out other devices. Please try again.');
    } finally {
      setIsLoggingOutOthers(false);
    }
  };

  if (!isOpen) return null;

  const initial = (displayName || currentUser.email || 'U')[0].toUpperCase();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              {initial}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                Account & Profile Settings
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                {currentUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#090d16',
            padding: '0 16px',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'general' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'general' ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>👤</span> Profile Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'security' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'security' ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🔒</span> Password & Security
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'devices' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'devices' ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>📱</span> Devices & Sessions
            {sessionInfo && sessionInfo.total_active_devices > 1 && (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {sessionInfo.total_active_devices}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {profileError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: 13,
                  }}
                >
                  ⚠️ {profileError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                  EMAIL ADDRESS
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      color: '#64748b',
                      fontSize: 13,
                      cursor: 'not-allowed',
                    }}
                  />
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ✓ Verified
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                    DISPLAY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                    USERNAME HANDLE
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: 10, color: '#64748b', fontSize: 13 }}>@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="alex_dev"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 28px',
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                  STARTING PROFICIENCY LEVEL
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                  }}
                >
                  <option value="BEGINNER">Beginner (Foundational Syntax & Types)</option>
                  <option value="INTERMEDIATE">Intermediate (Functions, Control Flow & Data Structures)</option>
                  <option value="ADVANCED">Advanced (Memory, Invariants & Asymptotics)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                  DEVELOPER BIO & INTERESTS
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief overview of your background, coding goals, or favorite languages..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94a3b8',
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  style={{
                    padding: '10px 22px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {passwordError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: 13,
                  }}
                >
                  ⚠️ {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: 13,
                  }}
                >
                  ✅ {passwordSuccess}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                  CURRENT PASSWORD *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                  NEW PASSWORD * (MIN 8 CHARACTERS)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong new password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94a3b8', marginBottom: 6 }}>
                  CONFIRM NEW PASSWORD *
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    padding: '10px 22px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DEVICES & SESSIONS */}
          {activeTab === 'devices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {deviceNotice && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: 13,
                  }}
                >
                  ✅ {deviceNotice}
                </div>
              )}

              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: '#090d16',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  ⚡
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                    Multi-Device Sync Enabled
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                    Your SkillForge account supports simultaneous logins across Laptop, Tablet, and Mobile phone with real-time progress synchronization.
                  </p>
                </div>
              </div>

              {/* Current Device Box */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: '#161e2e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>💻</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                        Current Active Device
                      </div>
                      <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                        ● Active now • Session valid for 30 days
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}
                  >
                    THIS DEVICE
                  </span>
                </div>
              </div>

              {/* Other Devices Status */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>
                    Other Active Sessions
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {isLoadingSessions ? (
                      'Checking other devices...'
                    ) : sessionInfo && sessionInfo.other_active_devices_count > 0 ? (
                      `Logged in on ${sessionInfo.other_active_devices_count} other browser(s) or device(s).`
                    ) : (
                      'No other devices currently logged into this account.'
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutOtherDevices}
                  disabled={isLoggingOutOthers || (sessionInfo?.other_active_devices_count === 0)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background:
                      sessionInfo?.other_active_devices_count === 0
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(239, 68, 68, 0.15)',
                    border:
                      sessionInfo?.other_active_devices_count === 0
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : '1px solid rgba(239, 68, 68, 0.3)',
                    color: sessionInfo?.other_active_devices_count === 0 ? '#64748b' : '#f87171',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor:
                      isLoggingOutOthers || sessionInfo?.other_active_devices_count === 0
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {isLoggingOutOthers ? 'Revoking Sessions...' : 'Log Out All Other Devices'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
