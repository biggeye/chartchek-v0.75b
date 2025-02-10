import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import AuthButton from "@/components/header-auth";

export default async function Home() {
  return (
    <>
  
      <main className="flex-1 flex flex-col gap-6 px-4">
      <div className="flex flex-col items-center px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            <span className="text-primary">
              <img
                src="/chartChek-banner-light.png"
                alt="ChartChek"
                className="h-10 w-auto"
              />
            </span>
            <span className="block text-2xl sm:text-3xl mt-2 text-muted-foreground">
              AI-Powered Compliance Assistant
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Streamline regulatory compliance for your behavioral health facility with instant, 
            accurate, and actionable insights powered by advanced AI technology.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/sign-up"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary flex items-center gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
          {['AI-Powered Compliance Assistance', 'Joint Commission & DHCS Standards', 'Secure Document Management', 'Real-time Expert Guidance'].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3"
            >
              <CheckCircle className="h-4 w-4 text-primary" />
              {feature}
            </div>
          ))}
        </div>

        {/* Job Openings Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center">The ChartChek Team</h2>
          <ul className="mt-6 space-y-4">
            {[{
              name: 'The Joint Commission Specialist',
              role: 'Compliance, Accreditation and Survey Preparation',
              description: 'Prepare compliance reports and maintain accreditation.',
              }, {
              name: 'DHCS Advisor',
              role: 'Compliance, Accreditation and Survey Preparation',
              description: 'Provide expert guidance on the DHCS requirements for your facility',
            }].map((job) => (
              <li key={job.name} className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-primary">{job.name}</h3>
                <h1 className="text-m font-italic text-foreground">{job.role}</h1>
                <p className="text-muted-foreground">{job.description}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Navigation Section */}
        <footer className="mt-16 w-full bg-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Solutions</h3>
                <ul className="mt-4 space-y-2">
                  {['Compliance Monitoring', 'Chart Analytics', 'Clinical Tools'].map((solution) => (
                    <li key={solution}>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                        {solution}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Company</h3>
                <ul className="mt-4 space-y-2">
                  {['About Us', 'Press', 'Blog'].map((company) => (
                    <li key={company}>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                        {company}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
      </main>
    </>
  );
}
