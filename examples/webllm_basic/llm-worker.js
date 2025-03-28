// Our LLM Worker is responsible for:
//   * Function 0: Load WebLLM from CDN thanks to ESM.
//   * Function 1: Initialize the LLM
//   * Function 2: Handle messages from the main thread

// Function 0: Load WebLLM from CDN
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// For the basic example, we are using a preloaded model.
// @see https://github.com/mlc-ai/web-llm/blob/main/src/config.ts, prebuiltAppConfig.model_list 
const MODEL_NAME = "Hermes-3-Llama-3.1-8B-q4f32_1-MLC";

// We will keep a chat history in memory. 
// Note: We are not checking for context window size. If this grows too large things will break.
const messageHistory = [{
    content: "You are a helpful assistant. You keep answers short and concise.",
    role: "system"
}];

// Our instance of the MLC engine.
let llmEngine;
let isInitialized = false;

// Function 1: Initialize WebLLM
async function initializeLLM() {
    try {
        // Create the MLC chat engine
        llmEngine = await webllm.CreateMLCEngine(MODEL_NAME, {
            // This allows us to check the progress of the model loading.
            // This will loop until the model is loaded.
            initProgressCallback: (params) => {
                self.postMessage({ type: 'llm-status', data: { text: params.text, progress: params.progress } });
            }
        });

        // Now the model is downloaded and loaded.
        isInitialized = true;
        self.postMessage({ type: 'llm-status', data: { text: 'LLM ready!' } });
    } catch (error) {
        console.error('Failed to initialize WebLLM:', error);
        self.postMessage({
            type: 'llm-status',
            data: { text: 'initialization-failed', error: error.message }
        });
    }
}

// Function 2: Handle messages from the main thread
self.onmessage = async (event) => {
    const { type, data } = event.data;

    switch (type) {
        // Called from the main thread to start downloading/loading the model into memory.
        case 'init':
            await initializeLLM();
            break;

        // This executes the prompt and generates a message.
        case 'generate':

            // a.k.a. Don't be in such a hurry.
            if (!isInitialized) {
                self.postMessage({
                    type: 'llm-response',
                    data: 'LLM is not initialized yet. Please wait.'
                });
                return;
            }

            try {
                // Send 'llm-status' messages at different times to let the user know what is going on.
                self.postMessage({ type: 'llm-status', data: { text: 'generating' } });

                // Add the new prompt to the history.
                messageHistory.push({ role: "user", content: data });

                // Generate response using the chat engine
                const response = await llmEngine.chat.completions.create({
                    messages: messageHistory,
                });

                // Add the agent response to the history.
                messageHistory.push({ role: "assistant", content: response.choices[0].message.content });

                // Just for debugging and curiosity.
                console.log("History: ", messageHistory);

                // Send the Agent response tho the main thread.
                self.postMessage({
                    type: 'llm-response',
                    data: response.choices[0].message.content
                });

                // Update the status. 
                self.postMessage({ type: 'llm-status', data: { text: '' } });
            } catch (error) {
                console.error('Generation error:', error);
                self.postMessage({
                    type: 'llm-response',
                    data: 'An error occurred while generating the response.',
                    error: error.message
                });
            }
            break;

        default:
            console.warn('Unknown message type:', type);
    }
};