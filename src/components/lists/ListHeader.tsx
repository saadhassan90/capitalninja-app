import { RefreshListButton } from "./RefreshListButton";
import { BulkActions } from "@/components/investors/BulkActions";

interface ListHeaderProps {
  selectedInvestors: number[];
  totalInvestors: number;
  listId: string;
  onClearSelection: () => void;
  onRefresh: () => Promise<void>;
}

export function ListHeader({ 
  selectedInvestors, 
  totalInvestors, 
  listId,
  onClearSelection,
  onRefresh
}: ListHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        {selectedInvestors.length > 0 ? (
          <BulkActions
            selectedCount={selectedInvestors.length}
            selectedInvestors={selectedInvestors}
            onClearSelection={onClearSelection}
            listId={listId}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            Total Investors: {totalInvestors}
          </div>
        )}
      </div>
      <RefreshListButton onRefresh={onRefresh} />
    </div>
  );
}