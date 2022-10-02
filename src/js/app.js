import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

import { MSDFTextGeometry, MSDFTextMaterial, uniforms } from "three-msdf-text";

import frag from "../shaders/shader.frag";
import vert from "../shaders/shader.vert";

import tokyo01 from "../img/tokyo-01.jpg";
import LatoBoldFnt from "../assets/Lato-Bold-msdf/Lato-Bold-msdf.fnt";
import LatoBoldPng from "../assets/Lato-Bold-msdf/Lato-Bold.png";

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.gui = new GUI();

    this.time = 0;

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
      50
    );

    this.camera.position.z = -2;

    // Set renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Call setup functions
    this.resize();
    this.settings();
    this.setupResize();
    this.addObjects();
    this.render();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };

    this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange(() => {
      this.material.uniforms.uProgress.value = this.settings.progress;
    }); // Checkbox
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
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // this.material = new THREE.MeshNormalMaterial();

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      fragmentShader: this.fragmentShader,
      vertexShader: this.vertexShader,
      uniforms: {
        uTime: { value: this.time },
        uProgress: { value: 0 },
        // uImageTexture: { value: new THREE.TextureLoader().load(tokyo01) },
      },
      wireframe: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // this.texture = new THREE.TextureLoader().load(tokyo01, (tex) => {
    //   tex.needsUpdate = true;
    //   this.mesh.scale.set(1.0, tex.image.height / tex.image.width, 1.0);
    // });
    // this.mesh.rotation.x = (Math.PI / 2) * 0.5;
    this.scene.add(this.mesh);

    Promise.all([loadFontAtlas(LatoBoldPng), loadFont(LatoBoldFnt)]).then(
      ([atlas, font]) => {
        console.log(font.data);
        const geometry = new MSDFTextGeometry({
          text: "GET WRECKED",
          font: font.data,
          align: "center",
          flipY: true,
          mode: "pre",
        });

        geometry;
        // const material = new MSDFTextMaterial({ side: THREE.DoubleSide });
        const material = new THREE.ShaderMaterial({
          side: THREE.doubleSide,
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
          },
          vertexShader: `
              // Attribute
              #include <three_msdf_attributes>
      
              // Varyings
              #include <three_msdf_varyings>
      
              void main() {
                  #include <three_msdf_vertex>
              }
          `,
          fragmentShader: `
              // Varyings
              #include <three_msdf_varyings>
      
              // Uniforms
              #include <three_msdf_common_uniforms>
              #include <three_msdf_strokes_uniforms>
      
              // Utils
              #include <three_msdf_median>
      
              void main() {
                  // Common
                  #include <three_msdf_common>
      
                  // Strokes
                  #include <three_msdf_strokes>
      
                  // Alpha Test
                  #include <three_msdf_alpha_test>
      
                  // Outputs
                  #include <three_msdf_strokes_output>
                  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
              }
          `,
        });
        material.uniforms.uMap.value = atlas;
        const mesh = new THREE.Mesh(geometry, material);

        this.scene.add(mesh);
        mesh.scale.x *= -0.01;
        mesh.scale.y *= -0.01;
        mesh.position.x = 1.2;
      }
    );

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

    window.requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
new Sketch({
  dom: document.querySelector(".container"),
  fragmentShader: frag,
  vertexShader: vert,
});
