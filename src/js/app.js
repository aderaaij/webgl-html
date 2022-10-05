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

    this.addEventListeners();
    this.resize();
    this.settings();

    this.render();
  }

  triggerAnimation() {
    for (let i = 0; i < 4; i++) {
      animate(
        (progress) => {
          this.textMaterial.uniforms[`uProgressText0${i + 1}`].value = progress;
          this.settings[`progress0${i + 1}`] = progress;
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
    const that = this;

    const colors = {
      color01: 0xec008c,
      color02: 0xffffff,
      color03: 0xec008c,
      color04: 0xffffff,
    };

    this.settings = {
      ...[...Array(4).keys()].reduce(
        (o, key) => ({
          ...o,
          [`progress0${key + 1}`]: 0,
        }),
        {}
      ),
      ...colors,
      trigger: () => {
        this.triggerAnimation();
      },
    };

    for (let i = 0; i < [...Array(4).keys()].length; i++) {
      this.gui
        .add(this.settings, `progress0${i + 1}`, 0, 1, 0.01)
        .onChange((val) => {
          this.material.uniforms.uProgress.value = val;
          this.textMaterial.uniforms[`uProgressText0${i + 1}`].value = val;
        })
        .name(`Layer ${i + 1} Progress`)
        .listen();
      this.gui
        .addColor(this.settings, `color0${i + 1}`, 0, 1, 0.01)
        .onChange((val) => {
          this.textMaterial.uniforms[`uLayerColor0${i + 1}`].value.set(val);
        })
        .name(`Layer ${i + 1} Color`);
    }

    this.gui.add(this.settings, "trigger").name("Animate");

    return this.settings;
  }

  addEventListeners = () => {
    window.addEventListener("resize", this.resize.bind(this));
  };

  resize = () => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    if (this.camera.aspect >= 0.6 && this.camera.aspect < 1) {
      this.camera.position.z = 3.5;
    }
    if (this.camera.aspect < 0.6) {
      this.camera.position.z = 4;
    }

    if (this.camera.aspect > 1) {
      this.camera.position.z = 2;
    }

    this.camera.updateProjectionMatrix();
    if (this.textGeometry) {
      this.textRatio =
        this.textGeometry.boundingBox.max.x /
        (this.textGeometry.boundingBox.max.y +
          this.textGeometry.boundingBox.min.y * -1);
    }
  };

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

  getCenterPoint(mesh) {
    const geometry = mesh.geometry;
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    mesh.localToWorld(center);
    return center;
  }

  async addText() {
    this.textMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
    });

    const [atlas, font] = await Promise.all([
      loadFontAtlas(DinBoldPng),
      loadFont(DinBoldFnt),
    ]);

    this.textGeometry = new MSDFTextGeometry({
      text: "HIGH TECH\nTEXT REVEAL\nMUCH WOW",
      font: font.data,
      flipY: true,
      mode: "pre",
    });
    this.textGeometry.computeBoundingBox();

    this.textRatio =
      this.textGeometry.boundingBox.max.x /
      (this.textGeometry.boundingBox.max.y +
        this.textGeometry.boundingBox.min.y * -1);

    this.textMaterial = new THREE.ShaderMaterial({
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
        ...[...Array(4).keys()].reduce(
          (o, key) => ({
            ...o,
            [`uProgressText0${key + 1}`]: { value: 0 },
            [`uLayerColor0${key + 1}`]: {
              value: new THREE.Color(this.settings[`color0${key + 1}`]),
            },
          }),
          {}
        ),

        uStrokeColor: { value: new THREE.Color(0x00ff00) },
        uTime: { value: 0 },
        uRatio: { value: 0 },
      },
      vertexShader: lettersVert,
      fragmentShader: lettersFrag,
    });
    this.textMaterial.uniforms.uMap.value = atlas;
    this.textMaterial.uniforms.uRatio.value = this.textRatio;

    const mesh = new THREE.Mesh(this.textGeometry, this.textMaterial);
    mesh.applyMatrix4(new THREE.Matrix4().makeScale(1 / 100, -1 / 100, 1));

    this.scene.add(mesh);
    mesh.position.x = (this.getCenterPoint(mesh).x * -1) / 100;
    mesh.position.y = this.getCenterPoint(mesh).y / 100;

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
    this.material.uniforms.uTime.value = this.time;

    this.textMaterial.uniforms.uTime.value = this.time;

    window.requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
new Sketch({
  dom: document.querySelector(".container"),
  fragmentShader: frag,
  vertexShader: vert,
});
