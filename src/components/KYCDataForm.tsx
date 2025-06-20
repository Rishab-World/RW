
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const handleSave = () => {
    toast({
      title: "KYC Data Saved",
      description: "Employee KYC information has been saved successfully.",
    });
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
    <div className="p-4 space-y-4 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-800">
            <User className="w-5 h-5" />
            <span>KYC Data Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Employee Name *</Label>
              <Input
                value={kycData.employeeName}
                onChange={(e) => handleInputChange('employeeName', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Father's Name</Label>
              <Input
                value={kycData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Husband's Name (if married)</Label>
              <Input
                value={kycData.husbandName}
                onChange={(e) => handleInputChange('husbandName', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={kycData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className="professional-input">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marital Status</Label>
              <Select value={kycData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                <SelectTrigger className="professional-input">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>DOB (As per Aadhar)</Label>
              <Input
                type="date"
                value={kycData.dobAadhar}
                onChange={(e) => handleInputChange('dobAadhar', e.target.value)}
                className="professional-input"
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Designation</Label>
              <Input
                value={kycData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Grade</Label>
              <Select value={kycData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                <SelectTrigger className="professional-input">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
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
              <Label>Date of Appointment</Label>
              <Input
                type="date"
                value={kycData.dateOfAppointment}
                onChange={(e) => handleInputChange('dateOfAppointment', e.target.value)}
                className="professional-input"
              />
            </div>
          </div>

          {/* Salary Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Basic Salary</Label>
              <Input
                type="number"
                value={kycData.basicSalary}
                onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Special Allowance</Label>
              <Input
                type="number"
                value={kycData.specialAllowance}
                onChange={(e) => handleInputChange('specialAllowance', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Conveyance</Label>
              <Input
                type="number"
                value={kycData.conveyance}
                onChange={(e) => handleInputChange('conveyance', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>HRA</Label>
              <Input
                type="number"
                value={kycData.hra}
                onChange={(e) => handleInputChange('hra', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>CEA</Label>
              <Input
                type="number"
                value={kycData.cea}
                onChange={(e) => handleInputChange('cea', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Books & Perks</Label>
              <Input
                type="number"
                value={kycData.booksPerks}
                onChange={(e) => handleInputChange('booksPerks', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Telephonic</Label>
              <Input
                type="number"
                value={kycData.telephonic}
                onChange={(e) => handleInputChange('telephonic', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Gross Salary</Label>
              <Input
                type="number"
                value={kycData.grossSalary}
                onChange={(e) => handleInputChange('grossSalary', e.target.value)}
                className="professional-input"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mobile No.</Label>
              <Input
                value={kycData.mobileNo}
                onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Email ID *</Label>
              <Input
                type="email"
                value={kycData.emailId}
                onChange={(e) => handleInputChange('emailId', e.target.value)}
                className="professional-input"
              />
            </div>
          </div>

          {/* Document Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Aadhar No.</Label>
              <Input
                value={kycData.aadharNo}
                onChange={(e) => handleInputChange('aadharNo', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Name as per Aadhar</Label>
              <Input
                value={kycData.namePerAadhar}
                onChange={(e) => handleInputChange('namePerAadhar', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>PAN No.</Label>
              <Input
                value={kycData.panNo}
                onChange={(e) => handleInputChange('panNo', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>Name as per PAN</Label>
              <Input
                value={kycData.namePerPan}
                onChange={(e) => handleInputChange('namePerPan', e.target.value)}
                className="professional-input"
              />
            </div>
          </div>

          {/* Bank Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bank A/c No.</Label>
              <Input
                value={kycData.bankAccountNo}
                onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
                className="professional-input"
              />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input
                value={kycData.ifscCode}
                onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                className="professional-input"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Permanent Address</Label>
              <Textarea
                value={kycData.permanentAddress}
                onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                className="professional-input"
                rows={3}
              />
            </div>
            <div>
              <Label>Aadhar Card Address</Label>
              <Textarea
                value={kycData.aadharAddress}
                onChange={(e) => handleInputChange('aadharAddress', e.target.value)}
                className="professional-input"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button onClick={handleSave} className="professional-button">
              <Save className="w-4 h-4 mr-2" />
              Save KYC Data
            </Button>
            <Button onClick={handleSendPolicies} variant="outline">
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
