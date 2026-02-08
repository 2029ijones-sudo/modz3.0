'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

  useEffect(() => {
    fetchUser();
    fetchContent();
  }, [activeTab]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await fetch(`/api/community?type=${activeTab}`).then(res => res.json());
    
    if (!error) {
      setContent(data.data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: newContent.type,
        user_id: user.id,
        ...newContent
      })
    });

    if (response.ok) {
      setNewContent({ type: 'comment', content: '', title: '', description: '', name: '' });
      fetchContent();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'forks':
        return content.map(fork => (
          <div key={fork.id} className="community-item">
            <div className="item-header">
              <img src={fork.profiles?.profile_picture_url || '/default-avatar.png'} alt={fork.profiles?.username} />
              <div>
                <h4>{fork.name}</h4>
                <p>by {fork.profiles?.username}</p>
              </div>
            </div>
            <p>{fork.description}</p>
            <div className="item-stats">
              <span>❤️ {fork.likes}</span>
              <span>⬇️ {fork.downloads}</span>
              <span>🏷️ {fork.tags?.join(', ')}</span>
            </div>
          </div>
        ));

      case 'comments':
        return content.map(comment => (
          <div key={comment.id} className="community-item">
            <div className="item-header">
              <img src={comment.profiles?.profile_picture_url || '/default-avatar.png'} alt={comment.profiles?.username} />
              <div>
                <h4>{comment.profiles?.username}</h4>
                <small>{new Date(comment.created_at).toLocaleDateString()}</small>
              </div>
            </div>
            <p>{comment.content}</p>
            <div className="item-actions">
              <button>Reply</button>
              <button>❤️ {comment.likes}</button>
            </div>
          </div>
        ));

      case 'issues':
        return content.map(issue => (
          <div key={issue.id} className="community-item">
            <div className="item-header">
              <img src={issue.profiles?.profile_picture_url || '/default-avatar.png'} alt={issue.profiles?.username} />
              <div>
                <h4>{issue.title}</h4>
                <span className={`status-badge ${issue.status}`}>{issue.status}</span>
              </div>
            </div>
            <p>{issue.description}</p>
            <div className="item-meta">
              <span>Priority: {issue.priority}</span>
              <span>Category: {issue.category}</span>
            </div>
          </div>
        ));
    }
  };

  return (
    <div className="community-container">
      <div className="community-header">
        <h2>Community Hub</h2>
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

            <button type="submit" disabled={!user}>
              {user ? 'Submit' : 'Login to contribute'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
