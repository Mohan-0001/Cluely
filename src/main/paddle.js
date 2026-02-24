// test-llava-phi3-solo.js
// Run: node test-llava-phi3-solo.js

const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== Llava-Phi3-Mini Solo Test Started ===');

  const imagePath = path.join(__dirname, 'Screenshot (40).png');

  if (!fs.existsSync(imagePath)) {
    console.error('Screenshot not found! Place Screenshot (40).png here.');
    return;
  }

  try {
    console.log('Loading Llava-Phi3-Mini model (first run downloads ~1.5–2 GB)...');

    const generator = await pipeline(
      'image-to-text',
      'Xenova/llava-phi3-mini',     // Public, no login required
      { quantized: true }           // Faster & smaller
    );

    console.log('Model loaded. Processing screenshot...');

    const start = Date.now();

    const output = await generator(imagePath, {
      max_new_tokens: 512,
      do_sample: false,
      temperature: 0.3,
      prompt: "Extract the LeetCode problem title, full description, examples, constraints, and any visible code snippet from this screenshot. Format cleanly."
    });

    const end = Date.now();

    console.log(`Inference took ${end - start} ms`);

    console.log('\n=== LLAVA-PHI3 EXTRACTED TEXT ===\n');
    console.log(output[0].generated_text);

  } catch (err) {
    console.error('Error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

main().catch(err => console.error('Fatal:', err.message));