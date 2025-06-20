import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog as UIDialog } from '@/components/ui/dialog';

interface Interview {
  id: string;
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  interview_date: string;
  interview_time: string;
  interviewer: string;
  interview_type: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Interviewer {
  id: string;
  name: string;
}

interface InterviewType {
  id: string;
  name: string;
}

interface InterviewSchedulingProps {
  candidates: any[];
  refreshCandidates: () => void;
}

const InterviewScheduling: React.FC<InterviewSchedulingProps> = ({
  candidates,
  refreshCandidates
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [newInterviewer, setNewInterviewer] = useState('');
  const [newInterviewType, setNewInterviewType] = useState('');
  const [formData, setFormData] = useState({
    candidateId: '',
    date: '',
    time: '',
    interviewer: '',
    type: '',
    notes: '',
  });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [interviewToCancel, setInterviewToCancel] = useState<Interview | null>(null);
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || 'system' : 'system';

  // Fetch interviews, interviewers, and interview types on component mount
  useEffect(() => {
    fetchInterviews();
    fetchInterviewers();
    fetchInterviewTypes();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('interviews_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'interviews' 
        }, 
        (payload) => {
          console.log('Change received!', payload);
          fetchInterviews();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchInterviews = async () => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('interview_date', { ascending: true });

    if (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch interviews",
        variant: "destructive",
      });
    } else {
      setInterviews(data || []);
    }
  };

  const fetchInterviewers = async () => {
    const { data, error } = await supabase
      .from('interviewers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching interviewers:', error);
    } else {
      setInterviewers(data || []);
    }
  };

  const fetchInterviewTypes = async () => {
    const { data, error } = await supabase
      .from('interview_types')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching interview types:', error);
    } else {
      setInterviewTypes(data || []);
    }
  };

  const handleAddInterviewer = async () => {
    if (!newInterviewer.trim()) return;

    const { error } = await supabase
      .from('interviewers')
      .insert([{ name: newInterviewer.trim() }]);

    if (error) {
      console.error('Error adding interviewer:', error);
      toast({
        title: "Error",
        description: "Failed to add interviewer",
        variant: "destructive",
      });
    } else {
      setNewInterviewer('');
      fetchInterviewers();
      toast({
        title: "Success",
        description: "Interviewer added successfully",
      });
    }
  };

