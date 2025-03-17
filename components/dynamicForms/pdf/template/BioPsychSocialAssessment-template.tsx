// components/dynamicForms/pdf/biopsychsocial-assessment.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { BioPsychSocialAssessment } from '@/types/pdf/biopsychsocialassessment';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
  ]
});

// PDF Styling
const styles = StyleSheet.create({
  page: { 
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    marginBottom: 20,
    borderBottom: '1px solid #CCCCCC',
    paddingBottom: 10,
  },
  title: { 
    fontSize: 24, 
    marginBottom: 8, 
    fontWeight: 'bold',
    color: '#2563EB', // blue-600
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
    color: '#4B5563', // gray-600
  },
  section: {
    marginBottom: 15,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#F3F4F6', // gray-100
    padding: 5,
    borderRadius: 3,
    color: '#1F2937', // gray-800
  },
  fieldGroup: {
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fieldContainer: {
    marginBottom: 8,
    width: '50%',
  },
  fullWidthField: {
    marginBottom: 10,
    width: '100%',
  },
  label: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 3,
    color: '#4B5563', // gray-600
  },
  text: { 
    fontSize: 11, 
    marginBottom: 5,
    lineHeight: 1.4,
    color: '#1F2937', // gray-800
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1px solid #CCCCCC',
    fontSize: 10,
    color: '#6B7280', // gray-500
    textAlign: 'center',
  },
  signatureArea: {
    marginTop: 30,
    borderTop: '1px solid #CCCCCC',
    paddingTop: 10,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6B7280', // gray-500
  },
  optionalSection: {
    marginTop: 5,
    paddingTop: 5,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 10,
    color: '#6B7280', // gray-500
  },
});

interface BioPsychSocialTemplateProps {
  formData: any; // Accept any form data structure
}

const BioPsychSocialTemplate: React.FC<BioPsychSocialTemplateProps> = ({ formData }) => {
  console.log('[BioPsychSocialTemplate] Received form data:', formData);
  
  // Process form data if it's an array (from the OpenAI tool call)
  let processedData: Record<string, any> = {};
  
  if (Array.isArray(formData)) {
    console.log('[BioPsychSocialTemplate] Form data is an array, processing...');
    // Convert array of field objects to a key-value object
    formData.forEach((field: any) => {
      // Check for different possible structures
      if (field.name && field.value !== undefined) {
        processedData[field.name] = field.value;
      } else if (field.label && field.value !== undefined) {
        // Some arrays might use label instead of name
        const fieldName = field.name || field.label.toLowerCase().replace(/\s+/g, '');
        processedData[fieldName] = field.value;
      } else if (typeof field === 'object') {
        // If it's an object with direct key-value pairs
        Object.keys(field).forEach(key => {
          if (key !== 'type' && key !== 'label') {
            processedData[key] = field[key];
          }
        });
      }
    });
    console.log('[BioPsychSocialTemplate] Processed form data:', processedData);
  } else if (formData && typeof formData === 'object') {
    // Use the object as is
    processedData = formData;
  }
  
  // Extract patient data from either nested structure or direct structure
  const patientData = processedData.patient || processedData;
  
  console.log('[BioPsychSocialTemplate] Using patient data:', patientData);
  console.log('[BioPsychSocialTemplate] Patient data keys:', Object.keys(patientData));
  console.log('[BioPsychSocialTemplate] First name value:', patientData.firstName);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Safety check to prevent null reference errors
  if (!patientData) {
    console.error('[BioPsychSocialTemplate] No patient data available for PDF generation');
    return (
      <Document>
        <Page>
          <Text>Error: No patient data available for PDF generation</Text>
        </Page>
      </Document>
    );
  }

  // Safely access properties with fallbacks
  const firstName = patientData.firstName || '';
  const lastName = patientData.lastName || '';
  const assessmentDate = patientData.assessmentDate || '';
  const dateOfBirth = patientData.dateOfBirth || '';
  const gender = patientData.gender || '';
  const clinicianName = patientData.clinicianName || '';
  const presentingProblem = patientData.presentingProblem || '';
  const psychiatricHistory = patientData.psychiatricHistory || '';
  const medicalHistory = patientData.medicalHistory || '';
  const substanceUseHistory = patientData.substanceUseHistory || '';
  const socialHistory = patientData.socialHistory || '';
  const legalHistory = patientData.legalHistory || '';
  const employmentStatus = patientData.employmentStatus || '';
  const educationalHistory = patientData.educationalHistory || '';
  const familyDynamics = patientData.familyDynamics || '';

  return (
    <Document>
      <Page style={styles.page} size="A4">
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            BioPsychSocial Assessment
          </Text>
          <Text style={styles.subtitle}>
            Patient: {firstName} {lastName}
          </Text>
          <Text style={styles.subtitle}>
            Assessment Date: {formatDate(assessmentDate)}
          </Text>
        </View>
        
        {/* Patient Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          
          <View style={styles.fieldGroup}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date of Birth:</Text>
              <Text style={styles.text}>{formatDate(dateOfBirth)}</Text>
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gender:</Text>
              <Text style={styles.text}>{gender}</Text>
            </View>
          </View>
          
          <View style={styles.fieldGroup}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Clinician:</Text>
              <Text style={styles.text}>{clinicianName}</Text>
            </View>
          </View>
        </View>
        
        {/* Clinical Assessment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Assessment</Text>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Presenting Problem:</Text>
            <Text style={styles.text}>{presentingProblem}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Psychiatric History:</Text>
            <Text style={styles.text}>{psychiatricHistory}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Medical History:</Text>
            <Text style={styles.text}>{medicalHistory}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Substance Use History:</Text>
            <Text style={styles.text}>{substanceUseHistory}</Text>
          </View>
        </View>
        
        {/* Psychosocial Factors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Psychosocial Factors</Text>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Social History:</Text>
            <Text style={styles.text}>{socialHistory}</Text>
          </View>
          
          {/* Optional sections */}
          {legalHistory && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Legal History:</Text>
              <Text style={styles.text}>{legalHistory}</Text>
            </View>
          )}
          
          {employmentStatus && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Employment Status:</Text>
              <Text style={styles.text}>{employmentStatus}</Text>
            </View>
          )}
          
          {educationalHistory && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Educational History:</Text>
              <Text style={styles.text}>{educationalHistory}</Text>
            </View>
          )}
          
          {familyDynamics && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Family Dynamics:</Text>
              <Text style={styles.text}>{familyDynamics}</Text>
            </View>
          )}
        </View>
        
        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <Text style={styles.label}>Clinician Signature:</Text>
          <View style={{ height: 40 }}></View>
          <Text style={styles.signatureLabel}>
            {clinicianName}, {formatDate(assessmentDate)}
          </Text>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>
          This document is confidential and contains protected health information.
        </Text>
        
        {/* Page Number */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default BioPsychSocialTemplate;
