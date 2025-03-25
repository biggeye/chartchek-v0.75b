// components/dynamicForms/pdf/template/PatientEvaluation-template.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Improved PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    marginBottom: 15,
    borderBottom: '2pt solid #4F46E5',
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    marginBottom: 6,
    paddingLeft: 6,
  },
  checkboxItem: {
    fontSize: 10,
    marginLeft: 12,
    marginBottom: 2,
  },
  divider: {
    borderBottom: '1pt dashed #D1D5DB',
    marginVertical: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
    borderTop: '1pt solid #eee',
    paddingTop: 4,
  },
});

// Helper function to clean HTML content
const cleanHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

// Extract readable content safely
const extractContent = (item: any): string => {
  if (item.records?.length && item.records[0]?.description) {
    return cleanHtml(item.records[0].description);
  }
  return cleanHtml(item.description || item.value || item.answer || '');
};

// Checkbox Field Renderer
const CheckboxField = ({ item }: { item: any }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{item.label}</Text>
    {item.records?.map((record: any, idx: number) => (
      <Text key={idx} style={styles.checkboxItem}>
        {record.value ? '☑' : '☐'} {record.label}
      </Text>
    ))}
  </View>
);

// Matrix Field Renderer
const MatrixRenderer = ({ item }: { item: any }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{item.label}</Text>
    {item.records?.map((record: any, idx: number) => (
      <View key={idx}>
        {record.column_names.map((col: any, colIdx: number) => (
          <Text key={colIdx} style={styles.value}>
            {col.key}: {col.value || 'N/A'}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

const KipuPatientEvaluationTemplate = ({ formData }: { formData: any }) => {
  const { title = 'Patient Evaluation', items = [] } = formData;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Generated on {new Date().toLocaleDateString()}
          </Text>
        </View>

        {items.map((item: any, index: number) => {
          if (item.field_type === 'matrix') {
            const prevAnswer = extractContent(items[index - 1]).toLowerCase();
            if (prevAnswer !== 'yes') return null;
            return <MatrixRenderer key={index} item={item} />;
          }

          if (
            item.field_type === 'checkbox' ||
            item.field_type === 'check_box' ||
            item.field_type === 'check_box_first_value_none'
          ) {
            return <CheckboxField key={index} item={item} />;
          }

          const content = extractContent(item);
          if (!content && item.field_type === 'title') return null;

          return (
            <View key={index} style={styles.section}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={[styles.value, !content ? { color: '#888' } : {}]}>
                {content || 'No response provided'}
              </Text>
              {item.divider_below && <View style={styles.divider} />}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text>
            ChartChek Patient Evaluation Document • {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default KipuPatientEvaluationTemplate;