  const handleAddInterviewType = async () => {
    if (!newInterviewType.trim()) return;

    const { error } = await supabase
      .from('interview_types')
      .insert([{ name: newInterviewType.trim() }]);

    if (error) {
      console.error('Error adding interview type:', error);
      toast({
        title: "Error",
        description: "Failed to add interview type",
        variant: "destructive",
      });
    } else {
      setNewInterviewType('');
      fetchInterviewTypes();
      toast({
        title: "Success",
        description: "Interview type added successfully",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCandidate = candidates.find(c => c.id === formData.candidateId);
    // Ensure time is in HH:MM:SS format or null
    let formattedTime = null;
    if (formData.time) {
      formattedTime = formData.time.length === 5 ? formData.time + ':00' : formData.time;
    }
    const newInterview = {
      candidate_id: formData.candidateId,
      candidate_name: selectedCandidate?.name || '',
      job_title: selectedCandidate?.position || '',
      interview_date: formData.date,
      interview_time: formattedTime,
      interviewer: formData.interviewer,
      interview_type: formData.type,
      status: 'scheduled',
      notes: formData.notes,
    };

    const { error, data } = await supabase
      .from('interviews')
      .insert([newInterview])
      .select();

    if (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interview",
        variant: "destructive",
      });
    } else {
      // Update candidate status to interviewed
      await supabase.from('candidates').update({ interview_status: 'interviewed' }).eq('id', formData.candidateId);
      // Insert into candidate_status_history
      await supabase.from('candidate_status_history').insert([
        {
          candidate_id: formData.candidateId,
          old_status: 'shortlisted',
          new_status: 'interviewed',
          changed_by: userEmail,
          changed_at: new Date().toISOString(),
          reason: 'Interview scheduled',
        },
      ]);
      setFormData({
        candidateId: '',
        date: '',
        time: '',
        interviewer: '',
        type: '',
        notes: '',
      });
      
      setIsDialogOpen(false);
      toast({
        title: "Interview Scheduled",
        description: "Interview has been successfully scheduled.",
      });
      await refreshCandidates();
    }
  };

  const handleCancelInterview = (interview: Interview) => {
    setInterviewToCancel(interview);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const confirmCancelInterview = async () => {
    if (!interviewToCancel) return;
    // Update interview status to cancelled and save reason
    await supabase.from('interviews').update({ status: 'cancelled', notes: cancelReason }).eq('id', interviewToCancel.id);
    // Update candidate status to shortlisted
    await supabase.from('candidates').update({ interview_status: 'shortlisted' }).eq('id', interviewToCancel.candidate_id);
    // Insert into candidate_status_history
    await supabase.from('candidate_status_history').insert([
      {
        candidate_id: interviewToCancel.candidate_id,
        old_status: 'interviewed',
        new_status: 'shortlisted',
        changed_by: userEmail,
        changed_at: new Date().toISOString(),
        reason: `Interview cancelled: ${cancelReason}`,
      },
    ]);
    setCancelDialogOpen(false);
    setInterviewToCancel(null);
    setCancelReason('');
    toast({
      title: "Interview Cancelled",
      description: "Interview has been cancelled and candidate status updated.",
    });
    await refreshCandidates();
  };

  const getInterviewsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return interviews.filter(interview => interview.interview_date === dateStr && interview.status !== 'cancelled');
  };

  const todaysInterviews = selectedDate ? getInterviewsForDate(selectedDate) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4" />
              <span>Schedule Interview</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Interview</DialogTitle>
              <DialogDescription>
                Set up an interview with a candidate
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidateId">Candidate *</Label>
                <Select
                  value={formData.candidateId}
                  onValueChange={(value) => setFormData({ ...formData, candidateId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates
                      .filter(c => c.interviewStatus === 'shortlisted')
                      .map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name} - {candidate.position}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interviewer">Interviewer *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.interviewer}
                    onValueChange={(value) => setFormData({ ...formData, interviewer: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {interviewers.map((interviewer) => (
                        <SelectItem key={interviewer.id} value={interviewer.name}>
                          {interviewer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" type="button">+</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Add New Interviewer</Label>
                          <div className="flex gap-2">
                            <Input
                              value={newInterviewer}
                              onChange={(e) => setNewInterviewer(e.target.value)}
                              placeholder="Enter interviewer name"
                            />
                            <Button onClick={handleAddInterviewer} type="button">Add</Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Interview Type *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {interviewTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" type="button">+</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Add New Interview Type</Label>
                          <div className="flex gap-2">
                            <Input
                              value={newInterviewType}
                              onChange={(e) => setNewInterviewType(e.target.value)}
                              placeholder="Enter interview type"
                            />
                            <Button onClick={handleAddInterviewType} type="button">Add</Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or instructions"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Interview</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="md:flex gap-6">
        <Card className="w-auto max-w-xs flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Interview Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'PPPP') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysInterviews.map((interview) => (
                <div key={interview.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{interview.candidate_name}</h4>
                    <span className="text-sm text-gray-500">{interview.interview_time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{interview.job_title}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{interview.interviewer}</span>
                    </span>
                    <span className="capitalize">{interview.interview_type}</span>
                  </div>
                </div>
              ))}
              {todaysInterviews.length === 0 && (
                <p className="text-gray-500 text-sm">No interviews scheduled for this date.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Interviewer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.filter(interview => interview.status !== 'cancelled').map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">{interview.candidate_name}</TableCell>
                  <TableCell>{interview.job_title}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{format(new Date(interview.interview_date), 'MMM dd, yyyy')}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{interview.interview_time}</span>
                    </div>
                  </TableCell>
                  <TableCell>{interview.interviewer}</TableCell>
                  <TableCell className="capitalize">{interview.interview_type}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${
                      interview.status === 'scheduled' ? 'status-pending' :
                      interview.status === 'completed' ? 'status-completed' :
                      interview.status === 'cancelled' ? 'status-rejected' : 'status-active'
                    }`}>
                      {interview.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {interview.status === 'scheduled' && (
                      <Button size="sm" variant="destructive" onClick={() => handleCancelInterview(interview)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {interviews.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No interviews scheduled yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Interview Dialog */}
      <UIDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this interview.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter cancellation reason"
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Close</Button>
            <Button variant="destructive" onClick={confirmCancelInterview} disabled={!cancelReason.trim()}>
              Confirm Cancel
            </Button>
          </div>
        </DialogContent>
      </UIDialog>
    </div>
  );
};

export default InterviewScheduling;
