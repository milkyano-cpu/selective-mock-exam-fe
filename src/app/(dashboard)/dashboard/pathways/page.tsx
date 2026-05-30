'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { TutorPathwayView } from '@/features/pathways/components/TutorPathwayView';
import { StudentPathwayView } from '@/features/pathways/components/StudentPathwayView';
import { ParentPlanView } from '@/features/pathway-plans/components/ParentPlanView';
import { FeaturePaywall } from '@/components/billing/FeaturePaywall';
import { hasPremiumAccess } from '@/features/membership/access';

export default function PathwaysPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'TUTOR' || user?.role === 'ADMIN') {
    return <TutorPathwayView />;
  }

  if (user?.role === 'PARENT') {
    return <ParentPlanView />;
  }

  if (user?.role === 'STUDENT' && !hasPremiumAccess(user)) {
    return (
      <FeaturePaywall
        title="Pathways are for Premium students"
        description="Available on Premium. Ask your parent to upgrade your plan to unlock tutor-assigned learning pathways, node progress, and pathway practice."
      />
    );
  }

  return <StudentPathwayView />;
}
