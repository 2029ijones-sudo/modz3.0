'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    profile_picture_url: ''
  });

  useEffect(() => {
    // Check URL for OAuth callback
    const handleOAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    };

    // 1. Handle OAuth callback if we're returning from auth
    handleOAuthCallback();
    
    // 2. Initial check
    fetchUserAndProfile();
    
    // 3. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserAndProfile = async () => {
    try {
      console.log('Fetching user...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      
      console.log('User found:', user);
      setUser(user);

      if (user) {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error in fetchUserAndProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No profile found
          console.log('No profile found, enabling edit mode');
          setEditMode(true);
          
          // Pre-fill username from email for new users
          const user = await supabase.auth.getUser();
          if (user.data?.user?.email) {
            const usernameFromEmail = user.data.user.email.split('@')[0];
            setFormData(prev => ({ ...prev, username: usernameFromEmail }));
          }
        } else {
          console.error('Error fetching profile:', error);
        }
        return;
      }

      console.log('Profile found:', profile);
      setProfile(profile);
      setFormData({
        username: profile.username,
        bio: profile.bio || '',
        profile_picture_url: profile.profile_picture_url || ''
      });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const checkUsername = async (username) => {
    try {
      const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        throw new Error('Failed to check username');
      }
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to save a profile');
      return;
    }
    
    // Check username availability
    if (formData.username !== profile?.username) {
      const isAvailable = await checkUsername(formData.username);
      if (!isAvailable) {
        alert('Username is already taken');
        return;
      }
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      
      if (data.profile) {
        setProfile(data.profile);
        setEditMode(false);
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user) {
      alert('You must be logged in to upload an avatar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file: ' + error.message);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, profile_picture_url: publicUrl });
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      alert('Error uploading file');
    }
  };

  const handleGitHubLogin = async () => {
    console.log('Starting GitHub login...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/profile`,
          scopes: 'read:user user:email'
        }
      });
      
      if (error) {
        console.error('GitHub login error:', error);
        alert('GitHub login failed: ' + error.message);
      }
    } catch (error) {
      console.error('Unexpected error during GitHub login:', error);
      alert('An unexpected error occurred');
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Starting Google login...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Google login error:', error);
        alert('Google login failed: ' + error.message);
      }
    } catch (error) {
      console.error('Unexpected error during Google login:', error);
      alert('An unexpected error occurred');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
      } else {
        setUser(null);
        setProfile(null);
        setEditMode(false);
        alert('Logged out successfully');
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      alert('An unexpected error occurred');
    }
  };

  const debugAuth = () => {
    console.log('=== DEBUG INFO ===');
    console.log('User state:', user);
    console.log('Profile state:', profile);
    console.log('Loading state:', loading);
    console.log('Edit mode:', editMode);
    
    // Check localStorage for auth tokens
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    console.log('Auth keys in localStorage:', authKeys);
    
    authKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        console.log(`${key}:`, value ? JSON.parse(value) : 'null');
      } catch (e) {
        console.log(`${key}: [Cannot parse]`);
      }
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
        <button className="debug-btn" onClick={debugAuth}>
          Debug Auth State
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="login-prompt">
          <h2>Welcome to Modz</h2>
          <p>Log in to create and manage your profile</p>
          
          <div className="login-buttons">
            <button className="github-login-btn" onClick={handleGitHubLogin}>
              <i className="fab fa-github"></i> Login with GitHub
            </button>
            
            <button className="google-login-btn" onClick={handleGoogleLogin}>
              <i className="fab fa-google"></i> Login with Google
            </button>
          </div>
          
          <div className="login-debug">
            <button className="debug-btn" onClick={debugAuth}>
              Debug Auth State
            </button>
            <button className="refresh-btn" onClick={fetchUserAndProfile}>
              Check Auth Again
            </button>
          </div>
          
          <div className="login-info">
            <p><small>Your profile allows you to:</small></p>
            <ul>
              <li>Customize your username and avatar</li>
              <li>Track your mods and contributions</li>
              <li>Join the Modz community</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>{editMode ? 'Create Profile' : 'Your Profile'}</h2>
        <div className="header-actions">
          {!editMode && (
            <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
              <i className="fas fa-edit"></i> Edit Profile
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
          <button className="debug-btn" onClick={debugAuth}>
            <i className="fas fa-bug"></i> Debug
          </button>
        </div>
      </div>

      <div className="profile-content">
        {editMode ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="avatar-upload">
              <div className="avatar-preview">
                <img 
                  src={formData.profile_picture_url || '/default-avatar.png'} 
                  alt="Profile Preview" 
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <div className="upload-controls">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-upload" className="upload-label">
                  <i className="fas fa-camera"></i> Change Avatar
                </label>
                <p className="upload-hint">Max 5MB • JPG, PNG, GIF</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                minLength={3}
                maxLength={30}
                placeholder="Choose a unique username"
              />
              <small>3-30 characters, letters, numbers, and underscores only</small>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                maxLength={500}
                placeholder="Tell the community about yourself, your projects, or your interests..."
              />
              <small>{500 - formData.bio.length} characters remaining</small>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                <i className="fas fa-save"></i> Save Profile
              </button>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setEditMode(false);
                  if (profile) {
                    setFormData({
                      username: profile.username,
                      bio: profile.bio || '',
                      profile_picture_url: profile.profile_picture_url || ''
                    });
                  }
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="avatar-display">
              <img 
                src={profile?.profile_picture_url || '/default-avatar.png'} 
                alt={profile?.username || 'User'} 
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <h3>{profile?.username || user.email?.split('@')[0] || 'User'}</h3>
              <p className="user-email">
                <i className="fas fa-envelope"></i> {user.email}
              </p>
              <p className="member-since">
                <i className="fas fa-calendar-alt"></i> Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="profile-details">
              {profile?.bio ? (
                <div className="bio-section">
                  <h4><i className="fas fa-user-circle"></i> About</h4>
                  <p>{profile.bio}</p>
                </div>
              ) : (
                <div className="bio-section empty">
                  <h4><i className="fas fa-user-circle"></i> About</h4>
                  <p className="empty-bio">No bio yet. Click "Edit Profile" to add one!</p>
                </div>
              )}

              <div className="stats-section">
                <h4><i className="fas fa-chart-bar"></i> Community Stats</h4>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Forks</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Comments</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Issues</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Mods</span>
                  </div>
                </div>
              </div>

              <div className="account-info">
                <h4><i className="fas fa-shield-alt"></i> Account Info</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Provider:</span>
                    <span className="info-value">
                      {user.app_metadata?.provider || 'email'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Login:</span>
                    <span className="info-value">
                      {new Date(user.last_sign_in_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">User ID:</span>
                    <span className="info-value user-id">{user.id.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
