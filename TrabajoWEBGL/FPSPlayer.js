// FPSPlayer.js

import * as THREE from '../lib/three.module.js'; // Importar THREE
export default class FPSPlayer {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.speed = 0.1; // Velocidad de movimiento
        this.mouseSensitivity = 0.002; // Sensibilidad del mouse

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.rotation = new THREE.Vector2();

        this.prevTime = performance.now();

        // Variables para el control del mouse
        this.isMouseCaptured = false;
        this.mouseX = 0;
        this.mouseY = 0;

        // Configurar el raycaster para las colisiones
        this.raycaster = new THREE.Raycaster();
    }

    handleInput(keyboard) {
        this.direction.set(0, 0, 0);

        // Dirección del movimiento en función de las teclas presionadas
        if (keyboard.forward) this.direction.z = -1;
        if (keyboard.backward) this.direction.z = 1;
        if (keyboard.left) this.direction.x = -1;
        if (keyboard.right) this.direction.x = 1;

        this.move();
    }

    move() {
        this.velocity.copy(this.direction).multiplyScalar(this.speed);
        this.camera.position.add(this.velocity);
    }

    updateMouseMovement(mouseX, mouseY) {
        if (!this.isMouseCaptured) return;

        let deltaX = mouseX - this.mouseX;
        let deltaY = mouseY - this.mouseY;

        // Rotar la cámara
        this.rotation.x -= deltaY * this.mouseSensitivity;
        this.rotation.y -= deltaX * this.mouseSensitivity;

        // Limitar la rotación en Y (evitar que se gire completamente hacia atrás)
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

        this.camera.rotation.set(this.rotation.x, this.rotation.y, 0);

        // Actualizar la posición del mouse
        this.mouseX = mouseX;
        this.mouseY = mouseY;
    }

    update(keyboard, mouseX, mouseY) {
        this.handleInput(keyboard); // Actualizar el movimiento según las teclas presionadas
        this.updateMouseMovement(mouseX, mouseY); // Actualizar la rotación de la cámara
    }

    toggleMouseCapture() {
        this.isMouseCaptured = !this.isMouseCaptured;
        if (this.isMouseCaptured) {
            this.mouseX = window.innerWidth / 2;
            this.mouseY = window.innerHeight / 2;
            document.body.style.cursor = 'none'; // Esconde el cursor cuando está capturado
        } else {
            document.body.style.cursor = 'auto'; // Vuelve a mostrar el cursor
        }
    }
}




