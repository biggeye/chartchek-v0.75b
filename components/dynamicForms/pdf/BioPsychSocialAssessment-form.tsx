'use client';
import React from 'react';
import { usePDFStore } from '@/store/pdfStore';
import type { BioPsychSocialAssessment } from '@/types/pdf/biopsychsocialassessment';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BioPsychSocialAssessmentForm: React.FC = () => {
  const { data, updateData } = usePDFStore();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateData(name as keyof BioPsychSocialAssessment['patient'], value);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
          <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-300">Patient Information</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Basic demographic information</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label font-medium text-gray-700 dark:text-gray-300">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={data.firstName}
                onChange={handleChange}
                className="input input-bordered w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="form-control">
              <label className="label font-medium text-gray-700 dark:text-gray-300">
                <span className="label-text">Last Name</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={data.lastName}
                onChange={handleChange}
                className="input input-bordered w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="form-control">
              <label className="label font-medium text-gray-700 dark:text-gray-300">
                <span className="label-text">Date of Birth</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={data.dateOfBirth}
                onChange={handleChange}
                className="input input-bordered w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="form-control">
              <label className="label font-medium text-gray-700 dark:text-gray-300">
                <span className="label-text">Gender</span>
              </label>
              <select
                name="gender"
                value={data.gender}
                onChange={handleChange}
                className="select select-bordered w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label font-medium text-gray-700 dark:text-gray-300">
                <span className="label-text">Assessment Date</span>
              </label>
              <input
                type="date"
                name="assessmentDate"
                value={data.assessmentDate}
                onChange={handleChange}
                className="input input-bordered w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="form-control mt-6">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Clinician Name</span>
            </label>
            <input
              type="text"
              name="clinicianName"
              value={data.clinicianName}
              onChange={handleChange}
              className="input input-bordered w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 border-b">
          <h2 className="text-2xl font-semibold text-green-800 dark:text-green-300">Clinical Assessment</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Detailed clinical information</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Presenting Problem</span>
            </label>
            <textarea
              name="presentingProblem"
              value={data.presentingProblem}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Describe the presenting problem in detail..."
            />
          </div>

          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Psychiatric History</span>
            </label>
            <textarea
              name="psychiatricHistory"
              value={data.psychiatricHistory}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Document any previous psychiatric treatment or diagnoses..."
            />
          </div>

          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Medical History</span>
            </label>
            <textarea
              name="medicalHistory"
              value={data.medicalHistory}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Document relevant medical conditions and treatments..."
            />
          </div>

          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Substance Use History</span>
            </label>
            <textarea
              name="substanceUseHistory"
              value={data.substanceUseHistory}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Document history of substance use, treatment, and current status..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b">
          <h2 className="text-2xl font-semibold text-purple-800 dark:text-purple-300">Psychosocial Factors</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Social and environmental context</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Social History</span>
            </label>
            <textarea
              name="socialHistory"
              value={data.socialHistory}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Document family relationships, living situation, and social support..."
            />
          </div>

          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Legal History</span>
              <span className="text-xs text-gray-500 ml-2">(Optional)</span>
            </label>
            <textarea
              name="legalHistory"
              value={data.legalHistory || ''}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Document any legal issues or involvement with the justice system..."
            />
          </div>

          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Employment Status</span>
              <span className="text-xs text-gray-500 ml-2">(Optional)</span>
            </label>
            <textarea
              name="employmentStatus"
              value={data.employmentStatus || ''}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Document current employment status and history..."
            />
          </div>

          <div className="form-control">
            <label className="label font-medium text-gray-700 dark:text-gray-300">
              <span className="label-text">Educational History</span>
              <span className="text-xs text-gray-500 ml-2">(Optional)</span>
            </label>
            <textarea
              name="educationalHistory"
              value={data.educationalHistory || ''}
              onChange={handleChange}
              className="textarea textarea-bordered h-28 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Document highest level of education and any learning difficulties..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BioPsychSocialAssessmentForm;