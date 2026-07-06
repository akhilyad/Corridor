import { requireRole } from "@/lib/session";
import { adminDocsAll } from "@/lib/queries";
import { humanizeEnum, fmtBytes, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { VerifyDocForm, RejectDocForm } from "./doc-actions";

export default async function AdminDocsPage() {
  const user = await requireRole("ADMIN", "STAFF");
  void user;
  const docs = await adminDocsAll();
  const pending = docs.filter((d) => d.status === "PENDING");
  const reviewed = docs.filter((d) => d.status !== "PENDING");

  return (
    <div>
      <PageHeader
        title="Document review"
        description="The compliance vault — every uploaded document across partners, clients and listings. Verify PENDING docs to unblock accreditation cycles; reject with a reason so the partner can re-upload."
      />

      <Card className="mb-4">
        <CardBody className="p-0">
          <div className="border-b border-ink-100 px-5 py-3">
            <div className="text-sm font-semibold text-ink-900">Verification queue</div>
            <div className="text-xs text-ink-500">{pending.length} document(s) pending review</div>
          </div>
          {pending.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-ink-400">
              <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
              Queue is clear — nothing pending.
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Document</TH>
                  <TH>Scope</TH>
                  <TH>File</TH>
                  <TH>Submitted</TH>
                  <TH>Verify / reject</TH>
                </TR>
              </THead>
              <TBody>
                {pending.map((d) => (
                  <TR key={d.id}>
                    <TD>
                      <div className="font-medium text-ink-900">{d.title}</div>
                      <Badge tone="neutral" className="mt-1">
                        {humanizeEnum(d.category)}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="text-ink-800">{d.org?.name ?? "—"}</div>
                      <div className="text-xs text-ink-500">{humanizeEnum(d.ownerType)}</div>
                    </TD>
                    <TD>
                      <div className="max-w-[12rem] truncate text-ink-800" title={d.fileName}>
                        {d.fileName}
                      </div>
                      <div className="text-xs text-ink-500">
                        {d.mimeType} · {fmtBytes(d.sizeBytes)}
                      </div>
                    </TD>
                    <TD className="text-ink-500">{fmtDate(d.createdAt)}</TD>
                    <TD>
                      <div className="flex flex-col gap-2">
                        <VerifyDocForm id={d.id} />
                        <RejectDocForm id={d.id} />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <div className="border-b border-ink-100 px-5 py-3">
            <div className="text-sm font-semibold text-ink-900">All documents ({reviewed.length})</div>
            <div className="text-xs text-ink-500">Already verified, expiring, expired or rejected</div>
          </div>
          {reviewed.length === 0 ? (
            <EmptyRow colSpan={6} message="No reviewed documents yet" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Document</TH>
                  <TH>Scope</TH>
                  <TH>Expires</TH>
                  <TH>Status</TH>
                  <TH>Verified by</TH>
                  <TH>Notes</TH>
                </TR>
              </THead>
              <TBody>
                {reviewed.map((d) => (
                  <TR key={d.id}>
                    <TD>
                      <div className="font-medium text-ink-900">{d.title}</div>
                      <Badge tone="neutral" className="mt-1">
                        {humanizeEnum(d.category)}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="text-ink-800">{d.org?.name ?? "—"}</div>
                      <div className="text-xs text-ink-500">{humanizeEnum(d.ownerType)}</div>
                    </TD>
                    <TD className="text-ink-500">{fmtDate(d.expiresAt)}</TD>
                    <TD>
                      <Badge tone={toneFor(d.status)}>{prettyStatus(d.status)}</Badge>
                    </TD>
                    <TD>
                      <div className="text-ink-800">{d.verifiedBy?.name ?? "—"}</div>
                      <div className="text-xs text-ink-500">{fmtDate(d.verifiedAt)}</div>
                    </TD>
                    <TD className="max-w-[16rem] text-ink-500">
                      <span className="line-clamp-2">{d.notes ?? "—"}</span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function toneFor(s: string): "green" | "amber" | "red" | "neutral" {
  if (s === "VERIFIED") return "green";
  if (s === "PENDING" || s === "EXPIRING_SOON") return "amber";
  if (s === "EXPIRED" || s === "REJECTED") return "red";
  return "neutral";
}

function prettyStatus(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
