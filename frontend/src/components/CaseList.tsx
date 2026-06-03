import React from 'react';
import { useGetCasesQuery } from '../store/api';

const CaseList = () => {
  const { data, error, isLoading } = useGetCasesQuery({ page: 0, size: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading cases</div>;

  return (
    <ul>
      {data?.data?.content?.map((c: any) => (
        <li key={c.id}>{c.caseId} - {c.status}</li>
      ))}
    </ul>
  );
};

export default CaseList;
