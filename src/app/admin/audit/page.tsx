import { requireRole } from "@/lib/session";
import { adminAudit } from "@/lib/queries";
import { fmtDateTime, jparse } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

export default async function AdminAuditPage() {
  const user = await requireRole("ADMIN", "STAFF");
  void user;
  const events = await adminAudit(300);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Append-only trail of every mutation on the platform — listings, docs, bookings, invoices, accreditations, take-rate changes. Last 300 events."
      />
      {events.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-8 w-8" />} title="No audit events yet" description="Mutations will appear here as users act on the platform." />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-ink-100">
              {events.map((e) => {
                const meta = jparse<Record<string, unknown>>(e.meta, {});
                const metaKeys = Object.keys(meta);
                return (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-28 shrink-0 text-xs text-ink-400">{fmtDateTime(e.createdAt)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-medium text-ink-900">{e.action}</span>
                        <Badge tone="neutral">{e.entityType}</Badge>
                        {e.entityId && (
                          <span className="font-mono text-xs text-ink-400">#{e.entityId.slice(-8)}</span>
                        )}
                        {e.user && <span className="text-xs text-ink-500">· {e.user.name}</span>}
                      </div>
                      {metaKeys.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-500">
                          {metaKeys.slice(0, 6).map((k) => (
                            <span key={k}>
                              <span className="text-ink-400">{k}:</span> {renderVal(meta[k])}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function renderVal(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
