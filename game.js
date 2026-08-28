import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";


/* =========================================================
   CRAFT
   Minecraft-style browser game
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const WORLD_SIZE = 32;

const PLAYER_HEIGHT = 1.7;
const PLAYER_SPEED = 6;
const JUMP_POWER = 7;
const GRAVITY = 20;

const BREAK_DISTANCE = 7;


/* =========================================================
   HTML ELEMENTS
========================================================= */

const loadingScreen =
  document.getElementById("loading");

const playButton =
  document.getElementById("playButton");

const coordsElement =
  document.getElementById("coords");

const joystickArea =
  document.getElementById("joystickArea");

const joystickKnob =
  document.getElementById("joystickKnob");

const jumpButton =
  document.getElementById("jumpButton");

const breakButton =
  document.getElementById("breakButton");

const placeButton =
  document.getElementById("placeButton");

const hotbarSlots =
  document.querySelectorAll(".slot");


/* =========================================================
   THREE.JS SETUP
========================================================= */

const scene =
  new THREE.Scene();

scene.background =
  new THREE.Color(0x87ceeb);

scene.fog =
  new THREE.Fog(
    0x87ceeb,
    25,
    65
  );


const camera =
  new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );


const renderer =
  new THREE.WebGLRenderer({
    antialias: true
  });

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

renderer.shadowMap.enabled = true;

document.body.appendChild(
  renderer.domElement
);


/* =========================================================
   LIGHTING
========================================================= */

const ambientLight =
  new THREE.HemisphereLight(
    0xbfe8ff,
    0x4b6b32,
    2
  );

scene.add(
  ambientLight
);


const sun =
  new THREE.DirectionalLight(
    0xffffff,
    2
  );

sun.position.set(
  20,
  35,
  15
);

sun.castShadow = true;

sun.shadow.mapSize.set(
  1024,
  1024
);

scene.add(
  sun
);


/* =========================================================
   BLOCK MATERIALS
========================================================= */

const blockMaterials = {

  grass:
    new THREE.MeshLambertMaterial({
      color: 0x4caf50
    }),

  dirt:
    new THREE.MeshLambertMaterial({
      color: 0x8b5a2b
    }),

  stone:
    new THREE.MeshLambertMaterial({
      color: 0x888888
    }),

  wood:
    new THREE.MeshLambertMaterial({
      color: 0x8b5a2b
    }),

  leaves:
    new THREE.MeshLambertMaterial({
      color: 0x2e8b57
    })

};


const blockGeometry =
  new THREE.BoxGeometry(
    1,
    1,
    1
  );


/* =========================================================
   WORLD DATA
========================================================= */

/*
  blockData:
  Stores every block that exists.

  Format:

  "x,y,z" => {
      type,
      mesh
  }
*/

const blockData =
  new Map();


function blockKey(
  x,
  y,
  z
) {

  return `${x},${y},${z}`;

}


/* =========================================================
   ADD BLOCK
========================================================= */

