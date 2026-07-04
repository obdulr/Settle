export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Settle Web Application
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Authentication system with Railway backend and Render frontend.
          </p>
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded">
              <h2 className="font-semibold mb-2">API Status</h2>
              <p className="text-sm">Backend: Railway (PostgreSQL + NestJS)</p>
              <p className="text-sm">Frontend: Render (Next.js)</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
              <h2 className="font-semibold mb-2">Authentication Endpoints</h2>
              <ul className="text-sm space-y-1">
                <li>POST /auth/register - Register new user</li>
                <li>POST /auth/login - Login user</li>
                <li>GET /auth/profile - Get user profile (protected)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
