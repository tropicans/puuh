import { DesignAgency } from "@/components/ui/landing-page"

interface DesignProps {
  isAuthenticated?: boolean
}

export function Design({ isAuthenticated = false }: DesignProps) {
  return <DesignAgency isAuthenticated={isAuthenticated} />
}
