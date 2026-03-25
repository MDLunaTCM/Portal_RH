import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding with red theme */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#dc2626] relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-[#dc2626]">RH</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Portal RH</h1>
                <p className="text-sm text-white/80">Human Resources</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <blockquote className="text-xl font-light leading-relaxed">
              &quot;Streamline your HR operations with our comprehensive portal. 
              From payroll to performance reviews, everything you need in one place.&quot;
            </blockquote>
            
            <div className="h-px bg-white/20" />
            
            <div className="flex items-center gap-10">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-white/80">Employees</div>
              </div>
              <div>
                <div className="text-3xl font-bold">25</div>
                <div className="text-sm text-white/80">Departments</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-white/80">Uptime</div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-white/60">
            &copy; 2026 Company Name. All rights reserved.
          </p>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/4 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-10 w-20 h-20 rounded-full bg-white/5" />
      </div>
      
      {/* Right panel - Auth forms with clean white/dark background */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
