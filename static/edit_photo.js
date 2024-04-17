"use strict";

let img;
let canvas;
let displayWidth, displayHeight;
let widthSlider, heightSlider;
let filterTypes;

const editContainer = document.getElementById("edit-container");
const pageContainer = document.getElementById("page-container");
const imageUrl = pageContainer.getAttribute("data-imageUrl");
const imageFilename = pageContainer.getAttribute("data-imageFilename");

function preload() {
  // Load the image from a known URL
  img = loadImage(imageUrl);
}

function setup() {
  img.resize(windowWidth / 1.5, 0); // Resize image to fit the window width while maintaining aspect ratio
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
  };
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

  // Loop through every pixel by incrementing by 4 each step (for each RGBA set)
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];     // Red value
    let g = img.pixels[i + 1]; // Green value
    let b = img.pixels[i + 2]; // Blue value

    // Apply the Sepia formula
    let tr = (0.393 * r) + (0.769 * g) + (0.189 * b);
    let tg = (0.349 * r) + (0.686 * g) + (0.168 * b);
    let tb = (0.272 * r) + (0.534 * g) + (0.131 * b);

    // Clamping the values to ensure they remain within the 0-255 range
    img.pixels[i] = tr > 255 ? 255 : tr;
    img.pixels[i + 1] = tg > 255 ? 255 : tg;
    img.pixels[i + 2] = tb > 255 ? 255 : tb;
  }

  img.updatePixels();  // Update the image with the new pixel data
}


document.getElementById('saveButton').addEventListener('click', function () {
  const domCanvas = document.querySelector("canvas");
  domCanvas.toBlob(async function (blob) {
    const formData = new FormData();  // Create FormData to send the blob file
    formData.append('image', blob);

    const response = await fetch(`/photos/${imageFilename}/edit`, {
      method: 'POST',
      body: formData
    });

    const resData = response.json();

    console.log(resData);
  }, 'image/png');
});

