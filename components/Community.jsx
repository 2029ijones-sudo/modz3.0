'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './Community.css';

export default function Community() {
  const [activeTab, setActiveTab] = useState('forks');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // ADD THIS - same as profile.jsx
  const [newContent, setNewContent] = useState({
    type: 'comment',
    content: '',
    title: '',
    description: '',
    name: ''
  });
  
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  // FIX: Use SAME auth logic as profile.jsx
  useEffect(() => {
    // Check initial session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted.current) {
        setUser(user);
        if (user) {
          // Get profile SAME WAY as profile.jsx does
          await getProfile(user.id);
        }
      }
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Community auth event:', event);
        if (session?.user) {
          if (isMounted.current) {
            setUser(session.user);
            // Get profile when user logs in
            await getProfile(session.user.id);
          }
        } else {
          if (isMounted.current) {
            setUser(null);
            setProfile(null);
          }
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // SAME function as profile.jsx uses
  const getProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.log('No profile found for community user:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile for community:', error);
      setProfile(null);
    }
  };

  // Fetch community content
  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/community?type=${activeTab}`, { signal });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!isMounted.current) return;
      
      if (data.error) {
        console.error('API error:', data.error);
        setContent([]);
      } else {
        setContent(data.data || []);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted:', activeTab);
        return;
      }
      console.error('Fetch error:', error);
      if (isMounted.current) {
        setContent([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login first!');
      return;
    }

    // If user doesn't have profile, redirect to create one
    if (!profile) {
      if (confirm('You need to create a profile first. Go to profile page?')) {
        window.location.href = '/profile';
      }
      return;
    }

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);
      
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newContent.type,
          user_id: user.id,
          username: profile.username, // Use profile username
          ...newContent
        }),
        signal: abortController.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (response.ok) {
        setNewContent({ type: 'comment', content: '', title: '', description: '', name: '' });
        fetchContent();
        alert('Posted successfully!');
      } else {
        alert(`Error: ${result.error || 'Failed to post'}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        alert('Request timed out. Please try again.');
      } else {
        console.error('Submit error:', error);
        alert('Failed to post. Please try again.');
      }
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

  return (
    <div className="community-container">
      <div className="community-header">
        <h2>Community Hub</h2>
        <div className="user-status">
          {user ? (
            <div>
              {profile ? (
                <div className="user-info">
                  <img 
                    src={profile.profile_picture_url || '/default-avatar.png'} 
                    alt={profile.username}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <span>Welcome, {profile.username}!</span>
                </div>
              ) : (
                <div>
                  <span>Welcome! </span>
                  <button 
                    onClick={() => window.location.href = '/profile'}
                    className="create-profile-btn"
                  >
                    Create Profile
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => supabase.auth.signInWithOAuth({ 
                provider: 'github',
                options: {
                  redirectTo: `${window.location.origin}/profile`
                }
              })}
              className="login-button"
            >
              Login to participate
            </button>
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
        {loading ? (
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
              disabled={!user || !profile || loading}
              className={`submit-button ${!user || !profile ? 'disabled' : ''}`}
            >
              {!user ? 'Login to contribute' : 
               !profile ? 'Create Profile First' : 
               'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
