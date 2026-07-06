-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "orgId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'PARTNER',
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "country" TEXT NOT NULL DEFAULT 'DE',
    "vatId" TEXT,
    "contactEmail" TEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "website" TEXT,
    "addressLine" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "region" TEXT,
    "accreditationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "accreditationStartedAt" DATETIME,
    "accreditationExpectedDays" INTEGER,
    "accreditationCompletedAt" DATETIME,
    "takeRateOverrideBps" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectSite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "capacityMw" INTEGER,
    "ownerOrDeveloper" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'DE',
    "region" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "addressLine" TEXT,
    "lat" REAL,
    "lng" REAL,
    "nearbyProjectType" TEXT,
    "nearbyProjectId" TEXT,
    "nearbyProjectName" TEXT,
    "distanceToProjectKm" REAL,
    "sleepsTotal" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parkingType" TEXT NOT NULL DEFAULT 'NONE',
    "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
    "parkingLoadRatingT" REAL,
    "storageClass" TEXT NOT NULL DEFAULT 'NONE',
    "storageAreaSqm" INTEGER NOT NULL DEFAULT 0,
    "hasFencedYard" BOOLEAN NOT NULL DEFAULT false,
    "hasInsuredOutbuilding" BOOLEAN NOT NULL DEFAULT false,
    "hasHeavyVehicleAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasLaydownYard" BOOLEAN NOT NULL DEFAULT false,
    "hasThreePhasePower" BOOLEAN NOT NULL DEFAULT false,
    "hasWorkshop" BOOLEAN NOT NULL DEFAULT false,
    "hasLaundry" BOOLEAN NOT NULL DEFAULT false,
    "hasMessRoom" BOOLEAN NOT NULL DEFAULT false,
    "hasWifi" BOOLEAN NOT NULL DEFAULT false,
    "hasCCTV" BOOLEAN NOT NULL DEFAULT false,
    "insuranceStatus" TEXT NOT NULL DEFAULT 'NONE',
    "insuranceProvider" TEXT,
    "insuranceAmountEurCents" INTEGER,
    "monthlyRateCents" INTEGER NOT NULL DEFAULT 0,
    "infraPremiumCents" INTEGER NOT NULL DEFAULT 0,
    "minStayMonths" INTEGER NOT NULL DEFAULT 1,
    "maxStayMonths" INTEGER NOT NULL DEFAULT 18,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "images" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Listing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_nearbyProjectId_fkey" FOREIGN KEY ("nearbyProjectId") REFERENCES "ProjectSite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deploymentCode" TEXT NOT NULL,
    "clientOrgId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "projectCountry" TEXT NOT NULL DEFAULT 'DE',
    "projectRegion" TEXT,
    "crewSize" INTEGER NOT NULL,
    "roleMix" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "housingBudgetCentsPerPersonMonth" INTEGER,
    "partnerOrgId" TEXT,
    "totalGrossCents" INTEGER,
    "corridorTakeCents" INTEGER,
    "corridorSaasFeeCents" INTEGER,
    "totalNetToCorridorCents" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deployment_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deployment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deployment_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeploymentSite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deploymentId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "partnerOrgId" TEXT NOT NULL,
    "bedsAllocated" INTEGER NOT NULL,
    "monthlyRateCents" INTEGER NOT NULL,
    "infraPremiumCents" INTEGER NOT NULL,
    "commissionBps" INTEGER NOT NULL DEFAULT 900,
    "enterpriseTakeBps" INTEGER NOT NULL DEFAULT 1300,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUOTE',
    "grossCents" INTEGER,
    "partnerNetCents" INTEGER,
    "corridorCents" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeploymentSite_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeploymentSite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeploymentSite_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "deploymentId" TEXT,
    "clientOrgId" TEXT NOT NULL,
    "partnerOrgId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requestedMoveIn" DATETIME NOT NULL,
    "requestedMoveOut" DATETIME NOT NULL,
    "headcount" INTEGER NOT NULL,
    "proposedMonthlyCents" INTEGER,
    "counterMonthlyCents" INTEGER,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "BookingRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "clientOrgId" TEXT NOT NULL,
    "deploymentId" TEXT,
    "issuedById" TEXT,
    "billingPeriodStart" DATETIME NOT NULL,
    "billingPeriodEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "corridorTakeCents" INTEGER NOT NULL DEFAULT 0,
    "corridorSaasFeeCents" INTEGER NOT NULL DEFAULT 0,
    "vatBps" INTEGER NOT NULL DEFAULT 1900,
    "vatCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "lineItems" TEXT,
    "issuedAt" DATETIME,
    "dueAt" DATETIME,
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerOrgId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "grossCents" INTEGER NOT NULL DEFAULT 0,
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "netCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payout_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payout_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorAccreditation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "partnerOrgId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "cycleStartedAt" DATETIME,
    "expectedDurationDays" INTEGER NOT NULL DEFAULT 270,
    "targetCompletionAt" DATETIME,
    "completedAt" DATETIME,
    "reviewerUserId" TEXT,
    "requiredDocCategories" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VendorAccreditation_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VendorAccreditation_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VendorAccreditation_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TakeRateConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostCommissionBps" INTEGER NOT NULL DEFAULT 900,
    "hostWaiveFirst90Days" BOOLEAN NOT NULL DEFAULT true,
    "enterpriseTakeBpsMin" INTEGER NOT NULL DEFAULT 1200,
    "enterpriseTakeBpsMax" INTEGER NOT NULL DEFAULT 1500,
    "enterpriseTakeBpsDefault" INTEGER NOT NULL DEFAULT 1300,
    "saasFeeCentsPerSiteMonth" INTEGER NOT NULL DEFAULT 75000,
    "vatBps" INTEGER NOT NULL DEFAULT 1900,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedByUserId" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_country_idx" ON "Organization"("country");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSite_code_key" ON "ProjectSite"("code");

