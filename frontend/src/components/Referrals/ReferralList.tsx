import React from 'react';
import { useGetReferralsQuery } from '../../store/api';

const ReferralList = ({ caseId }: { caseId: string }) => {
  const { data, error, isLoading } = useGetReferralsQuery({ caseId, page: 0, size: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading referrals</div>;

  return (
    <ul>
      {data?.data?.content?.map((r: any) => (
        <li key={r.id}>{r.referredTo} - {r.status}</li>
      ))}
    </ul>
  );
};

export default ReferralList;
