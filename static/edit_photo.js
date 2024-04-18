"use strict";

let img;
let canvas;
let displayWidth, displayHeight;
let widthSlider, heightSlider;

let currentStamp;
const stamps = {};

const editContainer = document.getElementById("edit-container");
const pageContainer = document.getElementById("page-container");
const imageUrl = pageContainer.getAttribute("data-imageUrl");
const imageFilename = pageContainer.getAttribute("data-imageFilename");

function preload() {
  img = loadImage(imageUrl);
  stamps.stampDave = loadImage('/static/davidStamp.png');
  stamps.stampCoop = loadImage('/static/coopStamp.png');
}

function setup() {
  img.resize(windowWidth / 1.5, 0); // Resize image to fit the window width while maintaining aspect ratio
  displayWidth = img.width;
  displayHeight = img.height;
  canvas = createCanvas(displayWidth, displayHeight); // Adjust the canvas size as needed
  canvas.parent(editContainer);
  pixelDensity(1);
  updateSliders();
  background(255);
  image(img, 0, 0, displayWidth, displayHeight); // Display the image
  currentStamp = stamps.stampDave;
}

function draw() {
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

document.getElementById('button-filter').addEventListener('click', applyFilter);

function applyFilter() {
  const filterType = document.getElementById('image-filter').value;

  if (filterType === "INVERT") filter(INVERT);
  if (filterType === "GRAY") filter(GRAY);
  if (filterType === "THRESHOLD") filter(THRESHOLD);
  if (filterType === "BLUR") filter(BLUR, 10);
  if (filterType === "SEPIA") applySepiaFilter(img);

  redraw(); // Redraw to apply the filter
}

function applySepiaFilter() {
  loadPixels();  // Load the pixels of the image to manipulate them

  // Loop through every pixel by incrementing by 4 each step (for each RGBA set)
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];     // Red value
    let g = pixels[i + 1]; // Green value
    let b = pixels[i + 2]; // Blue value

    // Apply the Sepia formula
    let tr = (0.393 * r) + (0.769 * g) + (0.189 * b);
    let tg = (0.349 * r) + (0.686 * g) + (0.168 * b);
    let tb = (0.272 * r) + (0.534 * g) + (0.131 * b);

    // Clamping the values to ensure they remain within the 0-255 range
    pixels[i] = tr > 255 ? 255 : tr;
    pixels[i + 1] = tg > 255 ? 255 : tg;
    pixels[i + 2] = tb > 255 ? 255 : tb;
  }

  updatePixels();  // Update the image with the new pixel data
}

document.getElementById('stamp-selector').addEventListener('change', updateStamp);

function updateStamp() {
  console.log("in updateStamp");
  const stampChoice = document.getElementById('stamp-selector').value;
  currentStamp = stamps[stampChoice];
}

function mousePressed() {
  // Check if the mouse position is within the image bounds
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    image(currentStamp, mouseX - currentStamp.width / 2, mouseY - currentStamp.height / 2);
  }
}


document.getElementById('saveButton').addEventListener('click', function () {
  const domCanvas = document.querySelector("canvas");
  domCanvas.toBlob(async function (blob) {
    const formData = new FormData();  // Create FormData to send the blob file
    formData.append('image', blob);
    formData.append("height", displayHeight);
    formData.append("width", displayWidth);

    const response = await fetch(`/photos/${imageFilename}/edit`, {
      method: 'POST',
      body: formData
    });

    const resData = await response.json();

    if (response.ok) {
      const alert = createAlertMessage("Image Saved", "success");
      document.getElementById('page-container').prepend(alert);
    } else {
      const alert = createAlertMessage("Save failed", "danger");
      document.getElementById('page-container').prepend(alert);
    }
  });
});


function createAlertMessage(message, type) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = 'alert';
  alert.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-bs-dismiss', 'alert');
  closeButton.setAttribute('aria-label', 'Close');
  alert.appendChild(closeButton);

  return alert;
}

