"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/types";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectSite = { id: string; name: string; code: string; type: string; country: string };

type ListingDefaults = {
  title?: string;
  description?: string;
  propertyType?: string;
  country?: string;
  region?: string | null;
  city?: string | null;
  postalCode?: string | null;
  addressLine?: string | null;
  lat?: number | null;
  lng?: number | null;
  nearbyProjectId?: string | null;
  nearbyProjectName?: string | null;
  nearbyProjectType?: string | null;
  distanceToProjectKm?: number | null;
  sleepsTotal?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingType?: string;
  parkingSpaces?: number;
  parkingLoadRatingT?: number | null;
  storageClass?: string;
  storageAreaSqm?: number;
  hasFencedYard?: boolean;
  hasInsuredOutbuilding?: boolean;
  hasHeavyVehicleAccess?: boolean;
  hasLaydownYard?: boolean;
  hasThreePhasePower?: boolean;
  hasWorkshop?: boolean;
  hasLaundry?: boolean;
  hasMessRoom?: boolean;
  hasWifi?: boolean;
  hasCCTV?: boolean;
  insuranceStatus?: string;
  insuranceProvider?: string | null;
  insuranceAmountEurCents?: number | null;
  monthlyRateCents?: number;
  infraPremiumCents?: number;
  minStayMonths?: number;
  maxStayMonths?: number;
};

/**
 * Shared create/edit listing form. The same structured-infra spec drives both;
 * only the server action + the optional hidden `id` field differ. Server
 * actions are passed in as props from the server-component routes.
 */
