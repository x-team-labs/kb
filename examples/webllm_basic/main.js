// Our main thread has the responsibility of:
//   * Function 1: Creating an LLM worker
//   * Function 2: Handling any messages posted from the LLM worker
//   * Function 3: Posting requests to the LLM worker
//   * Function 4: Displaying the chat history
//   * Function 5: Allow user to send messages to the LLM worker
//   * Function 6: Update the status of the LLM worker

// Function 1: Initialize WebLLM worker
const llmWorker = new Worker('llm-worker.js', { type: 'module' });

// Function 2: Handle messages from the LLM worker
llmWorker.onmessage = (event) => {
    const { type, data, error } = event.data;
    
    switch (type) {
        case 'llm-response':
            appendMessage(data, 'llm');
            break;
        case 'llm-status':
            updateStatus(data);
            if (error) {
                console.error('LLM Error:', error);
                appendMessage(`Error: ${error}`, 'llm');
            } 
            break;
        default:
            console.warn('Unknown message type:', type);
    }
};

// Function 2 (part B): Handle errors from the worker
llmWorker.onerror = (error) => {
    console.error('Worker error:', error);
    appendMessage('An error occurred while processing your request.', 'llm');
};

// Function 3: Initialize WebLLM by sending a message to the worker
llmWorker.postMessage({ type: 'init' });

// Function 5: Allow user to send messages to the LLM worker
document.getElementById('chat-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = event.target.elements.message;
    const message = input.value;
    
    if (message.trim()) {
        handleUserMessage(message);
        input.value = ''; // Clear the input after sending
    }
});

// Function 5 (part B): Handle user messages
function handleUserMessage(message) {
    // Display user message
    appendMessage(message, 'user');
    
    // Send message to LLM worker
    llmWorker.postMessage({
        type: 'generate',
        data: message
    });
}

// Function 4: Display the chat history
function appendMessage(message, sender) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Function 6: Update the status of the LLM worker
function updateStatus(status) {
    let statusDiv = document.querySelector('.status-message');
    
    if (typeof status === 'object') {
        statusDiv.innerHTML = `${status.text}${
            status.progress ? `<span class="progress">${Math.round(status.progress * 100)}%</span>` : ''
        }`;
    }
} 