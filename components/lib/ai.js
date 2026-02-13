// Mock AI completion for development
export async function getAICompletion(code) {
  // In production, this would call an actual AI API
  // For now, provide helpful suggestions based on code
  
  const suggestions = {
    'THREE.': `// THREE.js AI Suggestion:
// Add advanced material properties for better visuals
const material = new THREE.MeshPhysicalMaterial({
  color: 0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')},
  metalness: 0.5,
  roughness: 0.5,
  clearcoat: 0.5,
  clearcoatRoughness: 0.2,
  transmission: 0.5,
  thickness: 1.5,
  ior: 1.5,
  emissive: 0x000000,
  emissiveIntensity: 0.2
});`,
    
    'createObject': `// AI Enhancement: Add physics and interaction
mesh.userData = {
  interactable: true,
  onClick: () => {
    console.log('Object clicked!');
    gsap.to(mesh.scale, {
      duration: 0.3,
      x: 1.5,
      y: 1.5,
      z: 1.5,
      yoyo: true,
      repeat: 1
    });
  },
  onHover: () => {
    material.emissive.setHex(0xff0000);
    material.emissiveIntensity = 0.5;
  },
  onLeave: () => {
    material.emissive.setHex(0x000000);
    material.emissiveIntensity = 0;
  }
};`,
    
    'function': `// AI Suggestion: Add error handling and logging
try {
  // Your code here
  console.log('Function executed successfully');
} catch (error) {
  console.error('Error:', error);
  // Add recovery logic here
}`,
    
    'default': `// AI Suggestion: Optimize performance
// Consider using:
// 1. Object pooling for frequently created objects
// 2. InstancedMesh for multiple similar objects
// 3. Remove unused event listeners
// 4. Use throttle/debounce for frequent updates

// Example optimization:
const objectPool = [];
function getFromPool() {
  if (objectPool.length > 0) {
    return objectPool.pop();
  }
  return createNewObject();
}

function returnToPool(obj) {
  objectPool.push(obj);
}`
  };

  // Determine which suggestion to use based on code
  let selectedSuggestion = suggestions.default;
  
  if (code.includes('THREE.Mesh') || code.includes('new THREE.')) {
    selectedSuggestion = suggestions['THREE.'];
  } else if (code.includes('createObject') || code.includes('export function')) {
    selectedSuggestion = suggestions.createObject;
  } else if (code.includes('function') && code.includes('{') && code.includes('}')) {
    selectedSuggestion = suggestions.function;
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return selectedSuggestion;
}

// AI-powered code analysis
export async function analyzeCode(code) {
  const lines = code.split('\n').length;
  const characters = code.length;
  const functions = (code.match(/function\s+\w+|export\s+function|\w+\s*=\s*\(.*\)\s*=>/g) || []).length;
  const threeImports = (code.match(/THREE\.\w+/g) || []).length;
  
  return {
    lines,
    characters,
    functions,
    threeImports,
    complexity: Math.min(Math.floor(functions * 3 + threeImports * 0.5), 10),
    suggestions: [
      functions > 5 ? 'Consider breaking code into smaller modules' : null,
      threeImports > 10 ? 'Optimize Three.js imports for performance' : null,
      lines > 100 ? 'File getting large - consider splitting' : null,
    ].filter(Boolean)
  };
}

// AI code optimization
export async function optimizeCode(code) {
  // Simple optimizations
  let optimized = code;
  
  // Replace var with let/const
  optimized = optimized.replace(/\bvar\s+(\w+)/g, (match, name) => {
    return `let ${name}`;
  });
  
  // Add missing semicolons (basic)
  optimized = optimized.replace(/(\w+)(\s*=\s*.+)(\n|$)/g, (match, name, value) => {
    if (!match.trim().endsWith(';')) {
      return `${name}${value};`;
    }
    return match;
  });
  
  // Suggest const for variables that aren't reassigned
  const lines = optimized.split('\n');
  const variables = new Map();
  
  lines.forEach((line, i) => {
    const letMatch = line.match(/let\s+(\w+)\s*=/);
    if (letMatch) {
      const varName = letMatch[1];
      if (!variables.has(varName)) {
        variables.set(varName, { line: i, reassigned: false });
      }
    }
    
    // Check for reassignment
    const reassignMatch = line.match(new RegExp(`\\b${varName}\\s*=`));
    if (reassignMatch) {
      const varData = variables.get(varName);
      if (varData) {
        varData.reassigned = true;
      }
    }
  });
  
  // Replace let with const where appropriate
  variables.forEach((data, varName) => {
    if (!data.reassigned) {
      lines[data.line] = lines[data.line].replace(`let ${varName}`, `const ${varName}`);
    }
  });
  
  return lines.join('\n');
}
