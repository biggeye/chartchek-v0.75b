'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import UserProfile from '@/components/profile/UserProfile'

export default function AccountPage() {
  const params = useParams()
  const userId = params?.user_id as string

  return (
    <div className="p-8">
      <UserProfile userId={userId} />
    </div>
  )
}
