import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RegulationListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-gray-900/50 border-gray-800">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
                                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
                            </div>
                            <Skeleton className="h-4 w-4 bg-gray-800" />
                        </div>
                        <Skeleton className="h-6 w-3/4 mt-2 bg-gray-800" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2 bg-gray-800" />
                        <Skeleton className="h-4 w-2/3 mb-4 bg-gray-800" />

                        {/* Timeline skeleton */}
                        <div className="flex gap-1 mb-4">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <Skeleton key={j} className="h-2 w-8 rounded bg-gray-800" />
                            ))}
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <Skeleton className="h-4 w-16 bg-gray-800" />
                            <Skeleton className="h-4 w-24 bg-gray-800" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
