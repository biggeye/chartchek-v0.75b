# ChartChek Chat Components Documentation

This documentation outlines the React components in the chat system, their relationships, and interactions with the API endpoints.

## Component Overview

### AssistantChat
`AssistantChat.tsx` - Main chat interface component that orchestrates the entire chat experience.

**Props:**
```typescript
interface AssistantChatProps {
  initialAssistantId?: string;
  initialThreadId?: string;
}
```

**State Management:**
- Messages history
- Loading states
- Streaming content
- Error handling
- Assistant and Thread IDs

**API Interactions:**
1. **Thread Creation** - `POST /api/thread/create`
   - Creates new thread when starting a conversation
   - Handles initial message if provided

2. **Message Submission** - `POST /api/thread/message`
   - Sends user messages to the thread
   - Handles message content and attachments

3. **Stream Management** - `POST /api/thread/run/stream`
   - Initiates and manages SSE connection for assistant responses
   - Handles real-time message updates

### MessageList
`MessageList.tsx` - Displays the conversation history with auto-scrolling support.

**Props:**
```typescript
interface MessageListProps {
  messages?: Message[];
  streamingContent?: MessageContent[];
}
```

**Features:**
- Automatic scroll to bottom on new messages
- Different styling for user and assistant messages
- Streaming content support
- Message content rendering

### MessageContent
`MessageContent.tsx` - Renders individual message content with support for different content types.

**Props:**
```typescript
interface MessageContentProps {
  content: MessageContentType[];
  isStreaming?: boolean;
}
```

**Features:**
- Supports text content
- Handles streaming content display
- Markdown rendering support

### FileUpload
`FileUpload.tsx` - Handles file uploads for the chat interface.

**Props:**
```typescript
interface FileUploadProps {
  onFileUpload?: (file: File) => Promise<void>;
}
```

**API Interactions:**
- `POST /api/file/upload`
  - Uploads files to OpenAI
  - Stores file references in Supabase

### ThreadList
`ThreadList.tsx` - Displays and manages chat thread history.

**Features:**
- Fetches and displays user's chat threads
- Thread selection and navigation
- Real-time updates

**API Interactions:**
- Supabase direct query to `chat_threads` table
- Uses RLS policies for security

### RunStatus
`RunStatus.tsx` - Displays the current status of the assistant's response.

**Props:**
```typescript
interface RunStatusProps {
  isStreaming?: boolean;
  error?: string;
  assistantId?: string;
  threadId?: string;
  className?: string;
}
```

**Features:**
- Shows loading states
- Displays error messages
- Indicates streaming status

### NewThreadButton
`NewThreadButton.tsx` - Creates new chat threads.

**Props:**
```typescript
interface NewThreadButtonProps {
  onNewThread: (assistantId: string) => void;
}
```

**API Interactions:**
- Triggers thread creation through AssistantChat component

### SubmitButton
`SubmitButton.tsx` - Message submission button with loading state.

**Props:**
```typescript
interface SubmitButtonProps {
  message: string;
  isLoading: boolean;
}
```

## Component Interactions

1. **Chat Initialization Flow:**
   ```
   AssistantChat
   ├── Creates/Loads Assistant
   ├── Creates/Loads Thread
   ├── Initializes MessageList
   └── Sets up FileUpload
   ```

2. **Message Flow:**
   ```
   User Input → AssistantChat
   ├── Submits to API
   ├── Updates MessageList
   ├── Initiates Streaming
   └── Updates RunStatus
   ```

3. **File Upload Flow:**
   ```
   FileUpload → AssistantChat
   ├── Uploads to OpenAI
   ├── Stores in Supabase
   └── Attaches to Message
   ```

## State Management

The components use React's built-in state management with `useState` and `useEffect` hooks. Key state elements include:

1. **Message State:**
   - Current message input
   - Message history
   - Streaming content

2. **Thread State:**
   - Current thread ID
   - Thread list
   - Thread status

3. **UI State:**
   - Loading states
   - Error states
   - Streaming status

## Error Handling

Components implement comprehensive error handling:

1. **API Errors:**
   - Network failures
   - Authentication errors
   - Rate limiting

2. **UI Feedback:**
   - Error messages
   - Loading states
   - Status indicators

## Best Practices

1. **Performance:**
   - Optimized rendering with proper React hooks
   - Efficient state updates
   - Debounced input handling

2. **Security:**
   - Authentication checks
   - Secure file handling
   - Protected API routes

3. **UX:**
   - Responsive design
   - Loading indicators
   - Error feedback
   - Smooth animations

## Component Styling

Components use a combination of:
- Tailwind CSS for utility classes
- Shadcn/ui components for UI elements
- Custom CSS for specific styling needs

## Event Handling

1. **User Input:**
   - Message submission
   - File uploads
   - Thread selection

2. **System Events:**
   - Stream management
   - Error handling
   - State updates

## Dependencies

Key dependencies used across components:
- Next.js 15 App Router
- React 18+
- Supabase Client
- OpenAI API Client
- Tailwind CSS
- Shadcn/ui