function addBlock(
  x,
  y,
  z,
  type
) {

  const key =
    blockKey(
      x,
      y,
      z
    );

  if (
    blockData.has(key)
  ) {
    return;
  }


  const mesh =
    new THREE.Mesh(
      blockGeometry,
      blockMaterials[type]
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow = true;

  mesh.receiveShadow = true;


  mesh.userData.block = {
    x,
    y,
    z,
    type
  };


  scene.add(mesh);


  blockData.set(
    key,
    {
      type,
      mesh
    }
  );

}


/* =========================================================
   REMOVE BLOCK
========================================================= */

function removeBlock(
  x,
  y,
  z
) {

  const key =
    blockKey(
      x,
      y,
      z
    );


  const block =
    blockData.get(key);


  if (!block) {

    return;

  }


  scene.remove(
    block.mesh
  );


  blockData.delete(
    key
  );

}


/* =========================================================
   CHECK BLOCK
========================================================= */

function hasBlock(
  x,
  y,
  z
) {

  return blockData.has(
    blockKey(
      x,
      y,
      z
    )
  );

}


/* =========================================================
   TERRAIN HEIGHT
========================================================= */

function getTerrainHeight(
  x,
  z
) {

  const wave1 =
    Math.sin(
      x * 0.28
    ) * 2;

  const wave2 =
    Math.cos(
      z * 0.25
    ) * 2;

  const wave3 =
    Math.sin(
      (x + z) * 0.12
    ) * 2;


  const height =
    Math.floor(
      5 +
      wave1 +
      wave2 +
      wave3
    );


  return Math.max(
    2,
    Math.min(
      11,
      height
    )
  );

}


/* =========================================================
   CREATE TERRAIN
========================================================= */

function createTerrain() {

  for (
    let x = -WORLD_SIZE / 2;
    x < WORLD_SIZE / 2;
    x++
  ) {

    for (
      let z = -WORLD_SIZE / 2;
      z < WORLD_SIZE / 2;
      z++
    ) {

      const height =
        getTerrainHeight(
          x,
          z
        );


      /*
        Only generate visible-ish layers.

        This keeps Craft much lighter
        on iPad.
      */

      for (
        let y = 0;
        y <= height;
        y++
      ) {

        let type =
          "stone";


        if (
          y === height
        ) {

          type =
            "grass";

        }
        else if (
          y >= height - 2
        ) {

          type =
            "dirt";

        }


        /*
          We generate the top,
          plus terrain edges and
          nearby visible layers.
        */

        const isTop =
          y === height;

        const isEdge =
          x === -WORLD_SIZE / 2 ||
          x === WORLD_SIZE / 2 - 1 ||
          z === -WORLD_SIZE / 2 ||
          z === WORLD_SIZE / 2 - 1;


        if (
          isTop ||
          isEdge ||
          y >= height - 2
        ) {

          addBlock(
            x,
            y,
            z,
            type
          );

        }

      }

    }

  }

}


/* =========================================================
   TREES
========================================================= */

function createTree(
  x,
  groundY,
  z
) {

  const trunkHeight =
    3 +
    Math.floor(
      Math.random() * 2
    );


  /*
    Trunk
  */

  for (
    let y = 1;
    y <= trunkHeight;
    y++
  ) {

    addBlock(
      x,
      groundY + y,
      z,
      "wood"
    );

  }


  /*
    Leaves
  */

  const leafY =
    groundY +
    trunkHeight;


  for (
    let lx = -2;
    lx <= 2;
    lx++
  ) {

    for (
      let ly = 0;
      ly <= 3;
      ly++
    ) {

      for (
        let lz = -2;
        lz <= 2;
        lz++
      ) {

        const distance =
          Math.abs(lx) +
          Math.abs(lz);


        if (
          distance <= 3 &&
          !(lx === 0 && lz === 0 && ly === 0)
        ) {

          if (
            Math.random() > 0.15
          ) {

            addBlock(
              x + lx,
              leafY + ly,
              z + lz,
              "leaves"
            );

          }

        }

      }

    }

  }

}


function createTrees() {

  for (
    let i = 0;
    i < 28;
    i++
  ) {

    const x =
      Math.floor(
        Math.random() *
        (WORLD_SIZE - 8)
      ) -
      (WORLD_SIZE / 2 - 4);


    const z =
      Math.floor(
        Math.random() *
        (WORLD_SIZE - 8)
      ) -
      (WORLD_SIZE / 2 - 4);


    /*
      Don't spawn tree
      directly at spawn
    */

    if (
      Math.abs(x) < 5 &&
      Math.abs(z) < 5
    ) {

      continue;

    }


    const groundY =
      getTerrainHeight(
        x,
        z
      );


    createTree(
      x,
      groundY,
      z
    );

  }

}


/* =========================================================
   PLAYER
========================================================= */

const player = {

  position:
    new THREE.Vector3(
      0,
      10,
      0
    ),

  velocityY:
    0,

  onGround:
    false

};


camera.position.copy(
  player.position
);


/* =========================================================
   ROTATION
========================================================= */

let yaw =
  0;

let pitch =
  0;


function updateCameraRotation() {

  pitch =
    Math.max(
      -Math.PI / 2 + 0.05,
      Math.min(
        Math.PI / 2 - 0.05,
        pitch
      )
    );


  camera.rotation.set(
    pitch,
    yaw,
    0,
    "YXZ"
  );

}


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

const keys = {

  forward:
    false,

  backward:
    false,

  left:
    false,

  right:
    false

};


window.addEventListener(
  "keydown",
  event => {

    switch (
      event.code
    ) {

      case "KeyW":
      case "ArrowUp":

        keys.forward = true;
        break;


      case "KeyS":
      case "ArrowDown":

        keys.backward = true;
        break;


      case "KeyA":
      case "ArrowLeft":

        keys.left = true;
        break;


      case "KeyD":
      case "ArrowRight":

        keys.right = true;
        break;


      case "Space":

        jump();
        break;


      case "Digit1":

        selectBlock(
          "grass"
        );

        break;


      case "Digit2":

        selectBlock(
          "dirt"
        );

        break;


      case "Digit3":

        selectBlock(
          "stone"
        );

        break;


      case "Digit4":

        selectBlock(
          "wood"
        );

        break;


      case "Digit5":

        selectBlock(
          "leaves"
        );

        break;

    }

  }
);


window.addEventListener(
  "keyup",
  event => {

    switch (
      event.code
    ) {

      case "KeyW":
      case "ArrowUp":

        keys.forward = false;
        break;


      case "KeyS":
      case "ArrowDown":

        keys.backward = false;
        break;


      case "KeyA":
      case "ArrowLeft":

        keys.left = false;
        break;


      case "KeyD":
      case "ArrowRight":

        keys.right = false;
        break;

    }

  }
);


/* =========================================================
   MOUSE LOOK
========================================================= */

let mouseDown =
  false;

let lastMouseX =
  0;

let lastMouseY =
  0;


renderer.domElement.addEventListener(
  "mousedown",
  event => {

    mouseDown =
      true;

    lastMouseX =
      event.clientX;

    lastMouseY =
      event.clientY;

  }
);


window.addEventListener(
  "mouseup",
  () => {

    mouseDown =
      false;

  }
);


window.addEventListener(
  "mousemove",
  event => {

    if (
      !mouseDown
    ) {

      return;

    }


    const dx =
      event.clientX -
      lastMouseX;

    const dy =
      event.clientY -
      lastMouseY;


    yaw -=
      dx * 0.004;

    pitch -=
      dy * 0.004;


    updateCameraRotation();


    lastMouseX =
      event.clientX;

    lastMouseY =
      event.clientY;

  }
);


/* =========================================================
   TOUCH CAMERA
========================================================= */

let cameraTouch =
  null;

let lastTouchX =
  0;

let lastTouchY =
  0;


renderer.domElement.addEventListener(
  "touchstart",
  event => {

    if (
      event.touches.length !== 1
    ) {

      return;

    }


    const touch =
      event.touches[0];


    /*
      Left side is reserved
      for joystick.
    */

    if (
      touch.clientX <
      window.innerWidth * 0.45
    ) {

      return;

    }


    cameraTouch =
      touch.identifier;


    lastTouchX =
      touch.clientX;

    lastTouchY =
      touch.clientY;

  },
  {
    passive: false
  }
);


renderer.domElement.addEventListener(
  "touchmove",
  event => {

    for (
      const touch of event.touches
    ) {

      if (
        touch.identifier ===
        cameraTouch
      ) {

        const dx =
          touch.clientX -
          lastTouchX;

        const dy =
          touch.clientY -
          lastTouchY;


        yaw -=
          dx * 0.006;

        pitch -=
          dy * 0.006;


        updateCameraRotation();


        lastTouchX =
          touch.clientX;

        lastTouchY =
          touch.clientY;

      }

    }

  },
  {
    passive: false
  }
);


renderer.domElement.addEventListener(
  "touchend",
  event => {

    for (
      const touch of event.changedTouches
    ) {

      if (
        touch.identifier ===
        cameraTouch
      ) {

        cameraTouch =
          null;

      }

    }

  }
);


/* =========================================================
   MOBILE JOYSTICK
========================================================= */

let joystickTouch =
  null;

let joystickX =
  0;

let joystickY =
  0;


function resetJoystick() {

  joystickX = 0;

  joystickY = 0;


  joystickKnob.style.transform =
    "translate(-50%, -50%)";

}


joystickArea.addEventListener(
  "touchstart",
  event => {

    const touch =
      event.changedTouches[0];


    joystickTouch =
      touch.identifier;


    updateJoystick(
      touch
    );

  },
  {
    passive: false
  }
);


joystickArea.addEventListener(
  "touchmove",
  event => {

    for (
      const touch of event.touches
    ) {

      if (
        touch.identifier ===
        joystickTouch
      ) {

        updateJoystick(
          touch
        );

      }

    }

  },
  {
    passive: false
  }
);


joystickArea.addEventListener(
  "touchend",
  event => {

    for (
      const touch of event.changedTouches
    ) {

      if (
        touch.identifier ===
        joystickTouch
      ) {

        joystickTouch =
          null;

        resetJoystick();

      }

    }

  }
);


function updateJoystick(
  touch
) {

  const rect =
    joystickArea.getBoundingClientRect();


  const centerX =
    rect.left +
    rect.width / 2;

  const centerY =
    rect.top +
    rect.height / 2;


  let dx =
    touch.clientX -
    centerX;

  let dy =
    touch.clientY -
    centerY;


  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );


  const maxDistance =
    45;


  if (
    distance >
    maxDistance
  ) {

    dx =
      dx / distance *
      maxDistance;

    dy =
      dy / distance *
      maxDistance;

  }


  joystickX =
    dx / maxDistance;

  joystickY =
    dy / maxDistance;


  joystickKnob.style.transform =
    `translate(
      calc(-50% + ${dx}px),
      calc(-50% + ${dy}px)
    )`;

}


