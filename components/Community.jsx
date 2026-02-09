'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Community.css';

export default function Community() {
  const [activeTab, setActiveTab] = useState('forks');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [newContent, setNewContent] = useState({
    type: 'comment',
    content: '',
    title: '',
    description: '',
    name: ''
  });
  const [contentLoading, setContentLoading] = useState(false);

  // EXACT SAME AUTH LOGIC AS PROFILE.JSX
  useEffect(() => {
    console.log('Community: Setting up auth...');
    
    // 1. Handle OAuth callback if we're returning from auth
    const handleOAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Community: Error getting session:', error);
      }
      
      if (session) {
        console.log('Community: Session found:', session.user.email);
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    };

    handleOAuthCallback();
    
    // 2. Initial check
    fetchUserAndProfile();
    
    // 3. Listen for auth state changes (EXACT SAME AS PROFILE.JSX)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Community: Auth state changed:', event, session?.user?.email);
        
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

  // EXACT SAME AS PROFILE.JSX
  const fetchUserAndProfile = async () => {
    try {
      console.log('Community: Fetching user...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Community: Error getting user:', error);
        return;
      }
      
      console.log('Community: User found:', user?.email);
      setUser(user);

      if (user) {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Community: Error in fetchUserAndProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  // SIMILAR TO PROFILE.JSX
  const fetchProfile = async (userId) => {
    try {
      console.log('Community: Fetching profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No profile found
          console.log('Community: No profile found');
          setProfile(null);
        } else {
          console.error('Community: Error fetching profile:', error);
        }
        return;
      }

      console.log('Community: Profile found:', profile.username);
      setProfile(profile);
    } catch (error) {
      console.error('Community: Error in fetchProfile:', error);
      setProfile(null);
    }
  };

  // Fetch community content
  useEffect(() => {
    if (!loading) { // Only fetch after auth check is done
      fetchContent();
    }
  }, [activeTab, loading]);

  const fetchContent = async () => {
    setContentLoading(true);
    
    try {
      const response = await fetch(`/api/community?type=${activeTab}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Community: API error:', data.error);
        setContent([]);
      } else {
        setContent(data.data || []);
      }
    } catch (error) {
      console.error('Community: Fetch error:', error);
      setContent([]);
    } finally {
      setContentLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login first!');
      return;
    }

    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newContent.type,
          user_id: user.id,
          ...newContent
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setNewContent({ type: 'comment', content: '', title: '', description: '', name: '' });
        fetchContent();
        alert('Posted successfully!');
      } else {
        alert(`Error: ${result.error || 'Failed to post'}`);
      }
    } catch (error) {
      console.error('Community: Submit error:', error);
      alert('Failed to post. Please try again.');
    }
  };

  // USE EXACT SAME LOGIN FUNCTION AS PROFILE.JSX
  const handleGitHubLogin = async () => {
    console.log('Community: Starting GitHub login...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/profile`,
          scopes: 'read:user user:email'
        }
      });
      
      if (error) {
        console.error('Community: GitHub login error:', error);
        alert('GitHub login failed: ' + error.message);
      }
    } catch (error) {
      console.error('Community: Unexpected error during GitHub login:', error);
      alert('An unexpected error occurred');
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Community: Starting Google login...');
    
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
        console.error('Community: Google login error:', error);
        alert('Google login failed: ' + error.message);
      }
    } catch (error) {
      console.error('Community: Unexpected error during Google login:', error);
      alert('An unexpected error occurred');
    }
  };

  const renderContent = () => {
    if (content.length === 0) {
      return <div className="no-content">No {activeTab} found. Be the first to post!</div>;
    }

    switch (activeTab) {
      case 'forks':
        return content.map(fork => (
          <div key={fork.id} className="community-item">
            <div className="item-header">
              <img 
                src={fork.profiles?.profile_picture_url || '/default-avatar.png'} 
                alt={fork.profiles?.username} 
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div>
                <h4>{fork.name}</h4>
                <p>by {fork.profiles?.username || 'Anonymous'}</p>
              </div>
            </div>
            <p>{fork.description || 'No description'}</p>
            <div className="item-stats">
              <span>❤️ {fork.likes || 0}</span>
              <span>⬇️ {fork.downloads || 0}</span>
              <span>🏷️ {fork.tags?.join(', ') || 'No tags'}</span>
            </div>
          </div>
        ));

      case 'comments':
        return content.map(comment => (
          <div key={comment.id} className="community-item">
            <div className="item-header">
              <img 
                src={comment.profiles?.profile_picture_url || '/default-avatar.png'} 
                alt={comment.profiles?.username}
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div>
                <h4>{comment.profiles?.username || 'Anonymous'}</h4>
                <small>{new Date(comment.created_at).toLocaleDateString()}</small>
              </div>
            </div>
            <p>{comment.content}</p>
            <div className="item-actions">
              <button>Reply</button>
              <button>❤️ {comment.likes || 0}</button>
            </div>
          </div>
        ));

      case 'issues':
        return content.map(issue => (
          <div key={issue.id} className="community-item">
            <div className="item-header">
              <img 
                src={issue.profiles?.profile_picture_url || '/default-avatar.png'} 
                alt={issue.profiles?.username}
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div>
                <h4>{issue.title}</h4>
                <span className={`status-badge ${issue.status}`}>{issue.status || 'open'}</span>
              </div>
            </div>
            <p>{issue.description}</p>
            <div className="item-meta">
              <span>Priority: {issue.priority || 'medium'}</span>
              <span>Category: {issue.category || 'other'}</span>
            </div>
          </div>
        ));
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="community-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-container">
      <div className="community-header">
        <h2>Community Hub</h2>
        <div className="user-status">
          {user ? (
            <div className="user-info">
              {profile ? (
                <>
                  <img 
                    src={profile.profile_picture_url || '/default-avatar.png'} 
                    alt={profile.username}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <span>Welcome, {profile.username || user.email?.split('@')[0] || 'User'}!</span>
                </>
              ) : (
                <>
                  <img 
                    src="/default-avatar.png" 
                    alt="User"
                    className="user-avatar"
                  />
                  <span>Welcome! <a href="/profile">Create Profile</a></span>
                </>
              )}
            </div>
          ) : (
            <div className="login-buttons">
              <button className="github-login-btn" onClick={handleGitHubLogin}>
                <i className="fab fa-github"></i> Login with GitHub
              </button>
              
              <button className="google-login-btn" onClick={handleGoogleLogin}>
                <i className="fab fa-google"></i> Login with Google
              </button>
            </div>
          )}
        </div>
        <div className="tab-navigation">
          {['forks', 'comments', 'issues'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="community-content">
        {contentLoading ? (
          <div className="loading">Loading community content...</div>
        ) : (
          <div className="content-grid">
            {renderContent()}
          </div>
        )}

        <div className="create-content">
          <h3>Add to Community</h3>
          <select 
            value={newContent.type}
            onChange={(e) => setNewContent({...newContent, type: e.target.value})}
            className="content-type-select"
          >
            <option value="comment">Comment</option>
            <option value="issue">Report Issue</option>
            <option value="fork">Fork World</option>
          </select>

          <form onSubmit={handleSubmit} className="content-form">
            {newContent.type === 'fork' && (
              <>
                <input
                  type="text"
                  placeholder="Fork Name"
                  value={newContent.name}
                  onChange={(e) => setNewContent({...newContent, name: e.target.value})}
                  required
                  className="form-input"
                />
                <textarea
                  placeholder="Description"
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                  className="form-textarea"
                />
              </>
            )}

            {newContent.type === 'issue' && (
              <>
                <input
                  type="text"
                  placeholder="Issue Title"
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  required
                  className="form-input"
                />
                <textarea
                  placeholder="Issue Description"
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                  required
                  className="form-textarea"
                />
              </>
            )}

            {newContent.type === 'comment' && (
              <textarea
                placeholder="Write a comment..."
                value={newContent.content}
                onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                required
                className="form-textarea"
              />
            )}

            <button 
              type="submit" 
              disabled={!user || contentLoading}
              className={`submit-button ${!user ? 'disabled' : ''}`}
            >
              {user ? 'Submit' : 'Login to contribute'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
