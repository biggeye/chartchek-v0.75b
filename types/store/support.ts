export interface Match {
    snippet: string;
    start: number;
    end: number;
  }
  
 export interface FileAnnotation {
    fileId: string;
    matches: Match[];
    score?: number; // Optional score field
    id?: number; // Optional id for supertext reference
    type?: 'supertext' | 'link'; // Added type field
  }
  
  // Thread List Interface
  export interface Thread {
    threadId: string,
    threadTitle: string,
  }
  
// Removed duplicate ChatMessageAnnotation interface