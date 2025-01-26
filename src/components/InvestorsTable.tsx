import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { InvestorProfile } from "./InvestorProfile";
import { InvestorsSearch } from "./investors/InvestorsSearch";
import { InvestorsTableView } from "./investors/InvestorsTableView";

type LimitedPartner = {
  id: number;
  limited_partner_name: string;
  limited_partner_type: string | null;
  aum: number | null;
  hqlocation: string | null;
  preferred_fund_type: string | null;
  primary_contact: string | null;
  primary_contact_title: string | null;
};

const INVESTORS_PER_PAGE = 200;

async function fetchInvestors(searchTerm: string, type: string | null, location: string | null, page: number) {
  const start = (page - 1) * INVESTORS_PER_PAGE;
  
  let query = supabase
    .from('limited_partners')
    .select('id, limited_partner_name, limited_partner_type, aum, hqlocation, preferred_fund_type, primary_contact, primary_contact_title, count:id', { count: 'exact' })
    .order('limited_partner_name')
    .range(start, start + INVESTORS_PER_PAGE - 1);

  if (searchTerm) {
    query = query.ilike('limited_partner_name', `%${searchTerm}%`);
  }

  if (type) {
    query = query.eq('limited_partner_type', type);
  }

  if (location) {
    // Handle different location filters
    if (location === 'US') {
      query = query.ilike('hqlocation', '%United States%');
    } else if (location === 'MENA') {
      query = query.or('hqlocation.ilike.%Middle East%,hqlocation.ilike.%North Africa%');
    } else {
      query = query.ilike('hqlocation', `%${location}%`);
    }
  }

  const { data, error, count } = await query;
  
  if (error) {
    throw error;
  }
  
  return { data, count };
}

export function InvestorsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: investorsData, isLoading, error } = useQuery({
    queryKey: ['investors', searchTerm, selectedType, selectedLocation, currentPage],
    queryFn: () => fetchInvestors(searchTerm, selectedType, selectedLocation, currentPage),
  });

  const investors = investorsData?.data ?? [];
  const totalInvestors = investorsData?.count ?? 0;
  const totalPages = Math.ceil(totalInvestors / INVESTORS_PER_PAGE);

  const handleFilterChange = (type: string | null, location: string | null) => {
    if (type !== null) setSelectedType(type || null);
    if (location !== null) setSelectedLocation(location || null);
    setCurrentPage(1);
  };

  if (error) {
    return <div>Error loading investors</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <InvestorsSearch 
        value={searchTerm}
        onChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onFilterChange={handleFilterChange}
      />
      
      <InvestorsTableView 
        investors={investors}
        isLoading={isLoading}
        onViewInvestor={setSelectedInvestorId}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
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