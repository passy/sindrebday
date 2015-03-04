'use strict';

/**
Copyright (c) 2015 by chris-creditdesign (http://codepen.io/chris-creditdesign/pen/emKQwY)

With modifications from the TasteJS team (Addy, Stephen, Passy). https://github.com/tastejs

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var scene;
var cube;
var camera;
var renderer;
var clock;
var holder;
var intersects;
var particles = [];
var level = 1;
var totalLevels = 1;
var score = 0;
var totalTargets = 3;
var speed = 0.01;
var complete = false;
var comments = ['Easy', 'Tricky', 'Almost there'];
var myLevel = document.getElementById('level');
var myScore = document.getElementById('score');
var faces = ['passy', 'addy', 'stephen']
    .map(function(o) {
        return 'faces/' + o + '.jpeg';
    }).map(function(o) {
        var texture = new THREE.ImageUtils.loadTexture(o);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.name = o;
        return texture;
    });

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function myScene() {
    scene = new THREE.Scene();
    var light = new THREE.AmbientLight(0xffffff);
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 18;

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height);
    document.getElementById('webgl-container').appendChild(renderer.domElement);
    clock = new THREE.Clock();

    var sLight = new THREE.SpotLight(0xffffff);
    sLight.position.set(-100, 100, 100);
    scene.add(sLight);

    var aLight = new THREE.AmbientLight(0xffffff);
    scene.add(aLight);
}

function spinner() {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshPhongMaterial({
        color: 'hotpink',
        ambient: 'hotpink'
    });

    var cube = new THREE.Mesh(geometry, material);
    cube.position.x = 10;
    var spinner = new THREE.Object3D();
    spinner.rotation.x = 6;

    spinner.add(cube);
    scene.add(spinner);
}

function addHolder() {
    holder = new THREE.Object3D();
    holder.name = 'holder'

    for (var i = 0; i < totalTargets; i++) {
        var ranCol = new THREE.Color();
        ranCol.setRGB(Math.random(), Math.random(), Math.random());

        var geometry = new THREE.BoxGeometry(2, 2, 2);
        var material = new THREE.MeshPhongMaterial({
            map: _.sample(faces)
        });

        var cube = new THREE.Mesh(geometry, material);
        cube.position.x = i * 5;
        cube.name = 'cubeName' + i;

        var spinner = new THREE.Object3D();
        spinner.rotation.x = i * 2.5 * Math.PI;
        spinner.name = 'spinnerName' + i;

        spinner.add(cube);
        holder.add(spinner);
    };
    scene.add(holder);
}

function addExplosion(point) {
    var timeNow = clock.getElapsedTime();

    for (var i = 0; i < 4; i++) {
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshBasicMaterial({
            color: 0x999999
        });
        var part = new THREE.Mesh(geometry, material);
        part.position.x = point.x;
        part.position.y = point.y;
        part.position.z = point.z;
        part.name = 'part' + i;
        part.birthDay = timeNow;
        scene.add(part);
        particles.push(part);
    };
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {

    holder.children.forEach(function(elem, index, array) {
        elem.rotation.y += (speed * (6 - index));
        elem.children[0].rotation.x += 0.01;
        elem.children[0].rotation.y += 0.01;
    });

    if (particles.length > 0) {
        particles.forEach(function(elem, index, array) {
            switch (elem.name) {
                case 'part0':
                    elem.position.x += 1;
                    break;
                case 'part1':
                    elem.position.x -= 1;
                    break;
                case 'part2':
                    elem.position.y += 1;
                    break;
                case 'part3':
                    elem.position.y -= 1;
                    break;
                default:
                    break;
            }

            if (elem.birthDay - clock.getElapsedTime() < -1) {
                scene.remove(elem);
                particles.splice(index, 1);
            }
        })

    };

    renderer.render(scene, camera);
}

function onDocumentMouseDown(event) {
    event.preventDefault();

    if (complete) {
        complete = false;
        score = 0;
        restartScene();
        return;
    }

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    if (score < totalTargets) {
        holder.children.forEach(function(elem, index, array) {
            intersects = raycaster.intersectObjects(elem.children);
            if (intersects.length > 0 && intersects[0].object.visible) {
                intersects[0].object.visible = false;

                addExplosion(intersects[0].point);
                score += 1;

                if (score < totalTargets) {
                    myScore.innerHTML = '<span class="hit">HIT!</span> Score: ' + score + '/' + totalTargets;
                } else {
                    complete = true;

                    if (level < totalLevels) {
                        myScore.innerHTML = '<strong>You got \'em all!</strong> Click the screen for level ' + (level + 1) + '.';
                    } else {
                        // OMG, please make this prettier!
                        myScore.innerHTML = '<strong>You win!</strong> <span class="effing">Happy Birthday, Sindre!</span> <br><img class="winimg" src="sindre.jpg" alt="SINDRE IS THE BEST">';
                    }
                };
            }
        });
    }
}

function restartScene() {
    myScore.innerHTML = '';

    if (level < totalLevels) {
        speed += 0.005;
        totalTargets += 1;
        level += 1;
    } else {
        speed = 0.01;
        totalTargets = 3;
        level = 1;
    }

    myLevel.innerText = comments[level - 1] + ': Level ' + level + ' of ' + totalLevels;
    scene.remove(holder);
    addHolder();
}

document.getElementById('webgl-container').addEventListener('mousedown', onDocumentMouseDown, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}

window.onload = function() {
    myLevel.innerText = comments[level - 1] + ': Level ' + level + ' of ' + totalLevels;
    myScene();
    addHolder();
    animate();

    window.addEventListener('resize', onWindowResize, false);
};
