"use strict";

let img;
let canvas;
let displayWidth, displayHeight;
let widthSlider, heightSlider;
let filterTypes;

const editContainer = document.getElementById("edit-container");
const pageContainer = document.getElementById("page-container");
const imageUrl = pageContainer.getAttribute("data-imageUrl");

function preload() {
  // Load the image from a known URL
  img = loadImage(imageUrl);
}

function setup() {
  img.resize(windowWidth/1.5, 0); // Resize image to fit the window width while maintaining aspect ratio
  displayWidth = img.width;
  displayHeight = img.height;
  canvas = createCanvas(displayWidth, displayHeight); // Adjust the canvas size as needed
  canvas.parent(editContainer);
  pixelDensity(1);
  updateSliders();
  filterTypes = {
    "GRAY": GRAY,
    "THRESHOLD": THRESHOLD,
    "INVERT": INVERT,
    "BLUR": BLUR,
  }
}

function draw() {
  background(255);
  image(img, 0, 0, displayWidth, displayHeight); // Display the image
}

function updateSliders() {
  widthSlider = document.getElementById('widthSlider');
  heightSlider = document.getElementById('heightSlider');

  widthSlider.max = img.width;
  heightSlider.max = img.height;
  widthSlider.value = img.width;
  heightSlider.value = img.height;

  widthSlider.addEventListener('input', adjustSize);
  heightSlider.addEventListener('input', adjustSize);
}

function adjustSize() {
  displayWidth = widthSlider.value;
  displayHeight = heightSlider.value;
  resizeCanvas(displayWidth, displayHeight); // Resize the canvas to new dimensions
}

document.getElementById('button-filter').addEventListener('click', function () {
  const filterType = document.getElementById('image-filter').value;

  if (filterType === "INVERT") img.filter(INVERT);
  if (filterType === "GRAY") img.filter(GRAY);
  if (filterType === "THRESHOLD") img.filter(THRESHOLD);
  if (filterType === "BLUR") img.filter(BLUR, 10);
  if (filterType === "SEPIA") applySepiaFilter(img);

  redraw(); // Redraw to apply the filter
});

function downloadImage() {
  saveCanvas(canvas, 'editedImage', 'jpg');
}

function applySepiaFilter(img) {
  img.loadPixels();  // Load the pixels of the image to manipulate them

  for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
          let index = (x + y * img.width) * 4;  // Calculate the index in the pixel array
          let r = img.pixels[index];
          let g = img.pixels[index + 1];
          let b = img.pixels[index + 2];

          // Sepia formula
          let tr = (0.393 * r) + (0.769 * g) + (0.189 * b);
          let tg = (0.349 * r) + (0.686 * g) + (0.168 * b);
          let tb = (0.272 * r) + (0.534 * g) + (0.131 * b);

          // Clamping the values to ensure they remain between 0 and 255
          img.pixels[index] = tr > 255 ? 255 : tr;
          img.pixels[index + 1] = tg > 255 ? 255 : tg;
          img.pixels[index + 2] = tb > 255 ? 255 : tb;
      }
  }

  img.updatePixels();  // Update the image with the new pixel data
}

