import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

import GUI from "lil-gui";
import { animate } from "motion";
import { MSDFTextGeometry, uniforms } from "three-msdf-text";

// Shaders
import frag from "../shaders/shader.frag";
import vert from "../shaders/shader.vert";
import lettersFrag from "../shaders/letters/shader.frag";
import lettersVert from "../shaders/letters/shader.vert";

// Assets
import tokyo01 from "../img/tokyo-01.jpg";

import LatoBoldFnt from "../assets/Lato-Bold-msdf/Lato-Bold-msdf.fnt";
import LatoBoldPng from "../assets/Lato-Bold-msdf/Lato-Bold.png";

import DinBoldFnt from "../assets/Din-Bold-msdf/Din-Bold-msdf.fnt";
import DinBoldPng from "../assets/Din-Bold-msdf/Din-Bold.png";

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.gui = new GUI();
    this.gui.open(false);
    this.time = 0;
    this.textRatio = 0;

    this.container = options.dom;
    this.fragmentShader = options.fragmentShader;
    this.vertexShader = options.vertexShader;

    // Set width and height based on container
    this.height = this.container.offsetHeight;
    this.width = this.container.offsetWidth;

    // Set initial camera position
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      100
    );

    setTimeout(() => {
      this.triggerAnimation();
    }, 300);

    this.textGeometry = null;

    this.camera.position.z = 2;

    // Set renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.addEventListener("click", () => {
      this.triggerAnimation();
    });

    this.container.appendChild(this.renderer.domElement);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Call setup functions
    this.addText();
    this.addObjects();

    this.setupResize();
    this.resize();
    this.settings();

    this.render();
  }

  triggerAnimation() {
    for (let i = 0; i < 4; i++) {
      animate(
        (progress) => {
          this.letterMaterial.uniforms[`uProgressText0${i + 1}`].value =
            progress;
        },
        {
          duration: 0.3 * i + 1,
          delay: 0.25 * i,
          easing: [0.5, 1, 0.89, 1],
        }
      );
    }
  }

  settings() {
    this.settings = {
      progress01: 0,
      progress02: 0,
      progress03: 0,
      progress04: 0,
      trigger: () => {
        this.triggerAnimation();
      },
    };

    this.gui.add(this.settings, "progress01", 0, 1, 0.01).onChange((val) => {
      this.material.uniforms.uProgress.value = this.settings.progress;
      this.letterMaterial.uniforms.uProgressText01.value = val;
    });
    this.gui.add(this.settings, "progress02", 0, 1, 0.01).onChange((val) => {
      this.letterMaterial.uniforms.uProgressText02.value = val;
    });
    this.gui.add(this.settings, "progress03", 0, 1, 0.01).onChange((val) => {
      this.letterMaterial.uniforms.uProgressText03.value = val;
    });
    this.gui.add(this.settings, "progress04", 0, 1, 0.01).onChange((val) => {
      this.letterMaterial.uniforms.uProgressText04.value = val;
    });

    this.gui.add(this.settings, "trigger");
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    if (this.textGeometry) {
      this.textRatio =
        this.textGeometry.boundingBox.max.x /
        (this.textGeometry.boundingBox.max.y +
          this.textGeometry.boundingBox.min.y * -1);
    }
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      fragmentShader: this.fragmentShader,
      vertexShader: this.vertexShader,
      uniforms: {
        uTime: { value: this.time },
        uProgress: { value: 0 },
        uImageTexture: { value: new THREE.TextureLoader().load(tokyo01) },
      },
      wireframe: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.texture = new THREE.TextureLoader().load(tokyo01, (tex) => {
      tex.needsUpdate = true;
      this.mesh.scale.set(1.0, tex.image.height / tex.image.width, 1.0);
    });
    this.mesh.rotation.x = (Math.PI / 2) * 0.5;
    // this.scene.add(this.mesh);
  }

  async addText() {
    this.letterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
    });

    const [atlas, font] = await Promise.all([
      loadFontAtlas(DinBoldPng),
      loadFont(DinBoldFnt),
    ]);

    this.textGeometry = new MSDFTextGeometry({
      text: "HIGH TECH\nTEXT REVEAL",
      font: font.data,
      flipY: true,
      mode: "pre",
    });
    this.textGeometry.computeBoundingBox();

    this.textRatio =
      this.textGeometry.boundingBox.max.x /
      (this.textGeometry.boundingBox.max.y +
        this.textGeometry.boundingBox.min.y * -1);

    this.letterMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      defines: {
        IS_SMALL: false,
      },
      extensions: {
        derivatives: true,
      },
      uniforms: {
        // Common
        ...uniforms.common,
        // Rendering
        ...uniforms.rendering,

        // Strokes
        ...uniforms.strokes,
        uProgressText01: { value: 0 },
        uProgressText02: { value: 0 },
        uProgressText03: { value: 0 },
        uProgressText04: { value: 0 },
        uStrokeColor: { value: new THREE.Color(0x00ff00) },
        uTime: { value: 0 },
        uRatio: { value: 0 },
      },
      vertexShader: lettersVert,
      fragmentShader: lettersFrag,
    });

    this.letterMaterial.uniforms.uMap.value = atlas;
    this.letterMaterial.uniforms.uRatio.value = this.textRatio;

    const mesh = new THREE.Mesh(this.textGeometry, this.letterMaterial);
    mesh.applyMatrix4(new THREE.Matrix4().makeScale(0.01 * 1, -0.01, 0.01));

    this.scene.add(mesh);
    mesh.position.x = -1.5;

    function loadFontAtlas(path) {
      const promise = new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(path, resolve);
      });

      return promise;
    }

    function loadFont(path) {
      const promise = new Promise((resolve, reject) => {
        const loader = new FontLoader();
        loader.load(path, resolve);
      });

      return promise;
    }
  }

  render() {
    this.time += 0.05;
    // this.mesh.rotation.x = this.time / 2000;
    // this.mesh.rotation.y = this.time / 1000;
    this.material.uniforms.uTime.value = this.time;

    this.letterMaterial.uniforms.uTime.value = this.time;

    window.requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
new Sketch({
  dom: document.querySelector(".container"),
  fragmentShader: frag,
  vertexShader: vert,
});
