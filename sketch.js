// @ts-nocheck
let video;
let handPose;
let hands = [];
let faceMesh;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let sfasamento = 10;
let scaleFactor = 1;
let rotationAngle = 0;
let grabActive = false;

function preload() {
  handPose = ml5.handPose({ flipped: false });
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handPose.detectStart(video, (results) => {
    hands = results;
  });

  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  grabActive = false;

  for (let hand of hands) {
    const kp = (name) => hand.keypoints.find((p) => p.name === name);

    let indexTip = kp("index_finger_tip");
    let indexBase = kp("index_finger_mcp");
    let thumbTip = kp("thumb_tip");
    let pinkyTip = kp("pinky_tip");

    if (thumbTip && pinkyTip && indexTip && indexBase) {
      let distance = dist(indexTip.x, indexTip.y, thumbTip.x, thumbTip.y);

      // Mano destra (pollice a sinistra del mignolo)
      if (thumbTip.x < pinkyTip.x) {
        // Calcolo della rotazione
        let dir = createVector(
          indexTip.x - indexBase.x,
          indexTip.y - indexBase.y
        );
        rotationAngle = dir.heading();

        // Se distanza tra indice e pollice è piccola → mano chiusa
        if (distance < 10) {
          grabActive = true;
        }
      }
      // Mano sinistra
      else {
        sfasamento = map(indexTip.x, 0, video.width, 0, 100);
        scaleFactor = map(indexTip.y, 0, video.height, 2, 0.5);
        scaleFactor = constrain(scaleFactor, 0.5, 2);
      }
    }
  }

  for (let i = 0; i < faces.length; i++) {
    drawUniqueVideoGridOnFace(faces[i], 5, 6);
  }
}

function drawUniqueVideoGridOnFace(face, cols = 5, rows = 6) {
  let left = face.box.xMin;
  let top = face.box.yMin;
  let boxWidth = face.box.width;
  let boxHeight = face.box.height;

  let baseCellW = boxWidth / cols;
  let baseCellH = boxHeight / rows;

  let cellW = baseCellW * scaleFactor;
  let cellH = baseCellH * scaleFactor;

  let centerX = left + boxWidth / 2;
  let centerY = top + boxHeight / 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let cx = left + baseCellW * x;
      let cy = top + baseCellH * y;

      let targetX = cx;
      let targetY = cy;

      // Se la mano è chiusa, porta i tasselli verso il centro
      if (grabActive) {
        let lerpAmt = 0.85;
        targetX = lerp(cx, centerX, lerpAmt);
        targetY = lerp(cy, centerY, lerpAmt);
      }

      push();
      translate(targetX + baseCellW / 2, targetY + baseCellH / 2);
      rotate(rotationAngle);

      copy(
        video,
        cx - x * sfasamento,
        cy - y * sfasamento,
        cellW,
        cellH,
        -cellW / 2,
        -cellH / 2,
        cellW,
        cellH
      );
      pop();
    }
  }
}

function gotFaces(results) {
  faces = results;
}
