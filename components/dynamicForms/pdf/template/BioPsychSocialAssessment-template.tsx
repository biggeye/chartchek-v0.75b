// components/dynamicForms/pdf/biopsychsocial-assessment.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { BioPsychSocialAssessment } from '@/types/pdf/biopsychsocialassessment';

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
  patientData: BioPsychSocialAssessment['patient'];
}

const BioPsychSocialTemplate: React.FC<BioPsychSocialTemplateProps> = ({ patientData }) => {
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

  return (
    <Document>
      <Page style={styles.page} size="A4">
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            BioPsychSocial Assessment
          </Text>
          <Text style={styles.subtitle}>
            Patient: {patientData.firstName} {patientData.lastName}
          </Text>
          <Text style={styles.subtitle}>
            Assessment Date: {formatDate(patientData.assessmentDate)}
          </Text>
        </View>
        
        {/* Patient Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          
          <View style={styles.fieldGroup}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date of Birth:</Text>
              <Text style={styles.text}>{formatDate(patientData.dateOfBirth)}</Text>
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gender:</Text>
              <Text style={styles.text}>{patientData.gender}</Text>
            </View>
          </View>
          
          <View style={styles.fieldGroup}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Clinician:</Text>
              <Text style={styles.text}>{patientData.clinicianName}</Text>
            </View>
          </View>
        </View>
        
        {/* Clinical Assessment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Assessment</Text>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Presenting Problem:</Text>
            <Text style={styles.text}>{patientData.presentingProblem}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Psychiatric History:</Text>
            <Text style={styles.text}>{patientData.psychiatricHistory}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Medical History:</Text>
            <Text style={styles.text}>{patientData.medicalHistory}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Substance Use History:</Text>
            <Text style={styles.text}>{patientData.substanceUseHistory}</Text>
          </View>
        </View>
        
        {/* Psychosocial Factors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Psychosocial Factors</Text>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Social History:</Text>
            <Text style={styles.text}>{patientData.socialHistory}</Text>
          </View>
          
          {/* Optional sections */}
          {patientData.legalHistory && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Legal History:</Text>
              <Text style={styles.text}>{patientData.legalHistory}</Text>
            </View>
          )}
          
          {patientData.employmentStatus && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Employment Status:</Text>
              <Text style={styles.text}>{patientData.employmentStatus}</Text>
            </View>
          )}
          
          {patientData.educationalHistory && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Educational History:</Text>
              <Text style={styles.text}>{patientData.educationalHistory}</Text>
            </View>
          )}
          
          {patientData.familyDynamics && (
            <View style={styles.optionalSection}>
              <Text style={styles.label}>Family Dynamics:</Text>
              <Text style={styles.text}>{patientData.familyDynamics}</Text>
            </View>
          )}
        </View>
        
        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <Text style={styles.label}>Clinician Signature:</Text>
          <View style={{ height: 40 }}></View>
          <Text style={styles.signatureLabel}>
            {patientData.clinicianName}, {formatDate(patientData.assessmentDate)}
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
