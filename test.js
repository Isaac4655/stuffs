import { DiffusionImageGenerator } from './diffusion_image_gen.js';

async function main() {
    const generator = new DiffusionImageGenerator();
    await generator.loadModel();

    // Add training data (image URLs & descriptions)
    const imageURLs = [
        "/workspaces/stuffs/images/image1.jpg",
        "/workspaces/stuffs/images/download1.jpg"
    ];    
    const descriptions = [
        "A glowing bioluminescent sea creature in deep waters.",
        "A mysterious alien with jellyfish-like tendrils floating in the abyss."
    ];
    
    await generator.trainDiffusionModel(imageURLs, descriptions);    

    // Generate an image based on a prompt
    const prompt = "A glowing bioluminescent sea creature in deep waters.";
    const generatedImage = await generator.generateImage(prompt);
}

main();
