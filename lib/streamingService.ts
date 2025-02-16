// streamingService.ts

import type { MessageContent } from '@/types/api/openai'
import { useClientStore } from '@/store/clientStore';

// Define your (stub) types – replace these with your actual types.
type Thread = any
type Run = any
type RunStep = any
type Message = any
type ErrorData = any

// Define the possible event types
export type StreamEvent =
  | { type: 'thread.created'; data: Thread }
  | { type: 'thread.run.created'; data: Run }
  | { type: 'thread.run.queued'; data: Run }
  | { type: 'thread.run.in_progress'; data: Run }
  | { type: 'thread.run.requires_action'; data: Run }
  | { type: 'thread.run.completed'; data: Run }
  | { type: 'thread.run.incomplete'; data: Run }
  | { type: 'thread.run.failed'; data: Run }
  | { type: 'thread.run.cancelling'; data: Run }
  | { type: 'thread.run.cancelled'; data: Run }
  | { type: 'thread.run.expired'; data: Run }
  | { type: 'thread.run.step.created'; data: RunStep }
  | { type: 'thread.run.step.in_progress'; data: RunStep }
  | { type: 'thread.run.step.delta'; data: { delta: string } } // or your defined run step delta
  | { type: 'thread.run.step.completed'; data: RunStep }
  | { type: 'thread.run.step.failed'; data: RunStep }
  | { type: 'thread.run.step.cancelled'; data: RunStep }
  | { type: 'thread.run.step.expired'; data: RunStep }
  | { type: 'thread.message.created'; data: Message }
  | { type: 'thread.message.in_progress'; data: Message }
  | { type: 'thread.message.delta'; data: { delta: string } } // or your defined message delta
  | { type: 'thread.message.completed'; data: Message }
  | { type: 'thread.message.incomplete'; data: Message }
  | { type: 'error'; data: ErrorData }
  | { type: 'done'; data: '[DONE]' }
  // You can also have a "text" or "textDelta" event if they are separate from the above.
  | { type: 'text'; data: { text: string; annotations?: any[] } }
  | { type: 'textDelta'; data: { delta: string; annotations?: any[] } }

//
// Here’s our dispatcher function that calls the proper handler based on the event type.
// You could pass additional callbacks (or state updater functions) to these handlers if needed.
//
export function processStreamEvent(
  event: StreamEvent,
  // Optionally, pass state updater functions or context
  setStreamingContent: React.Dispatch<React.SetStateAction<MessageContent[]>>,
  accumulateText: { currentText: string; annotations: any[] } // for accumulating text (if needed)
): void {
  const currentThreadId = useClientStore((state) => state.currentThreadId);
  const currentAssistantId = useClientStore((state) => state.currentAssistantId);

  switch (event.type) {

    // Thread events
    case 'thread.created':
      handleThreadCreated(event.data)
      break

    // Run events
    case 'thread.run.created':
      handleRunCreated(event.data)
      break

    case 'thread.run.queued':
      handleRunQueued(event.data)
      break

    case 'thread.run.in_progress':
      handleRunInProgress(event.data)
      break

    case 'thread.run.requires_action':
      handleRunRequiresAction(event.data)
      break

    case 'thread.run.completed':
      handleRunCompleted(event.data)
      break

    case 'thread.run.incomplete':
      handleRunIncomplete(event.data)
      break

    case 'thread.run.failed':
      handleRunFailed(event.data)
      break

    case 'thread.run.cancelling':
      handleRunCancelling(event.data)
      break

    case 'thread.run.cancelled':
      handleRunCancelled(event.data)
      break

    case 'thread.run.expired':
      handleRunExpired(event.data)
      break

    // Run step events
    case 'thread.run.step.created':
      handleRunStepCreated(event.data)
      break

    case 'thread.run.step.in_progress':
      handleRunStepInProgress(event.data)
      break

    case 'thread.run.step.delta':
      // For delta events, you might want to update the UI incrementally.
      // For example, append the delta to a current accumulated text.
      handleRunStepDelta(event.data, setStreamingContent, accumulateText)
      break

    case 'thread.run.step.completed':
      handleRunStepCompleted(event.data)
      break

    case 'thread.run.step.failed':
      handleRunStepFailed(event.data)
      break

    case 'thread.run.step.cancelled':
      handleRunStepCancelled(event.data)
      break

    case 'thread.run.step.expired':
      handleRunStepExpired(event.data)
      break

    // Message events
    case 'thread.message.created':
      handleMessageCreated(event.data)
      break

    case 'thread.message.in_progress':
      handleMessageInProgress(event.data)
      break

    case 'thread.message.delta':
      // Similar to run step delta, update text incrementally.
      handleMessageDelta(event.data, setStreamingContent, accumulateText)
      break

    case 'thread.message.completed':
      handleMessageCompleted(event.data)
      break

    case 'thread.message.incomplete':
      handleMessageIncomplete(event.data)
      break

    // Text events (alternative way to deliver full text or delta)
    case 'text':
      // Replace any accumulated delta with complete text.
      accumulateText.currentText = event.data.text
      accumulateText.annotations = event.data.annotations || []
      setStreamingContent([
        { type: 'text', text: { value: event.data.text, annotations: event.data.annotations || [] } },
      ])
      break

    case 'textDelta':
      {
        const delta = event.data.delta || ''
        const newAnnotations = event.data.annotations || []
        accumulateText.currentText += delta
        accumulateText.annotations.push(...newAnnotations)
        // Here you can either append small chunks or update the last chunk.
        setStreamingContent((prev) => [
          ...prev,
          { type: 'text', text: { value: delta, annotations: newAnnotations } },
        ])
      }
      break

    // Errors and done
    case 'error':
      console.error('Stream error received:', event.data)
      break

    case 'done':
      console.log('Stream complete:', event.data)
      break

    default:
      console.warn('Unhandled event type received:', event)
      break
  }
}

