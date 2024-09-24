// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { parseVR } from './parsers/vr-parser/vr-parser.js';
import { parseStereo } from './parsers/stereo-parser/stereo-parser.js';
import { parseAnaglyph } from './parsers/anaglyph-parser/anaglyph-parser.js';
import { parseDepth } from './parsers/depth-parser/depth-parser.js';
import exifr from './vendor/exifr/full.esm.js';

import * as THREE from './vendor/three/three.module.min.js';
import { VRButton } from './lib/VRButton.js';
import { OrbitControls  } from './lib/OrbitControls.js';


class StereoImg extends HTMLElement {

    get type() {
      return this.getAttribute('type');
    }
    set type(val) {
      if (val) {
        this.setAttribute('type', val);
      } else {
        this.removeAttribute('type');
      }
    }

    get angle() {
      return this.getAttribute('angle');
    }
    set angle(val) {
      if (val) {
        this.setAttribute('angle', val);
      } else {
        this.removeAttribute('angle');
      }
    }

    get debug() {
      return this.getAttribute('debug');
    }
    set debug(val) {
      if (val) {
        this.setAttribute('debug', val);
      } else {
        this.removeAttribute('debug');
      }
    }

    get projection() {
      return this.getAttribute('projection');
    }
    set projection(val) {
      if (val) {
        this.setAttribute('projection', val);
      } else {
        this.removeAttribute('projection');
      }
    }

    get wiggle() {
      return this.getAttribute('wiggle');
    }
    set wiggle(val) {
      if (val) {
        this.setAttribute('wiggle', val);
      } else {
        this.removeAttribute('wiggle');
      }
    }

    get src() {
      return this.getAttribute('src');
    }
    set src(val) {
      if (val) {
        this.setAttribute('src', val);
      } else {
        this.removeAttribute('src');
      }

      // use setTimeout to ensure all DOM updates have finished, it's indeed common to update both src= and type= at the same time.
      // There is probably a cleaner way to do this.
      let that = this;
      window.setTimeout(() => {
        that.parseImageAndInitialize3DScene();
      }, 0);
    }

    animate() {
      this.renderer.setAnimationLoop( () => {
        this.renderer.render( this.scene, this.camera );
      } );
    }
  
    async parse() {
      if(this.src) {
        if(this.type === 'vr180' || this.type === 'vr') {
          this.stereoData = await parseVR(this.src);

        } else if(this.type === 'left-right' || this.type === 'right-left' || this.type === 'bottom-top' || this.type === 'top-bottom') {
          this.stereoData = await parseStereo(this.src, {
            type: this.type,
            angle: this.angle,
            projection: this.projection,
          });

        } else if(this.type === 'anaglyph') {
          this.stereoData = await parseAnaglyph(this.src, {
            angle: this.angle,
            projection: this.projection,
          });

        } else if(this.type === 'depth') {
          this.stereoData = await parseDepth(this.src);

        } else {
          // No type specified

          // if url ends with `PORTRAIT.jpg` assume type = depth
          if (this.src.toUpperCase().endsWith('PORTRAIT.JPG')) {
            this.stereoData = await parseDepth(this.src);
          } else {
            // try to read XMP metadata to see if VR Photo, otherwise assume stereo-style (e.g. "left right")
            // Read XMP metadata
            const exif = await exifr.parse(this.src, {
              xmp: true,
              multiSegment: true,
              mergeOutput: false,
              ihdr: true, //unclear why we need this, but if not enabled, some VR180 XMP Data are not parsed
            });

            if (exif?.GImage?.Data) {
              // GImage XMP for left eye found, assume VR Photo
              this.stereoData = await parseVR(this.src);
            } else {
              // no left eye found, assume stereo (e.g. left-right)
              console.info('<stereo-img> does not have a "type" attribute and image does not have XMP metadata of a VR picture.  Use "type" attribute to specify the type of stereoscopic image. Assuming stereo image of the "left-right" family.');
              this.stereoData = await parseStereo(this.src, {
                angle: this.angle,
                projection: this.projection,
              });
            }
          }
        }
      } else {
        // no src attribute. Use fake stereo data to render a black sphere
        this.stereoData = {
          leftEye: new ImageData(10, 10),
          rightEye: new ImageData(10, 10),
          phiLength: 0,
          thetaStart: 0,
          thetaLength: 0
        };
      }
    }

