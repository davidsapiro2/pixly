"use strict";

let img;
let initialImg;
let initialDisplayWidth, initialDisplayHeight;
let displayWidth, displayHeight;
let currentStamp;
const stamps = {};

const colors = {
  blue: [0, 0, 255],
  red: [255, 0, 0],
  green: [0, 255, 0],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  brown: [165, 42, 42],
  pink: [255, 192, 203],
  lime: [0, 255, 0],
  black: [0, 0, 0],
  white: [255, 255, 255],
  gray: [128, 128, 128],
  navy: [0, 0, 128]
};
let currColor = colors.black;

const sizes = {
  small: 3,
  medium: 10,
  large: 20
};
let currSize = sizes.small;

let isDrawing = false;

const editContainer = document.getElementById("edit-container");

const imageUrl = document.getElementById("page-container").getAttribute("data-imageUrl");
const imageFilename = document.getElementById("page-container").getAttribute("data-imageFilename");

////////////
// revert //
////////////

document.getElementById("revert-button").addEventListener("click", revert);

function revert() {
  isSorting = false;
  displayWidth = initialDisplayWidth;
  displayHeight = initialDisplayHeight;
  resizeCanvas(displayWidth, displayHeight); // Resize the canvas to n
  img = initialImg;
}

//////////////////////////
// preload, setup, draw //
//////////////////////////

/** Preloads necessary images to ensure that all images are loaded into
 * memory and ready to use before any setup or drawing occurs. */
function preload() {
  img = loadImage(imageUrl);
  initialImg = img;
  stamps.stampDave = loadImage('/static/davidStamp.png');
  stamps.stampCoop = loadImage('/static/coopStamp.png');
}

/** Sets up the initial canvas and image display properties.
 * This function is called once when the program starts. It initializes the
 * canvas, resizes the main image, sets up the display properties,
 * and draws the image*/
function setup() {
  img.resize(windowWidth / 1.5, 0); // Resize image to fit the window width
  initialDisplayHeight = img.height;
  initialDisplayWidth = img.width;
  displayWidth = img.width; // Store the width of the resized image
  displayHeight = img.height; // Store the height of the resized image

  let canvas = createCanvas(displayWidth, displayHeight); // Create a canvas element with dimensions of the image
  canvas.parent(editContainer); // Set the parent of the canvas in the HTML document
  background(255); // Set the background color of the canvas to white
  pixelDensity(1); // Set the pixel density of the display (useful for high-resolution displays)

  initializeSliders(); // Initialize the DOM sliders to set the height and width of the canvas

  image(img, 0, 0); // Draw the image onto the canvas the image

  currentStamp = stamps.stampDave; // Set the initial stamp to be used (if applicable)
}

/** Continuously executes and redraws the image on the canvas */
function draw() {
  image(img, 0, 0, displayWidth, displayHeight);  // Display the main image
  sortPixelsIfNecessary();
}


/////////////
// Filters //
/////////////

document.getElementById('button-filter').addEventListener('click', applyFilter);


/** Applies the selected filter to the image on the canvas based on user
 * selection from a dropdown. This function handles multiple filter types
 * including built-in p5.js filters and custom filters. */
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


/** Applies a sepia tone to the entire canvas. */
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


/** Applies the Sobel edge detection filter to the canvas to highlight edges
 * in the image. This function uses horizontal and vertical gradient
 * calculations to emphasize areas of high intensity change. */
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

  loadPixels();

  // Create a new image to store the edge data
  let edgeImg = createImage(width, height);
  edgeImg.loadPixels();

  for (let x = 1; x < width - 1; x++) {
    for (let y = 1; y < height - 1; y++) {
      let sumX = 0;
      let sumY = 0;

      // Apply the kernels to the pixel at (x, y)
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // Calculate the index for the pixels array
          let px = ((x + i) + (y + j) * width) * 4;
          // Assuming grayscale, we take the red channel's intensity
          let r = pixels[px];

          sumX += r * kernelX[i + 1][j + 1];
          sumY += r * kernelY[i + 1][j + 1];
        }
      }

      // Calculate the gradient magnitude
      let grad = sqrt(sumX * sumX + sumY * sumY);
      let index = (x + y * width) * 4;
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


/** Applies a pixelation effect to the canvas by grouping pixels into
 * larger blocks. This function modifies the canvas to display each block
 * with a uniform color, based on the top-left pixel of the block.
 *
 * Args:
 *    pixelSize (int): The size of the blocks of pixels (both width and height).
 */
