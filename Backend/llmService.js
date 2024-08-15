const Replicate = require("replicate");
const config = require('config');
// Initialize Replicate with your API key (replace with your actual API key)
const replicate = new Replicate({
    auth: config.get('replicate.apiKey'),
//        auth: 'r8_D9ScP0eskKi6OV5KiqgUZosvOmig1Cx1M4TWu'
});

// Function to generate blog content using LLaMA 2 model
const generateBlogContent = async (prompt) => {
    const input = {
        top_p: 0.9,
        prompt: prompt,
        min_tokens: 0,
        temperature: 0.6,
        prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nYou are a helpful assistant<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
        presence_penalty: 1.15
    };

    try {
    console.log('----------------------------------------');
    console.log(replicate);
        let generatedContent = '';

        // Stream the response from the LLaMA model
        for await (const event of replicate.stream("meta/meta-llama-3-70b-instruct", { input })) {
            generatedContent += event;
        }

        return generatedContent;
    } catch (error) {
        console.error("Error generating content:", error);
        throw new Error("Failed to generate blog content");
    }
};

module.exports = { generateBlogContent };