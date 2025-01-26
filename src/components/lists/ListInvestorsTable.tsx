import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvestorProfile } from "@/components/InvestorProfile";
import { InvestorsTableView } from "@/components/investors/InvestorsTableView";
import { useToast } from "@/hooks/use-toast";
import type { SortConfig } from "@/types/sorting";

interface ListInvestorsTableProps {
  listId: string;
}

export function ListInvestorsTable({ listId }: ListInvestorsTableProps) {
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [selectedInvestors, setSelectedInvestors] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'limited_partner_name',
    direction: 'asc'
  });

  const { toast } = useToast();

  const { data: investorsData, isLoading } = useQuery({
    queryKey: ['listInvestors', listId, currentPage, sortConfig],
    queryFn: async () => {
      const { data: listInvestors, error: listInvestorsError, count } = await supabase
        .from('list_investors')
        .select('investor_id', { count: 'exact' })
        .eq('list_id', listId)
        .range((currentPage - 1) * 200, currentPage * 200 - 1);

      if (listInvestorsError) throw listInvestorsError;

      if (!listInvestors?.length) {
        return { data: [], count: 0 };
      }

      const investorIds = listInvestors.map(li => li.investor_id);

      const { data: investors, error: investorsError } = await supabase
        .from('limited_partners')
        .select('*')
        .in('id', investorIds)
        .order(sortConfig.column, { ascending: sortConfig.direction === 'asc' });

      if (investorsError) throw investorsError;

      return { data: investors || [], count: count || 0 };
    },
    onError: (error: any) => {
      if (error?.message?.includes('rate limit')) {
        toast({
          title: "Rate Limit Reached",
          description: "Please wait a moment before making more requests.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load investors data. Please try again later.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSort = (column: string) => {
    setSortConfig(prevConfig => ({
      column,
      direction: prevConfig.column === column && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = (investorsData?.data || []).map(investor => investor.id);
      setSelectedInvestors(allIds);
    } else {
      setSelectedInvestors([]);
    }
  };

  const handleSelectInvestor = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedInvestors(prev => [...prev, id]);
    } else {
      setSelectedInvestors(prev => prev.filter(investorId => investorId !== id));
    }
  };

  return (
    <div className="flex flex-col">
      <InvestorsTableView 
        investors={investorsData?.data ?? []}
        isLoading={isLoading}
        onViewInvestor={setSelectedInvestorId}
        currentPage={currentPage}
        totalPages={Math.ceil((investorsData?.count ?? 0) / 200)}
        onPageChange={setCurrentPage}
        sortConfig={sortConfig}
        onSort={handleSort}
        selectedInvestors={selectedInvestors}
        onSelectAll={handleSelectAll}
        onSelectInvestor={handleSelectInvestor}
      />

      {selectedInvestorId && (
        <InvestorProfile
          investorId={selectedInvestorId}
          open={selectedInvestorId !== null}
          onOpenChange={(open) => !open && setSelectedInvestorId(null)}
        />
      )}
    </div>
  );
}