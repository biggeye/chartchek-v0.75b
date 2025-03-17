// components/dynamicForms/pdf/template/PatientIntake-template.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { PatientIntake } from '@/types/pdf/patientintake';

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
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 10,
    color: '#6B7280', // gray-500
  },
  symptomTag: {
    backgroundColor: '#EFF6FF', // blue-50
    borderRadius: 3,
    padding: '2 5',
    margin: '0 3 3 0',
    fontSize: 10,
    color: '#2563EB', // blue-600
    display: 'flex',
  },
  symptomContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
});

interface PatientIntakeTemplateProps {
  patientData: PatientIntake['patient'];
}

const PatientIntakeTemplate: React.FC<PatientIntakeTemplateProps> = ({ patientData }) => {
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
            Patient Intake Form
          </Text>
          <Text style={styles.subtitle}>
            Patient: {patientData.fullName}
          </Text>
          <Text style={styles.subtitle}>
            Date of Birth: {formatDate(patientData.dob)}
          </Text>
        </View>
        
        {/* Patient Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.text}>{patientData.address}</Text>
          </View>
          
          <View style={styles.fieldGroup}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number:</Text>
              <Text style={styles.text}>{patientData.phone}</Text>
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.text}>{patientData.email}</Text>
            </View>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Emergency Contact:</Text>
            <Text style={styles.text}>{patientData.emergencyContact}</Text>
          </View>
        </View>
        
        {/* Medical History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical History</Text>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Current Medications:</Text>
            <Text style={styles.text}>{patientData.medications}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Allergies:</Text>
            <Text style={styles.text}>{patientData.allergies}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Previous Diagnoses:</Text>
            <Text style={styles.text}>{patientData.diagnoses}</Text>
          </View>
          
          <View style={styles.fullWidthField}>
            <Text style={styles.label}>Current Symptoms:</Text>
            <View style={styles.symptomContainer}>
              {Array.isArray(patientData.symptoms) && patientData.symptoms.map((symptom, index) => (
                <Text key={index} style={styles.symptomTag}>{symptom}</Text>
              ))}
              {!Array.isArray(patientData.symptoms) && (
                <Text style={styles.text}>{patientData.symptoms}</Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <Text style={styles.label}>Patient Signature:</Text>
          <View style={{ height: 40 }}></View>
          <Text style={styles.signatureLabel}>
            {patientData.fullName}, {formatDate(new Date().toISOString())}
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

export default PatientIntakeTemplate;
