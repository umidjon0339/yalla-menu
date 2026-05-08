import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-primary mb-4">Yalla Restaurant</h1>
      <p className="text-muted-foreground mb-8">Digital Ordering System</p>
      
      {/* Temporary links to test our routes later */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link 
          href="/table/1" 
          className="bg-primary text-primary-foreground py-3 px-4 rounded-full font-semibold hover:bg-primary/90 transition"
        >
          View Demo Menu (Table 1)
        </Link>
        <Link 
          href="/login" 
          className="bg-secondary text-secondary-foreground py-3 px-4 rounded-full font-semibold hover:bg-secondary/80 transition"
        >
          Staff Login
        </Link>
      </div>
    </main>
  );
}