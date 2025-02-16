import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Edit, Download, ArrowLeft } from "lucide-react";
import type { RaiseProject } from "../types";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateMemoPDF } from "../utils/pdfUtils";

interface MemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: RaiseProject;
}

export function MemoDialog({
  open,
  onOpenChange,
  project,
}: MemoDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMemo, setEditedMemo] = useState(project.memo || '');
  const [showRenderedView, setShowRenderedView] = useState(false);

  const handleGenerateMemo = async () => {
    toast.error("Deal memo generation is currently disabled");
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('raises')
        .update({ memo: editedMemo })
        .eq('id', project.id);

      if (error) throw error;

      setIsEditing(false);
      setShowRenderedView(true);
      toast.success('Memo updated successfully');
    } catch (error: any) {
      console.error('Error updating memo:', error);
      toast.error(error.message || 'Failed to update memo');
    }
  };

  const handleDownloadPDF = () => {
    const memoElement = document.getElementById('memo-content');
    if (memoElement) {
      generateMemoPDF(memoElement, project.name);
    }
  };

  const handleBack = () => {
    setShowRenderedView(false);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deal Memo - {project.name}</DialogTitle>
        </DialogHeader>

        {!project.memo && !editedMemo ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Deal Memo Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Deal memo generation is currently disabled. Please check back later.
            </p>
            <Button 
              onClick={handleGenerateMemo} 
              disabled={true}
            >
              Generate Deal Memo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between gap-2">
              {showRenderedView ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Memo
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowRenderedView(true)}>
                        View Memo
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              {isEditing ? (
                <textarea
                  className="w-full h-full min-h-[400px] p-2 rounded border"
                  value={editedMemo}
                  onChange={(e) => setEditedMemo(e.target.value)}
                />
              ) : (
                <div id="memo-content" className="prose prose-sm max-w-none">
                  {editedMemo || project.memo}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}