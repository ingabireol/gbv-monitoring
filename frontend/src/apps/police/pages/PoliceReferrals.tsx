import DbReferralWorkspace from "@/components/referrals/DbReferralWorkspace";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";

const PoliceReferrals = () => (
  <DbReferralWorkspace
    sidebar={<PoliceSidebar />}
    title="Referrals"
    description="Track and manage referrals sent to partner institutions."
    mode="creator"
    createRole="POLICE"
    caseSource="assigned"
  />
);

export default PoliceReferrals;
