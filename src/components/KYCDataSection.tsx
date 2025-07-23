import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import KYCDataForm from './KYCDataForm';

const KYCDataSection: React.FC = () => {
  return (
    <div className="p-4">
      <KYCDataForm />
    </div>
  );
};

export default KYCDataSection; 