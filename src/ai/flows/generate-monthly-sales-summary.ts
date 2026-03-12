'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate a monthly sales summary in natural language.
 *
 * - generateMonthlySalesSummary - A function that handles the generation of the monthly sales summary.
 * - GenerateMonthlySalesSummaryInput - The input type for the generateMonthlySalesSummary function.
 * - GenerateMonthlySalesSummaryOutput - The return type for the generateMonthlySalesSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMonthlySalesSummaryInputSchema = z.object({
  month: z.string().describe('The name of the month (e.g., "Janeiro").'),
  year: z.number().describe('The year for the sales summary.'),
  totalSalesMonth: z.number().describe('Total sales amount for the month.'),
  totalReceivedMonth: z.number().describe('Total amount received for the month.'),
  totalPendingMonth: z.number().describe('Total outstanding amount for the month.'),
  numberOfClients: z.number().describe('Total number of active clients.'),
  numberOfOrders: z.number().describe('Total number of orders placed.'),
  topSellingProducts: z
    .array(
      z.object({
        name: z.string().describe('Product name.'),
        quantity: z.number().describe('Quantity sold.'),
      })
    )
    .describe('A list of top-selling products with their quantities.'),
  totalProductsRegistered: z.number().describe('Total number of products registered in the catalog.'),
});
export type GenerateMonthlySalesSummaryInput = z.infer<
  typeof GenerateMonthlySalesSummaryInputSchema
>;

const GenerateMonthlySalesSummaryOutputSchema = z.object({
  summary: z.string().describe('A natural language summary of monthly sales, trends, and insights.'),
});
export type GenerateMonthlySalesSummaryOutput = z.infer<
  typeof GenerateMonthlySalesSummaryOutputSchema
>;

export async function generateMonthlySalesSummary(
  input: GenerateMonthlySalesSummaryInput
): Promise<GenerateMonthlySalesSummaryOutput> {
  return generateMonthlySalesSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMonthlySalesSummaryPrompt',
  input: {schema: GenerateMonthlySalesSummaryInputSchema},
  output: {schema: GenerateMonthlySalesSummaryOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing sales data for Avon and Natura resellers. Your task is to provide a comprehensive and insightful natural language summary of the monthly sales performance.

Analyze the provided data for the month of {{{month}}} of {{{year}}} and highlight important trends, key performance indicators, and insights into the business health. Focus on what these numbers mean for the reseller and provide actionable observations.

Here is the sales data:

- Mês: {{{month}}}
- Ano: {{{year}}}
- Total vendido no mês: R$ {{{totalSalesMonth}}},
- Total recebido no mês: R$ {{{totalReceivedMonth}}},
- Total pendente no mês: R$ {{{totalPendingMonth}}},
- Quantidade de clientes: {{{numberOfClients}}},
- Quantidade de pedidos: {{{numberOfOrders}}},
- Produtos mais vendidos:
{{#each topSellingProducts}}
  - {{name}} ({{quantity}} unidades)
{{/each}}
- Total de produtos cadastrados: {{{totalProductsRegistered}}}.

Based on this information, provide a detailed summary. Your summary should:
1. Start with an overall assessment of the month's performance.
2. Discuss financial highlights: total sales, received, and pending amounts, and what they signify.
3. Analyze customer and order trends: client growth, order volume, and their impact.
4. Highlight product performance: which products are driving sales and any observations about product diversity.
5. Identify any potential areas for improvement or positive trends.
6. Keep the language natural, professional, and easy to understand for a business owner.
`,
});

const generateMonthlySalesSummaryFlow = ai.defineFlow(
  {
    name: 'generateMonthlySalesSummaryFlow',
    inputSchema: GenerateMonthlySalesSummaryInputSchema,
    outputSchema: GenerateMonthlySalesSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
