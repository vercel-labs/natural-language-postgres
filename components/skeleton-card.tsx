import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-2 w-full">
    <div className="w-full flex items-center justify-center">
    <Skeleton className="h-[28px] w-72 rounded-xl" />
    </div>
    <Skeleton className="h-[300px] w-full rounded-xl" />
      <div className="w-full flex justify-center items-center">
        <Skeleton className="h-4 w-20" />
        </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[450px]" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[350px]" />
      </div>
    </div>
  );
}
