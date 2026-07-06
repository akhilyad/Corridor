import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { DeploymentForm } from "../deployment-form";

export default async function NewDeploymentPage() {
  await requireRole("CLIENT");
  return (
    <div>
      <PageHeader
        title="New deployment"
        description="A deployment is the unit EPC procurement actually plans against — one crew, one project window, N lodging sites. Add sites once it's created."
      />
      <Card>
        <CardBody>
          <DeploymentForm />
        </CardBody>
      </Card>
    </div>
  );
}
