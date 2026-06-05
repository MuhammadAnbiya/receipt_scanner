import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const maxDuration = 30; // Increase timeout for API call

// Retry function for handling transient errors (e.g., 503)
async function generateContentWithRetry(model: any, contents: any, maxRetries: number = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await model.generateContent(contents);
    } catch (error: unknown) {
      // Cast error ke tipe Error agar properti .message bisa diakses
      const err = error as Error;
      
      // Check if it's a 503 Service Unavailable error
      if (err.message && (err.message.includes('503') || err.message.includes('Service Unavailable'))) {
        if (i === maxRetries - 1) throw err; // Last retry, rethrow
        // Exponential backoff: wait 2^i seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      // If it's not a 503, rethrow immediately
      throw err;
    }
  }
}

export async function POST(request: Request) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // System prompt for receipt parsing
    const systemPrompt = `
You are a receipt parsing expert. Your task is to extract items and their prices from receipt images.
Return ONLY a raw JSON array of objects with the exact structure:
[{"item_name": "string", "price": number}]

Rules:
- Do not include any additional text, explanation, or formatting outside the JSON array
- Each object must have exactly "item_name" (string) and "price" (number)
- Price must be a number (not string) representing the item price
- If you cannot identify items, return an empty array []
- Do not include currency symbols in price - just the numeric value
- If multiple same items exist, list each separately
- Ignore taxes, discounts, subtotals, totals - only extract individual line items
`;

    // Generate content with retry mechanism for 503 errors
    const result = await generateContentWithRetry(
      model,
      [
        systemPrompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: file.type
          }
        }
      ]
    );

    const response = await result.response;
    const text = response.text();

    // Attempt to parse the JSON
    let parsedData: { item_name: string; price: number }[] = [];
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);

        // Validate structure
        if (!Array.isArray(parsedData)) {
          throw new Error('Response is not an array');
        }

        parsedData.forEach((item, index) => {
          if (typeof item.item_name !== 'string' || typeof item.price !== 'number') {
            throw new Error(`Invalid item structure at index ${index}`);
          }
        });
      } else {
        // If no array found, try to parse the whole text
        parsedData = JSON.parse(text);
        if (!Array.isArray(parsedData)) {
          parsedData = [];
        }
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Return empty array if parsing fails
      parsedData = [];
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt. Please try again later.' },
      { status: 500 }
    );
  }
}