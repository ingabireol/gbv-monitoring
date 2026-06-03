import DbReferralWorkspace from "@/components/referrals/DbReferralWorkspace";
import { SocialWorkerSidebar } from "@/apps/socialworker/components/SocialWorkerSidebar";

const SocialWorkerReferrals = () => (
  <DbReferralWorkspace
    sidebar={<SocialWorkerSidebar />}
    title="Referrals"
    description="Track and manage referrals sent to partner institutions."
    mode="creator"
    createRole="SOCIAL_WORKER"
  />
);

export default SocialWorkerReferrals;
