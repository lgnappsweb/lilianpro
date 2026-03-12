'use server';
/**
 * @fileOverview Um fluxo Genkit para gerar mensagens de marketing curtas e envolventes para WhatsApp.
 *
 * - generateWhatsAppMarketingMessage - Uma função que gera mensagens de marketing para WhatsApp.
 * - GenerateWhatsAppMarketingMessageInput - O tipo de entrada para a função generateWhatsAppMarketingMessage.
 * - GenerateWhatsAppMarketingMessageOutput - O tipo de retorno para a função generateWhatsAppMarketingMessage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWhatsAppMarketingMessageInputSchema = z.object({
  productName: z
    .string()
    .optional()
    .describe('Nome do produto específico para o qual a mensagem será gerada.'),
  customerSegment: z
    .string()
    .optional()
    .describe(
      'Segmento de clientes (ex: "clientes VIP", "novos clientes") para quem a mensagem será direcionada.'
    ),
  offerDetails: z
    .string()
    .optional()
    .describe(
      'Detalhes da oferta ou promoção (ex: "20% de desconto em todos os batons", "compre 1 leve 2").'
    ),
  tone: z
    .enum(['amigável', 'profissional', 'entusiasmado', 'luxuoso', 'informativo'])
    .optional()
    .describe('O tom desejado para a mensagem de marketing.'),
});
export type GenerateWhatsAppMarketingMessageInput = z.infer<
  typeof GenerateWhatsAppMarketingMessageInputSchema
>;

const GenerateWhatsAppMarketingMessageOutputSchema = z.object({
  marketingMessage: z
    .string()
    .describe('A mensagem de marketing curta e envolvente gerada para WhatsApp.'),
});
export type GenerateWhatsAppMarketingMessageOutput = z.infer<
  typeof GenerateWhatsAppMarketingMessageOutputSchema
>;

export async function generateWhatsAppMarketingMessage(
  input: GenerateWhatsAppMarketingMessageInput
): Promise<GenerateWhatsAppMarketingMessageOutput> {
  return generateWhatsAppMarketingMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWhatsAppMarketingMessagePrompt',
  input: { schema: GenerateWhatsAppMarketingMessageInputSchema },
  output: { schema: GenerateWhatsAppMarketingMessageOutputSchema },
  prompt: `Você é um assistente de marketing especializado em criar mensagens de WhatsApp curtas e envolventes para revendedoras de cosméticos.
Sua tarefa é gerar uma mensagem de marketing que seja eficaz para promover ofertas e engajar clientes.

Considere as seguintes informações ao criar a mensagem:

{{#if productName}}
Produto específico: {{{productName}}}
{{/if}}

{{#if customerSegment}}
Segmento de cliente: {{{customerSegment}}}
{{/if}}

{{#if offerDetails}}
Detalhes da oferta: {{{offerDetails}}}
{{/if}}

{{#if tone}}
O tom da mensagem deve ser: {{{tone}}}.
{{else}}
O tom padrão da mensagem deve ser amigável e entusiasmado.
{{/if}}

A mensagem deve ser:
- Curta e direta.
- Envolvente e persuasiva.
- Adequada para ser enviada via WhatsApp.
- Em português.

Gerar apenas a mensagem, sem introduções ou conclusões adicionais.`,
});

const generateWhatsAppMarketingMessageFlow = ai.defineFlow(
  {
    name: 'generateWhatsAppMarketingMessageFlow',
    inputSchema: GenerateWhatsAppMarketingMessageInputSchema,
    outputSchema: GenerateWhatsAppMarketingMessageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
