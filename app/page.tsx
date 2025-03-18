"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Shield, Database, Globe, Layers, ArrowRight } from "lucide-react"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/navbar"

// Dynamically import Three.js components with no SSR
const ThreeBackground = dynamic(() => import("@/components/three-background"), { ssr: false })

// export const metadata: Metadata = {
//   title: "Login",
//   description: "Sign in to HakTrak Networks - Your AI-powered Cyber Intelligence Platform",
// }

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50])
  
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <>
      <Navbar />
      <div ref={containerRef} className="relative min-h-screen">
        {/* Hero Section with Animated Background */}
        <div className="relative h-screen overflow-hidden">
          {/* Three.js Background */}
          <ThreeBackground />
          
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80">
            <div className="absolute inset-0 opacity-30">
              {/* Animated grid pattern */}
              <div className="absolute inset-0" style={{ 
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', 
                backgroundSize: '30px 30px' 
              }}></div>
              
              {/* Animated particles */}
              <div className="stars-container">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute rounded-full bg-white animate-twinkle" 
                    style={{
                      width: Math.random() * 2 + 'px',
                      height: Math.random() * 2 + 'px',
                      top: Math.random() * 100 + 'vh',
                      left: Math.random() * 100 + 'vw',
                      opacity: Math.random() * 0.5 + 0.3,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${Math.random() * 5 + 3}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ opacity, scale, y }}
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <span className="gradient-text">Hak</span>Trak Networks
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 max-w-3xl mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Your AI-powered eXtended Cyber Intelligence Platform that protects you against cyber threats with actionable & contextualized intelligence.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                <Link href="/login">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg">
                <Link href="/features">
                  Learn More
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <div className="flex flex-col items-center">
              <span className="text-gray-400 text-sm mb-2">Scroll to explore</span>
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center p-1">
                <motion.div 
                  className="w-1 h-2 bg-gray-400 rounded-full"
                  animate={{ 
                    y: [0, 12, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Features Section */}
        <div className="bg-gray-900 py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                <span className="gradient-text">Comprehensive Cyber Intelligence</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Access multiple intelligence sources through a unified platform to identify and mitigate threats before they impact your organization.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Globe className="h-10 w-10 text-blue-400" />,
                  title: "Shodan",
                  description: "Discover exposed devices and services connected to the internet that could be vulnerable.",
                },
                {
                  icon: <Database className="h-10 w-10 text-blue-400" />,
                  title: "IntelX",
                  description: "Access intelligence exchange data from various sources to enhance your threat intelligence.",
                },
                {
                  icon: <Shield className="h-10 w-10 text-blue-400" />,
                  title: "Network Analysis",
                  description: "Analyze network infrastructure and identify potential vulnerabilities before they're exploited.",
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors duration-300 animate-float"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="mb-4 animate-pulse-slow">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="bg-black py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                <span className="gradient-text">How It Works</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Our platform leverages AI to provide actionable intelligence from multiple sources in three simple steps.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  number: "01",
                  title: "Sign Up",
                  description: "Create your account and get instant access to our cyber intelligence platform."
                },
                {
                  number: "02",
                  title: "Configure",
                  description: "Set up your targets and choose which intelligence sources to monitor."
                },
                {
                  number: "03",
                  title: "Monitor",
                  description: "Receive real-time alerts and actionable intelligence about potential threats."
                }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="text-5xl font-bold text-blue-600 opacity-30 mb-2">{step.number}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 right-0 transform translate-x-1/2">
                      <ArrowRight className="h-8 w-8 text-blue-600 opacity-30" />
                    </div>
                  )}
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
              <h2 className="text-4xl font-bold text-white mb-6">
                <span className="gradient-text">Ready to Enhance Your Cyber Security?</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Start using HakTrak Networks today to protect your organization from emerging cyber threats.
              </p>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                <Link href="/login">
                  Get Started Now
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </>
  )
}

