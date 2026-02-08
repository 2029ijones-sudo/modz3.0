import { NextResponse } from 'next/server';
import { VM } from 'vm2';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { gsap } from 'gsap';

// Safe sandbox for code execution
export async function POST(request) {
  try {
    const { code } = await request.json();
    
    // Create isolated VM
    const vm = new VM({
      timeout: 5000,
      sandbox: {
        THREE,
        CANNON,
        gsap,
        console: {
          log: (...args) => console.log('[Sandbox]:', ...args),
          error: (...args) => console.error('[Sandbox]:', ...args),
          warn: (...args) => console.warn('[Sandbox]:', ...args)
        },
        Math,
        Date,
        setTimeout: (fn, delay) => setTimeout(fn, delay),
        setInterval: (fn, interval) => setInterval(fn, interval),
        clearTimeout: (id) => clearTimeout(id),
        clearInterval: (id) => clearInterval(id),
        // Whitelisted packages
        lodash: require('lodash'),
        uuid: require('uuid'),
        p5: require('p5'),
        matter: require('matter-js')
      }
    });

    // Execute code in sandbox
    const result = vm.run(`
      (function() {
        "use strict";
        ${code}
        
        // Return the created object if any
        if (typeof createObject !== 'undefined') {
          return createObject();
        }
        return null;
      })();
    `);

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Code executed successfully'
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Execution failed'
    }, { status: 500 });
  }
}
