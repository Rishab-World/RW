import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  body: { fontFamily: 'Helvetica', padding: 32, color: '#222', fontSize: 12 },
  heading: { textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold', fontSize: 16, marginBottom: 18 },
  section: { marginBottom: 12 },
  label: { fontWeight: 'bold', marginBottom: 2 },
  ul: { marginLeft: 16, marginTop: 4, marginBottom: 4 },
  li: { marginBottom: 2 },
  lines: { minHeight: 36, borderBottom: '1 solid #bbb', marginBottom: 8 },
  signature: { marginLeft: 16, marginTop: 4 },
});

const ProbationReviewPDF = ({ variables = {} }) => (
  <Document>
    <Page style={styles.body}>
      <Text style={styles.heading}>Probation Period Review Form</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Employee Information:</Text>
        <View style={styles.ul}>
          <Text style={styles.li}>Name: {variables.EMPLOYEE_NAME || '_________________'}</Text>
          <Text style={styles.li}>Designation: {variables.DESIGNATION || '_________________'}</Text>
          <Text style={styles.li}>Department: {variables.DEPARTMENT || '_________________'}</Text>
          <Text style={styles.li}>Date of Joining: {variables.JOINING_DATE || '_________________'}</Text>
          <Text style={styles.li}>Date of Confirmation: {variables.CONFIRMATION_DATE || '_________________'}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Strengths: <Text style={{ fontWeight: 'normal' }}>(Highlight the employee’s notable strengths and achievements during these 3 months.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Areas for Improvement: <Text style={{ fontWeight: 'normal' }}>(Identify specific areas where improvement is needed and provide constructive feedback.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Training and Development: <Text style={{ fontWeight: 'normal' }}>(Discuss any training programs or development opportunities the employee has participated in.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Communication & Collaboration: <Text style={{ fontWeight: 'normal' }}>(Evaluate the employee’s communication skills & ability to collaborate with team members.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Attendance & Punctuality: <Text style={{ fontWeight: 'normal' }}>(Comments on the employee’s attendance record and punctuality.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Overall Performance Rating: <Text style={{ fontWeight: 'normal' }}>(Provide an overall rating based on the employee’s performance during this 3 months.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Head of Department Comments: <Text style={{ fontWeight: 'normal' }}>(Include any additional comments or recommendations for future improvement.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Employee’s Comments: <Text style={{ fontWeight: 'normal' }}>(Employee feedback on their experience and suggest areas for support or development.)</Text></Text>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
        <View style={styles.lines}></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Signatures:</Text>
        <View style={styles.signature}><Text>• Employee</Text></View>
        <View style={styles.signature}><Text>• Head of Department</Text></View>
        <View style={styles.signature}><Text>• Head HR</Text></View>
      </View>
    </Page>
  </Document>
);

export default ProbationReviewPDF; 