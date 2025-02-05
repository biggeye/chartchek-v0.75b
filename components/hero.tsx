import { ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  const features = [
    'AI-Powered Compliance Assistance',
    'Joint Commission & DHCS Standards',
    'Secure Document Management',
    'Real-time Expert Guidance'
  ]

  return (
    <div className="flex flex-col items-center px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          <span className="text-primary">ChartChek</span>
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
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3"
          >
            <CheckCircle className="h-4 w-4 text-primary" />
            {feature}
          </div>
        ))}
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-16" />
    </div>
  )
}
