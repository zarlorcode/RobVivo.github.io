
import * as THREE from "../lib/three.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";

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

        document.body.appendChild(this._threejs.docElement);

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
        this._LoadModel();
        this._previousRAF();
    }

    _LoadModel(){
        const glloader = new GLTFLoader();
        glloader.load('models/modular_dungeon/scene.gltf', (gltf) => {
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.scale.set(0.5, 0.5, 0.5);
            scene.add(gltf.scene);
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