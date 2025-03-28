This is a simple example that demonstrates running LLMs in the browser using [WebLLM](https://webllm.mlc.ai/).

This features:
  * Loading pre-configured models.
  * Using the LLM as a web worker.
  * Very simple message history.

To run this use your favourite lite HTTP server...

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# NodeJS/NPX
npx serve -l 8000

# PHP
php -S localhost:8000
```

---

Message flow diagram:

```
Main Thread                     Worker Thread
------------                    -------------
llmWorker.postMessage() ------> self.onmessage
                                    ↓
                                (processes)
                                    ↓
llmWorker.onmessage    <------ self.postMessage()
```