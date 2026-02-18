import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="pt-6">
                        <div className="text-center flex flex-col items-center">
                            <Skeleton className="h-10 w-16 mb-2 bg-gray-800" />
                            <Skeleton className="h-4 w-24 bg-gray-800" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
