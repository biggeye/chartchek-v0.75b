import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KipuEvaluation } from '@/types/kipu';
import { formatDate } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose, DialogBody
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, FilterIcon, MoreHorizontal, Search } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/fieldset';

// Define item interface for clarity
interface EvaluationItem {
  id: string;
  question: string;
  answer?: string;
}

interface EvaluationsListProps {
  evaluations: KipuEvaluation[];
  facilityId: string;
  patientId: string;
  onEdit: (evaluationId: string) => void;
  onNew: () => void;
}

export function EvaluationsList({ evaluations, facilityId, patientId, onEdit, onNew }: EvaluationsListProps) {
  const router = useRouter();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<KipuEvaluation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Filtered evaluations
  const filteredEvaluations = useMemo(() => {
    return evaluations?.filter(evaluation => {
      // Apply search filter
      const matchesSearch =
        !searchTerm ||
        evaluation.evaluation_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (evaluation.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      // Apply status filter
      const matchesStatus = !statusFilter || evaluation.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];
  }, [evaluations, searchTerm, statusFilter]);

  // Add a state for edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Add a toggle function
  const toggleEditMode = () => setIsEditMode(prev => !prev);

  const handleViewDetails = (evaluation: KipuEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'Completed': 'bg-green-100 text-green-800',
      'Draft': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-purple-100 text-purple-800',
      'Flagged': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Evaluations</h2>
        <Button onClick={onNew}>New Evaluation</Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search evaluations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 border bg-white hover:bg-gray-50">
              <FilterIcon className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Completed')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Draft')}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('In Progress')}>
              In Progress
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="p-4 text-gray-500 border rounded-md text-center">
          {searchTerm || statusFilter
            ? "No evaluations match your filters"
            : "No evaluations found for this patient"}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvaluations.map((evaluation) => {
                return (
                  <TableRow
                    key={evaluation.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(evaluation)}
                  >
                    <TableCell className="font-medium">{evaluation.evaluation_type}</TableCell>
                    <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                    <TableCell>{formatDate(evaluation.created_at)}</TableCell>
                    <TableCell>
                      {evaluation.provider_name || "System"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Button
                          className="border bg-white hover:bg-gray-50 h-8 text-sm px-3 py-1"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onEdit(evaluation.id.toString());
                          }}
                        >
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="p-1 h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Print</DropdownMenuItem>
                            <DropdownMenuItem>Export</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Enhanced Evaluation Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto evaluation-dialog">
          {/* Remove the close button by adding custom CSS */}
          <style jsx global>{`
            .evaluation-dialog [data-radix-collection-item] {
              display: none;
            }
          `}</style>

          {selectedEvaluation && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedEvaluation.evaluation_type}</DialogTitle>
                  {getStatusBadge(selectedEvaluation.status)}
                </div>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <CalendarIcon className="h-4 w-4" />
                  {formatDate(selectedEvaluation.created_at)}
                  {selectedEvaluation.provider_name && (
                    <span className="text-sm">
                      by {selectedEvaluation.provider_name}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500">Patient ID</h4>
                    <p>{selectedEvaluation.patient_id}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                    <p>{selectedEvaluation.updated_at ? formatDate(selectedEvaluation.updated_at) : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500">Evaluation ID</h4>
                    <p>{selectedEvaluation.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Clinical Notes</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {isEditMode ? 'Edit Mode' : 'View Mode'}
                    </span>
                    <Switch
                      checked={isEditMode}
                      onChange={toggleEditMode}
                      aria-label="Toggle edit mode"
                    />
                  </div>
                </div>
                
                {isEditMode ? (
                  <form className="space-y-4 w-full" onSubmit={(e) => {
                    e.preventDefault();
                    // Here you would handle saving the evaluation
                    // For now, just exit edit mode
                    setIsEditMode(false);
                  }}>
                    <textarea
                      id="notes"
                      defaultValue={selectedEvaluation.notes || ''}
                      rows={6}
                      className="bg-gray-50 p-6 rounded-md whitespace-pre-wrap border w-full min-h-[150px]"
                    />
          
                    {/* More editable fields */}
         
                    <div className="border-t p-4 flex justify-end space-x-3 mt-4">
                      <Button 
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          setIsEditMode(false);
                        }}
                        className="border bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="border bg-white hover:bg-gray-50"
                      >
                        Save
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-md whitespace-pre-wrap border min-h-[150px]">
                      {selectedEvaluation.notes || 'No notes recorded'}
                    </div>
                  </div>
                )}
                {selectedEvaluation.items && selectedEvaluation.items.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Assessment Items</h3>
                    <div className="border rounded-md divide-y">
                      {selectedEvaluation.items.map((item: EvaluationItem) => (
                        <div key={item.id} className="p-4">
                          <div className="font-medium">{item.question}</div>
                          <div className="text-gray-700 mt-1">
                            {item.answer || 'No response'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DialogBody>

              <DialogFooter className="mt-6">
                <Button
                  className="border bg-white hover:bg-gray-50 mr-2"
                  onClick={() => onEdit(selectedEvaluation.id.toString())}
                >
                  Edit Evaluation
                </Button>
                <Button
                  className="border bg-white hover:bg-gray-50"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}