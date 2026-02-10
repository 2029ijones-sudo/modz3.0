'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';
import './globals.css';

// Dynamically import components for better performance
const ThreeWorld = dynamic(() => import('../components/ThreeWorld'), { ssr: false });
const CodeEditor = dynamic(() => import('../components/CodeEditor'), { ssr: false });
const ModManager = dynamic(() => import('../components/ModManager'), { ssr: false });
const Community = dynamic(() => import('../components/Community'), { ssr: false });
const Profile = dynamic(() => import('../components/Profile'), { ssr: false });
const PWAInstaller = dynamic(() => import('../components/PWAInstaller'), { ssr: false });

// Encryption key (in production, store in environment variables)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'modz3-secret-key-2024';

// Function to encrypt URL parameters
const encryptData = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    return encodeURIComponent(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Function to decrypt URL parameters
const decryptData = (encrypted) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(decodeURIComponent(encrypted), ENCRYPTION_KEY);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Main component wrapper that handles routing
function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('world');
  const [showEditor, setShowEditor] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [worldName, setWorldName] = useState('Untitled Metaverse');
  const [encryptedParams, setEncryptedParams] = useState({});
  const cursorRef = useRef(null);
  const cursorTracerRef = useRef(null);
  const [showPWAInstaller, setShowPWAInstaller] = useState(true);

  // Decrypt URL parameters on load
  useEffect(() => {
    const encrypted = searchParams.get('e');
    if (encrypted) {
      const decrypted = decryptData(encrypted);
      if (decrypted) {
        setEncryptedParams(decrypted);
        
        // Handle decrypted parameters
        if (decrypted.tab) {
          setActiveTab(decrypted.tab);
        }
        if (decrypted.world) {
          setWorldName(decrypted.world);
        }
        if (decrypted.showEditor) {
          setShowEditor(true);
        }
        
        // Add notification about encrypted session
        if (decrypted.source === 'shared') {
          addNotification(`Loaded encrypted session from ${decrypted.owner || 'community'}`, 'info');
        }
      }
    }
  }, [searchParams]);

  // Update URL when active tab changes (with encryption)
  useEffect(() => {
    const data = {
      tab: activeTab,
      world: worldName,
      timestamp: Date.now(),
      session: Math.random().toString(36).substring(7)
    };
    
    const encrypted = encryptData(data);
    if (encrypted) {
      // Use replaceState to update URL without refresh
      window.history.replaceState({}, '', `?e=${encrypted}`);
    }
  }, [activeTab, worldName]);

  // Particle effects
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const createParticles = () => {
      const particleCount = 50;
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.width = particle.style.height = Math.random() * 6 + 2 + 'px';
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
        particlesContainer.appendChild(particle);
      }
    };

    createParticles();
    
    setTimeout(() => {
      addNotification('Welcome to Modz3.0! Drag & drop files to upload mods.', 'info');
    }, 1000);
  }, []);

  // 3D Cursor Effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cursor = cursorRef.current;
    const cursorTracer = cursorTracerRef.current;
    let cursorTrail = [];
    const MAX_TRAIL = 10;

    const handleMouseMove = (e) => {
      if (cursor) {
        cursor.style.left = `${e.clientX - 16}px`;
        cursor.style.top = `${e.clientY - 16}px`;
      }

      if (cursorTracer) {
        const tracer = cursorTracer.cloneNode(true);
        tracer.style.left = `${e.clientX}px`;
        tracer.style.top = `${e.clientY}px`;
        tracer.style.opacity = '0.7';
        document.body.appendChild(tracer);

        cursorTrail.push(tracer);
        if (cursorTrail.length > MAX_TRAIL) {
          const oldTracer = cursorTrail.shift();
          if (oldTracer.parentNode) {
            oldTracer.style.opacity = '0';
            setTimeout(() => oldTracer.remove(), 300);
          }
        }

        cursorTrail.forEach((t, i) => {
          if (t.style.opacity > 0) {
            t.style.opacity = (0.7 * (i / cursorTrail.length)).toString();
            t.style.transform = `scale(${0.5 + (i / cursorTrail.length)})`;
          }
        });
      }
    };

    const interactiveElements = document.querySelectorAll('.nav-link, .btn, .mod-item, .upload-area, .avatar-3d');
    
    const handleMouseEnter = () => {
      if (cursor) {
        cursor.style.transform = 'scale(1.8)';
        cursor.style.filter = 'drop-shadow(0 0 30px var(--accent))';
      }
    };
    
    const handleMouseLeave = () => {
      if (cursor) {
        cursor.style.transform = 'scale(1)';
        cursor.style.filter = 'drop-shadow(0 0 15px var(--primary))';
      }
    };

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  // Add notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Navigation functions with encrypted URLs
  const navigateToTab = (tab) => {
    setActiveTab(tab);
    
    // Create encrypted shareable URL
    const data = {
      tab,
      world: worldName,
      timestamp: Date.now(),
      session: Math.random().toString(36).substring(7)
    };
    
    const encrypted = encryptData(data);
    if (encrypted) {
      const url = `${window.location.origin}${window.location.pathname}?e=${encrypted}`;
      console.log('Encrypted URL:', url); // For debugging
      // In production, you might want to copy this to clipboard or show it
    }
  };

  const navigateToProfile = () => {
    const data = {
      tab: 'profile',
      timestamp: Date.now(),
      session: Math.random().toString(36).substring(7),
      secure: true
    };
    
    const encrypted = encryptData(data);
    if (encrypted) {
      window.location.href = `/profile?e=${encrypted}`;
    }
  };

  const navigateToCommunity = () => {
    setActiveTab('community');
  };

  const generateShareLink = () => {
    const data = {
      tab: activeTab,
      world: worldName,
      timestamp: Date.now(),
      source: 'shared',
      owner: 'You',
      secure: true
    };
    
    const encrypted = encryptData(data);
    if (encrypted) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?e=${encrypted}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        addNotification('Encrypted share link copied to clipboard!', 'success');
      }).catch(() => {
        // Fallback: show in prompt
        prompt('Share this encrypted URL:', shareUrl);
      });
      
      return shareUrl;
    }
    return null;
  };

  // Handle world actions
  const handleNewWorld = () => {
    const name = prompt('Enter world name:', 'My Awesome World');
    if (name) {
      setWorldName(name);
      addNotification(`Created new world: ${name}`, 'success');
      
      // Update URL with new world name
      const data = {
        tab: activeTab,
        world: name,
        timestamp: Date.now(),
        action: 'world_created'
      };
      
      const encrypted = encryptData(data);
      if (encrypted) {
        window.history.replaceState({}, '', `?e=${encrypted}`);
      }
    }
  };

  const handleClearWorld = () => {
    if (confirm('Clear the entire world?')) {
      window.dispatchEvent(new CustomEvent('clear-world'));
      addNotification('World cleared', 'success');
    }
  };

  const handleImportWorld = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.modz3,.zip,.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        addNotification(`Importing ${file.name}...`, 'info');
        window.dispatchEvent(new CustomEvent('import-world', { detail: file }));
      }
    };
    input.click();
  };

  const handleExportWorld = () => {
    addNotification('Exporting world...', 'info');
    window.dispatchEvent(new CustomEvent('export-world'));
  };

  const handleShareWorld = () => {
    const shareLink = generateShareLink();
    if (shareLink) {
      // Show share dialog
      if (navigator.share) {
        navigator.share({
          title: `Check out my Modz3.0 world: ${worldName}`,
          text: `I created a 3D world in Modz3.0 called "${worldName}". Check it out!`,
          url: shareLink
        });
      }
    }
  };

  // Handle PWA installation
  const handlePWAInstall = () => {
    // This will be called from PWAInstaller component
    addNotification('PWA installation initiated', 'info');
  };

  // Dismiss PWA installer
  const dismissPWAInstaller = () => {
    setShowPWAInstaller(false);
    localStorage.setItem('pwa_installer_dismissed', 'true');
  };

  // Render active tab content
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'world':
        return <ThreeWorld addNotification={addNotification} worldName={worldName} />;
      case 'community':
        return <Community addNotification={addNotification} encryptedParams={encryptedParams} />;
      case 'profile':
        return <Profile addNotification={addNotification} />;
      default:
        return <ThreeWorld addNotification={addNotification} worldName={worldName} />;
    }
  };

  return (
    <div className="app-container" suppressHydrationWarning>
      {/* Custom 3D Cursor */}
      <div className="custom-cursor" id="customCursor" ref={cursorRef}>
        <div className="cursor-inner"></div>
        <div className="cursor-outer"></div>
      </div>
      <div className="cursor-tracer" id="cursorTracer" ref={cursorTracerRef}></div>

      {/* Visual Effects */}
      <div className="scan-line"></div>
      <div className="hologram-effect"></div>
      <div id="particles"></div>

      {/* Header */}
      <header>
        <div className="logo">
          <i className="fas fa-cube logo-icon"></i>
          <h1>Modz</h1>
        </div>
        
        <nav className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'world' ? 'active' : ''}`}
            onClick={() => navigateToTab('world')}
            id="navWorld"
          >
            <i className="fas fa-globe"></i>
            <span>3D World</span>
          </button>
          <button 
            className="nav-link"
            onClick={() => setShowEditor(true)}
            id="editorToggle"
          >
            <i className="fas fa-code"></i>
            <span>AI Editor</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => navigateToTab('community')}
            id="navCommunity"
          >
            <i className="fas fa-share-alt"></i>
            <span>Community</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => navigateToTab('profile')}
            id="navProfile"
          >
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </button>
        </nav>
        
        <div className="user-section">
          <div className="world-actions">
            <button className="btn btn-secondary" onClick={handleImportWorld} id="importWorld">
              <i className="fas fa-folder-open"></i>
              <span>Import</span>
            </button>
            <button className="btn btn-primary" onClick={handleExportWorld} id="exportWorld">
              <i className="fas fa-download"></i>
              <span>Export</span>
            </button>
            <button className="btn btn-accent" onClick={handleShareWorld} id="shareWorld">
              <i className="fas fa-share"></i>
              <span>Share</span>
            </button>
          </div>
          <div className="avatar-container">
            <div className="avatar-glow"></div>
            <div className="avatar-3d" title="Profile Settings" id="userAvatar" onClick={navigateToProfile}>
              <i className="fas fa-robot"></i>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar - Only show in world tab */}
        {activeTab === 'world' && (
          <div className="sidebar">
            <ModManager addNotification={addNotification} />
          </div>
        )}

        {/* Main Content Area */}
        <div className={`content-area ${activeTab !== 'world' ? 'full-width' : ''}`}>
          {activeTab === 'world' ? (
            <>
              <div className="world-wrapper">
                <div className="world-header">
                  <h2 className="world-title" id="worldTitle">
                    Metaverse: {worldName}
                    {encryptedParams.source === 'shared' && (
                      <span className="shared-badge" title="Shared via encrypted link">
                        <i className="fas fa-lock"></i> Shared
                      </span>
                    )}
                  </h2>
                  <div className="world-actions">
                    <button className="btn btn-secondary" id="toggleGrid" onClick={() => addNotification('Toggle Grid - Coming soon', 'info')}>
                      <i className="fas fa-th"></i>
                      <span>Grid</span>
                    </button>
                    <button className="btn btn-danger" id="clearWorld" onClick={handleClearWorld}>
                      <i className="fas fa-trash"></i>
                      <span>Clear</span>
                    </button>
                    <button className="btn btn-success" id="newWorld" onClick={handleNewWorld}>
                      <i className="fas fa-plus"></i>
                      <span>New World</span>
                    </button>
                  </div>
                </div>

                <div className="world-overlay"></div>
                {renderActiveTab()}
                <div className="drop-zone" id="dropZone"></div>
              </div>

              {/* Advanced Code Editor */}
              {showEditor && (
                <div className="editor-panel active">
                  <CodeEditor 
                    onClose={() => setShowEditor(false)}
                    addNotification={addNotification}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={`tab-content ${activeTab}-tab`}>
              <div className="tab-header">
                <h2>
                  {activeTab === 'community' && 'Community Hub'}
                  {activeTab === 'profile' && 'Your Profile'}
                </h2>
                {activeTab === 'community' && (
                  <button className="btn btn-accent" onClick={handleShareWorld}>
                    <i className="fas fa-share"></i> Share Your World
                  </button>
                )}
              </div>
              <div className="tab-inner">
                {renderActiveTab()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PWA Installer Component */}
      {showPWAInstaller && (
        <PWAInstaller 
          addNotification={addNotification}
          onInstall={handlePWAInstall}
          onDismiss={dismissPWAInstaller}
        />
      )}

      {/* Notifications Container */}
      <div className="notification-container" id="notificationContainer">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification show ${notification.type}`}>
            <div className="notification-header">
              <i className={`fas fa-${
                notification.type === 'success' ? 'check-circle' :
                notification.type === 'error' ? 'times-circle' :
                notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'
              } notification-icon`}></i>
              <div className="notification-title">
                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              </div>
            </div>
            <div className="notification-message">{notification.message}</div>
          </div>
        ))}
      </div>

      {/* Encrypted Session Indicator */}
      {encryptedParams.source === 'shared' && (
        <div className="encrypted-session-indicator">
          <i className="fas fa-lock"></i>
          <span>Encrypted Session Loaded</span>
          <button onClick={() => window.location.href = window.location.pathname}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* PWA Install Button (Mobile) */}
      {typeof window !== 'undefined' && 
       !window.matchMedia('(display-mode: standalone)').matches &&
       'serviceWorker' in navigator && (
        <div className="pwa-install-button">
          <button 
            className="btn btn-primary btn-pwa-install"
            onClick={() => setShowPWAInstaller(true)}
          >
            <i className="fas fa-download"></i>
            Install App
          </button>
        </div>
      )}
    </div>
  );
}

// Main export with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Modz3.0...</p>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
