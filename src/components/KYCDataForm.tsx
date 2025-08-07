
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface KYCData {
  employeeName: string;
  fatherName: string;
  husbandName: string;
  gender: string;
  maritalStatus: string;
  dobAadhar: string;
  designation: string;
  basicSalary: string;
  specialAllowance: string;
  conveyance: string;
  hra: string;
  cea: string;
  booksPerks: string;
  telephonic: string;
  grossSalary: string;
  dateOfAppointment: string;
  mobileNo: string;
  emailId: string;
  aadharNo: string;
  namePerAadhar: string;
  panNo: string;
  namePerPan: string;
  bankAccountNo: string;
  ifscCode: string;
  permanentAddress: string;
  aadharAddress: string;
  grade: string;
}

const KYCDataForm: React.FC = () => {
  const { toast } = useToast();
  const [kycData, setKycData] = useState<KYCData>({
    employeeName: '',
    fatherName: '',
    husbandName: '',
    gender: '',
    maritalStatus: '',
    dobAadhar: '',
    designation: '',
    basicSalary: '',
    specialAllowance: '',
    conveyance: '',
    hra: '',
    cea: '',
    booksPerks: '',
    telephonic: '',
    grossSalary: '',
    dateOfAppointment: '',
    mobileNo: '',
    emailId: '',
    aadharNo: '',
    namePerAadhar: '',
    panNo: '',
    namePerPan: '',
    bankAccountNo: '',
    ifscCode: '',
    permanentAddress: '',
    aadharAddress: '',
    grade: ''
  });

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setKycData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!kycData.employeeName.trim() || !kycData.emailId.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter employee name and email address.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for database (convert to snake_case)
      const kycDataForDB = {
        employee_name: kycData.employeeName,
        father_name: kycData.fatherName,
        husband_name: kycData.husbandName,
        gender: kycData.gender,
        marital_status: kycData.maritalStatus,
        dob_aadhar: kycData.dobAadhar || null,
        designation: kycData.designation,
        basic_salary: kycData.basicSalary ? parseFloat(kycData.basicSalary) : null,
        special_allowance: kycData.specialAllowance ? parseFloat(kycData.specialAllowance) : null,
        conveyance: kycData.conveyance ? parseFloat(kycData.conveyance) : null,
        hra: kycData.hra ? parseFloat(kycData.hra) : null,
        cea: kycData.cea ? parseFloat(kycData.cea) : null,
        books_perks: kycData.booksPerks ? parseFloat(kycData.booksPerks) : null,
        telephonic: kycData.telephonic ? parseFloat(kycData.telephonic) : null,
        gross_salary: kycData.grossSalary ? parseFloat(kycData.grossSalary) : null,
        date_of_appointment: kycData.dateOfAppointment || null,
        mobile_no: kycData.mobileNo,
        email_id: kycData.emailId,
        aadhar_no: kycData.aadharNo,
        name_per_aadhar: kycData.namePerAadhar,
        pan_no: kycData.panNo,
        name_per_pan: kycData.namePerPan,
        bank_account_no: kycData.bankAccountNo,
        ifsc_code: kycData.ifscCode,
        permanent_address: kycData.permanentAddress,
        aadhar_address: kycData.aadharAddress,
        grade: kycData.grade,
      };

      // Insert into database
      const { error } = await supabase
        .from('kyc_data')
        .insert([kycDataForDB]);

      if (error) {
        console.error('Error saving KYC data:', error);
        toast({
          title: "Error",
          description: "Failed to save KYC data. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "KYC Data Saved",
          description: "Employee KYC information has been saved successfully.",
        });
        
        // Reset form
        setKycData({
          employeeName: '',
          fatherName: '',
          husbandName: '',
          gender: '',
          maritalStatus: '',
          dobAadhar: '',
          designation: '',
          basicSalary: '',
          specialAllowance: '',
          conveyance: '',
          hra: '',
          cea: '',
          booksPerks: '',
          telephonic: '',
          grossSalary: '',
          dateOfAppointment: '',
          mobileNo: '',
          emailId: '',
          aadharNo: '',
          namePerAadhar: '',
          panNo: '',
          namePerPan: '',
          bankAccountNo: '',
          ifscCode: '',
          permanentAddress: '',
          aadharAddress: '',
          grade: ''
        });
      }
    } catch (error) {
      console.error('Error saving KYC data:', error);
      toast({
        title: "Error",
        description: "Failed to save KYC data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendPolicies = () => {
    if (!kycData.emailId || !kycData.grade) {
      toast({
        title: "Missing Information",
        description: "Please enter employee email and grade to send policies.",
        variant: "destructive",
      });
      return;
    }

    const confirmSend = window.confirm(
      `Send policies for grade ${kycData.grade} to ${kycData.emailId}?\n\nCC: Maansi, Sanika, HR`
    );
    
    if (confirmSend) {
      // Simulate sending email
      setTimeout(() => {
        toast({
          title: "Policies Sent Successfully",
          description: `Travel, POSH, and Accidental policies for grade ${kycData.grade} have been sent to ${kycData.emailId}`,
        });
      }, 1000);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Card className="professional-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-300">
            <User className="w-5 h-5" />
            <span>KYC Data Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Employee Name *</Label>
              <Input
                value={kycData.employeeName}
                onChange={(e) => handleInputChange('employeeName', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Father's Name</Label>
              <Input
                value={kycData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Husband's Name (if married)</Label>
              <Input
                value={kycData.husbandName}
                onChange={(e) => handleInputChange('husbandName', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Gender</Label>
              <Select value={kycData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Marital Status</Label>
              <Select value={kycData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">DOB (As per Aadhar)</Label>
              <Input
                type="date"
                value={kycData.dobAadhar}
                onChange={(e) => handleInputChange('dobAadhar', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Designation</Label>
              <Input
                value={kycData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Grade</Label>
              <Select value={kycData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectItem value="M1">M1</SelectItem>
                  <SelectItem value="M2">M2</SelectItem>
                  <SelectItem value="M3">M3</SelectItem>
                  <SelectItem value="M4">M4</SelectItem>
                  <SelectItem value="M5">M5</SelectItem>
                  <SelectItem value="M6">M6</SelectItem>
                  <SelectItem value="M7">M7</SelectItem>
                  <SelectItem value="M8">M8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Date of Appointment</Label>
              <Input
                type="date"
                value={kycData.dateOfAppointment}
                onChange={(e) => handleInputChange('dateOfAppointment', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Salary Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Basic Salary</Label>
              <Input
                type="number"
                value={kycData.basicSalary}
                onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Special Allowance</Label>
              <Input
                type="number"
                value={kycData.specialAllowance}
                onChange={(e) => handleInputChange('specialAllowance', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Conveyance</Label>
              <Input
                type="number"
                value={kycData.conveyance}
                onChange={(e) => handleInputChange('conveyance', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">HRA</Label>
              <Input
                type="number"
                value={kycData.hra}
                onChange={(e) => handleInputChange('hra', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">CEA</Label>
              <Input
                type="number"
                value={kycData.cea}
                onChange={(e) => handleInputChange('cea', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Books & Perks</Label>
              <Input
                type="number"
                value={kycData.booksPerks}
                onChange={(e) => handleInputChange('booksPerks', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Telephonic</Label>
              <Input
                type="number"
                value={kycData.telephonic}
                onChange={(e) => handleInputChange('telephonic', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Gross Salary</Label>
              <Input
                type="number"
                value={kycData.grossSalary}
                onChange={(e) => handleInputChange('grossSalary', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Contact and Document Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Mobile No.</Label>
              <Input
                value={kycData.mobileNo}
                onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Email ID *</Label>
              <Input
                type="email"
                value={kycData.emailId}
                onChange={(e) => handleInputChange('emailId', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Aadhar No.</Label>
              <Input
                value={kycData.aadharNo}
                onChange={(e) => handleInputChange('aadharNo', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Name as per Aadhar</Label>
              <Input
                value={kycData.namePerAadhar}
                onChange={(e) => handleInputChange('namePerAadhar', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* PAN and Bank Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-200">PAN No.</Label>
              <Input
                value={kycData.panNo}
                onChange={(e) => handleInputChange('panNo', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Name as per PAN</Label>
              <Input
                value={kycData.namePerPan}
                onChange={(e) => handleInputChange('namePerPan', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Bank A/c No.</Label>
              <Input
                value={kycData.bankAccountNo}
                onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">IFSC Code</Label>
              <Input
                value={kycData.ifscCode}
                onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Permanent Address</Label>
              <Textarea
                value={kycData.permanentAddress}
                onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-200">Aadhar Card Address</Label>
              <Textarea
                value={kycData.aadharAddress}
                onChange={(e) => handleInputChange('aadharAddress', e.target.value)}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button onClick={handleSave} className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Save className="w-4 h-4 mr-2" />
              Save KYC Data
            </Button>
            <Button onClick={handleSendPolicies} variant="outline" className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Send className="w-4 h-4 mr-2" />
              Send Policies
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCDataForm;
