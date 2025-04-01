// lib/gemini/api.ts
export const geminiApi = {
    async createCorpus(displayName: string, description?: string) {
      try {
        const response = await fetch('/api/gemini/corpus/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ displayName, description }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create corpus');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error creating corpus:', error);
        throw error;
      }
    },
  
    async deleteDocument(documentName: string) {
      try {
        const response = await fetch(`/api/gemini/document/delete?documentName=${encodeURIComponent(documentName)}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete document');
        }
  
        return true;
      } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
      }
    },
  
    async uploadDocument(formData: FormData) {
      try {
        const response = await fetch('/api/gemini/document/upload', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload document');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
      }
    }
  };