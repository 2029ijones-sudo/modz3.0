'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Community.css';

export default function Community() {
  const [activeTab, setActiveTab] = useState('forks');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newContent, setNewContent] = useState({
    type: 'comment',
    content: '',
    title: '',
    description: '',
    name: ''
  });
  const [authChecked, setAuthChecked] = useState(false);

  // FIX 1: Listen for auth state changes
  useEffect(() => {
    // Setup auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Community auth event:', event);
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setAuthChecked(true);
      }
    );

    // Initial auth check
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true);
    };
    checkUser();

    return () => subscription.unsubscribe();
  }, []);

  // Fetch content when tab changes or when user logs in/out
  useEffect(() => {
    if (authChecked) {
      fetchContent();
    }
  }, [activeTab, authChecked]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/community?type=${activeTab}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.error) {
        console.error('API error:', data.error);
        setContent([]);
      } else {
        setContent(data.data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setContent([]);
    } finally {
      setLoading(false);
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
      console.error('Submit error:', error);
      alert('Failed to post. Please try again.');
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
                src={fork.profiles?.profile_picture_url || fork.profiles?.avatar_url || '/default-avatar.png'} 
                alt={fork.profiles?.username} 
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
                src={comment.profiles?.profile_picture_url || comment.profiles?.avatar_url || '/default-avatar.png'} 
                alt={comment.profiles?.username} 
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
                src={issue.profiles?.profile_picture_url || issue.profiles?.avatar_url || '/default-avatar.png'} 
                alt={issue.profiles?.username} 
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
    }
  };

  return (
    <div className="community-container">
      <div className="community-header">
        <h2>Community Hub</h2>
        <div className="user-status">
          {user ? (
            <span>Welcome, {user.email?.split('@')[0] || 'User'}!</span>
          ) : (
            <button onClick={() => window.location.href = '/auth'}>
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
          <div className="loading">Loading...</div>
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
          >
            <option value="comment">Comment</option>
            <option value="issue">Report Issue</option>
            <option value="fork">Fork World</option>
          </select>

          <form onSubmit={handleSubmit}>
            {newContent.type === 'fork' && (
              <>
                <input
                  type="text"
                  placeholder="Fork Name"
                  value={newContent.name}
                  onChange={(e) => setNewContent({...newContent, name: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
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
                />
                <textarea
                  placeholder="Issue Description"
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                  required
                />
              </>
            )}

            {newContent.type === 'comment' && (
              <textarea
                placeholder="Write a comment..."
                value={newContent.content}
                onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                required
              />
            )}

            <button 
              type="submit" 
              disabled={!user || loading}
              className={!user ? 'disabled' : ''}
            >
              {user ? 'Submit' : 'Login to contribute'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
