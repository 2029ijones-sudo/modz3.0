import { NextResponse } from 'next/server';

// Validate and parse code (no execution) - FIXED VERSION
export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'No code provided' 
      }, { status: 400 });
    }
    
    // Only parse if code is relatively small (avoid DoS)
    if (code.length > 100000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Code too large (max 100KB)' 
      }, { status: 400 });
    }
    
    // Try to parse with acorn if available, otherwise use basic validation
    let ast = null;
    let syntaxValid = true;
    let parseError = null;
    let acornAvailable = false;
    
    try {
      // Dynamic import to avoid build issues
      const acorn = await import('acorn');
      const acornLoose = await import('acorn-loose');
      
      acornAvailable = true;
      
      try {
        ast = acorn.parse(code, {
          ecmaVersion: 'latest',
          sourceType: 'module'
        });
      } catch (strictError) {
        // Try loose parsing
        ast = acornLoose.parse(code, {
          ecmaVersion: 'latest',
          sourceType: 'module'
        });
      }
    } catch (importError) {
      console.log('Acorn not available, using basic validation:', importError.message);
      // Fallback to basic validation
      try {
        // Simple validation that doesn't execute
        new Function(code);
      } catch (basicError) {
        syntaxValid = false;
        parseError = basicError.message;
      }
    }
    
    // Analyze the code
    const lines = code.split('\n').length;
    const sizeBytes = new Blob([code]).size;
    
    // Check for library usage (simple string matching)
    const hasThreeJS = /THREE\.|three|import.*three|from.*three/i.test(code);
    const hasPhysics = /CANNON\.|cannon|import.*cannon|from.*cannon/i.test(code);
    const hasGSAP = /gsap\.|import.*gsap|from.*gsap/i.test(code);
    const hasLodash = /lodash\.|import.*lodash|from.*lodash|_\./i.test(code);
    const hasP5 = /p5\.|import.*p5|from.*p5/i.test(code);
    const hasMatter = /matter\.|import.*matter|from.*matter/i.test(code);
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      'eval',
      'Function(',
      'setTimeout(',
      'setInterval(',
      'require(',
      'fetch(',
      'XMLHttpRequest',
      'document.',
      'window.',
      'localStorage',
      'sessionStorage',
      'indexedDB'
    ];
    
    const foundDangerous = dangerousPatterns.filter(pattern => 
      code.includes(pattern)
    );
    
    // Count functions and variables if AST is available
    let functionCount = 0;
    let variableCount = 0;
    let importCount = 0;
    
    if (ast && acornAvailable) {
      const traverse = (node) => {
        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
          functionCount++;
        }
        if (node.type === 'VariableDeclaration') {
          variableCount += node.declarations?.length || 0;
        }
        if (node.type === 'ImportDeclaration') {
          importCount++;
        }
        
        for (const key in node) {
          if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              node[key].forEach(traverse);
            } else {
              traverse(node[key]);
            }
          }
        }
      };
      
      traverse(ast);
    } else {
      // Fallback counts
      functionCount = (code.match(/function\s+\w+\s*\(|\([^)]*\)\s*=>|\basync\s+function/g) || []).length;
      importCount = (code.match(/import\s+.*\s+from/g) || []).length;
      variableCount = (code.match(/\b(const|let|var)\s+\w+/g) || []).length;
    }
    
    // Create analysis result
    const analysis = {
      lines,
      characters: code.length,
      sizeBytes,
      functions: functionCount,
      variables: variableCount,
      imports: importCount,
      libraries: {
        hasThreeJS,
        hasPhysics, 
        hasGSAP,
        hasLodash,
        hasP5,
        hasMatter
      },
      dangerousPatterns: foundDangerous,
      syntaxValid: syntaxValid && !parseError,
      parseError: parseError || null,
      acornUsed: acornAvailable
    };
    
    // Create simulated result WITHOUT importing actual libraries
    const simulatedResult = {
      librariesAvailable: {
        THREE: hasThreeJS ? 'Detected in code' : 'Not used',
        CANNON: hasPhysics ? 'Detected in code' : 'Not used', 
        gsap: hasGSAP ? 'Detected in code' : 'Not used',
        lodash: hasLodash ? 'Detected in code' : 'Not used',
        uuid: code.includes('uuid') ? 'Detected' : 'Not used',
        p5: hasP5 ? 'Detected in code' : 'Not used',
        matter: hasMatter ? 'Detected in code' : 'Not used'
      },
      objectsCreated: hasThreeJS ? '3D objects would be created' : 0,
      physicsBodies: hasPhysics ? 'Physics bodies would be created' : 0,
      animations: hasGSAP ? 'Animations would run' : 0,
      utilityFunctions: hasLodash ? 'Utility functions available' : 0,
      executionTime: 'Simulated 100ms',
      memoryUsed: 'Simulated 25MB',
      timestamp: new Date().toISOString(),
      note: 'This is code validation only. Actual execution requires a secure sandbox environment.'
    };
    
    return NextResponse.json({ 
      success: true, 
      message: syntaxValid ? 'Code validated successfully' : 'Code has syntax issues',
      analysis,
      simulatedResult,
      warning: foundDangerous.length > 0 ? 
        `Code contains potentially dangerous patterns: ${foundDangerous.join(', ')}` : 
        undefined
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Code validation failed'
    }, { status: 500 });
  }
}

// Runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
