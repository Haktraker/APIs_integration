"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { 
  Layers, 
  Globe, 
  Database, 
  Shield, 
  Search, 
  AlertTriangle, 
  Mail, 
  PieChart,
  ArrowRight,
  Bot,
  Lock,
  Zap
} from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: <Layers className="h-12 w-12 text-blue-400" />,
      title: "Dark & Deep Web Intelligence",
      description: "Access comprehensive dark web monitoring and data breach detection to protect your organization's assets.",
      benefits: [
        "Real-time dark web monitoring",
        "Data breach detection and alerts",
        "Credential exposure monitoring",
        "Threat actor tracking"
      ]
    },
    {
      icon: <Globe className="h-12 w-12 text-blue-400" />,
      title: "Shodan Integration",
      description: "Discover and monitor internet-exposed devices and services to identify security vulnerabilities.",
      benefits: [
        "Device discovery and monitoring",
        "Vulnerability assessment",
        "Port scanning and analysis",
        "Service identification"
      ]
    },
    {
      icon: <Database className="h-12 w-12 text-blue-400" />,
      title: "IntelX Data Analysis",
      description: "Leverage advanced data analysis to extract actionable intelligence from multiple sources.",
      benefits: [
        "Multi-source intelligence gathering",
        "Pattern analysis and correlation",
        "Threat intelligence feeds",
        "Historical data analysis"
      ]
    },
    {
      icon: <Shield className="h-12 w-12 text-blue-400" />,
      title: "Network Security Analysis",
      description: "Comprehensive network security assessment and monitoring tools.",
      benefits: [
        "Network vulnerability scanning",
        "Security posture assessment",
        "Attack surface monitoring",
        "Risk scoring and prioritization"
      ]
    }
  ]

  const additionalFeatures = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms for threat detection and analysis"
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "Real-time Alerts",
      description: "Instant notifications for critical security threats and vulnerabilities"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Automated Reports",
      description: "Detailed reports and insights delivered to your inbox"
    },
    {
      icon: <PieChart className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics and visualization tools"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Secure Access",
      description: "Enterprise-grade security and access controls"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "API Integration",
      description: "Easy integration with your existing security tools"
    }
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-gray-900 to-background py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">Powerful Features</span> for
                <br />Complete Cyber Intelligence
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Discover how our comprehensive suite of tools can help protect your organization
                from emerging cyber threats.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Features */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mainFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800/30 rounded-lg p-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="mb-6">{feature.icon}</div>
                  <h2 className="text-2xl font-bold text-white mb-4">{feature.title}</h2>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-gray-300">
                        <ArrowRight className="h-4 w-4 text-blue-400 mr-2" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Features Grid */}
        <div className="bg-gray-900/50 py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Everything You Need
              </h2>
              <p className="text-xl text-gray-400">
                Comprehensive tools and features to enhance your cyber security
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {additionalFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800/30 rounded-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg mr-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-900 to-gray-900 py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Join thousands of organizations using HakTrak Networks to protect their assets
                from cyber threats.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  <Link href="/login">
                    Start Free Trial
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-800">
                  <Link href="/contact">
                    Contact Sales
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
} 