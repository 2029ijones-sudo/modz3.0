'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getAICompletion } from '../lib/ai';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';

export default function CodeEditor({ onClose, addNotification }) {
  const [code, setCode] = useState(`// Advanced JavaScript Mod Editor
// Supports ES6+, Three.js, Cannon.js, GSAP, and custom packages

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { gsap } from 'gsap';

// Example: Create an interactive physics object
export function createObject() {
  // Geometry with advanced material
  const geometry = new THREE.IcosahedronGeometry(2, 3);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x6c5ce7,
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transmission: 0.9,
    thickness: 2,
    ior: 1.5,
    emissive: 0x00ffff,
    emissiveIntensity: 0.3
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(0, 10, 0);

  // Physics body
  const shape = new CANNON.Sphere(2);
  const body = new CANNON.Body({ mass: 1 });
  body.addShape(shape);
  body.position.copy(mesh.position);
  body.angularVelocity.set(0, 2, 0);
  body.angularDamping = 0.5;

  // Animation
  mesh.userData = {
    physicsBody: body,
    update: (time) => {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
      
      // Pulsing effect
      const scale = 1 + Math.sin(time * 0.001) * 0.1;
      mesh.scale.setScalar(scale);
      
      // Color shift
      const hue = (time * 0.01) % 360;
      material.emissive.setHSL(hue / 360, 1, 0.5);
    }
  };

  return mesh;
}

// Example: Particle system
export function createParticleSystem(count = 1000) {
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50;
    positions[i + 1] = (Math.random() - 0.5) * 50;
    positions[i + 2] = (Math.random() - 0.5) * 50;
    
    velocities[i] = (Math.random() - 0.5) * 0.5;
    velocities[i + 1] = (Math.random() - 0.5) * 0.5;
    velocities[i + 2] = (Math.random() - 0.5) * 0.5;
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.2,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const system = new THREE.Points(particles, material);
  
  system.userData = {
    velocities,
    update: (time) => {
      const positions = particles.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        // Bounce off boundaries
        if (Math.abs(positions[i]) > 25) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 25) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 25) velocities[i + 2] *= -1;
      }
      
      particles.attributes.position.needsUpdate = true;
    }
  };

  return system;
}`);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [autoCompleteVisible, setAutoCompleteVisible] = useState(false);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const autoCompleteRef = useRef(null);
  
  // Auto-completion data for Three.js, Cannon.js, etc.
  const autoCompleteData = [
    // Three.js
    { label: 'THREE', type: 'module', detail: 'Three.js 3D library' },
    { label: 'new THREE.Scene()', type: 'constructor', detail: 'Create a new scene' },
    { label: 'new THREE.Mesh()', type: 'constructor', detail: 'Create a new mesh' },
    { label: 'new THREE.BoxGeometry()', type: 'constructor', detail: 'Create box geometry' },
    { label: 'new THREE.SphereGeometry()', type: 'constructor', detail: 'Create sphere geometry' },
    { label: 'new THREE.MeshBasicMaterial()', type: 'constructor', detail: 'Basic material' },
    { label: 'new THREE.MeshPhongMaterial()', type: 'constructor', detail: 'Phong material' },
    { label: 'new THREE.MeshPhysicalMaterial()', type: 'constructor', detail: 'Physical material' },
    { label: 'new THREE.PointLight()', type: 'constructor', detail: 'Point light' },
    { label: 'new THREE.DirectionalLight()', type: 'constructor', detail: 'Directional light' },
    { label: 'new THREE.AmbientLight()', type: 'constructor', detail: 'Ambient light' },
    { label: 'new THREE.WebGLRenderer()', type: 'constructor', detail: 'WebGL renderer' },
    { label: 'new THREE.PerspectiveCamera()', type: 'constructor', detail: 'Perspective camera' },
    { label: 'new THREE.OrbitControls()', type: 'constructor', detail: 'Orbit controls' },
    { label: 'THREE.MathUtils.degToRad()', type: 'function', detail: 'Degrees to radians' },
    { label: 'THREE.MathUtils.radToDeg()', type: 'function', detail: 'Radians to degrees' },
    
    // Cannon.js
    { label: 'CANNON', type: 'module', detail: 'Cannon.js physics engine' },
    { label: 'new CANNON.World()', type: 'constructor', detail: 'Create physics world' },
    { label: 'new CANNON.Body()', type: 'constructor', detail: 'Create physics body' },
    { label: 'new CANNON.Box()', type: 'constructor', detail: 'Box shape' },
    { label: 'new CANNON.Sphere()', type: 'constructor', detail: 'Sphere shape' },
    { label: 'new CANNON.Plane()', type: 'constructor', detail: 'Plane shape' },
    { label: 'CANNON.Vec3', type: 'class', detail: '3D vector' },
    { label: 'CANNON.Quaternion', type: 'class', detail: 'Quaternion' },
    
    // GSAP
    { label: 'gsap', type: 'module', detail: 'GSAP animation library' },
    { label: 'gsap.to()', type: 'function', detail: 'Animate to' },
    { label: 'gsap.from()', type: 'function', detail: 'Animate from' },
    { label: 'gsap.fromTo()', type: 'function', detail: 'Animate from to' },
    { label: 'gsap.timeline()', type: 'function', detail: 'Create timeline' },
    
    // Custom functions
    { label: 'createObject()', type: 'function', detail: 'Create and return a 3D object' },
    { label: 'createParticleSystem()', type: 'function', detail: 'Create particle system' },
    { label: 'export function', type: 'keyword', detail: 'Export a function' },
    { label: 'import', type: 'keyword', detail: 'Import module' },
    { label: 'from', type: 'keyword', detail: 'Import from' },
    { label: 'const', type: 'keyword', detail: 'Constant declaration' },
    { label: 'let', type: 'keyword', detail: 'Variable declaration' },
    { label: 'function', type: 'keyword', detail: 'Function declaration' },
    { label: 'return', type: 'keyword', detail: 'Return value' },
    { label: 'if', type: 'keyword', detail: 'If statement' },
    { label: 'else', type: 'keyword', detail: 'Else statement' },
    { label: 'for', type: 'keyword', detail: 'For loop' },
    { label: 'while', type: 'keyword', detail: 'While loop' },
    { label: 'new', type: 'keyword', detail: 'New instance' },
    { label: 'this', type: 'keyword', detail: 'This context' },
  ];
  
  // Initialize editor
  useEffect(() => {
    updateLineNumbers();
    updateCursorPosition();
    highlightSyntax();
    
    // Set focus to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Update line numbers
  const updateLineNumbers = () => {
    if (!lineNumbersRef.current || !textareaRef.current) return;
    
    const lineCount = textareaRef.current.value.split('\n').length;
    const numbers = [];
    
    for (let i = 1; i <= lineCount; i++) {
      numbers.push(`<div class="line-number">${i}</div>`);
    }
    
    lineNumbersRef.current.innerHTML = numbers.join('');
  };
  
  // Update cursor position
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    
    const text = textareaRef.current.value;
    const cursorPos = textareaRef.current.selectionStart;
    
    // Calculate line and column
    const textBeforeCursor = text.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    setCursorPosition({ line, column });
  };
  
  // Highlight syntax using Prism
  const highlightSyntax = () => {
    if (!editorRef.current) return;
    
    // Create highlighted version of code
    const highlightedCode = Prism.highlight(
      code,
      Prism.languages.javascript,
      'javascript'
    );
    
    // Split into lines for line numbers
    const lines = highlightedCode.split('\n');
    const lineNumbersContainer = lineNumbersRef.current;
    
    if (lineNumbersContainer) {
      lineNumbersContainer.innerHTML = '';
      lines.forEach((_, index) => {
        const lineNumber = document.createElement('div');
        lineNumber.className = 'line-number';
        lineNumber.textContent = index + 1;
        lineNumbersContainer.appendChild(lineNumber);
      });
    }
    
    // Set highlighted code in the display div
    const codeDisplay = editorRef.current.querySelector('.code-display');
    if (codeDisplay) {
      codeDisplay.innerHTML = highlightedCode;
      
      // Preserve whitespace
      const linesElements = codeDisplay.querySelectorAll('.code-line');
      lines.forEach((lineContent, index) => {
        if (linesElements[index]) {
          linesElements[index].innerHTML = lineContent || '&nbsp;';
        }
      });
    }
  };
  
  // Handle text changes
  const handleTextChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    updateLineNumbers();
    updateCursorPosition();
    
    // Trigger auto-complete on specific patterns
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newCode.substring(0, cursorPos);
    const lastWord = textBeforeCursor.match(/\b(\w+)$/);
    
    if (lastWord && lastWord[1].length >= 2) {
      showAutoComplete(lastWord[1], cursorPos);
    } else {
      setAutoCompleteVisible(false);
    }
  };
  
  // Show auto-complete suggestions
  const showAutoComplete = (word, cursorPos) => {
    const filtered = autoCompleteData.filter(item =>
      item.label.toLowerCase().includes(word.toLowerCase())
    );
    
    if (filtered.length > 0) {
      setAutoCompleteOptions(filtered);
      setAutoCompleteVisible(true);
      setAutoCompleteIndex(0);
      
      // Position auto-complete box
      if (autoCompleteRef.current && textareaRef.current) {
        const textarea = textareaRef.current;
        const lines = textarea.value.substring(0, cursorPos).split('\n');
        const currentLine = lines.length;
        const colPos = lines[lines.length - 1].length;
        
        // Calculate approximate position (this is simplified)
        const lineHeight = 20;
        const charWidth = 8;
        const top = (currentLine - 1) * lineHeight;
        const left = colPos * charWidth;
        
        autoCompleteRef.current.style.top = `${top}px`;
        autoCompleteRef.current.style.left = `${left}px`;
      }
    } else {
      setAutoCompleteVisible(false);
    }
  };
  
  // Insert auto-complete suggestion
  const insertAutoComplete = (option) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    
    // Find the word to replace
    const textBeforeCursor = text.substring(0, cursorPos);
    const match = textBeforeCursor.match(/\b(\w+)$/);
    
    if (match) {
      const startPos = cursorPos - match[1].length;
      const newText = text.substring(0, startPos) + option.label + text.substring(cursorPos);
      
      setCode(newText);
      setAutoCompleteVisible(false);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = startPos + option.label.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        updateCursorPosition();
      }, 0);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      // Insert two spaces at cursor position
      const newText = text.substring(0, start) + '  ' + text.substring(end);
      setCode(newText);
      
      // Move cursor after inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateCursorPosition();
      }, 0);
    }
    
    // Auto-complete navigation
    if (autoCompleteVisible) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutoCompleteIndex(prev => 
          prev < autoCompleteOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutoCompleteIndex(prev => 
          prev > 0 ? prev - 1 : autoCompleteOptions.length - 1
        );
      } else if (e.key === 'Enter' && autoCompleteOptions.length > 0) {
        e.preventDefault();
        insertAutoComplete(autoCompleteOptions[autoCompleteIndex]);
      } else if (e.key === 'Escape') {
        setAutoCompleteVisible(false);
      }
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveMod();
    }
    
    // Ctrl/Cmd + F to format
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      formatCode();
    }
    
    // Ctrl/Cmd + Space for AI suggestion
    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      getAISuggestion();
    }
  };
  
  // Format code using Prettier-like formatting
  const formatCode = () => {
    try {
      // Enhanced formatting with proper indentation
      const lines = code.split('\n');
      let indentLevel = 0;
      const formattedLines = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Decrease indent for closing braces/brackets
        if (trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed === ');') {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add line with proper indentation
        const indent = '  '.repeat(indentLevel);
        formattedLines.push(indent + trimmed);
        
        // Increase indent for opening braces/brackets
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
          indentLevel++;
        }
      });
      
      const formatted = formattedLines.join('\n');
      setCode(formatted);
      addNotification('Code formatted', 'info');
      
      // Update syntax highlighting
      setTimeout(highlightSyntax, 0);
    } catch (error) {
      addNotification('Formatting failed', 'error');
    }
  };
  
  const runCode = async () => {
    setIsRunning(true);
    addConsoleMessage('Running mod...', 'info');
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const result = await response.json();
      
      if (result.success) {
        addConsoleMessage('✓ Mod executed successfully', 'success');
        addNotification('Mod added to world!', 'success');
      } else {
        addConsoleMessage(`✗ Error: ${result.error}`, 'error');
        addNotification('Execution failed', 'error');
      }
    } catch (error) {
      addConsoleMessage(`✗ Network error: ${error.message}`, 'error');
      addNotification('Failed to execute', 'error');
    } finally {
      setIsRunning(false);
    }
  };
  
  const getAISuggestion = async () => {
    addConsoleMessage('Getting AI suggestion...', 'info');
    
    try {
      const suggestion = await getAICompletion(code);
      setCode(prev => prev + '\n\n' + suggestion);
      addConsoleMessage('AI suggestion added!', 'success');
      addNotification('AI enhancement applied', 'info');
      
      // Update syntax highlighting
      setTimeout(highlightSyntax, 0);
    } catch (error) {
      addConsoleMessage(`AI error: ${error.message}`, 'error');
    }
  };
  
  const addConsoleMessage = (message, type = 'info') => {
    setConsoleOutput(prev => [...prev, { 
      id: Date.now(), 
      message, 
      type,
      timestamp: new Date().toISOString()
    }]);
  };
  
  const saveMod = async () => {
    try {
      const response = await fetch('/api/mods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `mod_${Date.now()}.js`,
          code,
          type: 'javascript',
          metadata: {
            lines: code.split('\n').length,
            size: new Blob([code]).size,
            created: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        addNotification('Mod saved to database!', 'success');
        addConsoleMessage('Mod saved successfully', 'success');
      }
    } catch (error) {
      addNotification('Failed to save mod', 'error');
    }
  };
  
  // Update syntax highlighting when code changes
  useEffect(() => {
    highlightSyntax();
  }, [code]);
  
  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3><i className="fas fa-code"></i> Advanced JavaScript Editor</h3>
        <div className="editor-meta">
          <span className="cursor-info">
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
        </div>
        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={formatCode}>
            <i className="fas fa-broom"></i> Format
          </button>
          <button className="btn btn-secondary" onClick={getAISuggestion}>
            <i className="fas fa-robot"></i> AI Enhance
          </button>
          <button className="btn btn-primary" onClick={runCode} disabled={isRunning}>
            <i className="fas fa-play"></i> {isRunning ? 'Running...' : 'Run'}
          </button>
          <button className="btn btn-success" onClick={saveMod}>
            <i className="fas fa-save"></i> Save
          </button>
          <button className="btn btn-danger" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        <div 
          className="code-editor-container"
          ref={editorRef}
          style={{
            position: 'relative',
            height: '70vh',
            overflow: 'auto',
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontSize: '14px',
            lineHeight: '1.5',
            background: '#1e1e1e',
            color: '#d4d4d4',
          }}
        >
          {/* Line numbers */}
          <div 
            ref={lineNumbersRef}
            className="line-numbers"
            style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '50px',
              background: '#1a1a1a',
              color: '#6e7681',
              textAlign: 'right',
              padding: '10px 5px',
              userSelect: 'none',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          />
          
          {/* Textarea for editing */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            spellCheck="false"
            style={{
              position: 'absolute',
              left: '60px',
              top: '0',
              width: 'calc(100% - 60px)',
              height: '100%',
              background: 'transparent',
              color: 'transparent',
              caretColor: '#569cd6',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: '10px',
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre',
              overflow: 'hidden',
              zIndex: '2',
            }}
          />
          
          {/* Highlighted code display */}
          <div
            className="code-display"
            style={{
              position: 'absolute',
              left: '60px',
              top: '0',
              width: 'calc(100% - 60px)',
              height: '100%',
              padding: '10px',
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre',
              pointerEvents: 'none',
              overflow: 'hidden',
              zIndex: '1',
            }}
          />
          
          {/* Auto-complete dropdown */}
          {autoCompleteVisible && autoCompleteOptions.length > 0 && (
            <div
              ref={autoCompleteRef}
              className="auto-complete-dropdown"
              style={{
                position: 'absolute',
                background: '#252526',
                border: '1px solid #454545',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: '1000',
                minWidth: '200px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              {autoCompleteOptions.map((option, index) => (
                <div
                  key={option.label}
                  onClick={() => insertAutoComplete(option)}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: index === autoCompleteIndex ? '#094771' : 'transparent',
                    borderBottom: '1px solid #333',
                  }}
                >
                  <span style={{ color: '#c586c0' }}>{option.label}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6e7681',
                    marginLeft: '10px'
                  }}>
                    {option.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="editor-console">
        <div className="console-header">
          <i className="fas fa-terminal"></i> Console Output
          <button 
            className="btn btn-sm" 
            onClick={() => setConsoleOutput([])}
          >
            Clear
          </button>
        </div>
        <div className="console-output">
          {consoleOutput.map((entry) => (
            <div key={entry.id} className={`console-line ${entry.type}`}>
              <span className="timestamp">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="message">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .editor-panel {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #1e1e1e;
        }
        
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          background: #252526;
          border-bottom: 1px solid #454545;
        }
        
        .editor-header h3 {
          margin: 0;
          color: #cccccc;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .editor-meta {
          color: #6e7681;
          font-size: 12px;
        }
        
        .editor-actions {
          display: flex;
          gap: 10px;
        }
        
        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          transition: background 0.2s;
        }
        
        .btn-primary {
          background: #007acc;
          color: white;
        }
        
        .btn-primary:hover {
          background: #0062a3;
        }
        
        .btn-secondary {
          background: #3a3d41;
          color: #cccccc;
        }
        
        .btn-secondary:hover {
          background: #45494e;
        }
        
        .btn-success {
          background: #388a34;
          color: white;
        }
        
        .btn-success:hover {
          background: #2d702a;
        }
        
        .btn-danger {
          background: #f14c4c;
          color: white;
        }
        
        .btn-danger:hover {
          background: #c93535;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-sm {
          padding: 3px 8px;
          font-size: 12px;
        }
        
        .editor-content {
          flex: 1;
          overflow: hidden;
        }
        
        .code-line {
          white-space: pre;
          min-height: 20px;
        }
        
        .editor-console {
          height: 200px;
          background: #1e1e1e;
          border-top: 1px solid #454545;
        }
        
        .console-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 15px;
          background: #252526;
          color: #cccccc;
          font-weight: bold;
        }
        
        .console-output {
          height: calc(100% - 40px);
          overflow-y: auto;
          padding: 10px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
        
        .console-line {
          padding: 3px 0;
          border-bottom: 1px solid #2d2d2d;
          display: flex;
          gap: 15px;
        }
        
        .console-line.success {
          color: #4ec9b0;
        }
        
        .console-line.error {
          color: #f14c4c;
        }
        
        .console-line.info {
          color: #9cdcfe;
        }
        
        .timestamp {
          color: #6e7681;
          min-width: 80px;
        }
        
        .message {
          flex: 1;
        }
        
        /* Prism.js overrides */
        :global(.token.comment) {
          color: #6a9955 !important;
        }
        
        :global(.token.keyword) {
          color: #c586c0 !important;
        }
        
        :global(.token.string) {
          color: #ce9178 !important;
        }
        
        :global(.token.number) {
          color: #b5cea8 !important;
        }
        
        :global(.token.function) {
          color: #dcdcaa !important;
        }
        
        :global(.token.class-name) {
          color: #4ec9b0 !important;
        }
        
        :global(.token.operator) {
          color: #d4d4d4 !important;
        }
        
        :global(.token.punctuation) {
          color: #d4d4d4 !important;
        }
      `}</style>
    </div>
  );
}
