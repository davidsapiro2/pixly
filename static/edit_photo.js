"use strict";

let img;
let canvas;
let displayWidth, displayHeight;
let widthSlider, heightSlider;
let graphics;
let sortedImg;
let sorted = true;
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
  graphics = createGraphics(displayWidth, displayHeight); // Create a graphics buffer
  pixelDensity(1);
  updateSliders();
  background(255);
  image(img, 0, 0, displayWidth, displayHeight); // Display the image
  currentStamp = stamps.stampDave;
}

document.getElementById("sort-button").addEventListener("click", handleSortButtonClick);

function handleSortButtonClick() {
  sortedImg = get();
  sortedImg.loadPixels();
  sorted = false;
}

function draw() {
  image(img, 0, 0, displayWidth, displayHeight);  // Display the main image

  sortPixelsIfNecessary();
}

function sortPixelsIfNecessary() {
  if (!sorted) {  // Check if not sorted and y is within bounds
    sorted = true;

    for (let y = 0; y < sortedImg.height; y++) {
      for (let x = 0; x < sortedImg.width - 1; x++) {  // Iterate over the row
        if (pixelValue(sortedImg, y, x) > pixelValue(sortedImg, y, x + 1)) {
          swapPixels(sortedImg, y, x, y, x + 1);  // Swap pixels if out of order
          sorted = false;  // Set rowSorted to false as a swap was needed
        }
      }
    }
    sortedImg.updatePixels();  // Update pixels on the canvas
    img = sortedImg;
  }
}

function elementIndex(img, y, x) {
  return 4 * (y * img.width + x);
}

function pixelValue(img, y, x) {
  const pixelIndex = elementIndex(img, y, x);
  return img.pixels[pixelIndex] + img.pixels[pixelIndex + 1] + img.pixels[pixelIndex + 2];
}

function swapPixels(img, y1, x1, y2, x2) {
  const pixel1Index = elementIndex(img, y1, x1);
  const pixel2Index = elementIndex(img, y2, x2);

  [img.pixels[pixel1Index], img.pixels[pixel2Index]] = [img.pixels[pixel2Index], img.pixels[pixel1Index]];
  [img.pixels[pixel1Index + 1], img.pixels[pixel2Index + 1]] = [img.pixels[pixel2Index + 1], img.pixels[pixel1Index + 1]];
  [img.pixels[pixel1Index + 2], img.pixels[pixel2Index + 2]] = [img.pixels[pixel2Index + 2], img.pixels[pixel1Index + 2]];
  [img.pixels[pixel1Index + 3], img.pixels[pixel2Index + 3]] = [img.pixels[pixel2Index + 3], img.pixels[pixel1Index + 3]];
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
  console.log(displayHeight, displayWidth);
  resizeCanvas(displayWidth, displayHeight); // Resize the canvas to new dimensions
}

document.getElementById('button-filter').addEventListener('click', applyFilter);

function applyFilter() {
  const filterType = document.getElementById('image-filter').value;
  if (filterType === "INVERT") filter(INVERT);
  if (filterType === "GRAY") filter(GRAY);
  if (filterType === "THRESHOLD") filter(THRESHOLD);
  if (filterType === "BLUR") filter(BLUR, 10);
  if (filterType === "SEPIA") applySepiaFilter();
  if (filterType === "SOBEL") applySobelFilter();
  if (filterType === "PIXELATE") applyPixelation(5);

  img = get();
}

function applyPixelation(pixelSize) {
  loadPixels(); // Load the pixels from the canvas into the pixels array
  let w = width; // Use the width and height of the canvas
  let h = height;

  for (let x = 0; x < w; x += pixelSize) {
    for (let y = 0; y < h; y += pixelSize) {
      // Get the color of the top-left pixel of each block
      let i = (x + y * w) * 4;
      let colors = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];

      // Set every pixel in the block to this color
      for (let n = 0; n < pixelSize; n++) {
        for (let m = 0; m < pixelSize; m++) {
          if (x + n < w && y + m < h) { // Check bounds to avoid going outside the canvas dimensions
            let j = ((x + n) + (y + m) * w) * 4;
            pixels[j] = colors[0];
            pixels[j + 1] = colors[1];
            pixels[j + 2] = colors[2];
            pixels[j + 3] = colors[3];
          }
        }
      }
    }
  }
  updatePixels(); // Update the canvas with the modified pixels array
}

function applySobelFilter() {
  let kernelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  let kernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  // Capture the current canvas pixels
  let currCanvas = get();
  currCanvas.loadPixels();

  // Create a new image to store the edge data
  let edgeImg = createImage(currCanvas.width, currCanvas.height);
  edgeImg.loadPixels();

  for (let x = 1; x < currCanvas.width - 1; x++) {
    for (let y = 1; y < currCanvas.height - 1; y++) {
      let sumX = 0;
      let sumY = 0;

      // Apply the kernels to the pixel at (x, y)
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // Calculate the index for the pixels array
          let px = ((x + i) + (y + j) * currCanvas.width) * 4;
          // Assuming grayscale, we take the red channel's intensity
          let r = currCanvas.pixels[px];

          sumX += r * kernelX[i + 1][j + 1];
          sumY += r * kernelY[i + 1][j + 1];
        }
      }

      // Calculate the gradient magnitude
      let grad = sqrt(sumX * sumX + sumY * sumY);
      let index = (x + y * currCanvas.width) * 4;
      edgeImg.pixels[index] = grad;
      edgeImg.pixels[index + 1] = grad;
      edgeImg.pixels[index + 2] = grad;
      edgeImg.pixels[index + 3] = 255;  // Set alpha to opaque
    }
  }

  // Update the pixels and set the edgeImg as the new display image
  edgeImg.updatePixels();
  image(edgeImg, 0, 0);
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
    img = get();
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