    /**
     * When called, the element should wiggle between the left and right eye images
     * @param {Boolean} toggle: if true, enable wiggle, if false, disable wiggle
     */
    toggleWiggle(toggle) {
      let intervalMilliseconds = 1000 / 10;
      let layer = 1;
      let intervalID;

      if(toggle) {
        setInterval(() => {
          layer = layer === 1 ? 2 : 1;
          this.camera.layers.set(layer);
        }, intervalMilliseconds);
      } else {
        clearInterval(intervalID);
      }
    } 

    /**
     * 
     * @param {String} eye: "left" or "right"
     */
    async createEye(eye, debug) {
      const radius = 10; // 500
      const depth = radius / 5;
      const planeSegments = this.stereoData.depth ? 256 : 1;
      const sphereWidthSegments = 60;
      const sphereHeightSegments = 40;

      const eyeNumber = eye === "left" ? 1 : 2;
      let imageData = eye === "left" ? this.stereoData.leftEye : this.stereoData.rightEye;

      // if max texture size supported by the GPU is below the eye image size, resize the image
      const maxTextureSize = this.renderer.capabilities.maxTextureSize;
      if (imageData.width > maxTextureSize || imageData.height > maxTextureSize) {
        const newWidth = Math.min(imageData.width, maxTextureSize);
        const newHeight = Math.min(imageData.height, maxTextureSize);
        console.warn(`Image size (${imageData.width}x${imageData.height}) exceeds max texture size (${maxTextureSize}x${maxTextureSize}). Resizing to ${newWidth}x${newHeight}.`);
        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        const imageBitmap = await createImageBitmap(imageData);
        ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
        imageData = ctx.getImageData(0, 0, newWidth, newHeight);
      }

      const texture = new THREE.Texture(imageData);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;

      let geometry;
      // if angle is less than Pi / 2, use a plane, otherwise use a sphere
      if(this.stereoData.phiLength < Math.PI / 2) {
        const imageWidth = imageData.width;
        const imageHeight = imageData.height;
        const aspectRatio = imageWidth / imageHeight;

        const planeWidth = radius * 2;
        const planeHeight = planeWidth / aspectRatio;
        const planeDistance = radius;

        geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, planeSegments, planeSegments);
        // Put the plane in front of the camera (rotate and translate it)
        geometry.rotateY(-Math.PI / 2);
        geometry.translate(planeDistance, 0, 0);
      } else {
        geometry = new THREE.SphereGeometry(radius, sphereWidthSegments, sphereHeightSegments, -1 * this.stereoData.phiLength / 2, this.stereoData.phiLength, this.stereoData.thetaStart, this.stereoData.thetaLength);
        // invert the geometry on the x-axis so that all of the faces point inward
        geometry.scale(-1, 1, 1);
      }

      if (this.stereoData.projection === 'fisheye') {
        // by default, the sphere UVs are equirectangular
        // re-set the UVs of the sphere to be compatible with a fisheye image
        // to do so, we use the spatial positions of the vertices
        if(this.stereoData.phiLength !== Math.PI || this.stereoData.thetaLength !== Math.PI) {
          console.warn('Fisheye projection is only well supported for 180° stereoscopic images.');
        }
  
        const normals = geometry.attributes.normal.array;
        const uvs = geometry.attributes.uv.array;
        for (let i = 0, l = normals.length / 3; i < l; i++) {
  
          const x = normals[i * 3 + 0];
          const y = normals[i * 3 + 1];
          const z = normals[i * 3 + 2];
  
          // TODO: understand and check this line of math. It is taken from https://github.com/mrdoob/three.js/blob/f32e6f14046b5affabe35a0f42f0cad7b5f2470e/examples/webgl_panorama_dualfisheye.html
          var correction = (y == 0 && z == 0) ? 1 : (Math.acos(x) / Math.sqrt(y * y + z * z)) * (2 / Math.PI);
          // We expect that the left/right eye images have already been cropped of any black border.
          // Therefore, UVs expand the whole u and v axis 
          uvs[ i * 2 + 0 ] = z * 0.5 * correction + 0.5;
          uvs[ i * 2 + 1 ] = y * 0.5 * correction + 0.5;
          }
      }

