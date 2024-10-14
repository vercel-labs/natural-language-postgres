import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DeployButton } from "./deploy-button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export const ProjectInfoDrawer = () => (
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="ghost" size="icon" className="sm:hidden">
        <Info className="h-5 w-5" />
        <span className="sr-only">Project Information</span>
      </Button>
    </DrawerTrigger>
    <DrawerContent className="border border-border">
      <DrawerHeader className="flex justify-center items-center">
        <DeployButton />
      </DrawerHeader>
      <DrawerDescription className="px-4 text-base">
        This application uses the{" "}
        <Link
          target="_blank"
          className="text-primary hover:text-primary/90 underline"
          href="https://sdk.vercel.ai"
        >
          AI SDK
        </Link>{" "}
        to allow you to query a PostgreSQL database with natural language. The dataset is CB Insights&apos; list of all unicorn companies. Learn more at{" "}
        <Link
          href="https://www.cbinsights.com/research-unicorn-companies"
          target="_blank"
          className="text-primary hover:text-primary/90 underline"
        >
          CB Insights
        </Link>
        .
      </DrawerDescription>
      <DrawerFooter>
        <DrawerClose asChild>
          <Button variant="outline">Close</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);
