import { requireRole } from "@/lib/session";
import { projectSitesAll } from "@/lib/queries";
import { createListingAction } from "@/server/actions/listings";
import { PageHeader } from "@/components/ui/empty";
import { ListingForm } from "@/components/listing-form";

export default async function NewListingPage() {
  await requireRole("PARTNER");
  const sites = await projectSitesAll();
  const projectSites = JSON.stringify(sites.map((s) => ({ id: s.id, name: s.name, code: s.code, type: s.type, country: s.country })));

  return (
    <div>
      <PageHeader
        title="New listing"
        description="Capture the structured infrastructure spec — that's what procurement filters on. Saved as a draft until you submit for review."
      />
      <ListingForm
        action={createListingAction}
        projectSites={projectSites}
        submitLabel="Save draft"
      />
    </div>
  );
}
