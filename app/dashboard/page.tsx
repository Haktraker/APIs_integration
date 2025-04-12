import DashboardLayout from "../dashboard-layout";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <h3 className="text-lg font-medium">Security Scans</h3>
    <p className="text-2xl font-bold">24</p>
  </div>
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <h3 className="text-lg font-medium">Vulnerabilities</h3>
    <p className="text-2xl font-bold">5</p>
  </div>
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <h3 className="text-lg font-medium">Critical Issues</h3>
    <p className="text-2xl font-bold">2</p>
  </div>
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <h3 className="text-lg font-medium">Assets Monitored</h3>
    <p className="text-2xl font-bold">15</p>
  </div>
</div>
<div className="mt-8 grid gap-8 md:grid-cols-2">
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <h3 className="mb-4 text-lg font-medium">Recent Activity</h3>
    <div className="space-y-4">
      <div className="border-l-2 pl-4">
        <p className="text-sm">Port scan completed</p>
        <p className="text-xs text-muted-foreground">2 minutes ago</p>
      </div>
      <div className="border-l-2 pl-4">
        <p className="text-sm">Vulnerability scan started</p>
        <p className="text-xs text-muted-foreground">10 minutes ago</p>
      </div>
    </div>
  </div>
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <h3 className="mb-4 text-lg font-medium">Quick Actions</h3>
    <div className="grid grid-cols-2 gap-4">
      <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        New Scan
      </button>
      <button className="rounded-md bg-secondary px-4 py-2 text-sm text-secondary-foreground">
        View Reports
      </button>
    </div>
  </div>
</div>
        </DashboardLayout>
    )
}
