"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  Target, 
  Users, 
  Award,
  ArrowRight,
  Globe,
  Lock,
  Zap,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AboutPage() {
  const stats = [
    { number: "500+", label: "Organizations Protected" },
    { number: "24/7", label: "Threat Monitoring" },
    { number: "99.9%", label: "Service Uptime" },
    { number: "10M+", label: "Threats Detected" }
  ]

  const values = [
    {
      icon: <Shield className="h-6 w-6 text-blue-400" />,
      title: "Security First",
      description: "We prioritize the security and privacy of our clients above all else."
    },
    {
      icon: <Target className="h-6 w-6 text-blue-400" />,
      title: "Proactive Protection",
      description: "We believe in preventing threats before they become incidents."
    },
    {
      icon: <Users className="h-6 w-6 text-blue-400" />,
      title: "Client Partnership",
      description: "We work closely with our clients to understand and meet their unique needs."
    },
    {
      icon: <Award className="h-6 w-6 text-blue-400" />,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from code to customer service."
    }
  ]

  const team = [
    {
      name: "Alex Chen",
      role: "Chief Executive Officer",
      image: "/team/alex-chen.jpg",
      description: "Former cybersecurity consultant with 15+ years of experience."
    },
    {
      name: "Sarah Johnson",
      role: "Chief Technology Officer",
      image: "/team/sarah-johnson.jpg",
      description: "AI and machine learning expert with a focus on threat detection."
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Security",
      image: "/team/marcus-rodriguez.jpg",
      description: "Certified ethical hacker and security researcher."
    },
    {
      name: "Emily Zhang",
      role: "Head of Product",
      image: "/team/emily-zhang.jpg",
      description: "Product strategist with expertise in cyber intelligence platforms."
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
                About <span className="gradient-text">HakTrak Networks</span>
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                We're on a mission to make cyber intelligence accessible and actionable
                for organizations of all sizes.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl font-bold text-blue-400 mb-2">{stat.number}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-gray-900/50 py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  Founded in 2020, HakTrak Networks emerged from a simple yet powerful idea: 
                  make enterprise-grade cyber intelligence accessible to organizations of all sizes. 
                  Our founders, having worked in cybersecurity for over a decade, saw a gap in the 
                  market for an integrated, user-friendly platform that could provide comprehensive 
                  threat intelligence without requiring extensive technical expertise.
                </p>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Today, we're proud to serve hundreds of organizations worldwide, helping them 
                  stay ahead of cyber threats with our innovative AI-powered platform. Our team 
                  of security experts, developers, and data scientists works tirelessly to evolve 
                  our platform and keep our clients protected in an ever-changing threat landscape.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Values Section */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Our Values</h2>
              <p className="text-xl text-gray-400">
                The principles that guide everything we do
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
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
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{value.title}</h3>
                  </div>
                  <p className="text-gray-400">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gray-900/50 py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Our Leadership Team</h2>
              <p className="text-xl text-gray-400">
                Meet the experts behind HakTrak Networks
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800/30 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="relative h-48 bg-gray-700">
                    {/* Placeholder for team member photos */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="h-20 w-20 text-gray-600" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                    <div className="text-blue-400 text-sm mb-3">{member.role}</div>
                    <p className="text-gray-400 text-sm">{member.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-900 to-gray-900 py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Want to Learn More?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Get in touch with our team to discuss how we can help protect your organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  <Link href="/contact">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Contact Us
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-800">
                  <Link href="/features">
                    Learn More About Features
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