/* =========================================================
   JUMP
========================================================= */

function jump() {

  if (
    player.onGround
  ) {

    player.velocityY =
      JUMP_POWER;

    player.onGround =
      false;

  }

}


jumpButton.addEventListener(
  "pointerdown",
  event => {

    event.preventDefault();

    jump();

  }
);


/* =========================================================
   HOTBAR
========================================================= */

let selectedBlock =
  "grass";


function selectBlock(
  blockType
) {

  selectedBlock =
    blockType;


  hotbarSlots.forEach(
    slot => {

      slot.classList.remove(
        "active"
      );


      if (
        slot.dataset.block ===
        blockType
      ) {

        slot.classList.add(
          "active"
        );

      }

    }
  );

}


hotbarSlots.forEach(
  slot => {

    slot.addEventListener(
      "pointerdown",
      event => {

        event.preventDefault();

        selectBlock(
          slot.dataset.block
        );

      }
    );

  }
);


/* =========================================================
   RAYCASTING
========================================================= */

const raycaster =
  new THREE.Raycaster();

raycaster.far =
  BREAK_DISTANCE;


function getTargetBlock() {

  raycaster.setFromCamera(
    new THREE.Vector2(0, 0),
    camera
  );


  const meshes =
    [];


  blockData.forEach(
    block => {

      meshes.push(
        block.mesh
      );

    }
  );


  const intersections =
    raycaster.intersectObjects(
      meshes,
      false
    );


  if (
    intersections.length === 0
  ) {

    return null;

  }


  return intersections[0];

}


