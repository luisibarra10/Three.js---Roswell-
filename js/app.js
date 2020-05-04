
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/build/three.module.js';
import { TrackballControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/loaders/GLTFLoader.js';
import { DDSLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/loaders/DDSLoader.js';
import { PMREMGenerator } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/pmrem/PMREMGenerator.js';
import { PMREMCubeUVPacker } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/pmrem/PMREMCubeUVPacker.js';
import { GUI } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/libs/dat.gui.module.js';

var defaultLayers = ["Arms2", "Back1", "BackHolder1", "Base", "Casters", "Config", "Seat", "SeatHolder"];

var artifactCanvas = document.getElementById('artifactCanvas');


var container, stats, controls;
var camera, scene, renderer, light;
var clock = new THREE.Clock();
var mixer;
var bulbLight, bulbMat, hemiLight, stats;
var meshes;

var params = {
    shadows: true,
    exposure: 0.85,
    bulbPower: 6,
    hemiIrradiance: 18,
    metalness: 0.86,
    roughness: 1,
};



init();
animate();
function init() {

  container = document.createElement('div');
  document.body.appendChild(container);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(100, 100, 300);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);


  var bulbGeometry = new THREE.SphereBufferGeometry(0.02, 16, 8);
  bulbLight = new THREE.PointLight(0xffffff, 5000, 5000, 2);
  bulbMat = new THREE.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000
  });
  bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
  bulbLight.position.set(0, 50, 0);
  bulbLight.castShadow = true;
  scene.add(bulbLight);

  hemiLight = new THREE.HemisphereLight(0xEEEEEE, 0xaaaaaa, 0.02); //0x0f0e0d
  scene.add(hemiLight);

  var spotLight = new THREE.SpotLight( 0xffffff );
spotLight.position.set( 10, 10, 10 );
scene.add( spotLight );

  // ground
  var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(500, 500), new THREE.MeshPhongMaterial({ color: 0xDDDDDD, depthWrite: false }));
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  var grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);
  // model
    // model


    var ddsLoader = new DDSLoader();

    var cubeMapTexture = new THREE.CubeTextureLoader().setPath('./Test/')
        .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], function (rgbmCubeMap) {
            rgbmCubeMap.encoding = THREE.RGBM16Encoding;
            rgbmCubeMap.format = THREE.RGBAFormat;
            var pmremGenerator = new PMREMGenerator(rgbmCubeMap);
            pmremGenerator.update(renderer);
            var pmremCubeUVPacker = new PMREMCubeUVPacker(pmremGenerator.cubeLods);
            pmremCubeUVPacker.update(renderer);
            var rgbmCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;

            rgbmCubeMap.magFilter = THREE.LinearFilter;
            rgbmCubeMap.needsUpdate = true;
            
            //scene.background = rgbmCubeMap;
            pmremGenerator.dispose();
            pmremCubeUVPacker.dispose();
        });
    cubeMapTexture.exposure = 1;

    var loader = new GLTFLoader();
    loader.load('models/Roswell.glb', function (object) {
        meshes = object.scene.children[0];
        
        scene.add(object.scene);
        object.scene.children[0].position.set(1, 75, 1);
        for (var i = 0; i < object.scene.children[0].children.length; i++) {
            //Scale
            object.scene.children[0].children[i].scale.set(0.1, 0.1, 0.1);
            //Materials
            object.scene.children[0].children[i].children[0].material.envMap = cubeMapTexture;
            object.scene.children[0].children[i].children[0].material.metalness = 1;
            object.scene.children[0].children[i].children[0].material.roughness = 1;
            console.log(object.scene.children[0].children[0].children[0].material);
            //shadow casting
            object.scene.children[0].children[i].children[0].castShadow = true;
            object.scene.children[0].children[i].children[0].receiveShadow = true;
            //hide layers
            if (!defaultLayers.includes(object.scene.children[0].children[i].name)) {
                object.scene.children[0].children[i].visible = false;
            }
            if (object.scene.children[0].children[i].name.includes("Casters")) {
                object.scene.children[0].children[i].children[0].material.metalness = 1;
                object.scene.children[0].children[i].children[0].material.roughness = 0;

            }
        }

    });
    


    renderer = new THREE.WebGLRenderer({ canvas: artifactCanvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 50, 0);
    controls.update();
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.4;
    controls.staticMoving = true;
    controls.update();

    var gui = new GUI();
    gui.add(params, 'hemiIrradiance', 10, 30);
    gui.add(params, 'bulbPower', 0, 200);
    gui.add(params, 'exposure', 0, 1);
    gui.add(params, 'metalness', 0, 1);
    gui.add(params, 'roughness', 0, 1);
    gui.add(params, 'shadows');
    gui.open();


    window.addEventListener('resize', onWindowResize, false);
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();
    renderer.render(scene, camera);
    controls.update();

    render();
}

var previousShadowMap = false;
function render() {
    renderer.toneMappingExposure = Math.pow(params.exposure, 4.0); // to allow for very bright scenes.
    renderer.shadowMap.enabled = params.shadows;
    bulbLight.castShadow = params.shadows;
    if (params.shadows !== previousShadowMap) {

        previousShadowMap = params.shadows;
    }
    bulbLight.power = params.bulbPower;
    bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow(0.02, 2.0); // convert from intensity to irradiance at bulb surface
    hemiLight.intensity = params.hemiIrradiance;
    var time = Date.now() * 0.0005;
    //bulbLight.position.y = Math.cos(time) * 0.75 + 1.25;
    if (meshes)
    for (var i = 0; i < meshes.children.length; i++) {

        meshes.children[i].children[0].material.metalness = params.metalness;
        meshes.children[i].children[0].material.roughness = params.roughness;
    }


    renderer.render(scene, camera);
}
