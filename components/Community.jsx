'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import './Community.css';
import './RepoViewer.css'; // We'll create this

export default function Community() {
  const [activeTab, setActiveTab] = useState('repositories');
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoContent, setRepoContent] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [newContent, setNewContent] = useState({
    type: 'repository',
    name: '',
    description: '',
    is_public: true,
    content: {
      files: [],
      structure: {}
    }
  });
  const [contentLoading, setContentLoading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('file');
  const [newFolderPath, setNewFolderPath] = useState('');
  const router = useRouter();

  // Auth logic (same as before)
  useEffect(() => {
    console.log('Community: Setting up auth...');
    
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
    
    fetchUserAndProfile();
    
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
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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

  const fetchProfile = async (userId) => {
    try {
      console.log('Community: Fetching profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
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

  // Fetch repositories
  useEffect(() => {
    if (!loading) {
      fetchRepositories();
    }
  }, [activeTab, loading]);

  const fetchRepositories = async () => {
    setContentLoading(true);
    
    try {
      let query = supabase
        .from('repositories')
        .select(`
          *,
          profiles:user_id (
            username,
            profile_picture_url
          ),
          forks:fork_count,
          stars:star_count,
          issues:issue_count
        `)
        .order('created_at', { ascending: false });

      // Add filters based on activeTab
      if (activeTab === 'my-repos' && user) {
        query = query.eq('user_id', user.id);
      } else if (activeTab === 'starred' && user) {
        // Get starred repos
        const { data: stars } = await supabase
          .from('repo_stars')
          .select('repo_id')
          .eq('user_id', user.id);
        
        if (stars && stars.length > 0) {
          query = query.in('id', stars.map(s => s.repo_id));
        } else {
          setRepositories([]);
          setContentLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setRepositories(data || []);
    } catch (error) {
      console.error('Community: Fetch error:', error);
      setRepositories([]);
    } finally {
      setContentLoading(false);
    }
  };

  // Create new repository
  const createRepository = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login first!');
      return;
    }

    try {
      const { data: repo, error } = await supabase
        .from('repositories')
        .insert([{
          name: newContent.name,
          description: newContent.description,
          user_id: user.id,
          is_public: newContent.is_public,
          content: newContent.content,
          language: detectLanguage(newContent.content.files),
          last_updated: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setNewContent({
        type: 'repository',
        name: '',
        description: '',
        is_public: true,
        content: {
          files: [],
          structure: {}
        }
      });
      
      fetchRepositories();
      alert('Repository created successfully!');
      
    } catch (error) {
      console.error('Community: Create repo error:', error);
      alert(`Failed to create repository: ${error.message}`);
    }
  };

  // Select repository and load its content
  const selectRepository = async (repo) => {
    setSelectedRepo(repo);
    setCurrentPath('');
    
    if (repo.content && repo.content.files) {
      setRepoContent(repo.content);
    } else {
      // Load repository content if not in initial fetch
      try {
        const { data, error } = await supabase
          .from('repositories')
          .select('content')
          .eq('id', repo.id)
          .single();
        
        if (error) throw error;
        
        setRepoContent(data.content);
      } catch (error) {
        console.error('Error loading repo content:', error);
      }
    }
  };

  // Navigate to path
  const navigateToPath = (path) => {
    setCurrentPath(path);
  };

  // Get current directory contents
  const getCurrentDirectoryContents = () => {
    if (!repoContent || !repoContent.structure) return [];
    
    const pathParts = currentPath.split('/').filter(p => p);
    let currentDir = repoContent.structure;
    
    // Navigate to current path
    for (const part of pathParts) {
      if (currentDir[part] && currentDir[part].type === 'directory') {
        currentDir = currentDir[part].contents;
      } else {
        return []; // Invalid path
      }
    }
    
    // Convert structure to array
    return Object.entries(currentDir).map(([name, item]) => ({
      name,
      ...item
    })).sort((a, b) => {
      // Directories first, then files
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  };

  // Open file for editing
  const openFileForEditing = (filePath) => {
    const file = repoContent.files.find(f => f.path === filePath);
    if (file) {
      setEditingFile(file);
      setFileContent(file.content);
    }
  };

  // Save edited file
  const saveFile = async () => {
    if (!editingFile || !selectedRepo) return;
    
    try {
      // Update in-memory content
      const updatedFiles = repoContent.files.map(f => 
        f.path === editingFile.path ? { ...f, content: fileContent } : f
      );
      
      const updatedContent = {
        ...repoContent,
        files: updatedFiles,
        last_updated: new Date().toISOString()
      };
      
      // Update database
      const { error } = await supabase
        .from('repositories')
        .update({
          content: updatedContent,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedRepo.id);
      
      if (error) throw error;
      
      setRepoContent(updatedContent);
      setEditingFile(null);
      alert('File saved successfully!');
      
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Failed to save file: ${error.message}`);
    }
  };

  // Create new file or folder
  const createNewItem = async () => {
    if (!selectedRepo || !newFileName) return;
    
    const fullPath = currentPath ? `${currentPath}/${newFileName}` : newFileName;
    
    try {
      let updatedContent;
      
      if (newFileType === 'file') {
        // Create new file
        const newFile = {
          path: fullPath,
          name: newFileName,
          content: '',
          language: detectLanguageFromExtension(newFileName),
          size: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        updatedContent = {
          ...repoContent,
          files: [...repoContent.files, newFile],
          structure: addToStructure(repoContent.structure, currentPath, newFileName, 'file')
        };
      } else {
        // Create new folder
        updatedContent = {
          ...repoContent,
          structure: addToStructure(repoContent.structure, currentPath, newFileName, 'directory')
        };
      }
      
      // Update database
      const { error } = await supabase
        .from('repositories')
        .update({
          content: updatedContent,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedRepo.id);
      
      if (error) throw error;
      
      setRepoContent(updatedContent);
      setNewFileName('');
      setIsCreatingFile(false);
      
      alert(`${newFileType === 'file' ? 'File' : 'Folder'} created successfully!`);
      
    } catch (error) {
      console.error('Error creating item:', error);
      alert(`Failed to create ${newFileType}: ${error.message}`);
    }
  };

  // Fork repository
  const forkRepository = async (repo) => {
    if (!user) {
      alert('Please login to fork repositories');
      return;
    }
    
    try {
      const { data: forkedRepo, error } = await supabase
        .from('repositories')
        .insert([{
          name: `${repo.name}-fork`,
          description: `Fork of ${repo.name}`,
          user_id: user.id,
          original_repo_id: repo.id,
          is_public: repo.is_public,
          content: repo.content,
          language: repo.language,
          fork_count: 0,
          star_count: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update original repo's fork count
      await supabase
        .from('repositories')
        .update({ fork_count: (repo.fork_count || 0) + 1 })
        .eq('id', repo.id);
      
      alert('Repository forked successfully!');
      fetchRepositories();
      
    } catch (error) {
      console.error('Error forking repo:', error);
      alert(`Failed to fork repository: ${error.message}`);
    }
  };

  // Star repository
  const starRepository = async (repo) => {
    if (!user) {
      alert('Please login to star repositories');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('repo_stars')
        .insert([{
          repo_id: repo.id,
          user_id: user.id
        }]);
      
      if (error) throw error;
      
      // Update star count
      await supabase
        .from('repositories')
        .update({ star_count: (repo.star_count || 0) + 1 })
        .eq('id', repo.id);
      
      alert('Repository starred!');
      fetchRepositories();
      
    } catch (error) {
      console.error('Error starring repo:', error);
      alert(`Failed to star repository: ${error.message}`);
    }
  };

  // Create issue
  const createIssue = async (repoId, title, description) => {
    if (!user) {
      alert('Please login to report issues');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('repo_issues')
        .insert([{
          repo_id: repoId,
          user_id: user.id,
          title,
          description,
          status: 'open'
        }]);
      
      if (error) throw error;
      
      alert('Issue reported successfully!');
      
    } catch (error) {
      console.error('Error creating issue:', error);
      alert(`Failed to report issue: ${error.message}`);
    }
  };

  // Helper functions
  const detectLanguage = (files) => {
    if (!files || files.length === 0) return 'Unknown';
    
    const extensions = files.map(f => {
      const parts = f.name.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    });
    
    const languageMap = {
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'go': 'Go',
      'rs': 'Rust',
      'rb': 'Ruby',
      'php': 'PHP',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'md': 'Markdown',
      'yml': 'YAML',
      'yaml': 'YAML',
      'xml': 'XML'
    };
    
    for (const ext of extensions) {
      if (languageMap[ext]) {
        return languageMap[ext];
      }
    }
    
    return 'Unknown';
  };

  const detectLanguageFromExtension = (filename) => {
    const parts = filename.split('.');
    const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    
    const languageMap = {
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'go': 'Go',
      'rs': 'Rust',
      'rb': 'Ruby',
      'php': 'PHP',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'md': 'Markdown',
      'yml': 'YAML',
      'yaml': 'YAML',
      'xml': 'XML'
    };
    
    return languageMap[ext] || 'Unknown';
  };

  const addToStructure = (structure, currentPath, name, type) => {
    const pathParts = currentPath.split('/').filter(p => p);
    let currentDir = structure;
    
    // Navigate to current directory
    for (const part of pathParts) {
      if (!currentDir[part]) {
        currentDir[part] = { type: 'directory', contents: {} };
      }
      currentDir = currentDir[part].contents;
    }
    
    // Add new item
    currentDir[name] = {
      type: type,
      ...(type === 'directory' ? { contents: {} } : {})
    };
    
    return structure;
  };

  // Render repository list
  const renderRepositoryList = () => {
    if (repositories.length === 0) {
      return <div className="no-content">No repositories found. Create the first one!</div>;
    }

    return repositories.map(repo => (
      <div key={repo.id} className="repository-item" onClick={() => selectRepository(repo)}>
        <div className="repo-header">
          <h4>{repo.name}</h4>
          <span className={`repo-visibility ${repo.is_public ? 'public' : 'private'}`}>
            {repo.is_public ? 'Public' : 'Private'}
          </span>
        </div>
        <p className="repo-description">{repo.description || 'No description'}</p>
        <div className="repo-meta">
          <span className="repo-language">{repo.language || 'Unknown'}</span>
          <div className="repo-stats">
            <span>⭐ {repo.star_count || 0}</span>
            <span>🍴 {repo.fork_count || 0}</span>
            <span>🐛 {repo.issue_count || 0}</span>
          </div>
        </div>
        <div className="repo-footer">
          <img 
            src={repo.profiles?.profile_picture_url || '/default-avatar.png'} 
            alt={repo.profiles?.username}
            className="repo-avatar"
            onError={(e) => { e.target.src = '/default-avatar.png'; }}
          />
          <span className="repo-owner">{repo.profiles?.username || 'Anonymous'}</span>
          <span className="repo-updated">Updated {new Date(repo.updated_at || repo.created_at).toLocaleDateString()}</span>
        </div>
        <div className="repo-actions">
          <button className="btn-star" onClick={(e) => { e.stopPropagation(); starRepository(repo); }}>
            ⭐ Star
          </button>
          <button className="btn-fork" onClick={(e) => { e.stopPropagation(); forkRepository(repo); }}>
            🍴 Fork
          </button>
          <button className="btn-issue" onClick={(e) => {
            e.stopPropagation();
            const title = prompt('Issue title:');
            if (title) {
              const description = prompt('Issue description:');
              if (description) {
                createIssue(repo.id, title, description);
              }
            }
          }}>
            🐛 Report Issue
          </button>
        </div>
      </div>
    ));
  };

  // Render file explorer
  const renderFileExplorer = () => {
    if (!selectedRepo || !repoContent) return null;
    
    const contents = getCurrentDirectoryContents();
    const pathParts = currentPath ? ['root', ...currentPath.split('/').filter(p => p)] : ['root'];
    
    return (
      <div className="file-explorer">
        <div className="explorer-header">
          <h4>{selectedRepo.name}</h4>
          <div className="path-breadcrumb">
            {pathParts.map((part, index) => (
              <button
                key={index}
                className="path-segment"
                onClick={() => {
                  const newPath = pathParts.slice(1, index + 1).join('/');
                  setCurrentPath(newPath);
                }}
              >
                {part}
                {index < pathParts.length - 1 && <span className="path-separator">/</span>}
              </button>
            ))}
          </div>
          <button className="btn-create" onClick={() => setIsCreatingFile(true)}>
            + Create new
          </button>
        </div>
        
        {isCreatingFile && (
          <div className="create-item-modal">
            <h5>Create New</h5>
            <select 
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value)}
              className="form-input"
            >
              <option value="file">File</option>
              <option value="directory">Folder</option>
            </select>
            <input
              type="text"
              placeholder={newFileType === 'file' ? 'filename.ext' : 'folder-name'}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="form-input"
            />
            <div className="modal-actions">
              <button onClick={createNewItem} className="btn-primary">
                Create
              </button>
              <button onClick={() => setIsCreatingFile(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="explorer-contents">
          {contents.length === 0 ? (
            <div className="empty-directory">
              This directory is empty. Create a new file or folder.
            </div>
          ) : (
            contents.map((item, index) => (
              <div
                key={index}
                className={`explorer-item ${item.type}`}
                onClick={() => {
                  if (item.type === 'directory') {
                    const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                    navigateToPath(newPath);
                  } else {
                    // Find the full file path
                    const filePath = currentPath ? `${currentPath}/${item.name}` : item.name;
                    openFileForEditing(filePath);
                  }
                }}
              >
                <span className="item-icon">
                  {item.type === 'directory' ? '📁' : getFileIcon(item.name)}
                </span>
                <span className="item-name">{item.name}</span>
                {item.type === 'file' && (
                  <span className="item-size">{item.size || '0'} bytes</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Render file editor
  const renderFileEditor = () => {
    if (!editingFile) return null;
    
    return (
      <div className="file-editor">
        <div className="editor-header">
          <h4>Editing: {editingFile.name}</h4>
          <div className="editor-actions">
            <button onClick={saveFile} className="btn-primary">
              💾 Save
            </button>
            <button onClick={() => setEditingFile(null)} className="btn-secondary">
              ✕ Close
            </button>
          </div>
        </div>
        <textarea
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          className="editor-textarea"
          spellCheck="false"
        />
        <div className="editor-footer">
          <span className="language-badge">
            Language: {editingFile.language || 'Unknown'}
          </span>
          <span className="file-size">
            Size: {fileContent.length} characters
          </span>
        </div>
      </div>
    );
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      'js': '📄',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '⚛️📘',
      'py': '🐍',
      'java': '☕',
      'cpp': '📚',
      'c': '📗',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'yml': '⚙️',
      'yaml': '⚙️',
      'xml': '📄',
      'txt': '📄'
    };
    return iconMap[ext] || '📄';
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
        <h2>Repository Hub</h2>
        <div className="user-status">
          {user ? (
            <div className="user-info">
              {profile ? (
                <>
                  <img 
                    src={profile.profile_picture_url || '/default-avatar.png'} 
                    alt={profile.username}
                    className="user-avatar"
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
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
              <button className="github-login-btn" onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}>
                <i className="fab fa-github"></i> Login with GitHub
              </button>
              <button className="google-login-btn" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
                <i className="fab fa-google"></i> Login with Google
              </button>
            </div>
          )}
        </div>
        <div className="tab-navigation">
          {['repositories', 'my-repos', 'starred', 'issues', 'pull-requests'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="community-content">
        {selectedRepo ? (
          <div className="repo-viewer">
            <div className="repo-sidebar">
              <button className="btn-back" onClick={() => setSelectedRepo(null)}>
                ← Back to Repositories
              </button>
              {renderFileExplorer()}
            </div>
            <div className="repo-main">
              {editingFile ? renderFileEditor() : (
                <div className="repo-info">
                  <h3>{selectedRepo.name}</h3>
                  <p className="repo-description">{selectedRepo.description}</p>
                  <div className="repo-details">
                    <div className="detail-item">
                      <strong>Owner:</strong> {selectedRepo.profiles?.username || 'Anonymous'}
                    </div>
                    <div className="detail-item">
                      <strong>Language:</strong> {selectedRepo.language || 'Unknown'}
                    </div>
                    <div className="detail-item">
                      <strong>Created:</strong> {new Date(selectedRepo.created_at).toLocaleDateString()}
                    </div>
                    <div className="detail-item">
                      <strong>Last Updated:</strong> {new Date(selectedRepo.updated_at || selectedRepo.created_at).toLocaleDateString()}
                    </div>
                    <div className="detail-item">
                      <strong>Visibility:</strong> 
                      <span className={`visibility-badge ${selectedRepo.is_public ? 'public' : 'private'}`}>
                        {selectedRepo.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  <div className="repo-actions-panel">
                    <button className="btn-action" onClick={() => forkRepository(selectedRepo)}>
                      🍴 Fork ({selectedRepo.fork_count || 0})
                    </button>
                    <button className="btn-action" onClick={() => starRepository(selectedRepo)}>
                      ⭐ Star ({selectedRepo.star_count || 0})
                    </button>
                    <button className="btn-action" onClick={() => {
                      const title = prompt('Issue title:');
                      if (title) {
                        const description = prompt('Issue description:');
                        if (description) {
                          createIssue(selectedRepo.id, title, description);
                        }
                      }
                    }}>
                      🐛 Report Issue
                    </button>
                    <button className="btn-action" onClick={() => {
                      // Clone repository functionality
                      alert('Clone URL: (coming soon)');
                    }}>
                      📋 Clone
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="content-grid">
              {contentLoading ? (
                <div className="loading">Loading repositories...</div>
              ) : (
                renderRepositoryList()
              )}
            </div>

            <div className="create-content">
              <h3>Create New Repository</h3>
              <form onSubmit={createRepository} className="content-form">
                <input
                  type="text"
                  placeholder="Repository Name"
                  value={newContent.name}
                  onChange={(e) => setNewContent({...newContent, name: e.target.value})}
                  required
                  className="form-input"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                  className="form-textarea"
                />
                <div className="form-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={newContent.is_public}
                      onChange={(e) => setNewContent({...newContent, is_public: e.target.checked})}
                    />
                    Make this repository public
                  </label>
                </div>
                <button 
                  type="submit" 
                  disabled={!user || contentLoading}
                  className={`submit-button ${!user ? 'disabled' : ''}`}
                >
                  {user ? 'Create Repository' : 'Login to create'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
