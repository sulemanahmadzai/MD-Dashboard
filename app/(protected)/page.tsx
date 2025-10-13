export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h1>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">Chart 1</p>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">Chart 2</p>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">Chart 3</p>
        </div>
      </div>
      <div className="bg-muted/50 min-h-[400px] flex-1 rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Analytics Content</p>
      </div>
    </div>
  );
}
