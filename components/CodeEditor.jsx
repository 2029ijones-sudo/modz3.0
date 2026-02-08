'use client';
import { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { jsLinter } from './jsLinter';
import { getAICompletion } from '../lib/ai';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';

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
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Register custom Three.js autocompletion
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        return {
          suggestions: [
            {
              label: 'THREE',
              kind: monaco.languages.CompletionItemKind.Module,
              documentation: 'Three.js 3D library',
              insertText: 'THREE',
              range: range
            },
            {
              label: 'CANNON',
              kind: monaco.languages.CompletionItemKind.Module,
              documentation: 'Cannon.js physics engine',
              insertText: 'CANNON',
              range: range
            },
            {
              label: 'gsap',
              kind: monaco.languages.CompletionItemKind.Module,
              documentation: 'GSAP animation library',
              insertText: 'gsap',
              range: range
            },
            {
              label: 'createObject',
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: 'Create and return a 3D object',
              insertText: 'createObject()',
              range: range
            }
          ]
        };
      }
    });
  };

  const runCode = async () => {
    setIsRunning(true);
    addConsoleMessage('Running mod...', 'info');
    
    try {
      // Send code to execution API
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

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      addNotification('Code formatted', 'info');
    }
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

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3><i className="fas fa-code"></i> Advanced JavaScript Editor</h3>
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
        <MonacoEditor
          height="70vh"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={setCode}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: true,
            snippets: { prefix: 'mod' },
            folding: true,
            lineNumbers: 'on',
            glyphMargin: true,
            automaticLayout: true,
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true
          }}
        />
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
    </div>
  );
}