      const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        displacementScale: -1 * depth,
        displacementBias: depth / 2,
        flatShading: true,
      });
      if(this.stereoData.depth) {
        material.displacementMap = new THREE.Texture(this.stereoData.depth);
        material.displacementMap.needsUpdate = true;
        // material.displacementMap.colorSpace = THREE.SRGBColorSpace;
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.reorder('YXZ');
      mesh.rotation.y = Math.PI / 2;
      mesh.rotation.x = this.stereoData.roll || 0;
      mesh.rotation.z = this.stereoData.pitch || 0;
      mesh.layers.set(eyeNumber); // display in left/right eye only
      this.scene.add(mesh);

      if(this.debug) {
        const wireframe = new THREE.WireframeGeometry(geometry);
        const line = new THREE.LineSegments(wireframe);
        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;
        line.rotation.reorder('YXZ');
        line.rotation.y = Math.PI / 2;
        line.rotation.x = this.stereoData.roll || 0;
        line.rotation.z = this.stereoData.pitch || 0;
        line.layers.set(eyeNumber);
        this.scene.add(line);
      }
    }

    async initialize3DScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color( 0xb8b804 );
      

      const light = new THREE.AmbientLight( 0xffffff, 3 );
      light.layers.enable(1);
      light.layers.enable(2);
      this.scene.add( light );
      //this.scene.add( new THREE.HemisphereLight( 0xcccccc, 0x999999, 3 ) );

      // const light = new THREE.DirectionalLight( 0xffffff, 3 );
			// light.position.set( 0, 6, 0 );
			// light.castShadow = true;
			// light.shadow.camera.top = 2;
			// light.shadow.camera.bottom = - 2;
			// light.shadow.camera.right = 2;
			// light.shadow.camera.left = - 2;
			// light.shadow.mapSize.set( 4096, 4096 );
			// this.scene.add( light );

      const geometry = new THREE.PlaneGeometry( 0.1, 0.1 );
      const material = new THREE.MeshBasicMaterial();
      const loader = new THREE.TextureLoader();
      loader.load( 'kandao-qoocam-ego.jpg', 
      function ( texture ) {    

          // The texture has loaded, so assign it to your material object. In the 
          // next render cycle, this material update will be shown on the plane 
          // geometry
          material.map = texture;
          material.needsUpdate = true;
      });
      //const material = new THREE.MeshBasicMaterial( {color: 0xFF5733, side: THREE.DoubleSide} );
      let plane = new THREE.Mesh( geometry, material );
      plane.position.y = 0.4;
      plane.position.z =   -1.4;
      this.scene.add( plane );

      await this.createEye("left");
      await this.createEye("right");

      if(this.wiggle === 'enabled' || !this.wiggle) {
//        this.toggleWiggle(true);
      }
    }

    async parseImageAndInitialize3DScene() {
      await this.parse();
      await this.initialize3DScene();
    }

    async init() {
      if (this.debug) {
        console.log('Debug mode enabled');
        this.debug = true;
      }
      

      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          contain: content;
        }
      </style>
      `;

      // TODO: should we also read width and height attributes and resize element accordingly?
      if(this.clientHeight === 0) {
        const aspectRatio = 4 / 3;
        this.style.height = this.clientWidth / aspectRatio + "px";
      }

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.xr.enabled = true;
      this.renderer.setSize(this.clientWidth, this.clientHeight);
      this.shadowRoot.appendChild(this.renderer.domElement);

      if (this.debug) {
        console.log(`Max Texture Size: ${this.renderer.capabilities.maxTextureSize}`);
      }

      // TODO: Should we use component size instead?
      this.camera = new THREE.PerspectiveCamera( 70, this.clientWidth / this.clientHeight, 1, 2000 );
      this.camera.layers.enable( 1 );

      //const controls = new OrbitControls( this.camera, this.renderer.domElement );
   
      //controls.update();

      this.shadowRoot.appendChild(VRButton.createButton(this.renderer));

      await this.parseImageAndInitialize3DScene();
      this.camera.position.set(0, 1.7, 0);
      this.animate();

      // Listen for component resize
      const resizeObserver = new ResizeObserver(() => {
        this.renderer.setSize(this.clientWidth, this.clientHeight);
        this.camera.aspect = this.clientWidth / this.clientHeight;
        this.camera.updateProjectionMatrix();
      });

      resizeObserver.observe(this);
    }


    constructor() {
      super();
      this.init();
    }

  }

window.customElements.define('stereo-img', StereoImg);

