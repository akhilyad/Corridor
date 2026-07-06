import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { projectSitesAll } from "@/lib/queries";
import { updateListingAction } from "@/server/actions/listings";
import { PageHeader } from "@/components/ui/empty";
import { ListingForm } from "@/components/listing-form";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("PARTNER");
  const { id } = await params;
  const listing = await prisma.listing.findFirst({ where: { id, orgId: user.orgId! } });
  if (!listing) notFound();

  const sites = await projectSitesAll();
  const projectSites = JSON.stringify(sites.map((s) => ({ id: s.id, name: s.name, code: s.code, type: s.type, country: s.country })));
  // Booleans/numbers/strings round-trip fine; extra keys (id, dates) ignored.
  const defaults = JSON.stringify(listing);

  return (
    <div>
      <PageHeader
        title="Edit listing"
        description={listing.title}
      />
      <ListingForm
        action={updateListingAction}
        projectSites={projectSites}
        defaults={defaults}
        listingId={listing.id}
        submitLabel="Save changes"
        redirectTo={`/partner/listings/${listing.id}`}
      />
    </div>
  );
}
