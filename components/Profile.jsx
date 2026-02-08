'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // ADD THIS
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    profile_picture_url: ''
  });

  useEffect(() => {
    // 1. Initial check
    fetchUserAndProfile();
    
    // 2. CRITICAL: Listen for auth state changes
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
    const response = await fetch(`/api/profile/check-username?username=${username}`);
    const data = await response.json();
    return data.available;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check username availability
    if (formData.username !== profile?.username) {
      const isAvailable = await checkUsername(formData.username);
      if (!isAvailable) {
        alert('Username is already taken');
        return;
      }
    }

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        ...formData
      })
    });

    const data = await response.json();
    
    if (data.profile) {
      setProfile(data.profile);
      setEditMode(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setFormData({ ...formData, profile_picture_url: publicUrl });
  };

  // ADD DEBUG FUNCTION
  const handleGitHubLogin = async () => {
    console.log('Starting GitHub login...');
    
    // ADD redirectTo option
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/profile`
      }
    });
    
    if (error) {
      console.error('GitHub login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  // ADD DEBUG INFO
  const debugAuth = () => {
    console.log('=== DEBUG INFO ===');
    console.log('User state:', user);
    console.log('Profile state:', profile);
    console.log('LocalStorage:', Object.keys(localStorage));
    
    // Check localStorage for auth tokens
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    console.log('Auth keys in localStorage:', authKeys);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading...</div>
        <button onClick={debugAuth} style={{ marginTop: '10px' }}>
          Debug Auth State
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="login-prompt">
          <h2>Please log in to view your profile</h2>
          <button onClick={handleGitHubLogin}>
            Login with GitHub
          </button>
          <button onClick={debugAuth} style={{ marginTop: '10px' }}>
            Debug Auth State
          </button>
          <button onClick={() => {
            // Force check auth
            fetchUserAndProfile();
          }} style={{ marginTop: '10px' }}>
            Check Auth Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>{editMode ? 'Create Profile' : 'Your Profile'}</h2>
        <div>
          <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
          <button onClick={debugAuth} style={{ marginLeft: '10px' }}>
            Debug
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
                />
              </div>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <label htmlFor="avatar-upload">Change Avatar</label>
            </div>

            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                maxLength={500}
                placeholder="Tell the community about yourself..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                Save Profile
              </button>
              <button type="button" className="cancel-btn" onClick={() => {
                setEditMode(false);
                if (profile) {
                  setFormData({
                    username: profile.username,
                    bio: profile.bio || '',
                    profile_picture_url: profile.profile_picture_url || ''
                  });
                }
              }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="avatar-display">
              <img 
                src={profile?.profile_picture_url || '/default-avatar.png'} 
                alt={profile?.username} 
              />
              <h3>{profile?.username || user.email?.split('@')[0] || 'User'}</h3>
              <p>{user.email}</p>
            </div>
            
            <div className="profile-details">
              {profile?.bio && (
                <div className="bio-section">
                  <h4>About</h4>
                  <p>{profile.bio}</p>
                </div>
              )}

              <div className="stats-section">
                <h4>Community Stats</h4>
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
