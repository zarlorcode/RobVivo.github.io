/**
 * EscenaAnimada.js
 * 
 * Practica AGM #2. Escena basica con interfaz y animacion
 * Se trata de añadir un interfaz de usuario que permita 
 * disparar animaciones sobre los objetos de la escena con Tween
 * 
 * @author 
 * 
 */

// Modulos necesarios
/*******************
 * TO DO: Cargar los modulos necesarios
 *******************/
import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, controls;

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/
let pentagono, angulo = 0;
let material, suelo;
let effectController;

// Acciones
init();
loadScene();
loadGUI();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    /*******************
    * TO DO: Completar el motor de render y el canvas
    *******************/
    document.getElementById('container').appendChild(renderer.domElement);

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5, 0.5, 0.5);
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );
    /*******************
    * TO DO: Añadir manejador de camara (OrbitControls)
    *******************/
    // Añadir controles de órbita
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();
}

function loadScene()
{
    const material = new THREE.MeshNormalMaterial( {wireframe:false} );

    /*******************
    * TO DO: Misma escena que en la practica anterior
    *******************/
   // Suelo
   suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), material);
   suelo.rotation.x = -Math.PI / 2;
   scene.add(suelo);

   // Crear el conjunto de objetos en un pentágono
   pentagono = new THREE.Object3D();
   scene.add(pentagono);
   const radio = 3;
   const geometries = [
       new THREE.BoxGeometry(1, 1, 1),
       new THREE.SphereGeometry(0.5, 20, 20),
       new THREE.ConeGeometry(0.5, 1, 20),
       new THREE.CylinderGeometry(0.3, 0.3, 1, 20),
       new THREE.TorusGeometry(0.5, 0.2, 16, 100)
   ];
   
   for (let i = 0; i < 5; i++) {
       const mesh = new THREE.Mesh(geometries[i], material);
       const angle = (i * 2 * Math.PI) / 5;
       mesh.position.set(radio * Math.cos(angle), 0.5, radio * Math.sin(angle));
       pentagono.add(mesh);
   }


    // Importar un modelo en json en el centro del pentágono
    const loader = new THREE.ObjectLoader();
    loader.load('models/soldado/soldado.json', 
    function (objeto){
        const soldado = new THREE.Object3D();
        soldado.add(objeto);
        soldado.position.set(0, 0, 0); // Asegúrate de que el soldado esté en el centro
        scene.add(soldado);
        soldado.name = 'soldado';
    });
   
   // Ejes
   scene.add(new THREE.AxesHelper(5));

}

function loadGUI()
{
    // Interfaz de usuario
    /*******************
    * TO DO: Crear la interfaz de usuario con la libreria lil-gui.js
    * - Funcion de disparo de animaciones. Las animaciones deben ir
    *   encadenadas
    * - Slider de control de radio del pentagono
    * - Checkbox para alambrico/solido
    *******************/

    effectController = {
        animar: function () {
            animarPentagono();
        },
        radio: 3,
        wireframe: false
    };
    
    const gui = new GUI();
    gui.add(effectController, 'animar').name('Iniciar Animación');
    gui.add(effectController, 'radio', 2, 6, 0.1).name('Radio Pentágono').onChange(updateRadio);
    gui.add(effectController, 'wireframe').name('Modo Alambrico').onChange(updateWireframe);
}

function animarPentagono() {
    new TWEEN.Tween(pentagono.rotation)
        .to({ y: pentagono.rotation.y + Math.PI * 2 }, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

function updateRadio() {
    let radio = effectController.radio;
    pentagono.children.forEach((obj, i) => {
        const angle = (i * 2 * Math.PI) / 5;
        obj.position.set(radio * Math.cos(angle), 0.5, radio * Math.sin(angle));
    });
}

function updateWireframe() {
    pentagono.children.forEach(obj => {
        obj.material.wireframe = effectController.wireframe;
    });
    suelo.material.wireframe = effectController.wireframe;
}

function update(delta)
{
    /*******************
    * TO DO: Actualizar tween
    *******************/
    TWEEN.update(delta);
}

function render(delta)
{
    requestAnimationFrame( render );
    update(delta);
    renderer.render( scene, camera );
}