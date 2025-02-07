'use client'

import { useState } from 'react'

interface UserProfileData {
  fullName: string
  email: string
  title: string
}

export default function UserProfile({ 
  initialData,
  onUpdate 
}: { 
  initialData: UserProfileData
  onUpdate: (field: keyof UserProfileData, value: string) => Promise<void>
}) {
  const [data, setData] = useState<UserProfileData>(initialData)

  return (
    <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900">Profile</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          This information will be displayed publicly so be careful what you share.
        </p>

        <dl className="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
          <div className="pt-6 sm:flex">
            <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Full name</dt>
            <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
              <div className="text-gray-900">{data.fullName}</div>
              <button
                type="button"
                onClick={() => {
                  const newName = prompt('Enter new name:', data.fullName)
                  if (newName && newName !== data.fullName) {
                    onUpdate('fullName', newName)
                    setData(prev => ({ ...prev, fullName: newName }))
                  }
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Update
              </button>
            </dd>
          </div>

          <div className="pt-6 sm:flex">
            <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Email address</dt>
            <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
              <div className="text-gray-900">{data.email}</div>
              <button
                type="button"
                onClick={() => {
                  const newEmail = prompt('Enter new email:', data.email)
                  if (newEmail && newEmail !== data.email) {
                    onUpdate('email', newEmail)
                    setData(prev => ({ ...prev, email: newEmail }))
                  }
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Update
              </button>
            </dd>
          </div>

          <div className="pt-6 sm:flex">
            <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Title</dt>
            <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
              <div className="text-gray-900">{data.title}</div>
              <button
                type="button"
                onClick={() => {
                  const newTitle = prompt('Enter new title:', data.title)
                  if (newTitle && newTitle !== data.title) {
                    onUpdate('title', newTitle)
                    setData(prev => ({ ...prev, title: newTitle }))
                  }
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Update
              </button>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
