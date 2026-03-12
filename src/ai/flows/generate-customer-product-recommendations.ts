'use server';
/**
 * @fileOverview A Genkit flow to generate personalized product recommendations for a customer.
 *
 * - generateCustomerProductRecommendations - A function that handles the product recommendation process.
 * - GenerateCustomerProductRecommendationsInput - The input type for the generateCustomerProductRecommendations function.
 * - GenerateCustomerProductRecommendationsOutput - The return type for the generateCustomerProductRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCustomerProductRecommendationsInputSchema = z.object({
  customerName: z.string().describe("The name of the customer for whom recommendations are being generated."),
  purchaseHistory: z.array(
    z.object({
      productName: z.string().describe("The name of a product previously purchased."),
      brand: z.string().describe("The brand of the product (e.g., Avon, Natura)."),
      category: z.string().describe("The category of the product (e.g., perfume, makeup)."),
    })
  ).describe("A list of products the customer has previously purchased."),
});
export type GenerateCustomerProductRecommendationsInput = z.infer<typeof GenerateCustomerProductRecommendationsInputSchema>;

const GenerateCustomerProductRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      productName: z.string().describe("The name of the recommended product."),
      reason: z.string().describe("A brief explanation for why this product is recommended."),
    })
  ).describe("A list of personalized product recommendations."),
});
export type GenerateCustomerProductRecommendationsOutput = z.infer<typeof GenerateCustomerProductRecommendationsOutputSchema>;

export async function generateCustomerProductRecommendations(input: GenerateCustomerProductRecommendationsInput): Promise<GenerateCustomerProductRecommendationsOutput> {
  return generateCustomerProductRecommendationsFlow(input);
}

const recommendProductPrompt = ai.definePrompt({
  name: 'recommendProductPrompt',
  input: { schema: GenerateCustomerProductRecommendationsInputSchema },
  output: { schema: GenerateCustomerProductRecommendationsOutputSchema },
  prompt: `You are an expert sales assistant for Avon and Natura products. Your goal is to provide personalized product recommendations for a customer based on their past purchase history.

The customer's name is: {{{customerName}}}

Here is their purchase history:
{{#each purchaseHistory}}
- Product: {{{productName}}}, Brand: {{{brand}}}, Category: {{{category}}}
{{/each}}

Based on this history, what 3-5 products would you recommend for {{{customerName}}}? For each recommendation, provide a brief reason why it's a good fit. Focus on products from Avon or Natura that complement their past purchases or fit their apparent preferences. The recommendations should be varied, covering different categories if appropriate.

Provide the recommendations in a structured JSON format.`,
});

const generateCustomerProductRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateCustomerProductRecommendationsFlow',
    inputSchema: GenerateCustomerProductRecommendationsInputSchema,
    outputSchema: GenerateCustomerProductRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendProductPrompt(input);
    if (!output) {
      throw new Error('Failed to generate product recommendations.');
    }
    return output;
  }
);
