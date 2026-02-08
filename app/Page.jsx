'use client';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import './globals.css';

// Dynamically import components for better performance (no SSR for Three.js)
const ThreeWorld = dynamic(() => import('../components/ThreeWorld'), { ssr: false });
const CodeEditor = dynamic(() => import('../components/CodeEditor'), { ssr: false });
const ModManager = dynamic(() => import('../components/ModManager'), { ssr: false });

export default function Home() {
  const [activeTab, setActiveTab] = useState('world');
  const [showEditor, setShowEditor] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [worldName, setWorldName] = useState('Untitled Metaverse');
  const cursorRef = useRef(null);
  const cursorTracerRef = useRef(null);

  // 3D Cursor Effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cursor = cursorRef.current;
    const cursorTracer = cursorTracerRef.current;
    let cursorTrail = [];
    const MAX_TRAIL = 10;

    const handleMouseMove = (e) => {
      // Main cursor
      if (cursor) {
        cursor.style.left = `${e.clientX - 16}px`;
        cursor.style.top = `${e.clientY - 16}px`;
      }

      // Trail effect
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

        // Animate trail
        cursorTrail.forEach((t, i) => {
          if (t.style.opacity > 0) {
            t.style.opacity = (0.7 * (i / cursorTrail.length)).toString();
            t.style.transform = `scale(${0.5 + (i / cursorTrail.length)})`;
          }
        });
      }
    };

    // Interactive cursor effects
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

  // Handle world actions
  const handleNewWorld = () => {
    const name = prompt('Enter world name:', 'My Awesome World');
    if (name) {
      setWorldName(name);
      addNotification(`Created new world: ${name}`, 'success');
    }
  };

  const handleClearWorld = () => {
    if (confirm('Clear the entire world?')) {
      // Dispatch custom event for ThreeWorld to handle
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
        // Dispatch event for ModManager to handle
        window.dispatchEvent(new CustomEvent('import-world', { detail: file }));
      }
    };
    input.click();
  };

  const handleExportWorld = () => {
    addNotification('Exporting world...', 'info');
    // Dispatch event for ModManager to handle
    window.dispatchEvent(new CustomEvent('export-world'));
  };

  return (
    <div className="app-container">
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

      {/* Header - Converted from HTML header */}
      <header>
        <div className="logo">
          <i className="fas fa-cube logo-icon"></i>
          <h1>Modz3.0</h1>
        </div>
        
        <nav className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'world' ? 'active' : ''}`}
            onClick={() => setActiveTab('world')}
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
            className="nav-link"
            onClick={() => addNotification('Community features coming soon!', 'info')}
            id="navCommunity"
          >
            <i className="fas fa-share-alt"></i>
            <span>Community</span>
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
          </div>
          <div className="avatar-container">
            <div className="avatar-glow"></div>
            <div className="avatar-3d" title="Metahuman Avatar" id="userAvatar" onClick={() => addNotification('User profile coming soon!', 'info')}>
              <i className="fas fa-robot"></i>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - Converted from HTML main-container */}
      <div className="main-container">
        {/* Sidebar */}
        <div className="sidebar">
          <ModManager addNotification={addNotification} />
        </div>

        {/* 3D World */}
        <div className="world-container">
          <div className="world-header">
            <h2 className="world-title" id="worldTitle">Metaverse: {worldName}</h2>
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
          
          {/* Three.js Canvas */}
          {activeTab === 'world' && <ThreeWorld addNotification={addNotification} />}
          
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
      </div>

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

      {/* Inline script for dynamic particles (converted from original) */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('DOMContentLoaded', () => {
            // Create particle effects
            function createParticles() {
              const particleCount = 50;
              const particlesContainer = document.getElementById('particles');
              for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + 'vw';
                particle.style.animationDelay = Math.random() * 20 + 's';
                particle.style.width = particle.style.height = Math.random() * 6 + 2 + 'px';
                particle.style.backgroundColor = 'hsl(' + Math.random() * 360 + ', 100%, 70%)';
                particlesContainer.appendChild(particle);
              }
            }
            
            createParticles();
            
            // Welcome message
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('add-notification', {
                  detail: {
                    message: 'Welcome to Modz3.0! Drag & drop files to upload mods.',
                    type: 'info'
                  }
                }));
              }
            }, 1000);
          });
        `
      }} />
    </div>
  );
}
