import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';

// Custom linter for Three.js/Modz specific code
export const jsLinter = (view) => {
  const diagnostics = [];
  const tree = syntaxTree(view.state);

  // Get all nodes
  tree.iterate({
    enter: (node) => {
      // Basic syntax error detection
      if (node.name === 'ERROR') {
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'error',
          message: 'Syntax error',
        });
      }
    },
  });

  // Custom rule: Check for dangerous patterns
  const code = view.state.doc.toString();
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const from = view.state.doc.line(lineNumber).from;

    // Rule 1: No eval
    if (line.includes('eval(')) {
      diagnostics.push({
        from: from + line.indexOf('eval('),
        to: from + line.indexOf('eval(') + 4,
        severity: 'error',
        message: 'Avoid eval() - security risk',
      });
    }

    // Rule 2: No Function constructor
    if (line.includes('Function(')) {
      diagnostics.push({
        from: from + line.indexOf('Function('),
        to: from + line.indexOf('Function(') + 8,
        severity: 'warning',
        message: 'Avoid Function constructor - use regular functions',
      });
    }

    // Rule 3: Check for missing THREE prefix
    const threeObjects = ['Mesh', 'Geometry', 'Material', 'Scene', 'Camera', 'Light'];
    threeObjects.forEach((obj) => {
      const regex = new RegExp(`(?<!THREE\\.|import.*from.*['"]three['"])${obj}\\b`);
      if (regex.test(line)) {
        diagnostics.push({
          from: from + line.indexOf(obj),
          to: from + line.indexOf(obj) + obj.length,
          severity: 'warning',
          message: `Consider using THREE.${obj} if you imported Three.js`,
        });
      }
    });

    // Rule 4: Check for performance issues
    if (line.includes('setInterval(') || line.includes('setTimeout(')) {
      const match = line.match(/(setInterval|setTimeout)\(/);
      if (match) {
        const funcName = match[1];
        const index = line.indexOf(funcName);
        diagnostics.push({
          from: from + index,
          to: from + index + funcName.length,
          severity: 'info',
          message: `${funcName} detected - remember to clear with clearInterval/clearTimeout`,
        });
      }
    }

    // Rule 5: Check for infinite loops
    const loopPatterns = [/for\s*\(\s*;\s*;\s*\)/, /while\s*\(\s*true\s*\)/];
    loopPatterns.forEach((pattern) => {
      if (pattern.test(line)) {
        const match = line.match(pattern);
        if (match) {
          diagnostics.push({
            from: from + line.indexOf(match[0]),
            to: from + line.indexOf(match[0]) + match[0].length,
            severity: 'warning',
            message: 'Potential infinite loop - add break condition',
          });
        }
      }
    });
  });

  // Check for common Three.js mistakes
  if (code.includes('new THREE.Mesh()')) {
    diagnostics.push({
      from: 0,
      to: 0,
      severity: 'error',
      message: 'THREE.Mesh requires geometry and material parameters',
    });
  }

  if (code.includes('renderer.render()') && !code.includes('requestAnimationFrame')) {
    diagnostics.push({
      from: 0,
      to: 0,
      severity: 'info',
      message: 'Use requestAnimationFrame for smooth animations',
    });
  }

  return diagnostics;
};

// Additional helper function for CodeMirror
export const createLinter = () => {
  return linter(jsLinter);
};

// Simple validation for the run button
export const validateCode = (code) => {
  const errors = [];
  const warnings = [];

  if (!code.trim()) {
    errors.push('Code is empty');
    return { isValid: false, errors, warnings };
  }

  // Check for required Three.js import
  if (code.includes('THREE.') && !code.includes('import') && !code.includes('from') && !code.includes('three')) {
    warnings.push('THREE used but no import detected - ensure Three.js is loaded');
  }

  // Check for canvas/world setup
  if (code.includes('new THREE.WebGLRenderer') && !code.includes('appendChild')) {
    warnings.push('Remember to add renderer to DOM with appendChild()');
  }

  // Check for animation loop
  if (code.includes('animate()') && !code.includes('requestAnimationFrame')) {
    warnings.push('animate() defined but not called with requestAnimationFrame');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
