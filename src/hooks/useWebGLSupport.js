/**
 * useWebGLSupport.js
 * Comprehensive WebGL / WebGL2 feature detection, hardware acceleration checking,
 * and context loss resilience hook for the Kimi Antonelli 3D experience.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Pure WebGL support check matching test suite contract
 * @param {HTMLCanvasElement|null} [mockCanvas]
 * @returns {boolean}
 */
export function checkWebGLSupport(mockCanvas) {
  if (mockCanvas) {
    try {
      const gl = mockCanvas.getContext('webgl2') || mockCanvas.getContext('webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true; // SSR safe default
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const supported = !!gl;
    if (gl) {
      const loseExt = gl.getExtension('WEBGL_lose_context');
      if (loseExt) {
        loseExt.loseContext();
      }
    }
    return supported;
  } catch {
    return false;
  }
}

/**
 * Detailed detection including software rendering check
 * @returns {{ isSupported: boolean, isSoftware: boolean, error: string | null }}
 */
export function detectWebGLDetails() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { isSupported: true, isSoftware: false, error: null };
  }

  try {
    const canvas = document.createElement('canvas');
    // First try hardware accelerated WebGL
    let gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
             canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true });

    let isSoftware = false;

    // If hardware acceleration failed, test if software renderer exists
    if (!gl) {
      gl = canvas.getContext('webgl2') ||
           canvas.getContext('webgl') ||
           canvas.getContext('experimental-webgl');
      if (gl) {
        isSoftware = true;
      }
    }

    if (!gl) {
      return { isSupported: false, isSoftware: false, error: 'WebGL context creation failed' };
    }

    // Inspect renderer unmasked info for software drivers
    try {
      const dbgExt = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgExt) {
        const rendererName = gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) || '';
        if (/swiftshader|llvmpipe|software rasterizer|microsoft basic render/i.test(rendererName)) {
          isSoftware = true;
        }
      }
    } catch {
      // Non-fatal if extension is restricted by browser security policies
    }

    // Clean up temporary detection context
    try {
      const loseExt = gl.getExtension('WEBGL_lose_context');
      if (loseExt) {
        loseExt.loseContext();
      }
    } catch {
      // Ignore cleanup error
    }

    return { isSupported: true, isSoftware, error: null };
  } catch (err) {
    return { isSupported: false, isSoftware: false, error: err?.message || 'WebGL throw exception' };
  }
}

/**
 * React Hook for WebGL detection and canvas lifecycle resilience
 * @param {React.RefObject<HTMLCanvasElement>} [externalCanvasRef]
 * @returns {{
 *   isSupported: boolean,
 *   isContextLost: boolean,
 *   hasError: boolean,
 *   isAvailable: boolean,
 *   isSoftware: boolean,
 *   canvasRef: React.RefObject<HTMLCanvasElement>,
 *   handleContextLost: (event?: Event) => void,
 *   handleContextRestored: () => void
 * }}
 */
export function useWebGLSupport(externalCanvasRef) {
  const internalCanvasRef = useRef(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;

  const [details, setDetails] = useState(() => detectWebGLDetails());
  const [isContextLost, setIsContextLost] = useState(false);
  const [hasError, setHasError] = useState(Boolean(details.error));

  const handleContextLost = useCallback((event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    setIsContextLost(true);
  }, []);

  const handleContextRestored = useCallback(() => {
    setIsContextLost(false);
    setHasError(false);
  }, []);

  // Attach event listeners to canvas element if available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onLost = (e) => handleContextLost(e);
    const onRestored = () => handleContextRestored();

    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost, false);
      canvas.removeEventListener('webglcontextrestored', onRestored, false);
    };
  }, [canvasRef, handleContextLost, handleContextRestored]);

  const isAvailable = details.isSupported && !isContextLost && !hasError;

  return {
    isSupported: details.isSupported,
    isContextLost,
    hasError,
    isAvailable,
    isSoftware: details.isSoftware,
    canvasRef,
    handleContextLost,
    handleContextRestored,
  };
}

export default useWebGLSupport;