function applyPixelation(pixelSize) {
  loadPixels(); // Load the pixels from the canvas into the pixels array

  for (let x = 0; x < width; x += pixelSize) {
    for (let y = 0; y < height; y += pixelSize) {
      // Get the color of the top-left pixel of each block
      let i = (x + y * width) * 4;
      let colors = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];

      // Set every pixel in the block to this color
      for (let n = 0; n < pixelSize; n++) {
        for (let m = 0; m < pixelSize; m++) {
          if (x + n < width && y + m < height) { // Check bounds to avoid going outside the canvas dimensions
            let j = ((x + n) + (y + m) * width) * 4;
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


/////////////////
// Sort Pixels //
/////////////////

let sortedImg;
let isSorting = false;

document.getElementById("sort-button").addEventListener("click", handleSortButtonClick);

/** Toggles the sorting state and updates the appearance and text of
 * the sorting button.*/
function handleSortButtonClick() {
  isSorting = !isSorting;
  const buttonText = isSorting ? "Stop sorting" : "Start sorting";
  const sortBtn = document.getElementById("sort-button");

  sortBtn.classList.toggle("btn-warning");
  sortBtn.classList.toggle("btn-danger");

  sortBtn.textContent = buttonText;
}

/** Sorts the pixels of the image row by row if they are not already sorted.
 * The ordering is based on the sum of the RGB values of each pixel.
 * If any swap is made, it indicates the image was not sorted, and 'sorted' is
 * set to false */
function sortPixelsIfNecessary() {
  if (isSorting) {  // Check if not sorted and y is within bounds
    sortedImg = get();
    sortedImg.loadPixels();

    for (let y = 0; y < sortedImg.height; y++) {
      for (let x = 0; x < sortedImg.width - 1; x++) {  // Iterate over the row
        if (pixelValue(sortedImg, y, x) > pixelValue(sortedImg, y, x + 1)) {
          swapPixels(sortedImg, y, x, y, x + 1);  // Swap pixels if out of order
        }
      }
    }
    sortedImg.updatePixels();  // Update pixels on the canvas
    img = sortedImg;
  }
}

/** Calculates the index of a pixel in the pixel array based on its x and y coordinates.
 *
 * Args:
 *    img (p5.Image): The image whose pixels are being accessed.
 *    y (int): The y-coordinate of the pixel.
 *    x (int): The x-coordinate of the pixel.
 *
 * Returns:
 *    int: The index in the pixels array corresponding to the pixel at (x, y).*/
function getPixelIndex(img, y, x) {
  return 4 * (y * img.width + x);
}

/** Retrieves the combined RGB value of a pixel at specified coordinates in
 * an image. This is used to compare pixel intensity for sorting purposes.
 *
 * Args:
 *    img (p5.Image): The image from which to get the pixel's RGB value.
 *    y (int): The y-coordinate of the pixel.
 *    x (int): The x-coordinate of the pixel.
 *
 * Returns:
 *    int: The sum of the RGB values of the pixel, used for sorting comparison.*/
function pixelValue(img, y, x) {
  const pixelIndex = getPixelIndex(img, y, x);
  return img.pixels[pixelIndex] + img.pixels[pixelIndex + 1] + img.pixels[pixelIndex + 2];
}


/** Swaps the pixel data of two pixels in an image.
 *
 * Args:
 *    img (p5.Image): The image in which the pixels are to be swapped.
 *    y1, x1 (int): The y and x coordinates of the first pixel.
 *    y2, x2 (int): The y and x coordinates of the second pixel. */
function swapPixels(img, y1, x1, y2, x2) {
  const pixel1Index = getPixelIndex(img, y1, x1);
  const pixel2Index = getPixelIndex(img, y2, x2);

  [img.pixels[pixel1Index], img.pixels[pixel2Index]] = [img.pixels[pixel2Index], img.pixels[pixel1Index]];
  [img.pixels[pixel1Index + 1], img.pixels[pixel2Index + 1]] = [img.pixels[pixel2Index + 1], img.pixels[pixel1Index + 1]];
  [img.pixels[pixel1Index + 2], img.pixels[pixel2Index + 2]] = [img.pixels[pixel2Index + 2], img.pixels[pixel1Index + 2]];
  [img.pixels[pixel1Index + 3], img.pixels[pixel2Index + 3]] = [img.pixels[pixel2Index + 3], img.pixels[pixel1Index + 3]];
}


/////////////////////////
// Canvas Click Events //
////////////////////////


document.getElementById('drawButton').addEventListener('click', toggleDraw);
document.getElementById('stamp-selector').addEventListener('change', updateStamp);
document.getElementById('color-selector').addEventListener('change', updateDrawOptions);
document.getElementById('size-selector').addEventListener('change', updateDrawOptions);

/** Toggles between draw mode and stamp mode. */
function toggleDraw() {
  isDrawing = !isDrawing;
  document.getElementById("stamp-mode").classList.toggle("d-none");
  document.getElementById("draw-mode").classList.toggle("d-none");

  const buttonText = isDrawing ? "Switch to Stamp Mode" : "Switch to Draw Mode";
  document.getElementById("drawButton").textContent = buttonText;
}

/** Updates color and size to user choices. */
function updateDrawOptions() {
  const colorChoice = document.getElementById('color-selector').value;
  const sizeChoice = document.getElementById('size-selector').value;
  currColor = colors[colorChoice];
  currSize = sizes[sizeChoice];
}

/** Adds users drawings to the canvas. */
function mouseDraw() {
  fill(...currColor);
  noStroke();
  circle(mouseX, mouseY, currSize);
  img = get();
}

/** Updates the current stamp based on user selection from a dropdown menu.
 * This function retrieves the user-selected stamp name from the dropdown,
 * and updates the global `currentStamp` variable to the selected stamp image */
function updateStamp() {
  const stampChoice = document.getElementById('stamp-selector').value;
  currentStamp = stamps[stampChoice];
}


/** Handles mouse press events within the p5.js canvas.
 * This function checks if the mouse click is within the bounds of the canvas
 * and, if so, applies the users stamp or drawing depending on which mode is
 * currently active.*/
function mousePressed() {
  // Check if the mouse position is within the image bounds
  const isInBounds = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
  if (isInBounds && !isDrawing) {
    placeStamp();
  }
}

function mouseDragged() {
  const isInBounds = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
  if (isDrawing && isInBounds) {
    // Set the stroke weight and color
    strokeWeight(currSize);
    stroke(...currColor);

    // Draw a line from the previous mouse position to the current position
    line(mouseX, mouseY, pmouseX, pmouseY);

    img = get();
  }

}

/** Adds stamp to the canvas. */
function placeStamp() {
  image(currentStamp, mouseX - currentStamp.width / 2, mouseY - currentStamp.height / 2);
  img = get();
}

/////////////
// Sliders //
/////////////


/** Initializes slider controls for adjusting image dimensions on the UI.
 * This function sets up sliders for width and height adjustments,
 * configuring their maximum values based on the current image dimensions and
 * attaching event listeners to handle user input changes. */
function initializeSliders() {
  const widthSlider = document.getElementById('widthSlider');
  const heightSlider = document.getElementById('heightSlider');

  widthSlider.max = img.width;
  heightSlider.max = img.height;
  widthSlider.value = img.width;
  heightSlider.value = img.height;

  widthSlider.addEventListener('input', adjustSize);
  heightSlider.addEventListener('input', adjustSize);
}

/** Adjusts the size of the canvas based on slider inputs.
 * This function is called in response to slider input events and updates the
 * canvas dimensions to reflect the selected width and height. */
function adjustSize() {
  displayWidth = document.getElementById('widthSlider').value;
  displayHeight = document.getElementById('heightSlider').value;
  resizeCanvas(displayWidth, displayHeight); // Resize the canvas to new dimensions
}


///////////////////////
// Save image button //
///////////////////////


document.getElementById('saveButton').addEventListener('click', handleSaveButtonClick);


/** Handles the save button click to submit the current canvas state to the
 * server. This function captures the current state of the canvas, converts it
 * to a Blob, and sends it to the server along with the current display
 * dimensions using FormData. Upon successful save, it displays a success alert,
 * and on failure, it shows an error alert. */
function handleSaveButtonClick() {
  initialImg = get();
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
      document.getElementById('alert-container').prepend(alert);
    } else {
      const alert = createAlertMessage("Save failed", "danger");
      document.getElementById('alert-container').prepend(alert);
    }
  });
}

/** Creates an alert message element with a close button.
 * This function dynamically creates a Bootstrap-styled alert component
 * that can be displayed in the UI.
 *
 * Args:
 *    message (string): The text message to display in the alert.
 *    type (string): The type of the alert, which determines the color and
 *                   iconography ('success', 'danger', etc.).
 *
 * Returns:
 *    HTMLElement: The constructed alert element to be inserted into the DOM. */
function createAlertMessage(message, type) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show col-12`;
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