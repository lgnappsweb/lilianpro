'use server';
/**
 * @fileOverview This file provides a Genkit flow for suggesting optimal times and message types for customer follow-ups
 * for an Avon and Natura reseller.
 *
 * - suggestCustomerFollowUp - A function that handles the customer follow-up suggestion process.
 * - SuggestCustomerFollowUpInput - The input type for the suggestCustomerFollowUp function.
 * - SuggestCustomerFollowUpOutput - The return type for the suggestCustomerFollowUp function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const SuggestCustomerFollowUpInputSchema = z.object({
  customerName: z.string().describe('The full name of the customer.'),
  customerId: z.string().describe('The unique identifier for the customer.'),
  purchaseHistory: z.array(
    z.object({
      orderId: z.string().describe('Unique identifier for the order.'),
      orderDate: z.string().describe('Date of the order in YYYY-MM-DD format.'),
      products: z.array(z.string()).describe('List of product names purchased in this order.'),
      totalAmount: z.number().describe('Total amount of the order.'),
      paymentStatus: z
        .enum(['Pago', 'Pendente', 'Atrasado'])
        .describe('Payment status of the order.'),
    })
  ).describe('A list of the customer\'s past purchase orders.'),
  pendingPayments: z.array(
    z.object({
      orderId: z.string().describe('Unique identifier for the order with pending payment.'),
      dueDate: z.string().describe('Due date of the pending payment in YYYY-MM-DD format.'),
      amountDue: z.number().describe('Amount currently due for this payment.'),
      daysOverdue: z.number().optional().describe('Number of days the payment is overdue, if applicable.'),
    })
  ).describe('A list of outstanding payments for the customer.'),
  lastContactDate: z.string().optional().describe('The date of the last contact with the customer in YYYY-MM-DD format.'),
  customerNotes: z.string().optional().describe('Any additional notes or preferences for the customer.'),
  newProductsAvailable: z.array(z.string()).optional().describe('List of new product names available that might interest the customer.'),
});
export type SuggestCustomerFollowUpInput = z.infer<typeof SuggestCustomerFollowUpInputSchema>;

// Output Schema
const SuggestCustomerFollowUpOutputSchema = z.object({
  recommendedAction: z.object({
    timeframe: z
      .string()
      .describe(
        'The recommended timeframe for the follow-up (e.g., "immediately", "in 2 days", "next week", "end of month").'
      ),
    messageType: z
      .enum([
        'payment_reminder',
        'new_product_alert',
        'loyalty_program_info',
        'general_check_in',
        'birthday_greeting',
        'special_offer',
        'follow_up_on_last_purchase',
      ])
      .describe(
        'The type of message to send (e.g., payment reminder, new product alert, general check-in).'
      ),
    suggestedContent: z
      .string()
      .describe('A template or example message content for the follow-up, suitable for WhatsApp.'),
    reasoning: z
      .string()
      .describe('The reasoning behind this follow-up suggestion.'),
  }).describe('The recommended follow-up action for the customer.'),
});
export type SuggestCustomerFollowUpOutput = z.infer<typeof SuggestCustomerFollowUpOutputSchema>;

// Wrapper function for the flow
export async function suggestCustomerFollowUp(input: SuggestCustomerFollowUpInput): Promise<SuggestCustomerFollowUpOutput> {
  return suggestCustomerFollowUpFlow(input);
}

// Define the prompt
const suggestCustomerFollowUpPrompt = ai.definePrompt({
  name: 'suggestCustomerFollowUpPrompt',
  input: { schema: SuggestCustomerFollowUpInputSchema },
  output: { schema: SuggestCustomerFollowUpOutputSchema },
  prompt: `Você é um assistente de vendas de IA para uma revendedora Avon e Natura. Seu objetivo é sugerir os melhores momentos e tipos de mensagem para acompanhamento de clientes, para manter bons relacionamentos e melhorar os esforços de cobrança.

Considere as seguintes informações do cliente:

Nome do Cliente: {{{customerName}}}
ID do Cliente: {{{customerId}}}
Data do Último Contato: {{{lastContactDate}}}
Notas do Cliente: {{{customerNotes}}}

Histórico de Compras:
{{#if purchaseHistory}}
  {{#each purchaseHistory}}
    - ID do Pedido: {{this.orderId}}, Data: {{this.orderDate}}, Produtos: {{this.products}}, Total: R$ {{this.totalAmount}}, Status: {{this.paymentStatus}}
  {{/each}}
{{else}}
  Nenhum histórico de compra disponível.
{{/if}}

Pagamentos Pendentes:
{{#if pendingPayments}}
  {{#each pendingPayments}}
    - ID do Pedido: {{this.orderId}}, Data de Vencimento: {{this.dueDate}}, Valor Devido: R$ {{this.amountDue}}, Dias Atrasados: {{this.daysOverdue}}
  {{/each}}
{{else}}
  Nenhum pagamento pendente.
{{/if}}

Novos Produtos Disponíveis que podem interessar o cliente:
{{#if newProductsAvailable}}
  {{#each newProductsAvailable}}
    - {{this}}
  {{/each}}
{{else}}
  Nenhum produto novo específico anotado.
{{/if}}

Com base nesses dados, forneça uma única recomendação de acompanhamento acionável.
Certifique-se de que o conteúdo sugerido seja profissional e adequado para um cliente Avon/Natura, preferencialmente formatado para uma mensagem de WhatsApp.
Priorize lembretes de pagamento para pagamentos em atraso ou próximos ao vencimento. Se não houver pagamentos pendentes, concentre-se em oportunidades de vendas, relacionamento ou ofertas especiais.
`
});

// Define the Genkit flow
const suggestCustomerFollowUpFlow = ai.defineFlow(
  {
    name: 'suggestCustomerFollowUpFlow',
    inputSchema: SuggestCustomerFollowUpInputSchema,
    outputSchema: SuggestCustomerFollowUpOutputSchema,
  },
  async (input) => {
    const { output } = await suggestCustomerFollowUpPrompt(input);
    if (!output) {
      throw new Error('Failed to generate customer follow-up suggestion.');
    }
    return output;
  }
);
