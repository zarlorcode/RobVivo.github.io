// Escena1.js

//import * as THREE from "../lib/three.module.js";
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";

import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";

class BasicCharacterControls {
    constructor(params) {
        this._Init(params);
    }
    _Init(params) {
        this._params = params;
        this._move = {
            foward: false,
            backward: false,
            left: false,
            right: false,
        };
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.Vector3(1,0.25,50.0);
        this._velocity = new THREE.Vector3(0,0,0);

        document.addEventListener('keydown',(e) => this._onKeyDown(e), false);
        document.addEventListener('keyup',(e) => this._onKeyUp(e), false);
    }
    _onKeyDown(event) {
        switch (event.keyCode) {
            case 87://w
                this._move.foward = true;
                break;
            case 65: //a
                this._move.left = true;
                break;
            case 83: //s
                this._move.backward = true;
                break;
            case 68: // d
                this._move.right = true;
            case 38://up
            case 37: //left
            case 40: //down
            case 39: //right
                break;
        }  
    }    
    
    Update(timeInSeconds){
        const velocity = this._velocity;
        const frameDecceleration = new THREE.Vector3(
            velocity.x*this._decceleration.x,
            velocity.y*this._decceleration.y,
            velocity.z*this._decceleration.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z)*Math.min(
            Math.abs(frameDecceleration.z),Math.abs(velocity.z));
        velocity.add(frameDecceleration);

        const controlObject = this._params.target;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();

        if(this._move.foward) {
            velocity.z += this._acceleration.z * timeInSeconds;
        }

        if(this._move.backward) {
            velocity.z -= this._acceleration.z * timeInSeconds;
        }
        if(this._move.left) {
            velocity.x += this._acceleration.z * timeInSeconds;
        }
        if(this._move.right) {
            velocity.x -= this._acceleration.z * timeInSeconds;
        }
    }
    
}

class LoadModelDemo {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true
        });
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this._threejs.domElement);

        window.addEventListener('resize', () => {
            this._OnWindowResize();
        }, false);

        const fov = 60;
        const aspect = 1920/1080;
        const near = 1.0;
        const far = 1000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(75, 20, 0);

        this._scene = new THREE.Scene();
        
        let light = new THREE.DirectionalLight(0xFFFFFF,1.0);
        light.position.set(20,100,10);
        light.target.position.set(0,0,0);
        light.castShadow =true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        this._scene.add(light);
        
        light = new THREE.AmbientLight(0xFFFFFF,4.0);
        this._scene.add(light);

        const controls = new OrbitControls(
            this._camera, this._threejs.domElement);
        controls.target.set(0,20,0);
        controls.update();

        /*
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load({

        })*/
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100,100,10,10),
            new THREE.MeshStandardMaterial({
                color: 0x202020,
        }));
        plane.castShadow=false;
        plane.receiveShadow=true;
        plane.rotation.x = -Math.PI /2;
        this._scene.add(plane);

        this._previousRAF = null;
        //this._LoadModel();
        this._LoadAnimatedModel();
        this._RAF();
    }

    _LoadAnimatedModel(){
        const loader = new FBXLoader();
        loader.setPath('models/Player/');
        loader.load('player.fbx', (fbx=>{
            fbx.scale.setScalar(0.1);
            fbx.traverse(c =>{
                c.castShadow = true;
            });

            const anim = new FBXLoader();
            anim.setPath('models/Player/');
            anim.load('dance.fbx', (anim) => {
                this._mixer = new THREE.AnimationMixer(fbx);
                const idle = this._mixer.clipAction(anim.animations[0]);
                idle.play();
            });
            this._scene.add(fbx);
        }));
    }
    

    _LoadModel(){
        const glloader = new GLTFLoader();
        glloader.load('models/robota/scene.gltf', (gltf) => {
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.scale.set(0.5, 0.5, 0.5);
            this._scene.add(gltf.scene);
        }, undefined, (error) => {
            console.error("Error cargando el modelo:", error);
        });
    }

    _OnWindowResize(){
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }
    _RAF(){
        requestAnimationFrame((t) =>{
            if(this._previousRAF === null){
                this._previousRAF = t;
            }
            this._RAF();

            this._threejs.render(this._scene, this._camera);
            this._Step(t - this._previousRAF);
            this._previousRAF = t;
        });
    }

    _Step(timeElapsed){
        if(this._mixer){
            this._mixer.update(timeElapsed*0.001);
        }
    }
}

let _APP = null;
window.addEventListener('DOMContentLoaded', () =>{
    _APP = new LoadModelDemo();
});



