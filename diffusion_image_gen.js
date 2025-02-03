// A JavaScript-based diffusion model for image generation
// Uses TensorFlow.js to implement a U-Net architecture for denoising diffusion
// Works in Node.js and browser, compatible with GitHub Codespaces

import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

class DiffusionImageGenerator {
    constructor() {
        this.model = null; // Placeholder for diffusion model
        this.timesteps = 10; // Reduced for debugging
        this.stopEarly = false; // Flag to stop early
        this.currentTimestep = 0; // Track current timestep
    }

    async loadModel() {
        console.log("Loading diffusion model...");
        
        const inputImage = tf.input({ shape: [256, 256, 3] });
        const noise = tf.input({ shape: [256, 256, 3] });
        const timeStep = tf.input({ shape: [1] });

        let expandedTimeStep = tf.layers.dense({ units: 256 * 256, activation: 'relu' }).apply(timeStep);
        expandedTimeStep = tf.layers.reshape({ targetShape: [256, 256, 1] }).apply(expandedTimeStep);

        let x = tf.layers.concatenate().apply([inputImage, noise, expandedTimeStep]);
        x = tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(x);
        x = tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(x);
        x = tf.layers.conv2d({ filters: 3, kernelSize: 3, activation: 'sigmoid', padding: 'same' }).apply(x);
        
        this.model = tf.model({ inputs: [inputImage, noise, timeStep], outputs: x });
        this.model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        
        console.log("Diffusion model loaded successfully.");
    }

    async addNoise(image, step) {
        const noise = tf.randomNormal(image.shape);
        const alpha = 1 - (step / this.timesteps);
        return image.mul(alpha).add(noise.mul(1 - alpha));
    }

    async generateImage(prompt) {
        if (!this.model) {
            console.error("Model not loaded.");
            return;
        }
        console.log(`Generating image for: "${prompt}"`);

        let image = tf.randomNormal([1, 256, 256, 3]);
        for (let t = this.timesteps; t > 0; t--) {
            this.currentTimestep = t;
            if (this.stopEarly) {
                console.log(`Stopping early at timestep ${t}`);
                this.saveImage(image, "./images/output.png");
                return image;
            }
            console.log(`Timestep ${this.timesteps - t + 1} / ${this.timesteps} in progress...`);
            
            image = await this.model.predict([
                image, 
                tf.randomNormal([1, 256, 256, 3]), 
                tf.tensor([t]).reshape([1, 1])
            ]);

            if (t % 10 === 0) {
                console.log(`Checkpoint at timestep ${t}: Image is evolving...`);
            }
        }

        console.log("Image generation complete.");
        this.saveImage(image, "./images/output.png");
        return image;
    }

    async trainDiffusionModel(imageURLs, descriptions) {
        console.log("Starting diffusion model training...");

        const images = await Promise.all(imageURLs.map(url => this.loadImage(url)));

        for (let i = 0; i < 10; i++) {
            console.log(`Epoch ${i + 1} starting...`);
            for (let j = 0; j < this.timesteps; j++) {
                console.log(`Epoch ${i + 1}, Timestep ${j + 1}/${this.timesteps}`);
                this.currentTimestep = j;
                const noisyImages = await Promise.all(images.map(img => this.addNoise(img, j)));
                try {
                    await this.model.fit(
                        [tf.stack(noisyImages), tf.randomNormal([images.length, 256, 256, 3]), tf.tensor(Array(images.length).fill(j)).reshape([images.length, 1])],
                        tf.stack(images),
                        {
                            epochs: 1,
                            callbacks: {
                                onEpochEnd: (epoch, logs) => {
                                    console.log(`Epoch ${epoch + 1}, Loss: ${logs.loss}`);
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error("Training error:", error);
                }
            }
        }
        console.log("Diffusion model training complete.");
    }

    async loadImage(filePath) {
        console.log(`Loading image from: ${filePath}`);
        
        const img = await loadImage(filePath);
        const canvas = createCanvas(256, 256);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 256, 256);

        const imageData = ctx.getImageData(0, 0, 256, 256);
        const pixels = new Uint8Array(256 * 256 * 3);
        for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
            pixels[j] = imageData.data[i];     // Red
            pixels[j + 1] = imageData.data[i + 1]; // Green
            pixels[j + 2] = imageData.data[i + 2]; // Blue
        }

        const tensor = tf.tensor(pixels, [256, 256, 3]).toFloat().div(tf.scalar(255));
        return tensor;
    }
}

export { DiffusionImageGenerator };

if (typeof window !== 'undefined') {
    window.DiffusionImageGenerator = DiffusionImageGenerator;
}
