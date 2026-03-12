
'use server';
/**
 * @fileOverview Este arquivo implementa um fluxo Genkit para gerar um resumo de vendas mensal em linguagem natural.
 *
 * - generateMonthlySalesSummary - Uma função que lida com a geração do resumo de vendas mensal.
 * - GenerateMonthlySalesSummaryInput - O tipo de entrada para a função generateMonthlySalesSummary.
 * - GenerateMonthlySalesSummaryOutput - O tipo de retorno para a função generateMonthlySalesSummary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMonthlySalesSummaryInputSchema = z.object({
  month: z.string().describe('O nome do mês (ex: "Janeiro").'),
  year: z.number().describe('O ano para o resumo de vendas.'),
  totalSalesMonth: z.number().describe('Valor total de vendas no mês.'),
  totalReceivedMonth: z.number().describe('Valor total recebido no mês.'),
  totalPendingMonth: z.number().describe('Valor total pendente no mês.'),
  numberOfClients: z.number().describe('Número total de clientes ativos.'),
  numberOfOrders: z.number().describe('Número total de pedidos realizados.'),
  topSellingProducts: z
    .array(
      z.object({
        name: z.string().describe('Nome do produto.'),
        quantity: z.number().describe('Quantidade vendida.'),
      })
    )
    .describe('Uma lista dos produtos mais vendidos com suas quantidades.'),
  totalProductsRegistered: z.number().describe('Número total de produtos registrados no catálogo.'),
});
export type GenerateMonthlySalesSummaryInput = z.infer<
  typeof GenerateMonthlySalesSummaryInputSchema
>;

const GenerateMonthlySalesSummaryOutputSchema = z.object({
  summary: z.string().describe('Um resumo em linguagem natural das vendas mensais, tendências e insights.'),
});
export type GenerateMonthlySalesSummaryOutput = z.infer<
  typeof GenerateMonthlySalesSummaryOutputSchema
>;

export async function generateMonthlySalesSummary(
  input: GenerateMonthlySalesSummaryInput
): Promise<GenerateMonthlySalesSummaryOutput> {
  try {
    // Chama o fluxo e garante que ele retorne um objeto válido mesmo em caso de falha interna
    const result = await generateMonthlySalesSummaryFlow(input);
    return result;
  } catch (error: any) {
    console.error("Erro fatal no fluxo de resumo mensal:", error);
    return {
      summary: "O resumo inteligente está temporariamente indisponível. Para ativá-lo, configure a chave GEMINI_API_KEY no arquivo .env."
    };
  }
}

const prompt = ai.definePrompt({
  name: 'generateMonthlySalesSummaryPrompt',
  input: {schema: GenerateMonthlySalesSummaryInputSchema},
  output: {schema: GenerateMonthlySalesSummaryOutputSchema},
  prompt: `Você é um assistente de IA especializado em analisar dados de vendas para revendedoras Avon e Natura. Sua tarefa é fornecer um resumo detalhado e perspicaz em linguagem natural sobre o desempenho de vendas mensal.

Analise os dados fornecidos para o mês de {{{month}}} de {{{year}}} e destaque tendências importantes, indicadores-chave de desempenho e insights sobre a saúde do negócio. Foque no que esses números significam para a revendedora e forneça observações acionáveis.

Aqui estão os dados de vendas:

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

Com base nessas informações, forneça um resumo detalhado. Seu resumo deve:
1. Começar com uma avaliação geral do desempenho do mês.
2. Discutir os destaques financeiros e o que eles significam.
3. Analisar tendências de clientes e pedidos.
4. Destacar o desempenho dos produtos.
5. Identificar áreas de melhoria ou tendências positivas.
6. Manter uma linguagem natural, profissional e fácil de entender.
`,
});

const generateMonthlySalesSummaryFlow = ai.defineFlow(
  {
    name: 'generateMonthlySalesSummaryFlow',
    inputSchema: GenerateMonthlySalesSummaryInputSchema,
    outputSchema: GenerateMonthlySalesSummaryOutputSchema,
  },
  async input => {
    try {
      // Tenta gerar a resposta da IA. Se a API Key estiver ausente, o Genkit lançará um erro aqui.
      const {output} = await prompt(input);
      
      if (!output || !output.summary) {
        return {
          summary: "A IA não conseguiu gerar o resumo com os dados atuais. Por favor, tente novamente mais tarde."
        };
      }
      
      return output;
    } catch (error: any) {
      // Captura o erro (ex: falta de chave de API) e retorna um fallback sem quebrar o servidor
      console.error("Erro ao chamar prompt da IA:", error.message || error);
      
      return {
        summary: "Os insights automáticos do mês não puderam ser gerados agora. Verifique se a sua chave de API do Google Gemini está configurada corretamente no ambiente de desenvolvimento."
      };
    }
  }
);
