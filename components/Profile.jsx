'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    profile_picture_url: ''
  });

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  const fetchUserAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfile(profile);
        setFormData({
          username: profile.username,
          bio: profile.bio || '',
          profile_picture_url: profile.profile_picture_url || ''
        });
      } else {
        setEditMode(true);
      }
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

  if (!user) {
    return (
      <div className="profile-container">
        <div className="login-prompt">
          <h2>Please log in to view your profile</h2>
          <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}>
            Login with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>{editMode ? 'Create Profile' : 'Your Profile'}</h2>
        {!editMode && (
          <button className="edit-btn" onClick={() => setEditMode(true)}>
            Edit Profile
          </button>
        )}
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
              {profile && (
                <button type="button" className="cancel-btn" onClick={() => {
                  setEditMode(false);
                  setFormData({
                    username: profile.username,
                    bio: profile.bio || '',
                    profile_picture_url: profile.profile_picture_url || ''
                  });
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="avatar-display">
              <img 
                src={profile?.profile_picture_url || '/default-avatar.png'} 
                alt={profile?.username} 
              />
              <h3>{profile?.username}</h3>
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
