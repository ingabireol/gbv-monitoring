import DbReferralWorkspace from "@/components/referrals/DbReferralWorkspace";
import { PartnerSidebar } from "@/apps/partner/components/PartnerSidebar";

const PartnerReferrals = () => (
  <DbReferralWorkspace
    sidebar={<PartnerSidebar />}
    title="Referrals"
    description="Review and manage referrals sent to your institution."
    mode="institution"
  />
);

export default PartnerReferrals;
