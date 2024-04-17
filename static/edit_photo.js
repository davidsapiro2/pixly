"use strict";

let img;
let canvas;
let displayWidth, displayHeight;
let widthSlider, heightSlider;

const editContainter = document.getElementById("edit-container");

function preload() {
  // Load the image from a known URL
  img = loadImage("https://pixly37.s3.us-east-2.amazonaws.com/2560px-A-Cat1.jpg");
}

function setup() {
  img.resize(windowWidth/1.5, 0); // Resize image to fit the window width while maintaining aspect ratio
  displayWidth = img.width;
  displayHeight = img.height;
  canvas = createCanvas(displayWidth, displayHeight); // Adjust the canvas size as needed
  canvas.parent(editContainter);
  pixelDensity(1);
  updateSliders();
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

document.getElementById('grayscaleButton').addEventListener('click', function () {
  img.filter(GRAY);
  redraw(); // Redraw to apply the grayscale filter
});

function downloadImage() {
  saveCanvas(canvas, 'editedImage', 'jpg');
}

