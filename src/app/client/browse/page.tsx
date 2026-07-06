import Link from "next/link";
import { requireRole } from "@/lib/session";
import { browseListings, type BrowseFilter } from "@/lib/queries";
import { humanizeEnum, fmtEur, fmtKm } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

const COUNTRIES = ["DE", "NL", "BE", "FR", "DK", "GB", "PL", "ES", "PT", "IE", "SE", "FI", "NO", "AT", "CH"];
const PROJECT_TYPES = ["WIND_OFFSHORE", "WIND_ONSHORE", "SOLAR", "DATACENTER", "SUBSTATION", "HYDRO", "H2", "GRID", "MIXED"];
const PARKING_TYPES = ["OPEN", "FENCED", "BARN", "GRAIN_STORE", "MACHINERY_SHED", "LAYDOWN_YARD"];
const STORAGE_CLASSES = ["BASIC", "SECURE", "INSURED_SECURE"];

type Params = Record<string, string | string[] | undefined>;

function one(p: Params, k: string): string | undefined {
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
}
function many(p: Params, k: string): string[] {
  const v = p[k];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function flag(p: Params, k: string): boolean {
  return one(p, k) === "1";
}

function Toggle({ label, name, value = "1", checked }: { label: string; name: string; value?: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-ink-700 cursor-pointer select-none">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 rounded border-ink-300 text-weld-500 focus-ring" />
      {label}
    </label>
  );
}

export default async function ClientBrowsePage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireRole("CLIENT");
  const params = await searchParams;

  const filter: BrowseFilter = {
    q: one(params, "q") || undefined,
    country: one(params, "country") || undefined,
    projectType: one(params, "projectType") || undefined,
    sleepsMin: one(params, "sleepsMin") ? Number(one(params, "sleepsMin")) : undefined,
    parkingTypes: many(params, "parkingTypes").length ? many(params, "parkingTypes") : undefined,
    storageClasses: many(params, "storageClasses").length ? many(params, "storageClasses") : undefined,
    fencedYardOnly: flag(params, "fencedYardOnly"),
    laydownOnly: flag(params, "laydownOnly"),
    heavyVehicleOnly: flag(params, "heavyVehicleOnly"),
    wifiOnly: flag(params, "wifiOnly"),
    maxRateCents: one(params, "maxRateEur") ? Math.round(Number(one(params, "maxRateEur")) * 100) : undefined,
    sort: (one(params, "sort") as BrowseFilter["sort"]) || undefined,
  };

  const listings = await browseListings(filter);
  const activeCount = Object.values(filter).filter((v) => v !== undefined && v !== false && v !== "" && !(Array.isArray(v) && v.length === 0)).length;

  return (
    <div>
      <PageHeader
        title="Browse listings"
        description="Filter the live marketplace by secured-infrastructure criteria — that's what EPC procurement actually matches on."
      />

      <Card>
        <CardBody>
          <form method="get" action="/client/browse" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Search" htmlFor="q">
                <Input id="q" name="q" defaultValue={one(params, "q")} placeholder="title, city, project" />
              </Field>
              <Field label="Country" htmlFor="country">
                <Select id="country" name="country" defaultValue={one(params, "country") ?? ""}>
                  <option value="">Any</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Project type" htmlFor="projectType">
                <Select id="projectType" name="projectType" defaultValue={one(params, "projectType") ?? ""}>
                  <option value="">Any</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{humanizeEnum(t)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Min sleeps" htmlFor="sleepsMin">
                <Input id="sleepsMin" name="sleepsMin" type="number" min={1} defaultValue={one(params, "sleepsMin")} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Max rate (€/mo)" htmlFor="maxRateEur">
                <Input id="maxRateEur" name="maxRateEur" type="number" min={0} step={50} defaultValue={one(params, "maxRateEur")} />
              </Field>
              <Field label="Sort by" htmlFor="sort">
                <Select id="sort" name="sort" defaultValue={one(params, "sort") ?? "distance"}>
                  <option value="distance">Distance to project</option>
                  <option value="price">Price (low to high)</option>
                  <option value="capacity">Capacity (sleeps)</option>
                </Select>
              </Field>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <Toggle label="Fenced yard" name="fencedYardOnly" checked={flag(params, "fencedYardOnly")} />
                <Toggle label="HGV access" name="heavyVehicleOnly" checked={flag(params, "heavyVehicleOnly")} />
                <Toggle label="Laydown yard" name="laydownOnly" checked={flag(params, "laydownOnly")} />
                <Toggle label="Wi-Fi" name="wifiOnly" checked={flag(params, "wifiOnly")} />
              </div>
              <div className="flex items-end justify-end">
                <Button type="submit" size="sm">
                  <Search className="h-3.5 w-3.5" /> Apply filters
                </Button>
              </div>
            </div>

            <details className="rounded-lg border border-ink-100 bg-ink-50/40 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-ink-700">Secured-infra refinements</summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs text-ink-500">Parking type</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {PARKING_TYPES.map((p) => (
                      <Toggle key={p} label={humanizeEnum(p)} name="parkingTypes" value={p} checked={many(params, "parkingTypes").includes(p)} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-ink-500">Storage class</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {STORAGE_CLASSES.map((s) => (
                      <Toggle key={s} label={humanizeEnum(s)} name="storageClasses" value={s} checked={many(params, "storageClasses").includes(s)} />
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </form>
        </CardBody>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {listings.length === 0
            ? "No listings match."
            : `${listings.length} live listing${listings.length === 1 ? "" : "s"}${activeCount ? " · filtered" : ""}`}
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="No matches"
          description="Try widening the filters — clear the max rate or project type, or remove a secured-infra refinement."
        />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <Card key={l.id} className="flex flex-col">
              <CardBody className="flex flex-1 flex-col">
                <Link href={`/client/browse/${l.id}`} className="font-medium text-ink-900 hover:text-weld-700">
                  {l.title}
                </Link>
                <div className="text-sm text-ink-500">
                  {l.city || l.region || l.country}
                  {l.org?.name ? ` · hosted by ${l.org.name}` : ""}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">Sleeps {l.sleepsTotal}</Badge>
                  {l.parkingType !== "NONE" && <Badge tone="sea">{humanizeEnum(l.parkingType)}</Badge>}
                  {l.hasFencedYard && <Badge tone="sea">Fenced</Badge>}
                  {l.hasHeavyVehicleAccess && <Badge tone="sea">HGV access</Badge>}
                  {l.hasLaydownYard && <Badge tone="sea">Laydown</Badge>}
                  {l.storageClass !== "NONE" && <Badge tone="violet">{humanizeEnum(l.storageClass)}</Badge>}
                  {l.hasThreePhasePower && <Badge tone="neutral">3-phase</Badge>}
                  {l.hasWifi && <Badge tone="neutral">Wi-Fi</Badge>}
                  {l.hasCCTV && <Badge tone="neutral">CCTV</Badge>}
                </div>

                <div className="mt-auto flex items-end justify-between pt-3">
                  <div>
                    <div className="text-lg font-semibold text-ink-900">
                      {fmtEur(l.monthlyRateCents)}
                      <span className="text-sm font-normal text-ink-400">/mo</span>
                    </div>
                    {l.infraPremiumCents > 0 && <div className="text-xs text-ink-400">+{fmtEur(l.infraPremiumCents)} infra</div>}
                  </div>
                  {l.distanceToProjectKm != null && (
                    <div className="text-right text-xs text-ink-400">
                      {fmtKm(l.distanceToProjectKm)} to
                      <br />
                      {l.nearbyProject?.name ?? l.nearbyProjectName ?? "project"}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
