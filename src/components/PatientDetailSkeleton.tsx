export default function PatientDetailSkeleton() {
  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded mb-4" />
          <div className="h-4 w-64 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-56 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}
