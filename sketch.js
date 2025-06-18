// @ts-nocheck
let video;
let handPose;
let hands = [];
let faceMesh;
let faces = [];
let sfasamento = 1;
let scaleFactor = 1;
let grid_rows = 10;
let grid_cols = 10;

function preload() {
  handPose = ml5.handPose({ flipped: false });
  faceMesh = ml5.faceMesh({
    maxFaces: 1,
    refineLandmarks: false,
    flipHorizontal: false,
  });
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

  if (hands.length > 0) {
    let hand = hands[0];
    let indexTip = hand.keypoints.find((p) => p.name === "index_finger_tip");
    if (indexTip) {
      sfasamento = map(indexTip.x, 0, video.width, 0.5, 2);
      scaleFactor = map(indexTip.y, 0, video.height, 2, 0.5);
      scaleFactor = constrain(scaleFactor, 0.5, 2);
    }
  }

  for (let i = 0; i < faces.length; i++) {
    drawUniqueVideoGridOnFace(faces[i], grid_cols, grid_rows);
  }
}

function drawUniqueVideoGridOnFace(face, cols, rows) {
  let left = face.box.xMin;
  let top = face.box.yMin;
  let boxWidth = face.box.width;
  let boxHeight = face.box.height;

  let baseCellW = boxWidth / cols;
  let baseCellH = boxHeight / rows;

  let grid_center = createVector(left + boxWidth / 2, top + boxHeight / 2);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let cellX = left + baseCellW * x;
      let cellY = top + baseCellH * y;

      let cell_center = createVector(
        cellX + baseCellW / 2,
        cellY + baseCellH / 2
      );
      let diff = p5.Vector.sub(cell_center, grid_center);
      let m = map(faces, 0, width, 0.5, 1.5);
      let source_center = p5.Vector.add(grid_center, diff.mult(sfasamento));

      let source_x = source_center.x - baseCellW / 2;
      let source_y = source_center.y - baseCellH / 2;

      copy(
        video,
        source_x,
        source_y,
        baseCellW,
        baseCellH,
        cellX,
        cellY,
        baseCellW,
        baseCellH
      );
    }
  }
}

function gotFaces(results) {
  faces = results;
}