-- CreateIndex
CREATE INDEX "ProjectSite_type_idx" ON "ProjectSite"("type");

-- CreateIndex
CREATE INDEX "ProjectSite_country_idx" ON "ProjectSite"("country");

-- CreateIndex
CREATE INDEX "Listing_orgId_idx" ON "Listing"("orgId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_country_idx" ON "Listing"("country");

-- CreateIndex
CREATE INDEX "Listing_nearbyProjectType_idx" ON "Listing"("nearbyProjectType");

-- CreateIndex
CREATE INDEX "Document_ownerType_ownerId_idx" ON "Document"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "Document_orgId_idx" ON "Document"("orgId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_deploymentCode_key" ON "Deployment"("deploymentCode");

-- CreateIndex
CREATE INDEX "Deployment_clientOrgId_idx" ON "Deployment"("clientOrgId");

-- CreateIndex
CREATE INDEX "Deployment_status_idx" ON "Deployment"("status");

-- CreateIndex
CREATE INDEX "Deployment_projectType_idx" ON "Deployment"("projectType");

-- CreateIndex
CREATE INDEX "DeploymentSite_deploymentId_idx" ON "DeploymentSite"("deploymentId");

-- CreateIndex
CREATE INDEX "DeploymentSite_listingId_idx" ON "DeploymentSite"("listingId");

-- CreateIndex
CREATE INDEX "DeploymentSite_partnerOrgId_idx" ON "DeploymentSite"("partnerOrgId");

-- CreateIndex
CREATE INDEX "BookingRequest_listingId_idx" ON "BookingRequest"("listingId");

-- CreateIndex
CREATE INDEX "BookingRequest_clientOrgId_idx" ON "BookingRequest"("clientOrgId");

-- CreateIndex
CREATE INDEX "BookingRequest_partnerOrgId_idx" ON "BookingRequest"("partnerOrgId");

-- CreateIndex
CREATE INDEX "BookingRequest_status_idx" ON "BookingRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_clientOrgId_idx" ON "Invoice"("clientOrgId");

-- CreateIndex
CREATE INDEX "Invoice_deploymentId_idx" ON "Invoice"("deploymentId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Payout_partnerOrgId_idx" ON "Payout"("partnerOrgId");

-- CreateIndex
CREATE INDEX "Payout_invoiceId_idx" ON "Payout"("invoiceId");

-- CreateIndex
CREATE INDEX "VendorAccreditation_partnerOrgId_idx" ON "VendorAccreditation"("partnerOrgId");

-- CreateIndex
CREATE INDEX "VendorAccreditation_status_idx" ON "VendorAccreditation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAccreditation_clientOrgId_partnerOrgId_key" ON "VendorAccreditation"("clientOrgId", "partnerOrgId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