/* =========================================================
   BREAK BLOCK
========================================================= */

function breakBlock() {

  const hit =
    getTargetBlock();


  if (!hit) {

    return;

  }


  const block =
    hit.object.userData.block;


  if (!block) {

    return;

  }


  removeBlock(
    block.x,
    block.y,
    block.z
  );


  /*
    If a top block is broken,
    reveal the block underneath
    so the world doesn't become
    visually empty.
  */

  const belowKey =
    blockKey(
      block.x,
      block.y - 1,
      block.z
    );


  if (
    !blockData.has(
      belowKey
    ) &&
    block.y > 0
  ) {

    addBlock(
      block.x,
      block.y - 1,
      block.z,
      "stone"
    );

  }

}


breakButton.addEventListener(
  "pointerdown",
  event => {

    event.preventDefault();

    breakBlock();

  }
);


/* =========================================================
   PLACE BLOCK
========================================================= */

function placeBlock() {

  const hit =
    getTargetBlock();


  if (!hit) {

    return;

  }


  const normal =
    hit.face.normal.clone();


  normal.transformDirection(
    hit.object.matrixWorld
  );


  const block =
    hit.object.userData.block;


  const x =
    Math.round(
      block.x +
      normal.x
    );

  const y =
    Math.round(
      block.y +
      normal.y
    );

  const z =
    Math.round(
      block.z +
      normal.z
    );


  /*
    Don't place block
    inside player's body.
  */

  const playerBlockX =
    Math.round(
      player.position.x
    );

  const playerBlockY =
    Math.floor(
      player.position.y - 1
    );

  const playerBlockZ =
    Math.round(
      player.position.z
    );


  if (
    x === playerBlockX &&
    z === playerBlockZ &&
    (
      y === playerBlockY ||
      y === playerBlockY + 1
    )
  ) {

    return;

  }


  addBlock(
    x,
    y,
    z,
    selectedBlock
  );

}


