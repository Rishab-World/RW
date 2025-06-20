import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

interface StatusChange {
  id: string;
  candidateId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface CandidateStatusHistoryProps {
  candidateId: string;
  statusHistory: StatusChange[];
}

const CandidateStatusHistory: React.FC<CandidateStatusHistoryProps> = ({ 
  candidateId, 
  statusHistory 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.map((change) => (
            <div key={change.id} className="flex items-start space-x-3 border-l-2 border-blue-200 pl-4 pb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {change.oldStatus || 'New'} → {change.newStatus}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{change.changedBy}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(change.changedAt).toLocaleString()}</span>
                  </div>
                </div>
                {change.reason && (
                  <p className="text-sm text-gray-700 mt-1">Reason: {change.reason}</p>
                )}
              </div>
            </div>
          ))}
          {statusHistory.length === 0 && (
            <p className="text-gray-500 text-sm">No status changes recorded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateStatusHistory;
