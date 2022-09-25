import * as THREE from "three";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import imagesLoaded from "imagesloaded";
import Scroll from "./scroll";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// import FontFaceObserver from "fontfaceobserver";

import vert from "../shaders/img/shader.vert";
import frag from "../shaders/img/shader.frag";

import effectVert from "../shaders/effect/shader.vert";
import effectFrag from "../shaders/effect/shader.frag";

import tokyo01 from "../img/tokyo-01.jpg";
export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    this.scene = new THREE.Scene();

    // Set width and height based on container
    this.height = this.container.offsetHeight;
    this.width = this.container.offsetWidth;

    // Set initial camera position
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      100,
      2000
    );

    this.camera.position.z = 600;

    // Set Camera Field of View
    // Math.atan calculates the angle in radians by deving the height by 2 and deviding that by the camera distance
    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);

    // Set renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.fragmentShader = options.fragmentShader;
    this.vertexShader = options.vertexShader;

    this.images = Array.from(document.querySelectorAll("img"));

    // const fontRoadRage = new Promise((resolve) => {
    //   new FontFaceObserver("Road Rage").load().then(() => {
    //     resolve();
    //   });
    // });

    // const fontOpen = new Promise((resolve) => {
    //   new FontFaceObserver("Open Sans").load().then(() => {
    //     resolve();
    //   });
    // });

    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll("img"),
        { background: true },
        resolve
      );
    });

    const allDone = [preloadImages];
    this.currentScroll = 0;
    this.previousScroll = 0;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // Call setup functions after assets are loaded
    Promise.all(allDone).then((res) => {
      this.scroll = new Scroll();
      this.addImages();
      this.setPosition();

      this.mouseMoveEvent();
      this.setupResize();
      this.resize();

      this.composerPass();
      this.render();
    });
  }

  composerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    const counter = 0.0;

    this.myEffect = {
      uniforms: {
        tDiffuse: { value: null },
        uScrollSpeed: { value: null },
        uTime: { value: null },
      },
      vertexShader: effectVert,
      fragmentShader: effectFrag,
    };

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;
    this.composer.addPass(this.customPass);
  }

  mouseMoveEvent() {
    window.addEventListener(
      "mousemove",
      (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
        this.pointer.y = -(e.clientY / this.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
          const obj = intersects[0].object;
          obj.material.uniforms.uHover.value = intersects[0].uv;
        }
      },
      false
    );
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.setPosition();

    this.images.forEach((img, i) => {
      const o = this.imageStore[i];
      o.mesh.position.y =
        this.currentScroll - o.top + this.height / 2 - o.height / 2;
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
      // o.mesh.scale.set(2, 2);
      const bounds = img.getBoundingClientRect();
      o.mesh.geometry.width = bounds.width / 2;
    });
    // this.imageStore.forEach((o) => {
    //   o.mesh.position.y =
    //     this.currentScroll - o.top + this.height / 2 - o.height / 2;
    //   o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
    // });
    this.camera.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(200, 100, 10, 10);
    // this.geometry = new THREE.SphereGeometry(0.5, 32, 32);

    this.material = new THREE.MeshNormalMaterial();

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      fragmentShader: this.fragmentShader,
      vertexShader: this.vertexShader,
      uniforms: {
        uTime: { value: this.time },
        uImageTexture: { value: new THREE.TextureLoader().load(tokyo01) },
      },
      wireframe: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // this.texture = new THREE.TextureLoader().load(tokyo01, (tex) => {
    //   tex.needsUpdate = true;
    //   // this.mesh.scale.set(1.0, tex.image.height / tex.image.width, 1.0);
    // });
    // this.mesh.rotation.x = Math.PI / 2 * 0.5;
    this.scene.add(this.mesh);
  }

  addImages() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,

      fragmentShader: this.fragmentShader,
      vertexShader: this.vertexShader,
      uniforms: {
        uImage: { value: 0 },
        uHover: { value: new THREE.Vector2(0.5, 0.5) },
        uHoverState: { value: 0 },
        uTime: { value: this.time },
      },
      wireframe: false,
    });

    this.materials = [];

    this.imageStore = this.images.map((img) => {
      const bounds = img.getBoundingClientRect();
      const geometry = new THREE.PlaneGeometry(
        bounds.width,
        bounds.height,
        100,
        100
      );

      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      const texture2 = new THREE.TextureLoader().load(img.currentSrc);
      texture2.needsUpdate = true;

      const material = this.material.clone();
      img.addEventListener("mouseenter", () => {
        gsap.to(material.uniforms.uHoverState, {
          duration: 1,
          value: 1,
        });
      });
      img.addEventListener("mouseout", () => {
        gsap.to(material.uniforms.uHoverState, {
          duration: 1,
          value: 0,
        });
      });
      this.materials.push(material);

      material.uniforms.uImage.value = texture2;

      const mesh = new THREE.Mesh(geometry, material);

      this.scene.add(mesh);

      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });
  }

  setPosition() {
    this.imageStore.forEach((o) => {
      o.mesh.position.y =
        this.currentScroll - o.top + this.height / 2 - o.height / 2;
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
    });
  }

  render() {
    this.time += 0.05;

    this.scroll.render();
    this.previousScroll = this.currentScroll;
    this.currentScroll = this.scroll.scrollToRender;

    // if (Math.round(this.currentScroll) !== Math.round(this.previousScroll)) {

    this.setPosition();

    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.customPass.uniforms.uScrollSpeed.value = this.scroll.speedTarget;
    this.customPass.uniforms.uTime.value = this.time;

    this.materials.forEach((m) => {
      m.uniforms.uTime.value = this.time;
    });

    this.composer.render();
    // }
    window.requestAnimationFrame(this.render.bind(this));
  }
}
new Sketch({
  dom: document.querySelector(".webgl"),
  fragmentShader: frag,
  vertexShader: vert,
});
