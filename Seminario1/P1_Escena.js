/**
 * Escena.js
 * 
 * Practica AGM #1. Escena basica en three.js
 * Seis objetos organizados en un grafo de escena con
 * transformaciones, animacion basica y modelos importados
 * 
 * @author 
 * 
 */

// Modulos necesarios
/*******************
 * TO DO: Cargar los modulos necesarios
 *******************/
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";

// Variables de consenso
let renderer, scene, camera;

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/
let pentagono, angulo = 0;

// Acciones
init();
loadScene();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    /*******************
    * TO DO: Completar el motor de render y el canvas
    *******************/
    document.getElementById('container').appendChild( renderer.domElement );

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );
    camera.lookAt( new THREE.Vector3(0,1,0) );
}

function loadScene()
{
    const material = new THREE.MeshNormalMaterial( );

    /*******************
    * TO DO: Construir un suelo en el plano XZ
    *******************/
    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 10,10), material );
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);

    /*******************
    * TO DO: Construir una escena con 5 figuras diferentes posicionadas
    * en los cinco vertices de un pentagono regular alredor del origen
    *******************/

    // Crear el conjunto de objetos en un pentágono
    pentagono = new THREE.Object3D();
    scene.add(pentagono);
    const radio = 3;
    const figuras = [];
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
        figuras.push(mesh);
        pentagono.add(mesh);
    }

    /*******************
    * TO DO: Añadir a la escena un modelo importado en el centro del pentagono
    *******************/
   // Importar un modelo en glTF en el centro del pentágono

   /*  const loader = new THREE.ObjectLoader();
       loader.load('models/soldado/soldado.json', 
       function (objeto)
       {
           const soldado = new THREE.Object3D();
           soldado.add(objeto);
           cubo.add(soldado);
           pentagono.add(soldado);
           soldado.name = 'soldado';
       });*/
    
    const glloader = new GLTFLoader();
    console.log("Intentando cargar modelo...");
    glloader.load( 'models/robota/scene.gltf', function ( gltf ) {
        console.log("Modelo cargado:", gltf);
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.scale.set(0.5, 0.5, 0.5);;
        pentagono.add(gltf.scene);
       
    }, undefined, function ( error ) {
       
        console.error("Error cargando el modelo:", error);
       
    });

    /*******************
    * TO DO: Añadir a la escena unos ejes
    *******************/
   scene.add(new THREE.AxesHelper(5));
}

function update()
{
    /*******************
    * TO DO: Modificar el angulo de giro de cada objeto sobre si mismo
    * y del conjunto pentagonal sobre el objeto importado
    *******************/
    angulo += 0.01;
    pentagono.rotation.y = angulo;
    pentagono.children.forEach(obj => obj.rotation.y += 0.02);
}

function render()
{
    requestAnimationFrame( render );
    update();
    renderer.render( scene, camera );
}