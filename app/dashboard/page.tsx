"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Search, Shield, Database, Globe, Layers, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold mb-6">
          <span className="gradient-text">Welcome to HakTrak Networks</span>
        </h1>
        
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-300 mb-4">
            Welcome to your dashboard! Here you can access all our cyber intelligence tools and services.
            Start by selecting one of our main features below or use the sidebar for navigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: <Layers className="h-8 w-8 text-blue-400" />,
              title: "Dark & Deep Web",
              description: "Search dark web and data leaks for sensitive information.",
              link: "/darkweb"
            },
            {
              icon: <Globe className="h-8 w-8 text-blue-400" />,
              title: "Shodan",
              description: "Discover exposed devices and vulnerable services.",
              link: "/shodan"
            },
            {
              icon: <Database className="h-8 w-8 text-blue-400" />,
              title: "IntelX",
              description: "Access intelligence exchange data from various sources.",
              link: "/intelx"
            },
            {
              icon: <Shield className="h-8 w-8 text-blue-400" />,
              title: "Network Analysis",
              description: "Analyze network infrastructure and identify vulnerabilities.",
              link: "/network"
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-gray-800/30 rounded-lg p-6 hover:bg-gray-700/30 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 mb-4">{feature.description}</p>
                  <Button asChild variant="link" className="text-blue-400 p-0 hover:text-blue-300">
                    <Link href={feature.link}>
                      Get Started <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
} 