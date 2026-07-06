import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Corridor — EPC workforce housing infrastructure",
  description:
    "Corridor is the supply-and-compliance marketplace for mid-term, infrastructure-equipped workforce housing for European energy and data-center EPC. Vendor accreditation, consolidated invoicing, and secured yards — sold directly into EPC procurement.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Corridor — EPC workforce housing infrastructure",
    description:
      "Mid-term housing + secured yards + compliance, sold into EPC procurement. The compliance-anchored alternative to Airbnb-for-EPC and to consumer mid-term rental platforms.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToasterProvider>{children}</ToasterProvider>
      </body>
    </html>
  );
}
