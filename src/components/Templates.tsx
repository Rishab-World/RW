import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, FileText, Download, Calendar, User, Shield, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PDFViewer } from '@react-pdf/renderer';
import ProbationReviewPDF from './ProbationReviewPDF';

interface Template {
  id: string;
  name: string;
  type: 'POSH Policy' | 'Confirmation Letter' | 'Joining Letter' | 'FNF Letter' | 'Probation Review';
  content: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'POSH Policy' as Template['type'],
    content: ''
  });
  const [pdfPreviewTemplate, setPdfPreviewTemplate] = useState<Template | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  // Add state for PDF variables and form submission
  const [pdfVariables, setPdfVariables] = useState({
    EMPLOYEE_NAME: '',
    DESIGNATION: '',
    DEPARTMENT: '',
    JOINING_DATE: '',
    CONFIRMATION_DATE: '',
  });
  const [pdfFormSubmitted, setPdfFormSubmitted] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [processedContent, setProcessedContent] = useState<string>('');

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setTemplates(
        data.map((t: any) => ({
          ...t,
          variables: t.variables || [],
          created_at: t.created_at,
          updated_at: t.updated_at,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const templateTypes = [
    { value: 'POSH Policy', label: 'POSH Policy', icon: Shield },
    { value: 'Confirmation Letter', label: 'Confirmation Letter', icon: Calendar },
    { value: 'Joining Letter', label: 'Joining Letter', icon: User },
    { value: 'FNF Letter', label: 'FNF Letter', icon: Mail },
    { value: 'Probation Review', label: 'Probation Review', icon: User }
  ];

  const handleCreateTemplate = async () => {
    setLoading(true);
    const variables = extractVariables(formData.content);
    const { error } = await supabase.from('document_templates').insert([
      {
        name: formData.name,
        type: formData.type,
        content: formData.content,
        variables,
      },
    ]);
    setIsCreateDialogOpen(false);
    resetForm();
    await fetchTemplates();
    setLoading(false);
  };

  const handleEditTemplate = async () => {
    if (selectedTemplate) {
      setLoading(true);
      const variables = extractVariables(formData.content);
      await supabase
        .from('document_templates')
        .update({
          name: formData.name,
          type: formData.type,
          content: formData.content,
          variables,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTemplate.id);
      setIsEditDialogOpen(false);
      resetForm();
      await fetchTemplates();
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    setLoading(true);
    await supabase.from('document_templates').delete().eq('id', id);
    await fetchTemplates();
    setLoading(false);
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (template: Template) => {
    setSelectedTemplate(template);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'POSH Policy',
      content: ''
    });
    setSelectedTemplate(null);
  };

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const getTypeIcon = (type: Template['type']) => {
    const typeConfig = templateTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : FileText;
  };

  const getTypeColor = (type: Template['type']) => {
    switch (type) {
      case 'POSH Policy':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Confirmation Letter':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Joining Letter':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'FNF Letter':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Probation Review':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  type TemplateType = Template['type'];
  
  /**
   * Handles PDF preview generation for templates
   * - For Probation Review: Uses @react-pdf/renderer with form inputs
   * - For other templates: Uses html2pdf.js with content from Supabase document_templates table
   * - Includes proper variable substitution and error handling
   */
  const handlePdfPreview = async (template: Template) => {
    setPdfPreviewTemplate(template);
    setPdfUrl(null);
    setPdfGenerating(false);
    setPdfError(null);

    if (template.type === 'Probation Review') {
      setPdfVariables({
        EMPLOYEE_NAME: '',
        DESIGNATION: '',
        DEPARTMENT: '',
        JOINING_DATE: '',
        CONFIRMATION_DATE: '',
      });
      setPdfFormSubmitted(false);
      return;
    }

    setPdfGenerating(true);
    try {
      const options = {
        margin: 0,
        filename: `${template.name}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      // Replace {VARIABLE} with formData values
      const processedContent = template.content.replace(/\{(.*?)\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return formData[trimmedKey] || '';
      });
      setProcessedContent(processedContent);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent;

      Object.assign(tempDiv.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '800px',
        minHeight: '1100px',
        background: 'white',
        opacity: '1',
        zIndex: '9999',
        transform: 'scale(1)',
        padding: '48px 56px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      });

      document.body.appendChild(tempDiv);

      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));

      try {
        const blob = await html2pdf().set(options).from(tempDiv).toPdf().output('blob');
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setPdfGenerating(false);
      } catch (error) {
        setPdfGenerating(false);
        setPdfError(`Failed to generate PDF: ${error.message}`);
      } finally {
        document.body.removeChild(tempDiv);
      }
    } catch (error) {
      setPdfGenerating(false);
      setPdfError(`Failed to generate PDF: ${error.message}`);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-x-3 mb-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search templates..."
          className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400"
        >
          <option value="all">All Types</option>
          {templateTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
          Templates: {filteredTemplates.length}
        </span>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-800 dark:text-slate-100">Create New Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTemplate(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Template Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                    placeholder="Enter template name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Template Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Template['type'] })}
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400"
                    required
                  >
                    {templateTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Template Content
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 min-h-[300px]"
                  placeholder="Enter template content. Use {VARIABLE_NAME} for dynamic fields."
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use curly braces for variables: {'{EMPLOYEE_NAME}'}, {'{COMPANY_NAME}'}, etc.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white">
                  Create Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const IconComponent = getTypeIcon(template.type);
            return (
              <Card key={template.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-800 dark:text-slate-100 text-lg">{template.name}</CardTitle>
                        <Badge className={`mt-1 ${getTypeColor(template.type)}`}>
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                    {template.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span>Variables: {template.variables.length}</span>
                    <span>Updated: {template.updated_at?.split('T')[0]}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openViewDialog(template)}
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(template)}
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePdfPreview(template)}
                      className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      PDF Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">Edit Template</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(80vh-100px)] pr-1 px-6">
            <form onSubmit={(e) => { e.preventDefault(); handleEditTemplate(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Template Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                    placeholder="Enter template name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Template Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Template['type'] })}
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400"
                    required
                  >
                    {templateTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Template Content
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 min-h-[300px]"
                  placeholder="Enter template content. Use {VARIABLE_NAME} for dynamic fields."
                  required
                />
                {formData.content && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Preview</label>
                    {formData.content.trim().startsWith('<div') || formData.content.trim().startsWith('<h2') ? (
                      <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md p-3" style={{ fontFamily: 'Arial, sans-serif', color: '#222' }}
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                      />
                    ) : (
                      <pre className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-mono text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md p-3">
                        {formData.content.replace(/\\r\\n|\\n|\\r/g, '\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white">
                  Update Template
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">Template Details</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(80vh-100px)] pr-1 px-6">
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Template Name
                    </label>
                    <p className="text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md">
                      {selectedTemplate.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Template Type
                    </label>
                    <Badge className={getTypeColor(selectedTemplate.type)}>
                      {selectedTemplate.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Template Content
                  </label>
                  {selectedTemplate.content.trim().startsWith('<div') || selectedTemplate.content.trim().startsWith('<h2') ? (
                    <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md p-4 max-h-[400px] overflow-y-auto" style={{ fontFamily: 'Arial, sans-serif', color: '#222' }}
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                    />
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md p-4 max-h-[400px] overflow-y-auto">
                      <pre className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-mono text-sm">
                        {selectedTemplate.content.replace(/\\r\\n|\\n|\\r/g, '\n')}
                      </pre>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Variables ({selectedTemplate.variables.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable, index) => (
                      <Badge key={index} variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsViewDialogOpen(false)}
                    className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!pdfPreviewTemplate} onOpenChange={() => { setPdfPreviewTemplate(null); setPdfUrl(null); setPdfFormSubmitted(false); setPdfGenerating(false); setPdfError(null); setShowTextPreview(false); setProcessedContent(''); }}>
        <DialogContent className="max-w-5xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>
          <div style={{ height: '70vh' }}>
            {pdfPreviewTemplate?.type === 'Probation Review' ? (
              !pdfFormSubmitted ? (
                <form
                  className="space-y-4 max-w-lg mx-auto mt-8"
                  onSubmit={e => { e.preventDefault(); setPdfFormSubmitted(true); }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee Name</label>
                      <Input value={pdfVariables.EMPLOYEE_NAME} onChange={e => setPdfVariables(v => ({ ...v, EMPLOYEE_NAME: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Designation</label>
                      <Input value={pdfVariables.DESIGNATION} onChange={e => setPdfVariables(v => ({ ...v, DESIGNATION: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <Input value={pdfVariables.DEPARTMENT} onChange={e => setPdfVariables(v => ({ ...v, DEPARTMENT: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Joining</label>
                      <Input type="date" value={pdfVariables.JOINING_DATE} onChange={e => setPdfVariables(v => ({ ...v, JOINING_DATE: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Confirmation</label>
                      <Input type="date" value={pdfVariables.CONFIRMATION_DATE} onChange={e => setPdfVariables(v => ({ ...v, CONFIRMATION_DATE: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-amber-600 dark:bg-slate-700 text-white">Preview PDF</Button>
                  </div>
                </form>
              ) : (
                <PDFViewer width="100%" height="100%">
                  <ProbationReviewPDF variables={pdfVariables} />
                </PDFViewer>
              )
            ) : (
              // PDF generation for other template types
              showTextPreview ? (
                <div className="h-full overflow-y-auto p-4 bg-white">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      Text Preview: {pdfPreviewTemplate?.name}
                    </h3>
                    <Button
                      onClick={() => setShowTextPreview(false)}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                    >
                      Back to PDF
                    </Button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md p-4">
                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Original Content:</h4>
                      <pre className="whitespace-pre-wrap font-mono text-sm text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 p-2 rounded">
                        {pdfPreviewTemplate?.content || 'No content available'}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Processed Content (for PDF):</h4>
                      <pre className="whitespace-pre-wrap font-mono text-sm text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 p-2 rounded">
                        {processedContent || 'No processed content available'}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe src={pdfUrl} width="100%" height="100%" title="PDF Preview" />
              ) : pdfGenerating ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mb-4"></div>
                  <div className="text-center text-slate-500 dark:text-slate-400 mb-4">
                    Generating PDF preview...
                  </div>
                  <div className="text-sm text-slate-400 dark:text-slate-500 max-w-md text-center">
                    Creating PDF from template: {pdfPreviewTemplate?.name}
                  </div>
                </div>
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-red-500 dark:text-red-400 text-center mb-4">
                    ❌ {pdfError}
                  </div>
                  <div className="text-sm text-slate-400 dark:text-slate-500 max-w-md text-center mb-4">
                    Template: {pdfPreviewTemplate?.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePdfPreview(pdfPreviewTemplate!)}
                      className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={() => setShowTextPreview(true)}
                      variant="outline"
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                    >
                      Show Text Preview
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center text-slate-500 dark:text-slate-400 mb-4">
                    Click "PDF Preview" to generate preview
                  </div>
                  <div className="text-sm text-slate-400 dark:text-slate-500 max-w-md text-center mb-4">
                    Template: {pdfPreviewTemplate?.name}
                  </div>
                  <Button
                    onClick={() => setShowTextPreview(true)}
                    variant="outline"
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                  >
                    Show Text Preview
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            {searchTerm || filterType !== 'all' ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first document template to get started.'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Templates; 