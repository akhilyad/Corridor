import { requireRole } from "@/lib/session";
import { partnerDocs, partnerListings } from "@/lib/queries";
import { humanizeEnum, fmtDate, fmtBytes } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { DocUploadForm } from "./upload-form";

const STATUS_ORDER = ["VERIFIED", "EXPIRING_SOON", "PENDING", "EXPIRED", "REJECTED"];

export default async function PartnerDocsPage() {
  const user = await requireRole("PARTNER");
  const [docs, listings] = await Promise.all([partnerDocs(user), partnerListings(user)]);

  const listingMap = new Map(listings.map((l) => [l.id, l.title]));
  const counts: Record<string, number> = {};
  for (const d of docs) counts[d.status] = (counts[d.status] ?? 0) + 1;

  return (
    <div>
      <PageHeader
        title="Compliance vault"
        description="Upload insurance, safety and certification evidence. Corridor compliance staff verify each file; verified docs unlock accreditation cycles and live listings."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload a document</CardTitle>
          </CardHeader>
          <CardBody>
            <DocUploadForm
              orgId={user.orgId!}
              listings={JSON.stringify(listings.map((l) => ({ id: l.id, title: l.title })))}
              maxBytesLabel="10 MiB"
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vault summary</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2.5 text-sm">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge status={s} />
                <span className="font-medium text-ink-900 tabular">{counts[s] ?? 0}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Category</TH>
              <TH>Title</TH>
              <TH>Scope</TH>
              <TH>Issued / expires</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {docs.length === 0 ? (
              <EmptyRow colSpan={5} message="No documents uploaded yet." />
            ) : (
              docs.map((d) => (
                <TR key={d.id}>
                  <TD>
                    <span className="font-medium text-ink-900">{humanizeEnum(d.category)}</span>
                  </TD>
                  <TD>
                    <div className="text-ink-800">{d.title}</div>
                    <div className="text-xs text-ink-400">
                      {d.fileName} · {fmtBytes(d.sizeBytes)}
                    </div>
                  </TD>
                  <TD>
                    {d.ownerType === "LISTING" ? (
                      <span className="text-xs text-ink-600">Listing: {listingMap.get(d.ownerId) ?? d.ownerId.slice(-8)}</span>
                    ) : (
                      <span className="text-xs text-ink-600">Organisation-wide</span>
                    )}
                  </TD>
                  <TD>
                    <div className="text-ink-700">Issued {fmtDate(d.issuedAt)}</div>
                    <div className={d.status === "EXPIRING_SOON" ? "text-xs text-weld-700" : "text-xs text-ink-400"}>
                      Expires {fmtDate(d.expiresAt)}
                    </div>
                  </TD>
                  <TD>
                    <StatusBadge status={d.status} />
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