// Handlers for thread events
function handleThreadCreated(thread: Thread): void {
  console.log('[StreamingService] Thread created:', thread);
  // Example: Update current thread ID in clientStore
  useClientStore.getState().setCurrentThreadId(thread.id);
}

// Handlers for run events
function handleRunCreated(run: Run): void {
  console.log('[Event] thread.run.created:', run)
}

function handleRunQueued(run: Run): void {
  console.log('[Event] thread.run.queued:', run)
}

function handleRunInProgress(run: Run): void {
  console.log('[Event] thread.run.in_progress:', run)
}

function handleRunRequiresAction(run: Run): void {
  console.log('[Event] thread.run.requires_action:', run)
}

function handleRunCompleted(run: Run): void {
  console.log('[Event] thread.run.completed:', run)
}

function handleRunIncomplete(run: Run): void {
  console.log('[Event] thread.run.incomplete:', run)
}

function handleRunFailed(run: Run): void {
  console.log('[Event] thread.run.failed:', run)
}

function handleRunCancelling(run: Run): void {
  console.log('[Event] thread.run.cancelling:', run)
}

function handleRunCancelled(run: Run): void {
  console.log('[Event] thread.run.cancelled:', run)
}

function handleRunExpired(run: Run): void {
  console.log('[Event] thread.run.expired:', run)
}

// Handlers for run step events
function handleRunStepCreated(step: RunStep): void {
  console.log('[Event] thread.run.step.created:', step)
}

function handleRunStepInProgress(step: RunStep): void {
  console.log('[Event] thread.run.step.in_progress:', step)
}

function handleRunStepDelta(
  stepDelta: { delta: string },
  setStreamingContent: React.Dispatch<React.SetStateAction<MessageContent[]>>,
  accumulateText: { currentText: string; annotations: any[] }
): void {
  console.log('[Event] thread.run.step.delta:', stepDelta)
  accumulateText.currentText += stepDelta.delta
  // Append or update a UI element.
  setStreamingContent((prev) => [
    ...prev,
    { type: 'text', text: { value: stepDelta.delta, annotations: [] } },
  ])
}

function handleRunStepCompleted(step: RunStep): void {
  console.log('[Event] thread.run.step.completed:', step)
}

function handleRunStepFailed(step: RunStep): void {
  console.log('[Event] thread.run.step.failed:', step)
}

function handleRunStepCancelled(step: RunStep): void {
  console.log('[Event] thread.run.step.cancelled:', step)
}

function handleRunStepExpired(step: RunStep): void {
  console.log('[Event] thread.run.step.expired:', step)
}

// Handlers for message events
function handleMessageCreated(message: Message): void {
  console.log('[Event] thread.message.created:', message)
}

function handleMessageInProgress(message: Message): void {
  console.log('[Event] thread.message.in_progress:', message)
}

function handleMessageDelta(
  msgDelta: { delta: string },
  setStreamingContent: React.Dispatch<React.SetStateAction<MessageContent[]>>,
  accumulateText: { currentText: string; annotations: any[] }
): void {
  console.log('[Event] thread.message.delta:', msgDelta)
  accumulateText.currentText += msgDelta.delta
  setStreamingContent((prev) => [
    ...prev,
    { type: 'text', text: { value: msgDelta.delta, annotations: [] } },
  ])
}

function handleMessageCompleted(message: Message): void {
  console.log('[Event] thread.message.completed:', message)
}

function handleMessageIncomplete(message: Message): void {
  console.log('[Event] thread.message.incomplete:', message)
}