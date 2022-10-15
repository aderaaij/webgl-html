import imagesLoaded from "imagesloaded";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

export const preloadImages = (selector) => {
  const promise = new Promise((resolve, reject) => {
    imagesLoaded(
      document.querySelectorAll(selector),
      { background: true },
      resolve
    );
  });
  return promise;
};

export const loadFontAtlas = (path) => {
  const promise = new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(path, resolve);
  });

  return promise;
};

export const loadFont = (path) => {
  const promise = new Promise((resolve, reject) => {
    const loader = new FontLoader();
    loader.load(path, resolve);
  });

  return promise;
};

export const getCenterPoint = (mesh) => {
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  mesh.localToWorld(center);
  return center;
};