export function ListingForm({
  action,
  projectSites,
  defaults,
  listingId,
  submitLabel,
  redirectTo,
}: {
  action: (prev: unknown, formData: FormData) => Promise<ActionResult<{ id: string }>>;
  projectSites: string;
  defaults?: string;
  listingId?: string;
  submitLabel: string;
  // Plain href, not a function — server components can't pass functions across
  // the server/client boundary. Defaults to the partner listing detail route.
  redirectTo?: string;
}) {
  const router = useRouter();
  const sites: ProjectSite[] = React.useMemo(() => {
    try {
      return JSON.parse(projectSites);
    } catch {
      return [];
    }
  }, [projectSites]);
  const d: ListingDefaults = React.useMemo(() => {
    try {
      return defaults ? JSON.parse(defaults) : {};
    } catch {
      return {};
    }
  }, [defaults]);

  const [state, formAction] = useActionState(action, null);
  React.useEffect(() => {
    if (state?.ok) router.push(redirectTo ?? `/partner/listings/${state.data.id}`);
  }, [state, router]);

  // Whole-eur cents → display number, with a create default for empty values.
  const eur = (cents?: number | null, fallback: string | number = "") =>
    typeof cents === "number" && cents ? Math.round(cents / 100) : fallback;
  // Pre-pick create-dependent checkbox defaults; on edit honour stored value.
  const defCheck = (v: boolean | undefined, createDefault: boolean) =>
    v === undefined ? createDefault : v;

  return (
    <form action={formAction} className="space-y-4">
      {listingId && <input type="hidden" name="id" value={listingId} />}

      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Title" htmlFor="title">
            <Input id="title" name="title" required defaultValue={d.title ?? ""} />
          </Field>
          <Field label="Description" htmlFor="description" hint="Min 20 chars — call out the secured-infra and proximity to the build">
            <Textarea id="description" name="description" required defaultValue={d.description ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Property type" htmlFor="propertyType">
              <Select id="propertyType" name="propertyType" defaultValue={d.propertyType ?? "FARMHOUSE"}>
                {["HOUSE","FARMHOUSE","APARTMENT_BLOCK","AGRI_BUILDING","COMMERCIAL_UNIT","MODULAR_CAMP"].map((v) => (
                  <option key={v} value={v}>{v.toLowerCase().replace(/_/g, " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="Country" htmlFor="country">
              <Select id="country" name="country" defaultValue={d.country ?? "DE"}>
                {["DE","NL","BE","FR","DK","GB","PL","ES","PT","IE","SE","FI","NO","AT","CH"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Region" htmlFor="region"><Input id="region" name="region" defaultValue={d.region ?? ""} /></Field>
            <Field label="City" htmlFor="city"><Input id="city" name="city" defaultValue={d.city ?? ""} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Postal code" htmlFor="postalCode"><Input id="postalCode" name="postalCode" defaultValue={d.postalCode ?? ""} /></Field>
            <Field label="Address" htmlFor="addressLine"><Input id="addressLine" name="addressLine" defaultValue={d.addressLine ?? ""} /></Field>
            <Field label="Latitude" htmlFor="lat"><Input id="lat" name="lat" type="number" step="0.0001" defaultValue={d.lat ?? ""} /></Field>
            <Field label="Longitude" htmlFor="lng"><Input id="lng" name="lng" type="number" step="0.0001" defaultValue={d.lng ?? ""} /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nearby project</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Project site" htmlFor="nearbyProjectId">
              <Select id="nearbyProjectId" name="nearbyProjectId" defaultValue={d.nearbyProjectId ?? ""}>
                <option value="">— none —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Or free-text project name" htmlFor="nearbyProjectName"><Input id="nearbyProjectName" name="nearbyProjectName" defaultValue={d.nearbyProjectName ?? ""} /></Field>
            <Field label="Distance to site (km)" htmlFor="distanceToProjectKm"><Input id="distanceToProjectKm" name="distanceToProjectKm" type="number" step="0.1" defaultValue={d.distanceToProjectKm ?? ""} /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Capacity</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sleeps (total)" htmlFor="sleepsTotal"><Input id="sleepsTotal" name="sleepsTotal" type="number" min={1} defaultValue={d.sleepsTotal ?? 6} required /></Field>
            <Field label="Bedrooms" htmlFor="bedrooms"><Input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={d.bedrooms ?? 3} /></Field>
            <Field label="Bathrooms" htmlFor="bathrooms"><Input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={d.bathrooms ?? 1} /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Secured infrastructure</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Parking type" htmlFor="parkingType">
              <Select id="parkingType" name="parkingType" defaultValue={d.parkingType ?? "FENCED"}>
                {["NONE","OPEN","FENCED","BARN","GRAIN_STORE","MACHINERY_SHED","LAYDOWN_YARD"].map((v) => (
                  <option key={v} value={v}>{v.toLowerCase().replace(/_/g, " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="Parking spaces" htmlFor="parkingSpaces"><Input id="parkingSpaces" name="parkingSpaces" type="number" min={0} defaultValue={d.parkingSpaces ?? 4} /></Field>
            <Field label="Axle-load rating (t)" htmlFor="parkingLoadRatingT"><Input id="parkingLoadRatingT" name="parkingLoadRatingT" type="number" step="0.5" defaultValue={d.parkingLoadRatingT ?? ""} /></Field>
            <Field label="Storage class" htmlFor="storageClass">
              <Select id="storageClass" name="storageClass" defaultValue={d.storageClass ?? "SECURE"}>
                {["NONE","BASIC","SECURE","INSURED_SECURE"].map((v) => (
                  <option key={v} value={v}>{v.toLowerCase().replace(/_/g, " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="Storage area (m²)" htmlFor="storageAreaSqm"><Input id="storageAreaSqm" name="storageAreaSqm" type="number" min={0} defaultValue={d.storageAreaSqm ?? 0} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Checkbox label="Fenced yard" name="hasFencedYard" defaultChecked={defCheck(d.hasFencedYard, true)} />
            <Checkbox label="Insured outbuilding" name="hasInsuredOutbuilding" defaultChecked={defCheck(d.hasInsuredOutbuilding, false)} />
            <Checkbox label="Heavy-vehicle access" name="hasHeavyVehicleAccess" defaultChecked={defCheck(d.hasHeavyVehicleAccess, true)} />
            <Checkbox label="Laydown yard" name="hasLaydownYard" defaultChecked={defCheck(d.hasLaydownYard, false)} />
            <Checkbox label="Three-phase power" name="hasThreePhasePower" defaultChecked={defCheck(d.hasThreePhasePower, false)} />
            <Checkbox label="Workshop" name="hasWorkshop" defaultChecked={defCheck(d.hasWorkshop, false)} />
            <Checkbox label="Laundry" name="hasLaundry" defaultChecked={defCheck(d.hasLaundry, false)} />
            <Checkbox label="Mess room" name="hasMessRoom" defaultChecked={defCheck(d.hasMessRoom, false)} />
            <Checkbox label="Wi-Fi" name="hasWifi" defaultChecked={defCheck(d.hasWifi, true)} />
            <Checkbox label="CCTV" name="hasCCTV" defaultChecked={defCheck(d.hasCCTV, false)} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Insurance posture</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Insurance status" htmlFor="insuranceStatus">
              <Select id="insuranceStatus" name="insuranceStatus" defaultValue={d.insuranceStatus ?? "INSURED"}>
                {["NONE","SELF_INSURED","INSURED"].map((v) => (
                  <option key={v} value={v}>{v.toLowerCase().replace(/_/g, " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="Insurance provider" htmlFor="insuranceProvider"><Input id="insuranceProvider" name="insuranceProvider" defaultValue={d.insuranceProvider ?? ""} /></Field>
            <Field label="Insurance amount (€)" htmlFor="insuranceAmountEurCents" hint="Whole euros">
              <Input id="insuranceAmountEurCents" name="insuranceAmountEurCents" type="number" min={0} defaultValue={eur(d.insuranceAmountEurCents)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing & stay</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Monthly rate (€/unit)" htmlFor="monthlyRateCents" hint="Whole euros, ex-VAT">
              <Input id="monthlyRateCents" name="monthlyRateCents" type="number" min={0} defaultValue={eur(d.monthlyRateCents, 2200)} required />
            </Field>
            <Field label="Infra premium (€/mo)" htmlFor="infraPremiumCents">
              <Input id="infraPremiumCents" name="infraPremiumCents" type="number" min={0} defaultValue={eur(d.infraPremiumCents, 800)} />
            </Field>
            <Field label="Min stay (months)" htmlFor="minStayMonths"><Input id="minStayMonths" name="minStayMonths" type="number" min={1} defaultValue={d.minStayMonths ?? 2} /></Field>
            <Field label="Max stay (months)" htmlFor="maxStayMonths"><Input id="maxStayMonths" name="maxStayMonths" type="number" min={1} defaultValue={d.maxStayMonths ?? 18} /></Field>
          </div>
        </CardBody>
      </Card>

      <FormError state={state} />
      <div className="flex justify-end gap-2">
        <SubmitButton size="lg">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
