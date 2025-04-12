import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runPortScan } from '@/lib/api/services/portscanner';

const requestSchema = z.object({
  target: z.string().min(1, 'Target is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target } = requestSchema.parse(body);
    
    const scanResult = await runPortScan(target);
    return NextResponse.json(scanResult, { 
      status: scanResult.success ? 200 : scanResult.error?.includes('Invalid') ? 400 : 500 
    });
  } catch (error) {
    console.error('Port scan error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request'
    }, { status: 400 });
  }
}