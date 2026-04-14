function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton rounded-lg bg-[var(--surface-raised)] ${className}`} />
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-5 w-5 rounded-full" />
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-3 w-16 ml-auto" />
      </div>
      <SkeletonBlock className="h-5 w-3/4" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <div className="flex items-center gap-4 pt-1">
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-4 w-10 ml-auto" />
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="space-y-3 border-l-2 border-[var(--border)] pl-4">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-4 w-4 rounded-full" />
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-12" />
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
      <div className="flex gap-3 pt-1">
        <SkeletonBlock className="h-3 w-8" />
        <SkeletonBlock className="h-3 w-10" />
      </div>
    </div>
  )
}

export function CommunityCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
      <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
      <SkeletonBlock className="h-8 w-16 rounded-xl" />
    </div>
  )
}

export function MembersSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-1.5">
          <SkeletonBlock className="h-7 w-7 rounded-full shrink-0" />
          <SkeletonBlock className="h-3 w-28" />
        </div>
      ))}
    </div>
  )
}
