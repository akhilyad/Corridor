import { requireRole } from "@/lib/session";
import { adminUsers, adminOrgs } from "@/lib/queries";
import { humanizeEnum, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Users, Building2 } from "lucide-react";

export default async function AdminUsersPage() {
  const user = await requireRole("ADMIN", "STAFF");
  void user;
  const [users, orgs] = await Promise.all([adminUsers(), adminOrgs()]);
  const partners = orgs.filter((o) => o.type === "PARTNER");
  const clients = orgs.filter((o) => o.type === "CLIENT");

  return (
    <div>
      <PageHeader
        title="Users & organisations"
        description={`${orgs.length} orgs (${partners.length} partners, ${clients.length} clients) and ${users.length} users on the platform.`}
      />

      <Card className="mb-4">
        <CardBody className="p-0">
          <div className="border-b border-ink-100 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Building2 className="h-4 w-4 text-ink-400" />
              Organisations ({orgs.length})
            </div>
          </div>
          {orgs.length === 0 ? (
            <EmptyRow colSpan={6} message="No organisations" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Type</TH>
                  <TH>Country</TH>
                  <TH>VAT ID</TH>
                  <TH>Accreditation</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {orgs.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-medium text-ink-900">
                      {o.legalName ?? o.name}
                      {o.legalName && <div className="text-xs text-ink-500">{o.name}</div>}
                    </TD>
                    <TD>
                      <Badge tone={o.type === "PARTNER" ? "sea" : "violet"}>
                        {humanizeEnum(o.type)}
                      </Badge>
                    </TD>
                    <TD>{o.country}</TD>
                    <TD className="font-mono text-xs text-ink-500">{o.vatId ?? "—"}</TD>
                    <TD>
                      <StatusBadge status={o.accreditationStatus} />
                    </TD>
                    <TD className="text-ink-500">{fmtDate(o.createdAt)}</TD>
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
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Users className="h-4 w-4 text-ink-400" />
              Users ({users.length})
            </div>
          </div>
          {users.length === 0 ? (
            <EmptyRow colSpan={6} message="No users" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Organisation</TH>
                  <TH>Active</TH>
                  <TH>Joined</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium text-ink-900">{u.name}</TD>
                    <TD className="text-ink-700">{u.email}</TD>
                    <TD>
                      <Badge tone={u.role === "ADMIN" ? "ink" : "neutral"}>{humanizeEnum(u.role)}</Badge>
                    </TD>
                    <TD>{u.org?.name ?? "—"}</TD>
                    <TD>
                      {u.isActive ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="red">Disabled</Badge>
                      )}
                    </TD>
                    <TD className="text-ink-500">{fmtDate(u.createdAt)}</TD>
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
