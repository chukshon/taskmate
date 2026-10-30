import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div
      className="flex justify-center p-12"
      role="status"
      aria-label="Loading"
    >
      <Spinner />
    </div>
  )
}
