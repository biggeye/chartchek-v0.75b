// components/GoogleAuthButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function GoogleAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAuth = async () => {
    setIsLoading(true);
    try {
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleAuth} 
      disabled={isLoading}
      outline
    >
      {isLoading ? 'Connecting...' : 'Connect Google Account'}
    </Button>
  );
}