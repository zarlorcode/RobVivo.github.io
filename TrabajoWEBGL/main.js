import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { OrbitControls } from "../lib/OrbitControls.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {GUI} from "../lib/lil-gui.module.min.js";

let suelo;
let video,effectController;
class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  } 

  get animations() {
    return this._animations;
  }
};


class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 100.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._position = new THREE.Vector3();

    this._animations = {};
    this._input = new BasicCharacterControllerInput();
    this._stateMachine = new CharacterFSM(
        new BasicCharacterControllerProxy(this._animations));

    this._LoadModels();
  }

  _LoadModels() {
    const loader = new FBXLoader();
    loader.setPath('models/Player/');
    loader.load('player.fbx', (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse(c => {
        c.castShadow = true;
      });

      this._target = fbx;
      this._params.scene.add(this._target);
      //fbx.position.set(120, 1, -100);  // Esquina frontal izquierda

      this._mixer = new THREE.AnimationMixer(this._target);

      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {
        this._stateMachine.SetState('idle');
      };

      const _OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);
  
        this._animations[animName] = {
          clip: clip,
          action: action,
        };
      };

      const loader = new FBXLoader(this._manager);
      loader.setPath('models/Player/');
      loader.load('walk.fbx', (a) => { _OnLoad('walk', a); });
      loader.load('run.fbx', (a) => { _OnLoad('run', a); });
      loader.load('idle.fbx', (a) => { _OnLoad('idle', a); });
      loader.load('dance.fbx', (a) => { _OnLoad('dance', a); });
    });
  }

  get Position() {
    return this._position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  Update(timeInSeconds) {
    if (!this._stateMachine._currentState) {
      return;
    }

    this._stateMachine.Update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(4.0);
    }

    if (this._stateMachine._currentState.Name == 'dance') {
      acc.multiplyScalar(0.0);
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    this._position.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
};

class BasicCharacterControllerInput {
  constructor() {
    this._Init();    
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch(event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
    }
  }
};


class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;
    
    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
};


class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
    this._AddState('run', RunState);
    this._AddState('dance', DanceState);
  }
};


class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() {}
  Exit() {}
  Update() {}
};


class DanceState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    }
  }

  get Name() {
    return 'dance';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['dance'].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();  
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState('idle');
  }

  _Cleanup() {
    const action = this._parent._proxy._animations['dance'].action;
    
    action.getMixer().removeEventListener('finished', this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {
  }
};


class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'walk';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['walk'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'run') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState('run');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};


class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'run';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['run'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'walk') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState('walk');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};


class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'idle';
  }

  Enter(prevState) {
    const idleAction = this._parent._proxy._animations['idle'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {
  }

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk');
    } else if (input._keys.space) {
      this._parent.SetState('dance');
    }
  }
};


class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(-15, 20, -30);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 10, 50);
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    // const t = 0.05;
    // const t = 4.0 * timeElapsed;
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}


class ThirdPersonCameraDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    light.position.set(170, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = 0.01;  // Reducción del bias para evitar el espacio
    light.shadow.normalBias = 0.05;  // Puede ayudar a suavizar los bordes
    light.shadow.mapSize.width = 8192;
    light.shadow.mapSize.height = 8192;


    // Ajuste del área de la cámara de sombras
    light.shadow.camera.left = -225;  // Esto cubre la mitad del plano 450x450
    light.shadow.camera.right = 225;
    light.shadow.camera.top = 225;
    light.shadow.camera.bottom = -225;

    // Ajuste de los valores near y far para asegurar que cubran todo el rango
    light.shadow.camera.near = 0.1;   // Valor cercano
    light.shadow.camera.far = 1000;   // Aumentado el rango de visión de las sombras

    this._scene.add(light);

  // Agregar el helper de la luz direccional
  //const lightHelper = new THREE.DirectionalLightHelper(light, 5); // Tamaño del helper
  //this._scene.add(lightHelper);

    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this._scene.add(light);

    let path ="./images/";
    const texsuelo = new THREE.TextureLoader().load(path+"rockyTerrain.jpg");
    texsuelo.repeat.set(4,3);
    texsuelo.wrapS= texsuelo.wrapT = THREE.MirroredRepeatWrapping;
    const matsuelo = new THREE.MeshStandardMaterial({color:"rgb(150,150,150)",map:texsuelo});
    // Suelo
    suelo = new THREE.Mesh( new THREE.PlaneGeometry(450,450,450,100), matsuelo );
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    suelo.castShadow = false;
    suelo.receiveShadow = true;
    this._scene.add(suelo);

    //VIDEO
    // Cine
    video = document.createElement('video');
    video.src = "./videos/GOTVideo.mp4";
    video.load();
    video.muted = false;
    video.play();
    const texvideo = new THREE.VideoTexture(video);
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(80,38, 4,4), 
                                    new THREE.MeshBasicMaterial({map:texvideo}));
    pantalla.position.set(-10,20,50);
    pantalla.rotation.y = -Math.PI;
    this._scene.add(pantalla);
   


  //CARGAR PAREDES
  const glloader = new GLTFLoader();

  // Crear un objeto vacío para las paredes
  const wallsGroup = new THREE.Group(); 

  glloader.load('models/screen_set/scene.gltf', (gltf) => {
    gltf.scene.position.y = 1; 
    gltf.scene.rotation.y = -Math.PI / 2; 
    gltf.scene.scale.set(15, 15, 15); 

    // Establecer el tamaño de la pantalla para que se repita adecuadamente
    const modelWidth = 15; // Ancho del modelo
    const modelDepth = 15; // Profundidad del modelo

    // Crear las paredes de la habitación (frontal, trasera, izquierda, derecha)
    const roomSize = 400;  // Tamaño del plano (500x500)

    // Pared frontal (a lo largo del eje X)
    for (let x = -roomSize / 2; x < roomSize / 2; x += modelWidth) {
        const newModel = gltf.scene.clone();
        newModel.position.set(x, 1, roomSize / 2);
        newModel.castShadow = true;  
        newModel.receiveShadow = true;  
        wallsGroup.add(newModel);
    }

    // Pared trasera (a lo largo del eje X)
    for (let x = -roomSize / 2; x < roomSize / 2; x += modelWidth) {
        const newModel = gltf.scene.clone();
        newModel.position.set(x, 1, -roomSize / 2);
        newModel.castShadow = true;  
        newModel.receiveShadow = true;  
        wallsGroup.add(newModel);
    }

    gltf.scene.rotation.y = 0;

    // Pared izquierda (a lo largo del eje Z)
    for (let z = -roomSize / 2; z < roomSize / 2; z += modelDepth) {
        const newModel = gltf.scene.clone();
        newModel.position.set(-roomSize / 2, 1, z);
        newModel.castShadow = true;  
        newModel.receiveShadow = true;  
        wallsGroup.add(newModel);
    }

    // Pared derecha (a lo largo del eje Z)
    for (let z = -roomSize / 2; z < roomSize / 2; z += modelDepth) {
        const newModel = gltf.scene.clone();
        newModel.position.set(roomSize / 2, 1, z);
        newModel.castShadow = true;  
        newModel.receiveShadow = true;  
        wallsGroup.add(newModel);
    }

    wallsGroup.children.forEach((wall) => {
      const position = wall.position;
      // Ajustar la posición de las paredes frontal, trasera, izquierda y derecha
      if (position.x === -roomSize / 2 || position.x === roomSize / 2) {
        position.x -= modelWidth / 2;  // Ajustamos ligeramente en el eje X
      }
      if (position.z === -roomSize / 2 || position.z === roomSize / 2) {
        position.z -= modelDepth / 2;  // Ajustamos ligeramente en el eje Z
      }
    });

    // Añadir el grupo de paredes a la escena
    this._scene.add(wallsGroup);

    console.log("Modelo cargado y paredes generadas correctamente.");
  }, undefined, (error) => {
    console.error("Error al cargar el modelo:", error);
  });


  glloader.load('models/torii/scene.gltf', (gltf) => {
    gltf.scene.position.y = 1;  // Ajusta la altura
    
    gltf.scene.scale.set(0.1, 0.1, 0.1); 
    this._scene.add(gltf.scene);  // Añade el modelo a la escena
    
    // Asigna sombras a todos los objetos dentro del modelo cargado
    gltf.scene.traverse((obj) => {
      if (obj.isObject3D) {
        obj.castShadow = true;  // El objeto emite sombras
        obj.receiveShadow = true;  // El objeto recibe sombras
      }
    });

    console.log("Modelo GLTF cargado correctamente.");
  }, undefined, (error) => {
    console.error("Error al cargar el modelo GLTF:", error);
  });

 
  
  //CARGAR ENTORNO BOX
  path ="./images/Maskonaive2/";
  const paredesEntorno = [];
      paredesEntorno.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                    map: new THREE.TextureLoader().load(path+"posx.jpg")}) );
      paredesEntorno.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                    map: new THREE.TextureLoader().load(path+"negx.jpg")}) );
      paredesEntorno.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                    map: new THREE.TextureLoader().load(path+"posy.jpg")}) );
      paredesEntorno.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                    map: new THREE.TextureLoader().load(path+"negy.jpg")}) );
      paredesEntorno.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                    map: new THREE.TextureLoader().load(path+"posz.jpg")}) );
      paredesEntorno.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                    map: new THREE.TextureLoader().load(path+"negz.jpg")}) );
      const habitacion = new THREE.Mesh( new THREE.BoxGeometry(1000,1000,1000),paredesEntorno);
      this._scene.add(habitacion);


    this._mixers = [];
    this._previousRAF = null;
    setupGUI();
    this._LoadAnimatedModel();
    this._RAF();
  }


  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    }
    this._controls = new BasicCharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }

    if (this._controls) {
      
      this._controls.Update(timeElapsedS);
    }

    this._thirdPersonCamera.Update(timeElapsedS);
  }
}

function setupGUI()
{
	// Definicion de los controles
	effectController = {
		mensaje: 'My cinema',
		play: function(){video.play();},
		pause: function(){video.pause();},
        mute: false,
		colorsuelo: "rgb(150,150,150)"
	};

	// Creacion interfaz
	const gui = new GUI();

	// Construccion del menu
  const videofolder = gui.addFolder("Control video");
  videofolder.add(effectController,"mute").onChange(v=>{video.muted = v});
	videofolder.add(effectController,"play");
	videofolder.add(effectController,"pause");

}
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new ThirdPersonCameraDemo();
});


function _LerpOverFrames(frames, t) {
  const s = new THREE.Vector3(0, 0, 0);
  const e = new THREE.Vector3(100, 0, 0);
  const c = s.clone();

  for (let i = 0; i < frames; i++) {
    c.lerp(e, t);
  }
  return c;
}

function _TestLerp(t1, t2) {
  const v1 = _LerpOverFrames(100, t1);
  const v2 = _LerpOverFrames(50, t2);
  console.log(v1.x + ' | ' + v2.x);
}

_TestLerp(0.01, 0.01);
_TestLerp(1.0 / 100.0, 1.0 / 50.0);
_TestLerp(1.0 - Math.pow(0.3, 1.0 / 100.0), 
          1.0 - Math.pow(0.3, 1.0 / 50.0));

    