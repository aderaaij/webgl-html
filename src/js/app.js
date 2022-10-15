import * as THREE from "three";
import { gsap } from "gsap";
import GUI from "lil-gui";
import { animate } from "motion";
import { MSDFTextGeometry, uniforms } from "three-msdf-text";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

import Scroll from "./scroll";

import {
  loadFont,
  loadFontAtlas,
  preloadImages,
  getCenterPoint,
} from "./utils";

import SawarabiGothicFnt from "../fonts/SawarabiGothic-Regular-msdf/SawarabiGothic-Regular-msdf.fnt";
import SawarabiGothicPng from "../fonts/SawarabiGothic-Regular-msdf/SawarabiGothic-Regular.png";

import vert from "../shaders/img/shader.vert";
import frag from "../shaders/img/shader.frag";

import effectVert from "../shaders/effect/shader.vert";
import effectFrag from "../shaders/effect/shader.frag";

import lettersVert from "../shaders/text/shader.vert";
import lettersFrag from "../shaders/text/shader.frag";

import tokyo01 from "../img/tokyo-01.jpg";
export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    this.scene = new THREE.Scene();
    this.gui = new GUI();
    this.gui.open(false);

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
    this.titles = Array.from(document.querySelectorAll(".text-item__title"));

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

    this.init();
  }

  triggerAnimation() {
    for (let a = 0; a < this.titleStore.length; a++) {
      for (let i = 0; i < 4; i++) {
        animate(
          (progress) => {
            this.titleStore[a].material.uniforms[
              `uProgressText0${i + 1}`
            ].value = progress;
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
  }

  settings() {
    const colors = {
      color01: 0xec008c,
      color02: 0xffffff,
      color03: 0xec008c,
      color04: 0xffffff,
    };

    this.settings = {
      ...colors,
      trigger: () => {
        this.triggerAnimation();
      },
    };

    for (let i = 0; i < [...Array(4).keys()].length; i++) {
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

  init() {
    const allDone = [
      preloadImages("img"),
      loadFontAtlas(SawarabiGothicPng),
      loadFont(SawarabiGothicFnt),
    ];

    this.currentScroll = 0;
    this.previousScroll = 0;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    Promise.all(allDone).then((results) => {
      this.atlas = results[1];
      this.font = results[2];

      this.scroll = new Scroll();
      this.addImages();
      this.addText();
      this.setPosition();

      this.mouseMoveEvent();

      this.setupResize();
      this.resize();

      this.settings();

      this.composerPass();
      this.render();
      this.triggerAnimation();
    });
  }

  addText() {
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
        ...uniforms.common,
        ...uniforms.rendering,
        ...uniforms.strokes,
        ...[...Array(4).keys()].reduce(
          (o, key) => ({
            ...o,
            [`uProgressText0${key + 1}`]: { value: 0 },
            // [`uLayerColor0${key + 1}`]: {
            //   value: new THREE.Color(this.settings[`color0${key + 1}`]),
            // },
          }),
          {}
        ),
        uLayerColor01: { value: new THREE.Color(0xec008c) },
        uLayerColor02: { value: new THREE.Color(0xffffff) },
        uLayerColor03: { value: new THREE.Color(0xec008c) },
        uLayerColor04: { value: new THREE.Color(0xffffff) },

        uStrokeColor: { value: new THREE.Color(0x00ff00) },
        uTime: { value: 0 },
        uRatio: { value: this.textRatio },
        uMap: { value: this.atlas },
      },
      vertexShader: lettersVert,
      fragmentShader: lettersFrag,
    });

    this.titleStore = this.titles.map((title, index) => {
      const bounds = title.getBoundingClientRect();
      const geometry = new MSDFTextGeometry({
        text: title.innerHTML,
        font: this.font.data,
        flipY: true,
        mode: "pre",
      });

      geometry.computeBoundingBox();
      const textRatio =
        geometry.boundingBox.max.x /
        (geometry.boundingBox.max.y + geometry.boundingBox.min.y * -1);

      const material = this.textMaterial.clone();
      material.uniforms.uRatio.value = textRatio;

      const mesh = new THREE.Mesh(geometry, material);
      mesh.applyMatrix4(new THREE.Matrix4().makeScale(1 * 5, -1 * 5, 1));

      // const center = getCenterPoint(mesh);
      // mesh.position.x = center.x * -1 * 100;
      // mesh.position.y = (center.y / 1) * 5 * (index * 3);

      this.scene.add(mesh);

      return {
        title,
        material,
        mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });
  }

  createCube(index) {
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = 300 * index;
    this.scene.add(mesh);
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

    for (let i = 0; i < this.images.length; i++) {
      const imageObj = this.imageStore[i];
      imageObj.mesh.position.y =
        this.currentScroll -
        imageObj.top +
        this.height / 2 -
        imageObj.height / 2;
      imageObj.mesh.position.x =
        imageObj.left - this.width / 2 + imageObj.width / 2;
      const bounds = this.images[i].getBoundingClientRect();
      imageObj.mesh.geometry.width = bounds.width / 2;
    }

    for (let i = 0; i < this.titles.length; i++) {
      const titleObject = this.titleStore[i];
      titleObject.mesh.position.y =
        this.currentScroll -
        titleObject.top +
        this.height / 2 -
        titleObject.height / 2;
      titleObject.mesh.position.x =
        titleObject.left - this.width / 2 + titleObject.width / 2;
      const bounds = this.titles[i].getBoundingClientRect();
      titleObject.mesh.geometry.width = bounds.width / 2;
    }

    this.camera.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    this.titleStore.forEach((o) => {
      o.mesh.position.y =
        this.currentScroll - o.top + this.height / 2.1 - o.height / 2;
      o.mesh.position.x = o.left - this.width / 1.8 + o.width / 1.8;
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
