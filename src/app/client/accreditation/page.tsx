import { requireRole } from "@/lib/session";
import { clientAccreditations } from "@/lib/queries";
import { humanizeEnum, fmtDate, jparse } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-ink-800">{value}</div>
    </div>
  );
}

export default async function ClientAccreditationPage() {
  const user = await requireRole("CLIENT");
  const accs = await clientAccreditations(user);

  return (
    <div>
      <PageHeader
        title="Approved vendors"
        description="Your approved-supplier cycles for housing vendors — Corridor compliance drives each cycle to APPROVED so the vendor can bid on your deployments."
      />
      {accs.length === 0 ? (
        <EmptyState
          icon={<BadgeCheck className="h-8 w-8" />}
          title="No vendor cycles yet"
          description="When Corridor compliance opens an approved-supplier cycle between you and a housing vendor, it'll appear here — Corridor staff manage the lifecycle; you track progress."
        />
      ) : (
        <div className="space-y-3">
          {accs.map((a) => {
            const required = jparse<string[]>(a.requiredDocCategories, []);
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{a.partnerOrg.name}</CardTitle>
                      <CardDescription>Approved-supplier cycle</CardDescription>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </CardHeader>
                <CardBody className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                    <Meta label="Cycle started" value={fmtDate(a.cycleStartedAt)} />
                    <Meta label="Target" value={fmtDate(a.targetCompletionAt)} />
                    <Meta label="Expected" value={`${a.expectedDurationDays ?? 270} days`} />
                    <Meta label="Completed" value={fmtDate(a.completedAt)} />
                  </div>
                  {required.length > 0 && (
                    <div>
                      <div className="text-xs text-ink-400">Required vault categories</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {required.map((c) => (
                          <Badge key={c} tone="neutral">
                            {humanizeEnum(c)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {a.notes && <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{a.notes}</p>}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
