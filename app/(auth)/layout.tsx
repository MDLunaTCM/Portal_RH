import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-header relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-hover" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-header-foreground">
          <div>
            {/* Logo placeholder */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-2xl font-bold">RH</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Portal RH</h1>
                <p className="text-sm text-white/80">Human Resources</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <blockquote className="text-lg font-light leading-relaxed">
              &quot;Streamline your HR operations with our comprehensive portal. 
              From payroll to performance reviews, everything you need in one place.&quot;
            </blockquote>
            <div className="h-px bg-white/20" />
            <div className="flex items-center gap-8 text-sm text-white/80">
              <div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div>Employees</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">25</div>
                <div>Departments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div>Uptime</div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-white/60">
            &copy; 2026 Company Name. All rights reserved.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/4 -right-10 w-40 h-40 rounded-full bg-white/5" />
      </div>
      
      {/* Right panel - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
