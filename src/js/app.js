import * as THREE from "three";
import frag from "../shaders/shader.frag";
import vert from "../shaders/shader.vert";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import tokyo01 from "../img/tokyo-01.jpg";
export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.scene = new THREE.Scene();
    this.container = options.dom;

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

    this.camera.position.z = 1;

    // Set renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);

    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.fragmentShader = options.fragmentShader;
    this.vertexShader = options.vertexShader;

    // Call setup functions
    this.resize();
    this.setupResize();
    this.addObjects();
    this.render();
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
    this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
    this.geometry = new THREE.SphereGeometry(0.5, 32, 32);

    this.material = new THREE.MeshNormalMaterial();

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      fragmentShader: this.fragmentShader,
      vertexShader: this.vertexShader,
      uniforms: {
        uTime: { value: this.time },
        uImageTexture: { value: new THREE.TextureLoader().load(tokyo01) },
      },
      wireframe: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.texture = new THREE.TextureLoader().load(tokyo01, (tex) => {
      tex.needsUpdate = true;
      // this.mesh.scale.set(1.0, tex.image.height / tex.image.width, 1.0);
    });
    // this.mesh.rotation.x = Math.PI / 2 * 0.5;
    this.scene.add(this.mesh);
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
