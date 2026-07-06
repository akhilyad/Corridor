import { requireRole } from "@/lib/session";
import { adminAccreditations, adminOrgs } from "@/lib/queries";
import { humanizeEnum, fmtDate, jparse } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";
import { CreateAccreditationForm, ChangeAccreditationStatusForm } from "./accreditation-actions";

export default async function AdminAccreditationPage() {
  const user = await requireRole("ADMIN", "STAFF");
  void user;
  const [accs, orgs] = await Promise.all([adminAccreditations(), adminOrgs()]);
  const clients = orgs.filter((o) => o.type === "CLIENT").map((o) => ({ id: o.id, name: o.name }));
  const partners = orgs.filter((o) => o.type === "PARTNER").map((o) => ({ id: o.id, name: o.name }));

  return (
    <div>
      <PageHeader
        title="Accreditations"
        description="The approved-supplier cycle — the moat. Open a cycle between a client and a partner, then drive it IN_REVIEW → CONDITIONAL → APPROVED so the partner can bid on that client's deployments."
      />

      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle>Open a new cycle</CardTitle>
            <CardDescription>Pick a client (EPC firm / hyperscaler) and a partner (housing vendor) to start a 6–12 month approved-supplier cycle.</CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          {clients.length === 0 || partners.length === 0 ? (
            <p className="text-sm text-ink-500">
              Need at least one client and one partner org to open a cycle. Seed data should include both.
            </p>
          ) : (
            <CreateAccreditationForm clients={clients} partners={partners} />
          )}
        </CardBody>
      </Card>

      {accs.length === 0 ? (
        <EmptyState icon={<BadgeCheck className="h-8 w-8" />} title="No accreditation cycles yet" description="Open one above." />
      ) : (
        <div className="space-y-3">
          {accs.map((a) => {
            const required = jparse<string[]>(a.requiredDocCategories, []);
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {a.partnerOrg.name}
                        <span className="text-ink-400"> → </span>
                        {a.clientOrg.name}
                      </CardTitle>
                      <CardDescription>
                        Approved-supplier cycle{a.reviewer ? ` · reviewer ${a.reviewer.name}` : ""}
                      </CardDescription>
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
                  <div className="border-t border-ink-100 pt-3">
                    <ChangeAccreditationStatusForm id={a.id} current={a.status} />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-ink-800">{value}</div>
    </div>
  );
}
