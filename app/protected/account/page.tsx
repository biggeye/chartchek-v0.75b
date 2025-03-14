'use client'

import React from 'react'
import UserProfile from '@/components/profile/UserProfile'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const userId = user?.id;

export default function AccountPage() {
  

  return (
    <div className="p-8">
      {userId ? (
        <UserProfile userId={userId} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading user information...</p>
        </div>
      )}
    </div>
  )
}
