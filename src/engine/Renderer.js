import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Custom Post-Processing Shader: Cinematic Grading, Dynamic Chromatic Aberration, Subtle Vignette & Film Grain
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uAberration: { value: 0.0 },
    uVignetteStrength: { value: 0.15 },
    uGrainStrength: { value: 0.015 },
    uColorGrading: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAberration;
    uniform float uVignetteStrength;
    uniform float uGrainStrength;
    varying vec2 vUv;

    // High quality pseudo-random noise generator
    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = length(center);

      // Chromatic Aberration offset based on screen distance + dynamic shockwave
      float abAmount = uAberration * 0.008 + dist * 0.0015;
      vec2 abOffset = normalize(center) * abAmount;

      float r = texture2D(tDiffuse, uv - abOffset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv + abOffset).b;
      vec3 color = vec3(r, g, b);

      // Smooth, gentle vignette effect (keeps scene bright and visible)
      float vignette = smoothstep(0.95, 0.45, dist * (0.8 + uVignetteStrength * 0.3));
      color *= vignette;

      // Subtle high-frequency film grain
      float noise = (random(uv + sin(uTime * 10.0)) - 0.5) * uGrainStrength;
      color += noise;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export class EngineRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // WebGL2 Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Post-Processing Composer Setup
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = null;
    this.bloomPass = null;
    this.cinematicPass = null;
    this.outputPass = null;

    this.aberrationTarget = 0.0;
    this.currentAberration = 0.0;

    this.settings = {
      preset: 'high',
      bloomEnabled: true,
      chromaEnabled: true,
      shadowsEnabled: true
    };
  }

  setupPostProcessing(scene, camera) {
    this.composer.removeAllPasses?.();

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Optimized Unreal Bloom Pass (subtle high-end glow)
    const bloomResolution = new THREE.Vector2(Math.floor(this.width * 0.5), Math.floor(this.height * 0.5));
    this.bloomPass = new UnrealBloomPass(bloomResolution, 0.25, 0.2, 0.92);
    this.composer.addPass(this.bloomPass);

    // Cinematic Custom Shader Pass
    this.cinematicPass = new ShaderPass(CinematicShader);
    this.composer.addPass(this.cinematicPass);

    // OutputPass: Handles sRGB Color Space & ACESFilmic Tone Mapping for proper bright exposure!
    this.outputPass = new OutputPass();
    this.outputPass.renderToScreen = true;
    this.composer.addPass(this.outputPass);
  }

  triggerAberrationKick(intensity = 1.0) {
    this.currentAberration = Math.min(this.currentAberration + intensity, 2.0);
  }

  setQualityPreset(preset) {
    this.settings.preset = preset;
    if (preset === 'ultra') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      if (this.bloomPass) this.bloomPass.strength = 0.45;
    } else if (preset === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      this.renderer.shadowMap.enabled = true;
      if (this.bloomPass) this.bloomPass.strength = 0.4;
    } else if (preset === 'medium') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = true;
      if (this.bloomPass) this.bloomPass.strength = 0.25;
    } else if (preset === 'low') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      if (this.bloomPass) this.bloomPass.strength = 0.0;
    }
  }

  setBloom(enabled) {
    this.settings.bloomEnabled = enabled;
    if (this.bloomPass) {
      this.bloomPass.enabled = enabled;
    }
  }

  setShadows(enabled) {
    this.settings.shadowsEnabled = enabled;
    this.renderer.shadowMap.enabled = enabled;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    if (this.bloomPass) {
      this.bloomPass.setSize(width, height);
    }
  }

  render(scene, camera, delta, time) {
    // Smoothly decay chromatic aberration
    this.currentAberration = THREE.MathUtils.lerp(this.currentAberration, 0.0, delta * 12.0);

    if (this.cinematicPass) {
      this.cinematicPass.uniforms.uTime.value = time;
      this.cinematicPass.uniforms.uAberration.value = this.settings.chromaEnabled ? this.currentAberration : 0.0;
    }

    if (this.settings.preset === 'low') {
      this.renderer.render(scene, camera);
    } else {
      this.composer.render(delta);
    }
  }
}
