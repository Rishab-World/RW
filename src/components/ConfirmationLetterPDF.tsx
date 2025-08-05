import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#222' },
  heading: { fontSize: 18, textAlign: 'center', marginBottom: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { marginBottom: 16 },
  label: { fontWeight: 'bold' },
  bodyText: { marginBottom: 8 },
  signature: { marginTop: 40, textAlign: 'right', fontWeight: 'bold' },
});

const ConfirmationLetterPDF = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.heading}>Confirmation Letter</Text>
      <View style={styles.section}>
        <Text style={styles.bodyText}>Date: {data.DATE || '__________'}</Text>
        <Text style={styles.bodyText}>To,</Text>
        <Text style={styles.bodyText}>{data.EMPLOYEE_NAME || 'Employee Name'}</Text>
        <Text style={styles.bodyText}>{data.DESIGNATION || 'Designation'}</Text>
        <Text style={styles.bodyText}>{data.DEPARTMENT || 'Department'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.bodyText}>
          Dear {data.EMPLOYEE_NAME || 'Employee Name'},
        </Text>
        <Text style={styles.bodyText}>
          We are pleased to inform you that your services with {data.COMPANY_NAME || 'Company Name'} have been confirmed effective from {data.CONFIRMATION_DATE || '__________'}.
        </Text>
        <Text style={styles.bodyText}>
          We appreciate your contribution and look forward to your continued dedication and performance.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.bodyText}>With best wishes,</Text>
        <Text style={styles.signature}>{data.COMPANY_NAME || 'Company Name'}</Text>
      </View>
    </Page>
  </Document>
);

export default ConfirmationLetterPDF; 