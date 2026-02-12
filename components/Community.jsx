'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CryptoJS from 'crypto-js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import * as acorn from 'acorn';
import * as acornLoose from 'acorn-loose';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Code, GitBranch, Star, GitFork, Bug, Eye, Download, Upload, 
  Share2, Lock, Globe, Plus, File, Folder, Edit2, Trash2, 
  Save, X, Search, Filter, ArrowLeft, ChevronRight, ChevronDown,
  ChevronUp, Play, Terminal, Settings, Users, Calendar, 
  MessageCircle, Bell, Zap, Shield, Cpu, Database, Cloud,
  Layers, Activity, GitMerge, GitPullRequest, GitCommit,
  BookOpen, AlertCircle, CheckCircle, Clock, Copy, ExternalLink,
  FileCode, FileText, FileJson, FileImage, Type, Box,
  Grid, List, RefreshCw, Server, Wifi, Power, ChevronLeft, Tag
} from 'lucide-react';

// Encryption key
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'quantum-mods-secret-key-2024';

const encryptData = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    return encodeURIComponent(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

const decryptData = (encrypted) => {
  if (!encrypted) return null;
  
  try {
    let decoded;
    try {
      decoded = decodeURIComponent(encrypted);
    } catch {
      decoded = encrypted;
    }
    
    const decrypted = CryptoJS.AES.decrypt(decoded, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) return null;
    
    return JSON.parse(decryptedString);
  } catch (error) {
    console.warn('Decryption failed (this is normal if no encrypted params):', error.message);
    return null;
  }
};

// ============= QUANTUM CODE EDITOR =============
const QuantumCodeEditor = ({ 
  file, 
  onSave, 
  onClose, 
  repository,
  user,
  addNotification,
  quantumEffects = {}
}) => {
  const [code, setCode] = useState(file?.content || '');
  const [language, setLanguage] = useState(file?.language || 'javascript');
  const [theme, setTheme] = useState('quantum-dark');
  const [fontSize, setFontSize] = useState(14);
  const [lintErrors, setLintErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [complexity, setComplexity] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [lines, setLines] = useState(0);
  const [ast, setAst] = useState(null);
  const [breakpoints, setBreakpoints] = useState([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debuggerState, setDebuggerState] = useState(null);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selections, setSelections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
 const editorRef = useRef(null);
const linesRef = useRef([]);
const containerRef = useRef(null);
const autoSaveTimer = useRef(null);
const channelRef = useRef(null);
const selectedRepoRef = useRef(selectedRepo);
  // Language detection
  useEffect(() => {
    if (file?.name) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const langMap = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript',
        'tsx': 'typescript', 'py': 'python', 'html': 'html',
        'css': 'css', 'json': 'json', 'md': 'markdown',
        'yml': 'yaml', 'yaml': 'yaml', 'xml': 'xml',
        'cpp': 'cpp', 'c': 'c', 'java': 'java',
        'rs': 'rust', 'go': 'go', 'rb': 'ruby',
        'php': 'php', 'sql': 'sql', 'sh': 'bash'
      };
      setLanguage(langMap[ext] || 'javascript');
    }
  }, [file]);

  // Code analysis
  useEffect(() => {
    if (code) {
      analyzeCode();
      updateMetrics();
    }
  }, [code, language]);

  const analyzeCode = useCallback(debounce(() => {
    setIsAnalyzing(true);
    try {
      const errors = [];
      const codeLines = code.split('\n');
      
      if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
        try {
          const ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
          setAst(ast);
          
          codeLines.forEach((line, i) => {
            if (line.length > 100) {
              errors.push({ line: i + 1, message: 'Line exceeds 100 characters', severity: 'warning' });
            }
            if (line.includes('console.log')) {
              errors.push({ line: i + 1, message: 'Console.log left in code', severity: 'info' });
            }
            if (line.includes('debugger')) {
              errors.push({ line: i + 1, message: 'Debugger statement found', severity: 'warning' });
            }
          });
        } catch (e) {
          const match = e.message.match(/line (\d+)/);
          if (match) {
            errors.push({ line: parseInt(match[1]), message: e.message, severity: 'error' });
          }
        }
      }

      let complexityScore = 0;
      const tokenCount = code.split(/\s+/).length;
      
      const ifCount = (code.match(/if\s*\(/g) || []).length;
      const forCount = (code.match(/for\s*\(/g) || []).length;
      const whileCount = (code.match(/while\s*\(/g) || []).length;
      const switchCount = (code.match(/switch\s*\(/g) || []).length;
      
      complexityScore = (ifCount + forCount + whileCount + switchCount) * 2;
      
      setComplexity(complexityScore);
      setTokens(tokenCount);
      setLines(codeLines.length);
      setLintErrors(errors);
      
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, 500), [code, language]);

  const updateMetrics = useCallback(() => {
    // Update code metrics
  }, []);

  // Auto-save
  useEffect(() => {
    if (autoSave && isDirty) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [code, autoSave, isDirty]);

  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave({ ...file, content: code, language, updated_at: new Date().toISOString() });
      setIsDirty(false);
      setLastSaved(new Date());
      if (addNotification) addNotification('File saved successfully', 'success');
    }
  }, [onSave, file, code, language, addNotification]);

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    setIsDirty(true);
    
    setHistory(prev => [...prev.slice(-50), { code: e.target.value, timestamp: Date.now() }]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCode(history[historyIndex - 1].code);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCode(history[historyIndex + 1].code);
    }
  };

  const handleFormat = () => {
    try {
      let formatted = code;
      if (['javascript', 'typescript', 'json'].includes(language)) {
        const obj = JSON.parse(code);
        formatted = JSON.stringify(obj, null, 2);
      }
      setCode(formatted);
      if (addNotification) addNotification('Code formatted', 'success');
    } catch (error) {
      if (addNotification) addNotification('Failed to format code', 'error');
    }
  };

  const executeCode = () => {
    setIsExecuting(true);
    setConsoleOutput([]);
    
    try {
      const sandbox = {
        console: {
          log: (...args) => setConsoleOutput(prev => [...prev, { type: 'log', args }]),
          error: (...args) => setConsoleOutput(prev => [...prev, { type: 'error', args }]),
          warn: (...args) => setConsoleOutput(prev => [...prev, { type: 'warn', args }]),
          info: (...args) => setConsoleOutput(prev => [...prev, { type: 'info', args }])
        },
        setTimeout,
        clearTimeout,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean
      };
      
      const fn = new Function(...Object.keys(sandbox), code);
      const result = fn(...Object.values(sandbox));
      
      if (result !== undefined) {
        setConsoleOutput(prev => [...prev, { type: 'result', args: [result] }]);
      }
    } catch (error) {
      setConsoleOutput(prev => [...prev, { type: 'error', args: [error.message] }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const renderLine = (line, index) => {
    const lineErrors = lintErrors.filter(e => e.line === index + 1);
    const hasBreakpoint = breakpoints.includes(index + 1);
    
    return (
      <div 
        key={index} 
        className={`editor-line ${lineErrors.length > 0 ? 'has-error' : ''} ${hasBreakpoint ? 'has-breakpoint' : ''}`}
        data-line={index + 1}
      >
        {showLineNumbers && (
          <div 
            className="line-number"
            onClick={() => {
              if (hasBreakpoint) {
                setBreakpoints(prev => prev.filter(b => b !== index + 1));
              } else {
                setBreakpoints(prev => [...prev, index + 1]);
              }
            }}
          >
            {index + 1}
          </div>
        )}
        <pre className="line-content" style={{ marginLeft: showLineNumbers ? '40px' : 0 }}>
          {highlightSyntax(line)}
        </pre>
      </div>
    );
  };

  const highlightSyntax = (line) => {
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'default', 'class', 'extends', 'new', 'this', 'super', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break', 'continue', 'typeof', 'instanceof', 'void', 'delete', 'in'];
    
    let highlighted = line;
    
    highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="syntax-string">$&</span>');
    
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="syntax-number">$1</span>');
    
    keywords.forEach(keyword => {
      highlighted = highlighted.replace(new RegExp(`\\b${keyword}\\b`, 'g'), `<span class="syntax-keyword">${keyword}</span>`);
    });
    
    if (line.trim().startsWith('//')) {
      highlighted = `<span class="syntax-comment">${line}</span>`;
    } else {
      highlighted = highlighted.replace(/\/\/.*$/g, '<span class="syntax-comment">$&</span>');
    }
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="quantum-code-editor" ref={containerRef}>
      {/* Editor Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="toolbar-btn" onClick={handleSave} disabled={!isDirty}>
                  <Save size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>Save (Ctrl+S)</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="toolbar-btn" onClick={handleUndo} disabled={historyIndex <= 0}>
                  <ChevronLeft size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>Undo (Ctrl+Z)</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="toolbar-btn" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                  <ChevronRight size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>Redo (Ctrl+Y)</Tooltip.Content>
            </Tooltip.Root>

            <div className="toolbar-divider" />

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className={`toolbar-btn ${showSearch ? 'active' : ''}`} onClick={() => setShowSearch(!showSearch)}>
                  <Search size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>Find (Ctrl+F)</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="toolbar-btn" onClick={handleFormat}>
                  <Zap size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>Format Code</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className={`toolbar-btn ${isExecuting ? 'executing' : ''}`} onClick={executeCode} disabled={isExecuting}>
                  <Play size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>Run Code</Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        <div className="toolbar-right">
          <select 
            className="language-selector"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="toolbar-btn">
                <Settings size={18} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="settings-dropdown">
              <DropdownMenu.Label>Editor Settings</DropdownMenu.Label>
              <DropdownMenu.Separator />
              
              <div className="setting-item">
                <label>Font Size</label>
                <input 
                  type="range" 
                  min="10" 
                  max="24" 
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                />
                <span>{fontSize}px</span>
              </div>

              <div className="setting-item">
                <label>Word Wrap</label>
                <input 
                  type="checkbox" 
                  checked={wordWrap}
                  onChange={(e) => setWordWrap(e.target.checked)}
                />
              </div>

              <div className="setting-item">
                <label>Line Numbers</label>
                <input 
                  type="checkbox" 
                  checked={showLineNumbers}
                  onChange={(e) => setShowLineNumbers(e.target.checked)}
                />
              </div>

              <div className="setting-item">
                <label>Minimap</label>
                <input 
                  type="checkbox" 
                  checked={showMinimap}
                  onChange={(e) => setShowMinimap(e.target.checked)}
                />
              </div>

              <div className="setting-item">
                <label>Auto Save</label>
                <input 
                  type="checkbox" 
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <button className="toolbar-btn close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="search-panel">
          <input
            type="text"
            placeholder="Find..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="replace-input"
          />
          <div className="search-actions">
            <button className="search-btn">Find Next</button>
            <button className="search-btn">Find Previous</button>
            <button className="search-btn replace-btn">Replace</button>
            <button className="search-btn replace-all-btn">Replace All</button>
          </div>
        </div>
      )}

      {/* Main Editor - Using textarea for actual editing */}
      <div 
        className="editor-container"
        style={{ fontSize: `${fontSize}px` }}
        ref={editorRef}
      >
        <textarea
          className="editor-textarea"
          value={code}
          onChange={handleCodeChange}
          spellCheck={false}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.5,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace'
          }}
        />
        <div className="editor-lines">
          {code.split('\n').map((line, i) => renderLine(line, i))}
        </div>

        {/* Minimap */}
        {showMinimap && (
          <div className="editor-minimap">
            {code.split('\n').map((line, i) => (
              <div 
                key={i} 
                className="minimap-line"
                style={{ 
                  height: `${fontSize * 0.6}px`,
                  backgroundColor: lintErrors.some(e => e.line === i + 1) ? '#f44336' : '#404040'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="editor-status-bar">
        <div className="status-left">
          <span className="status-item">
            <Code size={14} />
            {language}
          </span>
          <span className="status-item">
            Lines: {lines}
          </span>
          <span className="status-item">
            Tokens: {tokens}
          </span>
          <span className="status-item">
            Complexity: {complexity}
          </span>
          {isDirty && (
            <span className="status-item dirty">
              ● Unsaved
            </span>
          )}
          {lastSaved && (
            <span className="status-item">
              Last saved: {formatDistanceToNow(lastSaved)} ago
            </span>
          )}
        </div>

        <div className="status-right">
          {lintErrors.length > 0 && (
            <span className="status-item error">
              <AlertCircle size={14} />
              {lintErrors.length} {lintErrors.length === 1 ? 'issue' : 'issues'}
            </span>
          )}
          <span className="status-item">
            <Cpu size={14} />
            {quantumEffects?.chaosLevel ? `${Math.round(quantumEffects.chaosLevel)}%` : 'Stable'}
          </span>
        </div>
      </div>

      {/* Console Output */}
      {consoleOutput.length > 0 && (
        <div className="console-output">
          <div className="console-header">
            <Terminal size={16} />
            <span>Console</span>
            <button className="clear-console" onClick={() => setConsoleOutput([])}>
              Clear
            </button>
          </div>
          <div className="console-content">
            {consoleOutput.map((output, i) => (
              <div key={i} className={`console-line ${output.type}`}>
                <span className="console-prompt">{'>'}</span>
                {output.args.map((arg, j) => (
                  <span key={j} className="console-arg">
                    {typeof arg === 'string' ? arg : JSON.stringify(arg)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .quantum-code-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(108, 92, 231, 0.3);
        }

        .editor-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: #252525;
          border-bottom: 1px solid #333;
        }

        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .toolbar-btn {
          padding: 6px 8px;
          background: transparent;
          border: none;
          color: #ccc;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toolbar-btn:hover {
          background: #333;
          color: white;
        }

        .toolbar-btn.active {
          background: #6c5ce7;
          color: white;
        }

        .toolbar-btn.executing {
          background: #00b894;
          color: white;
          animation: pulse 1s infinite;
        }

        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: #444;
          margin: 0 8px;
        }

        .language-selector {
          padding: 6px 12px;
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 4px;
          outline: none;
          font-size: 13px;
        }

        .editor-container {
          flex: 1;
          overflow: auto;
          position: relative;
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          line-height: 1.5;
        }

        .editor-textarea {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 12px 12px 12px 52px;
          background: transparent;
          color: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: inherit;
          line-height: inherit;
          caret-color: white;
          z-index: 2;
        }

        .editor-lines {
          min-height: 100%;
          padding: 12px 0;
          position: relative;
          z-index: 1;
          pointer-events: none;
        }

        .editor-line {
          position: relative;
          display: flex;
          white-space: pre-wrap;
          word-wrap: break-word;
          min-height: 1.5em;
        }

        .editor-line.has-error {
          background: rgba(244, 67, 54, 0.1);
        }

        .editor-line.has-breakpoint .line-number::before {
          content: '●';
          position: absolute;
          left: 2px;
          color: #f44336;
        }

        .line-number {
          position: absolute;
          left: 0;
          width: 36px;
          padding: 0 8px;
          color: #858585;
          text-align: right;
          font-size: 12px;
          user-select: none;
          cursor: pointer;
          pointer-events: auto;
          z-index: 3;
        }

        .line-content {
          margin: 0;
          padding: 0 12px;
          white-space: pre-wrap;
          word-wrap: break-word;
          width: 100%;
        }

        .editor-minimap {
          position: absolute;
          top: 0;
          right: 0;
          width: 60px;
          height: 100%;
          background: #1a1a1a;
          border-left: 1px solid #333;
          overflow: hidden;
          padding: 12px 0;
        }

        .minimap-line {
          width: 100%;
          margin: 1px 0;
          transition: all 0.2s;
        }

        .search-panel {
          padding: 12px;
          background: #252525;
          border-bottom: 1px solid #333;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .search-input, .replace-input {
          flex: 1;
          padding: 8px 12px;
          background: #333;
          border: 1px solid #444;
          color: white;
          border-radius: 4px;
          font-size: 13px;
        }

        .search-actions {
          display: flex;
          gap: 4px;
        }

        .search-btn {
          padding: 6px 12px;
          background: #444;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .search-btn:hover {
          background: #555;
        }

        .replace-btn, .replace-all-btn {
          background: #6c5ce7;
        }

        .editor-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 16px;
          background: #1e1e1e;
          border-top: 1px solid #333;
          font-size: 12px;
          color: #ccc;
        }

        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-item.dirty {
          color: #fdcb6e;
        }

        .status-item.error {
          color: #f44336;
        }

        .console-output {
          max-height: 200px;
          overflow: auto;
          background: #1e1e1e;
          border-top: 1px solid #333;
        }

        .console-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #252525;
          color: #ccc;
        }

        .clear-console {
          margin-left: auto;
          padding: 2px 8px;
          background: #444;
          border: none;
          color: white;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }

        .console-content {
          padding: 8px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        .console-line {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 2px 0;
        }

        .console-prompt {
          color: #6c5ce7;
        }

        .console-line.log .console-prompt { color: #00b894; }
        .console-line.error .console-prompt { color: #f44336; }
        .console-line.warn .console-prompt { color: #fdcb6e; }
        .console-line.info .console-prompt { color: #0984e3; }
        .console-line.result .console-prompt { color: #6c5ce7; }

        .settings-dropdown {
          background: #252525;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 8px;
          min-width: 200px;
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px;
          color: white;
        }

        .syntax-keyword { color: #ff79c6; }
        .syntax-string { color: #f1fa8c; }
        .syntax-number { color: #bd93f9; }
        .syntax-comment { color: #6272a4; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// ============= MAIN COMMUNITY COMPONENT =============
export default function Community({ 
  addNotification,
  encryptedParams,
  reducedMotion = false,
  highContrast = false,
  screenReaderMode = false,
  performanceMode = {}
}) {
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
    template: 'blank',
    readme: true,
    gitignore: 'Node',
    license: 'MIT',
    content: {
      files: [],
      structure: { 'README.md': { type: 'file' } }
    }
  });
  const [contentLoading, setContentLoading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('file');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  const [showStats, setShowStats] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [commitHistory, setCommitHistory] = useState([]);
  const [branches, setBranches] = useState([{ name: 'main', is_default: true }]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [pullRequests, setPullRequests] = useState([]);
  const [issues, setIssues] = useState([]);
  const [stars, setStars] = useState([]);
  const [forks, setForks] = useState([]);
  const [watchers, setWatchers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [releases, setReleases] = useState([]);
  const [readme, setReadme] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [repoStats, setRepoStats] = useState({
    commits: 0,
    branches: 1,
    releases: 0,
    contributors: 0,
    size: 0,
    lines: 0
  });

  // ============= REALTIME SUBSCRIPTIONS STATE =============
  const [subscriptions, setSubscriptions] = useState({
    repositories: null,
    repoStars: null,
    repoIssues: null,
    pullRequests: null,
    commits: null,
    branches: null,
    releases: null,
    profiles: null,
    repoWatchers: null,
    repoComments: null
  });

  const router = useRouter();

// ============= GOOGLE AUTH =============
useEffect(() => {
  initializeAuth();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
      if (!selectedRepo) {
        await fetchRepositories();
      }
    } else {
      setUser(null);
      setProfile(null);
      setRepositories([]);
      setSelectedRepo(null);
      setRepoContent(null);
    }
  });

  return () => subscription?.unsubscribe();
}, []);

// ✅ ADD THIS RIGHT HERE - keep ref in sync with state
useEffect(() => {
  selectedRepoRef.current = selectedRepo;
}, [selectedRepo]);
  
  const initializeAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
      }
      
      if (encryptedParams) {
        if (typeof encryptedParams === 'string' && encryptedParams.includes('U2FsdGVkX1')) {
          const decrypted = decryptData(encryptedParams);
          if (decrypted?.repo) {
            setSelectedRepo(decrypted.repo);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code === 'PGRST116') {
        const { data: user } = await supabase.auth.getUser();
        
        const newProfile = {
          user_id: userId,
          username: user.user?.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
          email: user.user?.email,
          full_name: user.user?.user_metadata?.full_name || '',
          avatar_url: user.user?.user_metadata?.avatar_url || user.user?.user_metadata?.picture || '/default-avatar.png',
          bio: '',
          location: '',
          website: '',
          github_username: user.user?.user_metadata?.user_name || '',
          twitter_username: '',
          company: '',
          skills: [],
          interests: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .maybeSingle();

        if (insertError) throw insertError;
        profile = insertedProfile;
      } else if (error) {
        throw error;
      }

      setProfile(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/community`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to login with Google');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clean up all subscriptions
      Object.values(subscriptions).forEach(sub => {
        if (sub) sub.unsubscribe();
      });
      
      setUser(null);
      setProfile(null);
      setSelectedRepo(null);
      setRepositories([]);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // ============= REALTIME SUBSCRIPTIONS SETUP =============
  
  // Setup global repositories subscription
  const setupRepositoriesSubscription = useCallback(() => {
    if (subscriptions.repositories) {
      subscriptions.repositories.unsubscribe();
    }

    const channel = supabase
      .channel('repositories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repositories'
        },
        (payload) => {
          handleRealtimeUpdate('repositories', payload);
        }
      )
      .subscribe();

    setSubscriptions(prev => ({ ...prev, repositories: channel }));
    return channel;
  }, []);

  // Setup stars subscription
  const setupStarsSubscription = useCallback(() => {
    if (subscriptions.repoStars) {
      subscriptions.repoStars.unsubscribe();
    }

    const channel = supabase
      .channel('repo-stars-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repo_stars'
        },
        (payload) => {
          handleRealtimeUpdate('repo_stars', payload);
        }
      )
      .subscribe();

    setSubscriptions(prev => ({ ...prev, repoStars: channel }));
    return channel;
  }, []);

  // Setup watchers subscription
  const setupWatchersSubscription = useCallback(() => {
    if (subscriptions.repoWatchers) {
      subscriptions.repoWatchers.unsubscribe();
    }

    const channel = supabase
      .channel('repo-watchers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repo_watchers'
        },
        (payload) => {
          handleRealtimeUpdate('repo_watchers', payload);
        }
      )
      .subscribe();

    setSubscriptions(prev => ({ ...prev, repoWatchers: channel }));
    return channel;
  }, []);

  // Setup profile subscription
  const setupProfileSubscription = useCallback(() => {
    if (!user?.id) return;
    
    if (subscriptions.profiles) {
      subscriptions.profiles.unsubscribe();
    }

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleRealtimeUpdate('profiles', payload);
        }
      )
      .subscribe();

    setSubscriptions(prev => ({ ...prev, profiles: channel }));
    return channel;
  }, [user?.id]);

  // Setup repository-specific subscriptions
  const setupRepoSpecificSubscriptions = useCallback((repoId) => {
    if (!repoId) return;

    // Clean up existing repo-specific subscriptions
    if (subscriptions.repoIssues) subscriptions.repoIssues.unsubscribe();
    if (subscriptions.pullRequests) subscriptions.pullRequests.unsubscribe();
    if (subscriptions.commits) subscriptions.commits.unsubscribe();
    if (subscriptions.branches) subscriptions.branches.unsubscribe();
    if (subscriptions.releases) subscriptions.releases.unsubscribe();
    if (subscriptions.repoComments) subscriptions.repoComments.unsubscribe();

    // Issues subscription
    const issuesChannel = supabase
      .channel(`repo-issues-${repoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repo_issues',
          filter: `repo_id=eq.${repoId}`
        },
        (payload) => {
          handleRealtimeUpdate('repo_issues', payload);
        }
      )
      .subscribe();

    // Pull requests subscription
    const prChannel = supabase
      .channel(`repo-pr-${repoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pull_requests',
          filter: `repo_id=eq.${repoId}`
        },
        (payload) => {
          handleRealtimeUpdate('pull_requests', payload);
        }
      )
      .subscribe();

    // Commits subscription
    const commitsChannel = supabase
      .channel(`repo-commits-${repoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commits',
          filter: `repo_id=eq.${repoId}`
        },
        (payload) => {
          handleRealtimeUpdate('commits', payload);
        }
      )
      .subscribe();

    // Branches subscription
    const branchesChannel = supabase
      .channel(`repo-branches-${repoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branches',
          filter: `repo_id=eq.${repoId}`
        },
        (payload) => {
          handleRealtimeUpdate('branches', payload);
        }
      )
      .subscribe();

    // Releases subscription
    const releasesChannel = supabase
      .channel(`repo-releases-${repoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'releases',
          filter: `repo_id=eq.${repoId}`
        },
        (payload) => {
          handleRealtimeUpdate('releases', payload);
        }
      )
      .subscribe();

    // Comments subscription
    const commentsChannel = supabase
      .channel(`repo-comments-${repoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repo_comments',
          filter: `repo_id=eq.${repoId}`
        },
        (payload) => {
          handleRealtimeUpdate('repo_comments', payload);
        }
      )
      .subscribe();

    setSubscriptions(prev => ({
      ...prev,
      repoIssues: issuesChannel,
      pullRequests: prChannel,
      commits: commitsChannel,
      branches: branchesChannel,
      releases: releasesChannel,
      repoComments: commentsChannel
    }));
  }, []);

  // Initialize all global subscriptions
  useEffect(() => {
    if (!supabase) return;

    setupRepositoriesSubscription();
    setupStarsSubscription();
    setupWatchersSubscription();

    return () => {
      Object.values(subscriptions).forEach(sub => {
        if (sub) sub.unsubscribe();
      });
    };
  }, []);

  // Setup profile subscription when user changes
  useEffect(() => {
    if (user?.id) {
      setupProfileSubscription();
    }
    
    return () => {
      if (subscriptions.profiles) {
        subscriptions.profiles.unsubscribe();
      }
    };
  }, [user?.id]);

  // Setup repo-specific subscriptions when selected repo changes
  useEffect(() => {
    if (selectedRepo?.id) {
      setupRepoSpecificSubscriptions(selectedRepo.id);
    }
    
    return () => {
      // Clean up repo-specific subscriptions
      ['repoIssues', 'pullRequests', 'commits', 'branches', 'releases', 'repoComments'].forEach(key => {
        if (subscriptions[key]) {
          subscriptions[key].unsubscribe();
          setSubscriptions(prev => ({ ...prev, [key]: null }));
        }
      });
    };
  }, [selectedRepo?.id]);

 const handleRealtimeUpdate = useCallback((type, payload) => {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  // ✅ USE THE REF INSTEAD OF selectedRepo STATE
  const currentRepo = selectedRepoRef.current;
  
  switch (type) {
    case 'repositories':
      handleRepositoryRealtime(eventType, newRecord, oldRecord);
      break;
    
    case 'repo_stars':
      handleStarRealtime(eventType, newRecord, oldRecord);
      break;
    
    case 'repo_watchers':
      handleWatcherRealtime(eventType, newRecord, oldRecord);
      break;
    
    case 'repo_issues':
      // ✅ FIXED - uses currentRepo from ref
      if (currentRepo && newRecord?.repo_id === currentRepo.id) {
        handleIssuesRealtime(eventType, newRecord, oldRecord);
      }
      break;
    
    case 'pull_requests':
      // ✅ FIXED - uses currentRepo from ref
      if (currentRepo && newRecord?.repo_id === currentRepo.id) {
        handlePullRequestsRealtime(eventType, newRecord, oldRecord);
      }
      break;
    
    case 'commits':
      // ✅ FIXED - uses currentRepo from ref
      if (currentRepo && newRecord?.repo_id === currentRepo.id) {
        handleCommitsRealtime(eventType, newRecord, oldRecord);
      }
      break;
    
    case 'branches':
      // ✅ FIXED - uses currentRepo from ref
      if (currentRepo && newRecord?.repo_id === currentRepo.id) {
        handleBranchesRealtime(eventType, newRecord, oldRecord);
      }
      break;
    
    case 'releases':
      // ✅ FIXED - uses currentRepo from ref
      if (currentRepo && newRecord?.repo_id === currentRepo.id) {
        handleReleasesRealtime(eventType, newRecord, oldRecord);
      }
      break;
    
    case 'repo_comments':
      // ✅ FIXED - uses currentRepo from ref
      if (currentRepo && newRecord?.repo_id === currentRepo.id) {
        handleCommentsRealtime(eventType, newRecord, oldRecord);
      }
      break;
    
    case 'profiles':
      handleProfileRealtime(eventType, newRecord, oldRecord);
      break;
    
    default:
      break;
  }
}, [user]); // ✅ REMOVED selectedRepo FROM DEPS - NOW IT WON'T STALE!

  const handleRepositoryRealtime = (eventType, newRecord, oldRecord) => {
    if (!selectedRepo) {
      setRepositories(prev => {
        switch (eventType) {
          case 'INSERT':
            if (newRecord.is_public || newRecord.user_id === user?.id) {
              if (addNotification) addNotification(`New repository created: ${newRecord.name}`, 'info');
              return [newRecord, ...prev];
            }
            return prev;
          
          case 'UPDATE':
            return prev.map(repo => 
              repo.id === newRecord.id ? { ...repo, ...newRecord } : repo
            );
          
          case 'DELETE':
            if (addNotification) addNotification(`Repository removed: ${oldRecord?.name}`, 'info');
            return prev.filter(repo => repo.id !== oldRecord?.id);
          
          default:
            return prev;
        }
      });
    }
  };

  const handleStarRealtime = (eventType, newRecord, oldRecord) => {
    setRepositories(prev => prev.map(repo => {
      if (repo.id === (newRecord?.repo_id || oldRecord?.repo_id)) {
        const delta = eventType === 'INSERT' ? 1 : eventType === 'DELETE' ? -1 : 0;
        return {
          ...repo,
          star_count: Math.max(0, (repo.star_count || 0) + delta),
          is_starred: eventType === 'INSERT' && user?.id === newRecord?.user_id
            ? true 
            : eventType === 'DELETE' && user?.id === oldRecord?.user_id
            ? false 
            : repo.is_starred
        };
      }
      return repo;
    }));

    if (user && (newRecord?.user_id === user.id || oldRecord?.user_id === user.id)) {
      toast.success(eventType === 'INSERT' ? 'Repository starred!' : 'Repository unstarred');
    }
  };

  const handleWatcherRealtime = (eventType, newRecord, oldRecord) => {
    setRepositories(prev => prev.map(repo => {
      if (repo.id === (newRecord?.repo_id || oldRecord?.repo_id)) {
        const delta = eventType === 'INSERT' ? 1 : eventType === 'DELETE' ? -1 : 0;
        return {
          ...repo,
          watcher_count: Math.max(0, (repo.watcher_count || 0) + delta),
          is_watching: eventType === 'INSERT' && user?.id === newRecord?.user_id
            ? true
            : eventType === 'DELETE' && user?.id === oldRecord?.user_id
            ? false
            : repo.is_watching
        };
      }
      return repo;
    }));
  };

  const handleIssuesRealtime = (eventType, newRecord, oldRecord) => {
    if (selectedRepo && newRecord?.repo_id === selectedRepo.id) {
      setIssues(prev => {
        switch (eventType) {
          case 'INSERT':
            if (addNotification) addNotification(`New issue created: ${newRecord.title}`, 'info');
            return [newRecord, ...prev];
          case 'UPDATE':
            return prev.map(issue => 
              issue.id === newRecord.id ? { ...issue, ...newRecord } : issue
            );
          case 'DELETE':
            return prev.filter(issue => issue.id !== oldRecord?.id);
          default:
            return prev;
        }
      });

      setRepositories(prev => prev.map(repo => {
        if (repo.id === selectedRepo.id) {
          const delta = eventType === 'INSERT' ? 1 : eventType === 'DELETE' ? -1 : 0;
          return {
            ...repo,
            issue_count: Math.max(0, (repo.issue_count || 0) + delta)
          };
        }
        return repo;
      }));
    }
  };

  const handlePullRequestsRealtime = (eventType, newRecord, oldRecord) => {
    if (selectedRepo && newRecord?.repo_id === selectedRepo.id) {
      setPullRequests(prev => {
        switch (eventType) {
          case 'INSERT':
            if (addNotification) addNotification(`New pull request: ${newRecord.title}`, 'info');
            return [newRecord, ...prev];
          case 'UPDATE':
            if (newRecord.status === 'merged') {
              toast.success(`Pull request merged: ${newRecord.title}`);
            }
            return prev.map(pr => 
              pr.id === newRecord.id ? { ...pr, ...newRecord } : pr
            );
          case 'DELETE':
            return prev.filter(pr => pr.id !== oldRecord?.id);
          default:
            return prev;
        }
      });

      setRepositories(prev => prev.map(repo => {
        if (repo.id === selectedRepo.id) {
          const delta = eventType === 'INSERT' ? 1 : eventType === 'DELETE' ? -1 : 0;
          return {
            ...repo,
            pr_count: Math.max(0, (repo.pr_count || 0) + delta)
          };
        }
        return repo;
      }));
    }
  };

  const handleCommitsRealtime = (eventType, newRecord) => {
    if (selectedRepo && newRecord?.repo_id === selectedRepo.id && eventType === 'INSERT') {
      setCommitHistory(prev => [newRecord, ...prev].slice(0, 50));
      setRepoStats(prev => ({ ...prev, commits: prev.commits + 1 }));
      
      const today = new Date().toISOString().split('T')[0];
      setActivity(prev => {
        const existing = prev.find(d => d.date === today);
        if (existing) {
          return prev.map(d => 
            d.date === today ? { ...d, count: d.count + 1 } : d
          );
        } else {
          return [...prev, { date: today, count: 1 }].sort((a, b) => 
            a.date.localeCompare(b.date)
          ).slice(-30);
        }
      });

      if (addNotification && newRecord.message?.length > 0) {
        addNotification(`New commit: ${newRecord.message.substring(0, 50)}${newRecord.message.length > 50 ? '...' : ''}`, 'info');
      }
    }
  };

  const handleBranchesRealtime = (eventType, newRecord, oldRecord) => {
    if (selectedRepo && newRecord?.repo_id === selectedRepo.id) {
      setBranches(prev => {
        switch (eventType) {
          case 'INSERT':
            toast.success(`New branch created: ${newRecord.name}`);
            return [...prev, newRecord];
          case 'UPDATE':
            return prev.map(branch => 
              branch.id === newRecord.id ? { ...branch, ...newRecord } : branch
            );
          case 'DELETE':
            toast.info(`Branch deleted: ${oldRecord?.name}`);
            return prev.filter(branch => branch.id !== oldRecord?.id);
          default:
            return prev;
        }
      });

      if (eventType === 'INSERT' || eventType === 'DELETE') {
        setRepoStats(prev => ({ 
          ...prev, 
          branches: Math.max(0, prev.branches + (eventType === 'INSERT' ? 1 : -1)) 
        }));
      }
    }
  };

  const handleReleasesRealtime = (eventType, newRecord, oldRecord) => {
    if (selectedRepo && newRecord?.repo_id === selectedRepo.id) {
      setReleases(prev => {
        switch (eventType) {
          case 'INSERT':
            toast.success(`New release: ${newRecord.tag_name} - ${newRecord.title}`);
            return [newRecord, ...prev];
          case 'UPDATE':
            return prev.map(release => 
              release.id === newRecord.id ? { ...release, ...newRecord } : release
            );
          case 'DELETE':
            return prev.filter(release => release.id !== oldRecord?.id);
          default:
            return prev;
        }
      });

      if (eventType === 'INSERT' || eventType === 'DELETE') {
        setRepoStats(prev => ({ 
          ...prev, 
          releases: Math.max(0, prev.releases + (eventType === 'INSERT' ? 1 : -1)) 
        }));
      }
    }
  };

  const handleCommentsRealtime = (eventType, newRecord, oldRecord) => {
    if (selectedRepo && newRecord?.repo_id === selectedRepo.id) {
      if (eventType === 'INSERT') {
        if (addNotification) addNotification(`New comment on repository`, 'info');
      }
    }
  };

  const handleProfileRealtime = (eventType, newRecord) => {
    if (eventType === 'UPDATE' && newRecord?.user_id === user?.id) {
      setProfile(newRecord);
      if (addNotification) addNotification('Profile updated', 'info');
    }
  };

  // ============= REPOSITORY MANAGEMENT =============

  const fetchRepositories = async () => {
    if (selectedRepo) return;
    
    setContentLoading(true);
    
    try {
      let query = supabase
        .from('repositories')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'my-repos' && user) {
        query = query.eq('user_id', user.id);
      } else if (activeTab === 'starred' && user) {
        const { data: stars } = await supabase
          .from('repo_stars')
          .select('repo_id')
          .eq('user_id', user.id);
        
        if (stars?.length) {
          query = query.in('id', stars.map(s => s.repo_id));
        } else {
          setRepositories([]);
          setContentLoading(false);
          return;
        }
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (filterLanguage !== 'all') {
        query = query.eq('language', filterLanguage);
      }

      switch (sortBy) {
        case 'stars':
          query = query.order('star_count', { ascending: false });
          break;
        case 'forks':
          query = query.order('fork_count', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'created':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('updated_at', { ascending: false });
      }

      const { data: repos, error } = await query;

      if (error) throw error;

      const enrichedRepos = await Promise.all((repos || []).map(async (repo) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('user_id', repo.user_id)
          .maybeSingle();

        const { count: starCount } = await supabase
          .from('repo_stars')
          .select('*', { count: 'exact', head: true })
          .eq('repo_id', repo.id);

        const { count: forkCount } = await supabase
          .from('repositories')
          .select('*', { count: 'exact', head: true })
          .eq('original_repo_id', repo.id);

        const { count: issueCount } = await supabase
          .from('repo_issues')
          .select('*', { count: 'exact', head: true })
          .eq('repo_id', repo.id)
          .eq('status', 'open');

        const { count: prCount } = await supabase
          .from('pull_requests')
          .select('*', { count: 'exact', head: true })
          .eq('repo_id', repo.id)
          .eq('status', 'open');

        const { count: watcherCount } = await supabase
          .from('repo_watchers')
          .select('*', { count: 'exact', head: true })
          .eq('repo_id', repo.id);

        let isStarred = false;
        let isWatching = false;
        
        if (user) {
          const { data: starData } = await supabase
            .from('repo_stars')
            .select('id')
            .eq('repo_id', repo.id)
            .eq('user_id', user.id)
            .maybeSingle();
          isStarred = !!starData;

          const { data: watchData } = await supabase
            .from('repo_watchers')
            .select('id')
            .eq('repo_id', repo.id)
            .eq('user_id', user.id)
            .maybeSingle();
          isWatching = !!watchData;
        }

        return {
          ...repo,
          owner: profile || { username: 'Anonymous', avatar_url: '/default-avatar.png' },
          star_count: starCount || 0,
          fork_count: forkCount || 0,
          issue_count: issueCount || 0,
          pr_count: prCount || 0,
          watcher_count: watcherCount || 0,
          is_starred: isStarred,
          is_watching: isWatching
        };
      }));

      setRepositories(enrichedRepos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to load repositories');
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedRepo) {
      fetchRepositories();
    }
  }, [activeTab, searchQuery, filterLanguage, sortBy, user, selectedRepo]);

  const createRepository = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (!newContent.name) {
      toast.error('Repository name is required');
      return;
    }

    try {
      let initialContent = {
        files: [],
        structure: {}
      };

      if (newContent.readme) {
        const readmeContent = `# ${newContent.name}\n\n${newContent.description || ''}\n\n## Getting Started\n\nThis repository was created with Modz3.0 Quantum Repository System.`;
        initialContent.files.push({
          path: 'README.md',
          name: 'README.md',
          content: readmeContent,
          language: 'markdown',
          size: readmeContent.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        initialContent.structure['README.md'] = { type: 'file' };
      }

      if (newContent.gitignore !== 'none') {
        const gitignoreContent = getGitignoreTemplate(newContent.gitignore);
        initialContent.files.push({
          path: '.gitignore',
          name: '.gitignore',
          content: gitignoreContent,
          language: 'text',
          size: gitignoreContent.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        initialContent.structure['.gitignore'] = { type: 'file' };
      }

      if (newContent.license !== 'none') {
        const licenseContent = getLicenseTemplate(newContent.license);
        initialContent.files.push({
          path: 'LICENSE',
          name: 'LICENSE',
          content: licenseContent,
          language: 'text',
          size: licenseContent.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        initialContent.structure['LICENSE'] = { type: 'file' };
      }

      const { data: repo, error } = await supabase
        .from('repositories')
        .insert([{
          name: newContent.name,
          description: newContent.description,
          user_id: user.id,
          is_public: newContent.is_public,
          content: initialContent,
          language: 'Unknown',
          star_count: 0,
          fork_count: 0,
          view_count: 0,
          issue_count: 0,
          pr_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      setNewContent({
        type: 'repository',
        name: '',
        description: '',
        is_public: true,
        template: 'blank',
        readme: true,
        gitignore: 'Node',
        license: 'MIT',
        content: { files: [], structure: {} }
      });

      toast.success('Repository created successfully!');
      if (addNotification) addNotification('Repository created successfully', 'success');
      
    } catch (error) {
      console.error('Create repository error:', error);
      toast.error(`Failed to create repository: ${error.message}`);
    }
  };

  const selectRepository = async (repo) => {
    setSelectedRepo(repo);
    setCurrentPath('');
    
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repo.id)
        .maybeSingle();
      
      if (error) throw error;

      setRepoContent(data.content || { files: [], structure: {} });
      
      if (data.content?.files) {
        const readmeFile = data.content.files.find((f) => 
          f.name.toLowerCase() === 'readme.md' || f.name.toLowerCase() === 'readme'
        );
        if (readmeFile) {
          setReadme(readmeFile.content);
        }
      }

      await fetchCommitHistory(repo.id);
      await fetchBranches(repo.id);
      await fetchIssues(repo.id);
      await fetchPullRequests(repo.id);
      await fetchContributors(repo.id);
      await fetchReleases(repo.id);
      await fetchActivity(repo.id);

      await supabase
        .from('repositories')
        .update({ view_count: (repo.view_count || 0) + 1 })
        .eq('id', repo.id);

    } catch (error) {
      console.error('Error loading repository:', error);
      toast.error('Failed to load repository content');
    }
  };

  const fetchCommitHistory = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('commits')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCommitHistory(data || []);
      setRepoStats(prev => ({ ...prev, commits: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching commits:', error);
    }
  };

  const fetchBranches = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('repo_id', repoId);

      if (error) throw error;
      setBranches(data || [{ name: 'main', is_default: true }]);
      setRepoStats(prev => ({ ...prev, branches: data?.length || 1 }));
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchIssues = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('repo_issues')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const fetchPullRequests = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('pull_requests')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPullRequests(data || []);
    } catch (error) {
      console.error('Error fetching pull requests:', error);
    }
  };

  const fetchContributors = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('commits')
        .select('author_id, author_name, author_email')
        .eq('repo_id', repoId);

      if (error) throw error;
      
      const contributorsMap = new Map();
      data?.forEach((commit) => {
        const key = commit.author_id || commit.author_email;
        if (contributorsMap.has(key)) {
          contributorsMap.get(key).count++;
        } else {
          contributorsMap.set(key, {
            author_id: commit.author_id,
            author_name: commit.author_name,
            author_email: commit.author_email,
            count: 1
          });
        }
      });
      
      const contributorsList = Array.from(contributorsMap.values());
      setContributors(contributorsList);
      setRepoStats(prev => ({ ...prev, contributors: contributorsList.length }));
    } catch (error) {
      console.error('Error fetching contributors:', error);
    }
  };

  const fetchReleases = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReleases(data || []);
      setRepoStats(prev => ({ ...prev, releases: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  };

  const fetchActivity = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('commits')
        .select('created_at')
        .eq('repo_id', repoId);

      if (error) throw error;

      const activityData = {};
      data?.forEach((commit) => {
        const date = new Date(commit.created_at).toISOString().split('T')[0];
        activityData[date] = (activityData[date] || 0) + 1;
      });

      const formatted = Object.entries(activityData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      setActivity(formatted);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const saveFile = async (updatedFile) => {
    if (!selectedRepo || !repoContent) return;

    try {
      const updatedFiles = repoContent.files.map(f => 
        f.path === updatedFile.path ? updatedFile : f
      );

      const updatedContent = {
        ...repoContent,
        files: updatedFiles,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('repositories')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRepo.id);

      if (error) throw error;

      setRepoContent(updatedContent);
      
      await createCommit(selectedRepo.id, updatedFile.path, 'Updated ' + updatedFile.name);

      toast.success('File saved successfully');

    } catch (error) {
      console.error('Error saving file:', error);
      toast.error(`Failed to save file: ${error.message}`);
    }
  };

  const createCommit = async (repoId, filePath, message) => {
    if (!user) return;

    try {
      const commitHash = uuidv4();
      
      const { error } = await supabase
        .from('commits')
        .insert([{
          repo_id: repoId,
          user_id: user.id,
          author_name: profile?.username || user.email,
          author_email: user.email,
          message,
          files: [filePath],
          hash: commitHash,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

    } catch (error) {
      console.error('Error creating commit:', error);
    }
  };

  const createNewItem = async () => {
    if (!selectedRepo || !repoContent || !newFileName) return;

    const fullPath = currentPath ? `${currentPath}/${newFileName}` : newFileName;

    try {
      let updatedContent;

      if (newFileType === 'file') {
        const newFile = {
          path: fullPath,
          name: newFileName,
          content: '',
          language: detectLanguage(newFileName),
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
        updatedContent = {
          ...repoContent,
          structure: addToStructure(repoContent.structure, currentPath, newFileName, 'directory')
        };
      }

      const { error } = await supabase
        .from('repositories')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRepo.id);

      if (error) throw error;

      setRepoContent(updatedContent);
      
      await createCommit(
        selectedRepo.id,
        fullPath,
        `Create ${newFileType} ${newFileName}`
      );

      setNewFileName('');
      setIsCreatingFile(false);
      
      toast.success(`${newFileType === 'file' ? 'File' : 'Folder'} created successfully`);

    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(`Failed to create ${newFileType}: ${error.message}`);
    }
  };

  const deleteFile = async (filePath) => {
    if (!selectedRepo || !repoContent) return;

    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const updatedFiles = repoContent.files.filter(f => f.path !== filePath);
      const updatedStructure = removeFromStructure(repoContent.structure, filePath);

      const updatedContent = {
        ...repoContent,
        files: updatedFiles,
        structure: updatedStructure,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('repositories')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRepo.id);

      if (error) throw error;

      setRepoContent(updatedContent);
      
      await createCommit(
        selectedRepo.id,
        filePath,
        `Delete ${filePath.split('/').pop()}`
      );

      toast.success('File deleted successfully');

    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(`Failed to delete file: ${error.message}`);
    }
  };

  const starRepository = async (repo) => {
    if (!user) {
      toast.error('Please login to star repositories');
      return;
    }

    try {
      if (repo.is_starred) {
        const { error } = await supabase
          .from('repo_stars')
          .delete()
          .eq('repo_id', repo.id)
          .eq('user_id', user.id);

        if (error) throw error;

        await supabase
          .from('repositories')
          .update({ star_count: (repo.star_count || 0) - 1 })
          .eq('id', repo.id);

        toast.success('Repository unstarred');
      } else {
        const { error } = await supabase
          .from('repo_stars')
          .insert([{
            repo_id: repo.id,
            user_id: user.id,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        await supabase
          .from('repositories')
          .update({ star_count: (repo.star_count || 0) + 1 })
          .eq('id', repo.id);

        toast.success('Repository starred');
      }

    } catch (error) {
      console.error('Error starring repo:', error);
      toast.error(`Failed to ${repo.is_starred ? 'unstar' : 'star'} repository`);
    }
  };

  const watchRepository = async (repo) => {
    if (!user) {
      toast.error('Please login to watch repositories');
      return;
    }

    try {
      if (repo.is_watching) {
        const { error } = await supabase
          .from('repo_watchers')
          .delete()
          .eq('repo_id', repo.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast.success('Stopped watching repository');
      } else {
        const { error } = await supabase
          .from('repo_watchers')
          .insert([{
            repo_id: repo.id,
            user_id: user.id,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        toast.success('Now watching repository');
      }

    } catch (error) {
      console.error('Error watching repo:', error);
      toast.error(`Failed to ${repo.is_watching ? 'unwatch' : 'watch'} repository`);
    }
  };

  const forkRepository = async (repo) => {
    if (!user) {
      toast.error('Please login to fork repositories');
      return;
    }

    try {
      const { data: forkedRepo, error } = await supabase
        .from('repositories')
        .insert([{
          name: `${repo.name}-fork-${Date.now().toString(36)}`,
          description: `Fork of ${repo.name}`,
          user_id: user.id,
          original_repo_id: repo.id,
          is_public: repo.is_public,
          content: repo.content,
          language: repo.language,
          star_count: 0,
          fork_count: 0,
          view_count: 0,
          issue_count: 0,
          pr_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      await supabase
        .from('repositories')
        .update({ fork_count: (repo.fork_count || 0) + 1 })
        .eq('id', repo.id);

      toast.success('Repository forked successfully');
      
      setActiveTab('my-repos');
      
    } catch (error) {
      console.error('Error forking repo:', error);
      toast.error(`Failed to fork repository: ${error.message}`);
    }
  };

  const exportRepository = async () => {
    if (!selectedRepo || !repoContent) return;

    try {
      const zip = new JSZip();

      repoContent.files.forEach(file => {
        zip.file(file.path, file.content);
      });

      zip.file('repository.json', JSON.stringify({
        name: selectedRepo.name,
        description: selectedRepo.description,
        created_at: selectedRepo.created_at,
        language: selectedRepo.language,
        version: '1.0.0'
      }, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      
      saveAs(content, `${selectedRepo.name}.zip`);

      toast.success('Repository exported successfully');

    } catch (error) {
      console.error('Error exporting repository:', error);
      toast.error('Failed to export repository');
    }
  };

  const importRepository = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.json';
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        toast.loading('Importing repository...');

        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        
        const files = [];
        const structure = {};

        for (const [path, zipEntry] of Object.entries(contents.files)) {
          if (!zipEntry.dir) {
            const content = await zipEntry.async('string');
            files.push({
              path,
              name: path.split('/').pop() || '',
              content,
              language: detectLanguage(path),
              size: content.length,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            const parts = path.split('/');
            let current = structure;
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) {
                current[parts[i]] = { type: 'directory', contents: {} };
              }
              current = current[parts[i]].contents;
            }
            current[parts[parts.length - 1]] = { type: 'file' };
          }
        }

        const { data: repo, error } = await supabase
          .from('repositories')
          .insert([{
            name: file.name.replace('.zip', ''),
            description: 'Imported repository',
            user_id: user.id,
            is_public: true,
            content: { files, structure },
            language: detectLanguageFromFiles(files),
            star_count: 0,
            fork_count: 0,
            view_count: 0,
            issue_count: 0,
            pr_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .maybeSingle();

        if (error) throw error;

        toast.dismiss();
        toast.success('Repository imported successfully');
        
        setSelectedRepo(repo);

      } catch (error) {
        console.error('Error importing repository:', error);
        toast.dismiss();
        toast.error('Failed to import repository');
      }
    };

    input.click();
  };

  const createIssue = async () => {
    if (!user) {
      toast.error('Please login to create issues');
      return;
    }

    const title = prompt('Enter issue title:');
    if (!title) return;

    const description = prompt('Enter issue description (optional):');

    try {
      const { data: issueData, error } = await supabase
        .from('repo_issues')
        .insert([{
          repo_id: selectedRepo.id,
          user_id: user.id,
          title,
          description: description || '',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          labels: []
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      toast.success('Issue created successfully');
      
    } catch (error) {
      console.error('Error creating issue:', error);
      toast.error('Failed to create issue');
    }
  };

  const createPullRequest = async () => {
    if (!user) {
      toast.error('Please login to create pull requests');
      return;
    }

    const title = prompt('Enter pull request title:');
    if (!title) return;

    const base_branch = prompt('Base branch (default: main):') || 'main';
    const head_branch = prompt('Head branch:');
    if (!head_branch) return;

    try {
      const { error } = await supabase
        .from('pull_requests')
        .insert([{
          repo_id: selectedRepo.id,
          user_id: user.id,
          title,
          base_branch,
          head_branch,
          target_branch: base_branch,
          source_branch: head_branch,
          status: 'open',
          commits: 0,
          changes: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Pull request created successfully');
      
    } catch (error) {
      console.error('Error creating pull request:', error);
      toast.error('Failed to create pull request');
    }
  };

  const createBranch = async () => {
    if (!user) {
      toast.error('Please login to create branches');
      return;
    }

    const branchName = prompt('Enter branch name:');
    if (!branchName) return;

    const sourceBranch = prompt('Source branch (default: main):') || 'main';

    try {
      const { error } = await supabase
        .from('branches')
        .insert([{
          repo_id: selectedRepo.id,
          name: branchName,
          source_branch: sourceBranch,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Branch created successfully');
      
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error('Failed to create branch');
    }
  };

  const createRelease = async () => {
    if (!user) {
      toast.error('Please login to create releases');
      return;
    }

    const tagName = prompt('Enter tag name (e.g., v1.0.0):');
    if (!tagName) return;

    const title = prompt('Enter release title:');
    if (!title) return;

    const prerelease = confirm('Is this a pre-release? Click OK for yes, Cancel for no');

    try {
      const { error } = await supabase
        .from('releases')
        .insert([{
          repo_id: selectedRepo.id,
          user_id: user.id,
          tag_name: tagName,
          title,
          prerelease,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Release created successfully');
      
    } catch (error) {
      console.error('Error creating release:', error);
      toast.error('Failed to create release');
    }
  };

  // ============= UTILITY FUNCTIONS =============
  const detectLanguage = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap = {
      'js': 'JavaScript', 'jsx': 'JavaScript', 'ts': 'TypeScript',
      'tsx': 'TypeScript', 'py': 'Python', 'html': 'HTML',
      'css': 'CSS', 'json': 'JSON', 'md': 'Markdown',
      'yml': 'YAML', 'yaml': 'YAML', 'xml': 'XML',
      'cpp': 'C++', 'c': 'C', 'java': 'Java',
      'rs': 'Rust', 'go': 'Go', 'rb': 'Ruby',
      'php': 'PHP', 'sql': 'SQL', 'sh': 'Bash'
    };
    return languageMap[ext] || 'Plain Text';
  };

  const detectLanguageFromFiles = (files) => {
    const languages = {};
    files.forEach(file => {
      const lang = detectLanguage(file.name);
      languages[lang] = (languages[lang] || 0) + 1;
    });
    
    let maxCount = 0;
    let mainLanguage = 'Unknown';
    
    Object.entries(languages).forEach(([lang, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mainLanguage = lang;
      }
    });
    
    return mainLanguage;
  };

  const getGitignoreTemplate = (type) => {
    const templates = {
      'Node': `# Node.js
node_modules/
npm-debug.log
yarn-error.log
package-lock.json
yarn.lock
.env
dist/
build/
coverage/
.nyc_output/
.DS_Store`,
      'Python': `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env
.pytest_cache/
.coverage
htmlcov/
dist/
build/
*.egg-info/
`,
      'Java': `# Java
*.class
*.jar
*.war
*.ear
target/
build/
.settings/
.project
.classpath
.gradle/
build.gradle
gradle-app.setting
`,
      'React': `# React
node_modules/
build/
.env
*.log
.DS_Store
coverage/
dist/
.vscode/
`
    };
    return templates[type] || templates['Node'];
  };

  const getLicenseTemplate = (type) => {
    const year = new Date().getFullYear();
    const templates = {
      'MIT': `MIT License

Copyright (c) ${year} ${profile?.username || 'User'}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
      'Apache-2.0': `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/`,
      'GPL-3.0': `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007`,
      'BSD-3-Clause': `BSD 3-Clause License`
    };
    return templates[type] || templates['MIT'];
  };

  const addToStructure = (structure, currentPath, name, type) => {
    const pathParts = currentPath.split('/').filter(p => p);
    let current = { ...structure };
    let result = current;
    
    for (const part of pathParts) {
      if (!current[part]) {
        current[part] = { type: 'directory', contents: {} };
      }
      current = current[part].contents;
    }
    
    current[name] = { type };
    if (type === 'directory') {
      current[name].contents = {};
    }
    
    return result;
  };

  const removeFromStructure = (structure, path) => {
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    let current = { ...structure };
    let result = current;
    
    for (const part of pathParts) {
      if (current[part]?.contents) {
        current = current[part].contents;
      }
    }
    
    if (fileName) {
      delete current[fileName];
    }
    return result;
  };

  const getCurrentDirectoryContents = () => {
    if (!repoContent?.structure) return [];
    
    const pathParts = currentPath.split('/').filter(p => p);
    let current = repoContent.structure;
    
    for (const part of pathParts) {
      if (current[part]?.type === 'directory') {
        current = current[part].contents;
      } else {
        return [];
      }
    }
    
    return Object.entries(current).map(([name, item]) => ({
      name,
      ...item,
      path: currentPath ? `${currentPath}/${name}` : name
    })).sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const iconMap = {
      'js': <FileCode size={18} />,
      'jsx': <Code size={18} />,
      'ts': <FileCode size={18} />,
      'tsx': <Code size={18} />,
      'py': <FileCode size={18} />,
      'html': <FileCode size={18} />,
      'css': <FileText size={18} />,
      'json': <FileJson size={18} />,
      'md': <BookOpen size={18} />,
      'txt': <FileText size={18} />,
      'png': <FileImage size={18} />,
      'jpg': <FileImage size={18} />,
      'svg': <FileImage size={18} />,
    };
    return iconMap[ext] || <File size={18} />;
  };

  // ============= RENDER METHODS =============
  const renderFileExplorer = () => {
    if (!selectedRepo || !repoContent) return null;

    const contents = getCurrentDirectoryContents();
    const pathParts = currentPath ? currentPath.split('/') : [];

    return (
      <motion.div 
        className="quantum-file-explorer"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="explorer-header">
          <div className="explorer-title">
            <Folder size={16} />
            <h4>{selectedRepo.name}</h4>
          </div>
          <div className="explorer-actions">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="explorer-btn" onClick={() => setIsCreatingFile(true)}>
                    <Plus size={14} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content>Create new file/folder</Tooltip.Content>
              </Tooltip.Root>
              
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="explorer-btn" onClick={exportRepository}>
                    <Download size={14} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content>Export repository</Tooltip.Content>
              </Tooltip.Root>
              
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="explorer-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    <ChevronLeft size={14} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content>Collapse sidebar</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>

        <div className="explorer-breadcrumb">
          <button 
            className="breadcrumb-item"
            onClick={() => setCurrentPath('')}
          >
            root
          </button>
          {pathParts.map((part, index) => (
            <span key={index} className="breadcrumb-segment">
              <ChevronRight size={12} />
              <button
                className="breadcrumb-item"
                onClick={() => setCurrentPath(pathParts.slice(0, index + 1).join('/'))}
              >
                {part}
              </button>
            </span>
          ))}
        </div>

        <div className="explorer-contents">
          {contents.length === 0 ? (
            <div className="empty-directory">
              <Folder size={48} />
              <p>This directory is empty</p>
              <button className="create-btn" onClick={() => setIsCreatingFile(true)}>
                <Plus size={14} /> Create new file
              </button>
            </div>
          ) : (
            contents.map((item, index) => (
              <motion.div
                key={index}
                className={`explorer-item ${item.type}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onDoubleClick={() => {
                  if (item.type === 'directory') {
                    setCurrentPath(item.path);
                  } else {
                    const file = repoContent.files.find(f => f.path === item.path);
                    if (file) {
                      setEditingFile(file);
                    }
                  }
                }}
              >
                <div className="item-icon">
                  {item.type === 'directory' ? <Folder size={16} /> : getFileIcon(item.name)}
                </div>
                <div className="item-name">{item.name}</div>
                <div className="item-actions">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="item-menu-btn">
                        <Settings size={14} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="item-dropdown">
                      <DropdownMenu.Item onSelect={() => {
                        if (item.type === 'file') {
                          const file = repoContent.files.find(f => f.path === item.path);
                          if (file) setEditingFile(file);
                        }
                      }}>
                        <Edit2 size={14} /> Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onSelect={() => deleteFile(item.path)}>
                        <Trash2 size={14} /> Delete
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <Copy size={14} /> Copy path
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item>
                        <Download size={14} /> Download
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Create File Modal */}
        <AnimatePresence>
          {isCreatingFile && (
            <motion.div 
              className="create-file-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="modal-header">
                <h5>Create New</h5>
                <button className="close-btn" onClick={() => setIsCreatingFile(false)}>
                  <X size={16} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="form-select"
                  >
                    <option value="file">File</option>
                    <option value="directory">Folder</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder={newFileType === 'file' ? 'example.js' : 'folder-name'}
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="form-input"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setIsCreatingFile(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={createNewItem}
                  disabled={!newFileName}
                >
                  Create
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx>{`
          .quantum-file-explorer {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: var(--quantum-surface);
            border-right: 1px solid var(--quantum-border);
          }

          .explorer-header {
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--quantum-border);
          }

          .explorer-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: white;
          }

          .explorer-title h4 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
          }

          .explorer-actions {
            display: flex;
            gap: 4px;
          }

          .explorer-btn {
            padding: 6px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .explorer-btn:hover {
            background: rgba(108, 92, 231, 0.2);
            color: white;
          }

          .explorer-breadcrumb {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid var(--quantum-border);
            font-size: 12px;
          }

          .breadcrumb-segment {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .breadcrumb-item {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            transition: color 0.2s;
          }

          .breadcrumb-item:hover {
            color: var(--quantum-primary);
          }

          .explorer-contents {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
          }

          .explorer-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            color: rgba(255, 255, 255, 0.8);
          }

          .explorer-item:hover {
            background: rgba(108, 92, 231, 0.1);
          }

          .explorer-item.directory {
            color: var(--quantum-secondary);
          }

          .item-icon {
            margin-right: 8px;
            display: flex;
            align-items: center;
          }

          .item-name {
            flex: 1;
            font-size: 13px;
          }

          .item-actions {
            opacity: 0;
            transition: opacity 0.2s;
          }

          .explorer-item:hover .item-actions {
            opacity: 1;
          }

          .item-menu-btn {
            padding: 4px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            border-radius: 4px;
            cursor: pointer;
          }

          .item-menu-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .empty-directory {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
          }

          .empty-directory svg {
            margin-bottom: 16px;
            opacity: 0.5;
          }

          .create-btn {
            margin-top: 16px;
            padding: 8px 16px;
            background: var(--quantum-primary);
            border: none;
            color: white;
            border-radius: 6px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .create-btn:hover {
            background: var(--quantum-secondary);
            transform: translateY(-2px);
          }

          .create-file-modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            background: var(--quantum-surface-glass);
            backdrop-filter: blur(20px);
            border: 1px solid var(--quantum-border);
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            z-index: 1000;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid var(--quantum-border);
          }

          .modal-header h5 {
            margin: 0;
            color: white;
            font-size: 16px;
          }

          .close-btn {
            padding: 4px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            border-radius: 4px;
          }

          .close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .modal-body {
            padding: 16px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            margin-bottom: 6px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 13px;
          }

          .form-select, .form-input {
            width: 100%;
            padding: 10px 12px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--quantum-border);
            border-radius: 6px;
            color: white;
            font-size: 14px;
            outline: none;
          }

          .form-select:focus, .form-input:focus {
            border-color: var(--quantum-primary);
            box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.2);
          }

          .modal-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            padding: 16px;
            border-top: 1px solid var(--quantum-border);
          }

          .btn-primary, .btn-secondary {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary {
            background: var(--quantum-primary);
            border: none;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: var(--quantum-secondary);
            transform: translateY(-2px);
          }

          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: transparent;
            border: 1px solid var(--quantum-border);
            color: white;
          }

          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .item-dropdown {
            background: var(--quantum-surface-glass);
            backdrop-filter: blur(20px);
            border: 1px solid var(--quantum-border);
            border-radius: 8px;
            padding: 4px;
            min-width: 160px;
          }

          .item-dropdown [role="menuitem"] {
            padding: 8px 12px;
            color: white;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 4px;
            cursor: pointer;
          }

          .item-dropdown [role="menuitem"]:hover {
            background: rgba(108, 92, 231, 0.2);
          }
        `}</style>
      </motion.div>
    );
  };

  const renderRepositoryList = () => {
    if (repositories.length === 0) {
      return (
        <div className="no-repositories">
          <Box size={64} />
          <h3>No repositories found</h3>
          <p>Create your first repository to get started</p>
        </div>
      );
    }

    return (
      <motion.div 
        className={`repository-grid ${viewMode}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {repositories.map((repo, index) => (
          <motion.div
            key={repo.id}
            className="repository-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -4 }}
            onClick={() => selectRepository(repo)}
          >
            <div className="card-header">
              <div className="repo-icon">
                <Box size={24} />
              </div>
              <div className="repo-info">
                <h4 className="repo-name">{repo.name}</h4>
                <span className={`repo-visibility ${repo.is_public ? 'public' : 'private'}`}>
                  {repo.is_public ? <Globe size={12} /> : <Lock size={12} />}
                  {repo.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            <p className="repo-description">
              {repo.description || 'No description provided'}
            </p>

            <div className="repo-meta">
              {repo.language && repo.language !== 'Unknown' && (
                <span className="repo-language">
                  <span className="language-color" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                  {repo.language}
                </span>
              )}
              
              <div className="repo-stats">
                <span className="stat">
                  <Star size={14} />
                  {repo.star_count}
                </span>
                <span className="stat">
                  <GitFork size={14} />
                  {repo.fork_count}
                </span>
                <span className="stat">
                  <Bug size={14} />
                  {repo.issue_count}
                </span>
                <span className="stat">
                  <Eye size={14} />
                  {repo.watcher_count || 0}
                </span>
              </div>
            </div>

            <div className="card-footer">
              <div className="repo-owner">
                <img 
                  src={repo.owner?.avatar_url || '/default-avatar.png'}
                  alt={repo.owner?.username}
                  className="owner-avatar"
                />
                <span className="owner-name">{repo.owner?.username || 'Anonymous'}</span>
              </div>
              
              <span className="repo-updated">
                Updated {formatDistanceToNow(new Date(repo.updated_at || repo.created_at))} ago
              </span>
            </div>

            <div className="card-actions">
              <button 
                className={`action-btn star-btn ${repo.is_starred ? 'starred' : ''}`}
                onClick={(e) => { e.stopPropagation(); starRepository(repo); }}
              >
                <Star size={14} />
                {repo.is_starred ? 'Starred' : 'Star'}
              </button>
              
              <button 
                className={`action-btn watch-btn ${repo.is_watching ? 'watching' : ''}`}
                onClick={(e) => { e.stopPropagation(); watchRepository(repo); }}
              >
                <Eye size={14} />
                {repo.is_watching ? 'Watching' : 'Watch'}
              </button>
              
              <button 
                className="action-btn fork-btn"
                onClick={(e) => { e.stopPropagation(); forkRepository(repo); }}
              >
                <GitFork size={14} />
                Fork
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderRepositoryView = () => {
    if (!selectedRepo || !repoContent) return null;

    return (
      <div className="quantum-repository-view">
        <div className="repo-view-sidebar">
          {renderFileExplorer()}
        </div>
        
        <div className="repo-view-main">
          <div className="repo-view-header">
            <div className="repo-header-left">
              <button className="back-btn" onClick={() => setSelectedRepo(null)}>
                <ArrowLeft size={16} />
                Back to repositories
              </button>
              
              <div className="repo-header-info">
                <h2>{selectedRepo.name}</h2>
                <span className="repo-header-visibility">
                  {selectedRepo.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            <div className="repo-header-actions">
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button className="header-btn" onClick={exportRepository}>
                      <Download size={16} />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Download repository</Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button className="header-btn" onClick={() => setShowStats(!showStats)}>
                      <Activity size={16} />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Repository statistics</Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button className="header-btn" onClick={() => setShowGraph(!showGraph)}>
                      <Layers size={16} />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Contribution graph</Tooltip.Content>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          </div>

          <div className="repo-view-tabs">
            <button className={`repo-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
              <Code size={14} /> Code
            </button>
            <button className={`repo-tab ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>
              <Bug size={14} /> Issues {issues.length > 0 && <span className="tab-badge">{issues.length}</span>}
            </button>
            <button className={`repo-tab ${activeTab === 'pull-requests' ? 'active' : ''}`} onClick={() => setActiveTab('pull-requests')}>
              <GitPullRequest size={14} /> Pull Requests {pullRequests.length > 0 && <span className="tab-badge">{pullRequests.length}</span>}
            </button>
            <button className={`repo-tab ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
              <GitBranch size={14} /> Branches {branches.length > 0 && <span className="tab-badge">{branches.length}</span>}
            </button>
            <button className={`repo-tab ${activeTab === 'releases' ? 'active' : ''}`} onClick={() => setActiveTab('releases')}>
              <Tag size={14} /> Releases {releases.length > 0 && <span className="tab-badge">{releases.length}</span>}
            </button>
          </div>

          <div className="repo-view-content">
            {editingFile ? (
              <QuantumCodeEditor
                file={editingFile}
                onSave={saveFile}
                onClose={() => setEditingFile(null)}
                repository={selectedRepo}
                user={user}
                addNotification={addNotification}
                quantumEffects={{ chaosLevel: 0 }}
              />
            ) : activeTab === 'code' ? (
              <div className="code-view">
                {readme && (
                  <div className="readme-section">
                    <div className="readme-header">
                      <BookOpen size={16} />
                      <h3>README.md</h3>
                    </div>
                    <div className="readme-content markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {readme}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                <div className="files-section">
                  <div className="files-header">
                    <h4>Files</h4>
                    <span className="files-count">{repoContent.files?.length || 0} files</span>
                  </div>
                  
                  <div className="files-grid">
                    {repoContent.files?.map((file, index) => (
                      <div 
                        key={index} 
                        className="file-item"
                        onClick={() => setEditingFile(file)}
                      >
                        <div className="file-icon">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-meta">
                            {file.language} • {file.size} bytes
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'issues' ? (
              <div className="issues-view">
                <div className="issues-header">
                  <h3>Issues</h3>
                  <button className="create-issue-btn" onClick={createIssue}>
                    <Plus size={14} /> New Issue
                  </button>
                </div>
                
                {issues.length === 0 ? (
                  <div className="empty-issues">
                    <Bug size={48} />
                    <p>No open issues</p>
                  </div>
                ) : (
                  <div className="issues-list">
                    {issues.map(issue => (
                      <div key={issue.id} className="issue-item">
                        <div className="issue-icon">
                          <Bug size={16} />
                        </div>
                        <div className="issue-content">
                          <h4>{issue.title}</h4>
                          <p className="issue-meta">
                            #{issue.number || issue.id.slice(0, 6)} opened {formatDistanceToNow(new Date(issue.created_at))} ago by {issue.user_id?.slice(0, 6) || 'unknown'}
                          </p>
                        </div>
                        <span className={`issue-status ${issue.status}`}>
                          {issue.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'pull-requests' ? (
              <div className="prs-view">
                <div className="prs-header">
                  <h3>Pull Requests</h3>
                  <button className="create-pr-btn" onClick={createPullRequest}>
                    <GitPullRequest size={14} /> New Pull Request
                  </button>
                </div>
                
                {pullRequests.length === 0 ? (
                  <div className="empty-prs">
                    <GitPullRequest size={48} />
                    <p>No pull requests</p>
                  </div>
                ) : (
                  <div className="prs-list">
                    {pullRequests.map(pr => (
                      <div key={pr.id} className="pr-item">
                        <div className="pr-icon">
                          <GitPullRequest size={16} />
                        </div>
                        <div className="pr-content">
                          <h4>{pr.title}</h4>
                          <p className="pr-meta">
                            #{pr.id.slice(0, 6)} wants to merge {pr.commits || 0} commits into {pr.base_branch || 'main'} from {pr.head_branch || 'unknown'}
                          </p>
                        </div>
                        <span className={`pr-status ${pr.status}`}>
                          {pr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'branches' ? (
              <div className="branches-view">
                <div className="branches-header">
                  <h3>Branches</h3>
                  <button className="create-branch-btn" onClick={createBranch}>
                    <GitBranch size={14} /> New Branch
                  </button>
                </div>
                
                <div className="branches-list">
                  {branches.map((branch, index) => (
                    <div key={branch.id || index} className="branch-item">
                      <div className="branch-icon">
                        <GitBranch size={16} />
                      </div>
                      <div className="branch-content">
                        <h4>
                          {branch.name}
                          {branch.is_default && <span className="default-badge">default</span>}
                        </h4>
                        <p className="branch-meta">
                          Updated {formatDistanceToNow(new Date(branch.updated_at || Date.now()))} ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'releases' ? (
              <div className="releases-view">
                <div className="releases-header">
                  <h3>Releases</h3>
                  <button className="create-release-btn" onClick={createRelease}>
                    <Tag size={14} /> New Release
                  </button>
                </div>
                
                {releases.length === 0 ? (
                  <div className="empty-releases">
                    <Tag size={48} />
                    <p>No releases yet</p>
                  </div>
                ) : (
                  <div className="releases-list">
                    {releases.map(release => (
                      <div key={release.id} className="release-item">
                        <div className="release-icon">
                          <Tag size={16} />
                        </div>
                        <div className="release-content">
                          <h4>{release.tag_name}</h4>
                          <p className="release-title">{release.title}</p>
                          <p className="release-meta">
                            {release.prerelease ? 'Pre-release' : 'Latest'} • 
                            Released {formatDistanceToNow(new Date(release.created_at))} ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Statistics Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div 
              className="stats-panel"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
            >
              <div className="stats-header">
                <h3>Repository Statistics</h3>
                <button className="close-btn" onClick={() => setShowStats(false)}>
                  <X size={16} />
                </button>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <GitCommit size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{repoStats.commits}</span>
                    <span className="stat-label">Commits</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <GitBranch size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{repoStats.branches}</span>
                    <span className="stat-label">Branches</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{repoStats.contributors}</span>
                    <span className="stat-label">Contributors</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Tag size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{repoStats.releases}</span>
                    <span className="stat-label">Releases</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Database size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{repoStats.size} KB</span>
                    <span className="stat-label">Size</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Code size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{repoStats.lines}</span>
                    <span className="stat-label">Lines of Code</span>
                  </div>
                </div>
              </div>

              <div className="stats-chart">
                <h4>Activity (Last 30 Days)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={activity}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#ccc"
                      tick={{ fill: '#ccc', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#ccc"
                      tick={{ fill: '#ccc', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1e1e1e', 
                        border: '1px solid #6c5ce7',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6c5ce7" 
                      fillOpacity={1} 
                      fill="url(#colorActivity)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-contributors">
                <h4>Top Contributors</h4>
                <div className="contributors-list">
                  {contributors.slice(0, 5).map((contributor, i) => (
                    <div key={i} className="contributor-item">
                      <div className="contributor-avatar">
                        {contributor.author_name?.[0] || 'U'}
                      </div>
                      <div className="contributor-info">
                        <span className="contributor-name">{contributor.author_name || 'Unknown'}</span>
                        <span className="contributor-commits">{contributor.count} commits</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx>{`
          .quantum-repository-view {
            display: flex;
            height: 100%;
            position: relative;
          }

          .repo-view-sidebar {
            width: 280px;
            flex-shrink: 0;
            height: 100%;
            overflow: hidden;
          }

          .repo-view-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--quantum-surface);
          }

          .repo-view-header {
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--quantum-border);
          }

          .repo-header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .back-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: transparent;
            border: 1px solid var(--quantum-border);
            color: white;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .back-btn:hover {
            background: rgba(108, 92, 231, 0.1);
            border-color: var(--quantum-primary);
          }

          .repo-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .repo-header-info h2 {
            margin: 0;
            font-size: 20px;
            color: white;
          }

          .repo-header-visibility {
            padding: 4px 8px;
            background: rgba(108, 92, 231, 0.2);
            border: 1px solid var(--quantum-primary);
            border-radius: 4px;
            font-size: 11px;
            color: var(--quantum-primary);
          }

          .repo-header-actions {
            display: flex;
            gap: 8px;
          }

          .header-btn {
            padding: 8px;
            background: transparent;
            border: 1px solid var(--quantum-border);
            color: white;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .header-btn:hover {
            background: var(--quantum-primary);
            border-color: var(--quantum-primary);
          }

          .repo-view-tabs {
            display: flex;
            gap: 4px;
            padding: 0 24px;
            border-bottom: 1px solid var(--quantum-border);
          }

          .repo-tab {
            padding: 12px 16px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            position: relative;
          }

          .repo-tab:hover {
            color: white;
          }

          .repo-tab.active {
            color: var(--quantum-primary);
          }

          .repo-tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--quantum-primary);
          }

          .tab-badge {
            padding: 2px 6px;
            background: rgba(108, 92, 231, 0.2);
            border-radius: 12px;
            font-size: 11px;
          }

          .repo-view-content {
            flex: 1;
            overflow: auto;
            padding: 24px;
          }

          .code-view {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .readme-section {
            background: var(--quantum-surface-glass);
            border: 1px solid var(--quantum-border);
            border-radius: 12px;
            overflow: hidden;
          }

          .readme-header {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid var(--quantum-border);
          }

          .readme-header h3 {
            margin: 0;
            font-size: 16px;
            color: white;
          }

          .readme-content {
            padding: 24px;
            color: white;
          }

          .files-section {
            background: var(--quantum-surface-glass);
            border: 1px solid var(--quantum-border);
            border-radius: 12px;
            overflow: hidden;
          }

          .files-header {
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--quantum-border);
          }

          .files-header h4 {
            margin: 0;
            font-size: 16px;
            color: white;
          }

          .files-count {
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
          }

          .files-grid {
            padding: 16px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
          }

          .file-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .file-item:hover {
            background: rgba(108, 92, 231, 0.1);
            border-color: var(--quantum-primary);
          }

          .file-icon {
            color: var(--quantum-secondary);
          }

          .file-details {
            flex: 1;
            min-width: 0;
          }

          .file-name {
            display: block;
            color: white;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .file-meta {
            display: block;
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
          }

          .stats-panel {
            position: absolute;
            top: 0;
            right: 0;
            width: 400px;
            height: 100%;
            background: var(--quantum-surface-glass);
            backdrop-filter: blur(20px);
            border-left: 1px solid var(--quantum-border);
            padding: 24px;
            overflow-y: auto;
            z-index: 100;
          }

          .stats-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }

          .stats-header h3 {
            margin: 0;
            color: white;
            font-size: 18px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }

          .stat-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--quantum-border);
            border-radius: 12px;
          }

          .stat-icon {
            color: var(--quantum-primary);
          }

          .stat-info {
            display: flex;
            flex-direction: column;
          }

          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: white;
            line-height: 1;
          }

          .stat-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
          }

          .stats-chart {
            margin-bottom: 24px;
          }

          .stats-chart h4 {
            margin: 0 0 16px 0;
            color: white;
            font-size: 14px;
          }

          .stats-contributors h4 {
            margin: 0 0 16px 0;
            color: white;
            font-size: 14px;
          }

          .contributors-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .contributor-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
          }

          .contributor-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-accent));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
          }

          .contributor-info {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .contributor-name {
            color: white;
            font-size: 13px;
            font-weight: 500;
          }

          .contributor-commits {
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
          }

          @media (max-width: 1200px) {
            .repo-view-sidebar {
              position: absolute;
              z-index: 10;
              background: var(--quantum-surface);
              transform: translateX(-100%);
              transition: transform 0.3s;
            }

            .repo-view-sidebar.open {
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    );
  };

  const getLanguageColor = (language) => {
    const colors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'C++': '#f34b7d',
      'C': '#555555',
      'C#': '#178600',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'PHP': '#4F5D95'
    };
    return colors[language] || '#6c5ce7';
  };

  if (loading) {
    return (
      <div className="quantum-loading-screen">
        <div className="quantum-spinner-cosmic"></div>
        <p>Initializing Quantum Repository System...</p>
      </div>
    );
  }

  return (
    <div className="quantum-community-container">
      {/* Quantum Background */}
      <div className="quantum-community-bg" />
      
      {/* Main Content */}
      <div className="quantum-community-content">
        {/* Header */}
        <header className="quantum-community-header">
          <div className="header-left">
            <div className="community-logo">
              <Box size={24} />
              <h1>Quantum Repositories</h1>
            </div>
          </div>

          <div className="header-right">
            {user ? (
              <div className="user-menu">
                <div className="user-profile">
                  <img 
                    src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '/default-avatar.png'}
                    alt={profile?.username || user?.email}
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <span className="user-name">{profile?.username || user?.email?.split('@')[0]}</span>
                    <span className="user-email">{user?.email}</span>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  <Power size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <button className="login-btn" onClick={handleGoogleLogin}>
                <img src="/google-icon.svg" alt="Google" width={16} height={16} />
                Continue with Google
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        {selectedRepo ? (
          renderRepositoryView()
        ) : (
          <>
            {/* Search and Filters */}
            <div className="community-filters">
              <div className="search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filters-group">
                <select 
                  className="filter-select"
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                >
                  <option value="all">All Languages</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                </select>

                <select 
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="updated">Last updated</option>
                  <option value="stars">Most stars</option>
                  <option value="forks">Most forks</option>
                  <option value="name">Name</option>
                  <option value="created">Newest</option>
                </select>

                <div className="view-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid size={16} />
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="community-tabs">
              {['repositories', 'my-repos', 'starred'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'repositories' && <Globe size={14} />}
                  {tab === 'my-repos' && <Box size={14} />}
                  {tab === 'starred' && <Star size={14} />}
                  {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>

            {/* Repository Grid */}
            {contentLoading ? (
              <div className="loading-repos">
                <div className="quantum-spinner"></div>
                <p>Loading quantum repositories...</p>
              </div>
            ) : (
              renderRepositoryList()
            )}

            {/* Create Repository Form */}
            {user && (
              <motion.div 
                className="create-repo-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="section-header">
                  <h2>Create New Repository</h2>
                  <button className="import-btn" onClick={importRepository}>
                    <Download size={14} />
                    Import Repository
                  </button>
                </div>

                <form onSubmit={createRepository} className="create-repo-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Repository Name *</label>
                      <input
                        type="text"
                        placeholder="my-awesome-project"
                        value={newContent.name}
                        onChange={(e) => setNewContent({...newContent, name: e.target.value})}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        placeholder="Short description of your repository"
                        value={newContent.description}
                        onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Template</label>
                      <select
                        value={newContent.template}
                        onChange={(e) => setNewContent({...newContent, template: e.target.value})}
                        className="form-select"
                      >
                        <option value="blank">Blank Repository</option>
                        <option value="react">React Application</option>
                        <option value="node">Node.js Project</option>
                        <option value="python">Python Project</option>
                        <option value="nextjs">Next.js Application</option>
                        <option value="threejs">Three.js 3D Scene</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>.gitignore</label>
                      <select
                        value={newContent.gitignore}
                        onChange={(e) => setNewContent({...newContent, gitignore: e.target.value})}
                        className="form-select"
                      >
                        <option value="none">None</option>
                        <option value="Node">Node</option>
                        <option value="Python">Python</option>
                        <option value="Java">Java</option>
                        <option value="React">React</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>License</label>
                      <select
                        value={newContent.license}
                        onChange={(e) => setNewContent({...newContent, license: e.target.value})}
                        className="form-select"
                      >
                        <option value="none">None</option>
                        <option value="MIT">MIT</option>
                        <option value="Apache-2.0">Apache 2.0</option>
                        <option value="GPL-3.0">GPL 3.0</option>
                        <option value="BSD-3-Clause">BSD 3-Clause</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newContent.readme}
                        onChange={(e) => setNewContent({...newContent, readme: e.target.checked})}
                      />
                      Add README.md
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newContent.is_public}
                        onChange={(e) => setNewContent({...newContent, is_public: e.target.checked})}
                      />
                      Public repository
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={!newContent.name || contentLoading}
                  >
                    {contentLoading ? 'Creating...' : 'Create Repository'}
                  </button>
                </form>
              </motion.div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .quantum-community-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          background: radial-gradient(circle at 50% 0%, var(--quantum-void) 0%, var(--quantum-deep-space) 100%);
        }

        .quantum-community-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(108, 92, 231, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(162, 155, 254, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .quantum-community-content {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }

        .quantum-community-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .community-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .community-logo h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          background: linear-gradient(135deg, #fff, var(--quantum-secondary));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--quantum-border);
          border-radius: 50px;
          padding: 8px 16px;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--quantum-primary);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          color: white;
          font-size: 13px;
          font-weight: 500;
        }

        .user-email {
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
        }

        .logout-btn, .login-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .logout-btn:hover {
          background: rgba(244, 67, 54, 0.2);
        }

        .login-btn {
          background: var(--quantum-primary);
          color: white;
        }

        .login-btn:hover {
          background: var(--quantum-secondary);
          transform: translateY(-2px);
        }

        .community-filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--quantum-border);
          border-radius: 50px;
          flex: 1;
          max-width: 400px;
        }

        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 14px;
          outline: none;
        }

        .search-bar input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .filters-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-select {
          padding: 8px 16px;
          background: var(--quantum-surface-glass);
          border: 1px solid var(--quantum-border);
          border-radius: 30px;
          color: white;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--quantum-surface-glass);
          border: 1px solid var(--quantum-border);
          border-radius: 30px;
        }

        .view-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn:hover {
          color: white;
        }

        .view-btn.active {
          background: var(--quantum-primary);
          color: white;
        }

        .community-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--quantum-border);
          padding-bottom: 16px;
        }

        .tab-btn {
          padding: 8px 20px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 30px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: white;
          border-color: var(--quantum-border);
        }

        .tab-btn.active {
          background: var(--quantum-primary);
          color: white;
          border-color: var(--quantum-primary);
        }

        .repository-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .repository-card {
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--quantum-border);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
        }

        .repository-card:hover {
          border-color: var(--quantum-primary);
          box-shadow: 0 10px 30px rgba(108, 92, 231, 0.2);
          transform: translateY(-4px);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .repo-icon {
          padding: 8px;
          background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-accent));
          border-radius: 12px;
          color: white;
        }

        .repo-info {
          flex: 1;
        }

        .repo-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .repo-visibility {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }

        .repo-visibility.public {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }

        .repo-visibility.private {
          background: rgba(244, 67, 54, 0.1);
          color: #f44336;
        }

        .repo-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 16px;
          min-height: 40px;
        }

        .repo-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .repo-language {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .language-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .repo-stats {
          display: flex;
          gap: 12px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .repo-owner {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .owner-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid var(--quantum-border);
        }

        .owner-name {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .repo-updated {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .card-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .repository-card:hover .card-actions {
          opacity: 1;
        }

        .action-btn {
          flex: 1;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--quantum-border);
          color: white;
          border-radius: 6px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(108, 92, 231, 0.2);
          border-color: var(--quantum-primary);
        }

        .action-btn.star-btn.starred {
          background: rgba(255, 193, 7, 0.2);
          border-color: #ffc107;
          color: #ffc107;
        }

        .action-btn.watch-btn.watching {
          background: rgba(76, 175, 80, 0.2);
          border-color: #4caf50;
          color: #4caf50;
        }

        .create-repo-section {
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--quantum-border);
          border-radius: 24px;
          padding: 24px;
          margin-top: 40px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 20px;
          color: white;
        }

        .import-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--quantum-border);
          color: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .import-btn:hover {
          background: var(--quantum-primary);
          border-color: var(--quantum-primary);
        }

        .create-repo-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 500;
        }

        .form-input, .form-select {
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--quantum-border);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          outline: none;
        }

        .form-input:focus, .form-select:focus {
          border-color: var(--quantum-primary);
          box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.2);
        }

        .form-options {
          display: flex;
          gap: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .submit-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-accent));
          border: none;
          color: white;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(108, 92, 231, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .no-repositories {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .no-repositories svg {
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .no-repositories h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: white;
        }

        .no-repositories p {
          margin: 0;
          font-size: 14px;
        }

        .loading-repos {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 16px;
        }

        .quantum-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(108, 92, 231, 0.3);
          border-top-color: var(--quantum-primary);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .quantum-community-content {
            padding: 16px;
          }

          .community-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .search-bar {
            max-width: none;
          }

          .filters-group {
            flex-wrap: wrap;
          }

          .repository-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
