import { DashboardLayout } from '@/components/DashboardLayout';
import { QuickGuide } from '@/components/QuickGuide';

export default function GuidePage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 font-mono">
                <QuickGuide />
            </div>
        </DashboardLayout>
    );
}
