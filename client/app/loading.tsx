import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return <main className="flex justify-center p-12" role="status" aria-label="Loading"><Spinner /></main>
}
