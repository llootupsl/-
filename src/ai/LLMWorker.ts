import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

// Hook up the MLC WebWorker handler
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
