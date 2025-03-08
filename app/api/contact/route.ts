import { NextResponse } from 'next/server'
import { z } from 'zod'
// Import your email service here
// import { sendEmail } from '@/lib/email'

const formSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  companyName: z.string().min(2),
  companySize: z.string(),
  industry: z.string(),
  position: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  message: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = formSchema.parse(body)

    // Create email content
    const emailContent = `
      New Contact Form Submission

      Personal Information:
      - Name: ${validatedData.firstName} ${validatedData.lastName}
      - Email: ${validatedData.email}
      - Phone: ${validatedData.phone}

      Company Information:
      - Company: ${validatedData.companyName}
      - Size: ${validatedData.companySize}
      - Industry: ${validatedData.industry}
      - Position: ${validatedData.position}

      Message:
      ${validatedData.message || 'No additional message provided'}
    `

    // Send email
    // await sendEmail({
    //   to: 'your-email@example.com',
    //   subject: 'New Contact Form Submission',
    //   text: emailContent,
    // })

    return NextResponse.json(
      { message: 'Form submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { message: 'Error submitting form' },
      { status: 500 }
    )
  }
} 