placeButton.addEventListener(
  "pointerdown",
  event => {

    event.preventDefault();

    placeBlock();

  }
);


/* =========================================================
   DESKTOP CLICK BREAK / PLACE
========================================================= */

renderer.domElement.addEventListener(
  "contextmenu",
  event => {

    event.preventDefault();

  }
);


renderer.domElement.addEventListener(
  "dblclick",
  () => {

    breakBlock();

  }
);


/* =========================================================
   PLAYER COLLISION WITH GROUND
========================================================= */

function getGroundHeight(
  x,
  z
) {

  const blockX =
    Math.round(x);

  const blockZ =
    Math.round(z);


  let highest =
    -1;


  blockData.forEach(
    (block, key) => {

      const parts =
        key.split(",");


      const bx =
        Number(parts[0]);

      const by =
        Number(parts[1]);

      const bz =
        Number(parts[2]);


      if (
        bx === blockX &&
        bz === blockZ
      ) {

        highest =
          Math.max(
            highest,
            by
          );

      }

    }
  );


  return highest;

}


/* =========================================================
   UPDATE PLAYER
========================================================= */

function updatePlayer(
  delta
) {

  /*
    Keyboard + joystick
  */

  let forward =
    joystickY;

  let side =
    joystickX;


  if (
    keys.forward
  ) {

    forward -= 1;

  }


  if (
    keys.backward
  ) {

    forward += 1;

  }


  if (
    keys.left
  ) {

    side -= 1;

  }


  if (
    keys.right
  ) {

    side += 1;

  }


  const movement =
    new THREE.Vector3(
      side,
      0,
      forward
    );


  if (
    movement.length() > 1
  ) {

    movement.normalize();

  }


  const forwardVector =
    new THREE.Vector3(
      -Math.sin(yaw),
      0,
      -Math.cos(yaw)
    );


  const rightVector =
    new THREE.Vector3(
      Math.cos(yaw),
      0,
      -Math.sin(yaw)
    );


  const moveDirection =
    new THREE.Vector3();


  moveDirection.addScaledVector(
    forwardVector,
    -movement.z
  );


  moveDirection.addScaledVector(
    rightVector,
    movement.x
  );


  player.position.addScaledVector(
    moveDirection,
    PLAYER_SPEED * delta
  );


  /*
    World border
  */

  const border =
    WORLD_SIZE / 2 - 1;


  player.position.x =
    Math.max(
      -border,
      Math.min(
        border,
        player.position.x
      )
    );


  player.position.z =
    Math.max(
      -border,
      Math.min(
        border,
        player.position.z
      )
    );


  /*
    Gravity
  */

  player.velocityY -=
    GRAVITY * delta;


  player.position.y +=
    player.velocityY * delta;


  /*
    Ground collision
  */

  const groundHeight =
    getGroundHeight(
      player.position.x,
      player.position.z
    );


  const playerFeet =
    player.position.y -
    PLAYER_HEIGHT;


  const groundTop =
    groundHeight +
    0.5;


  if (
    playerFeet <=
    groundTop
  ) {

    player.position.y =
      groundTop +
      PLAYER_HEIGHT;


    player.velocityY =
      0;


    player.onGround =
      true;

  }
  else {

    player.onGround =
      false;

  }


  camera.position.copy(
    player.position
  );


  coordsElement.textContent =
    `X: ${Math.round(player.position.x)}
     Y: ${Math.round(player.position.y)}
     Z: ${Math.round(player.position.z)}`;

}


/* =========================================================
   GAME LOOP
========================================================= */

const clock =
  new THREE.Clock();


function animate() {

  requestAnimationFrame(
    animate
  );


  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );


  updatePlayer(
    delta
  );


  renderer.render(
    scene,
    camera
  );

}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }
);


/* =========================================================
   START GAME
========================================================= */

function startGame() {

  loadingScreen.style.display =
    "none";


  createTerrain();

  createTrees();


  /*
    Spawn player
  */

  const spawnGround =
    getGroundHeight(
      0,
      0
    );


  player.position.set(
    0,
    spawnGround +
    PLAYER_HEIGHT +
    0.6,
    0
  );


  camera.position.copy(
    player.position
  );


  updateCameraRotation();

  animate();

}


playButton.addEventListener(
  "click",
  startGame
);
