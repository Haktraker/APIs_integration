"use client"

import React, { useRef, useState, useEffect } from "react"
import * as THREE from "three"

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    if (!mounted || !containerRef.current) return
    
    let animationFrameId: number
    
    try {
      // Scene setup
      const scene = new THREE.Scene()
      
      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      camera.position.z = 5
      
      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      containerRef.current.appendChild(renderer.domElement)
      
      // Create particles
      const particlesGeometry = new THREE.BufferGeometry()
      const particlesCount = 2000
      
      const posArray = new Float32Array(particlesCount * 3)
      
      for (let i = 0; i < particlesCount * 3; i += 3) {
        // Position
        posArray[i] = (Math.random() - 0.5) * 15 // x
        posArray[i + 1] = (Math.random() - 0.5) * 15 // y
        posArray[i + 2] = (Math.random() - 0.5) * 15 // z
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
      
      // Material
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x3b82f6, // Blue color
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })
      
      // Points
      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
      scene.add(particlesMesh)
      
      // Add some ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)
      
      // Handle resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      
      window.addEventListener('resize', handleResize)
      
      // Mouse movement effect
      let mouseX = 0
      let mouseY = 0
      
      const handleMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1
      }
      
      window.addEventListener('mousemove', handleMouseMove)
      
      // Animation loop
      const animate = () => {
        // Rotate particles slowly
        particlesMesh.rotation.x += 0.0005
        particlesMesh.rotation.y += 0.0005
        
        // Move particles based on mouse position
        particlesMesh.rotation.x += mouseY * 0.0005
        particlesMesh.rotation.y += mouseX * 0.0005
        
        renderer.render(scene, camera)
        animationFrameId = requestAnimationFrame(animate)
      }
      
      animate()
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('mousemove', handleMouseMove)
        cancelAnimationFrame(animationFrameId)
        
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement)
        }
        
        // Dispose resources
        particlesGeometry.dispose()
        particlesMaterial.dispose()
        renderer.dispose()
      }
    } catch (error) {
      console.error("Error initializing Three.js scene:", error)
      return () => {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [mounted])
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 -z-10"
      style={{ pointerEvents: 'none' }}
    />
  )
} 