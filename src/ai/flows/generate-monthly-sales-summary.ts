
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

/**
 * Função principal para gerar o resumo. 
 * É ultra-segura para evitar que o Next.js quebre se a chave de IA estiver faltando.
 */
export async function generateMonthlySalesSummary(
  input: GenerateMonthlySalesSummaryInput
): Promise<GenerateMonthlySalesSummaryOutput> {
  // Verificação rápida de ambiente para evitar chamadas inúteis que resultam em erro fatal
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    return {
      summary: "O resumo inteligente está aguardando a configuração da GEMINI_API_KEY no arquivo .env para ser ativado."
    };
  }

  try {
    const result = await generateMonthlySalesSummaryFlow(input);
    return result;
  } catch (error: any) {
    console.warn("Aviso: Falha controlada ao gerar resumo mensal de IA:", error.message || "Erro desconhecido");
    return {
      summary: "Não foi possível gerar os insights automáticos agora. Verifique sua conexão e a validade da chave de API do Google Gemini."
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
      // Tenta gerar a resposta da IA.
      const {output} = await prompt(input);
      
      if (!output || !output.summary) {
        return {
          summary: "A IA processou os dados, mas não conseguiu formatar um resumo legível no momento."
        };
      }
      
      return output;
    } catch (error: any) {
      // Captura o erro específico do Genkit e retorna um fallback seguro
      console.warn("Erro controlado dentro do fluxo Genkit:", error.message || error);
      
      return {
        summary: "Os insights automáticos do mês estão temporariamente indisponíveis devido a uma falha na comunicação com o serviço de IA."
      };
    }
  }
);
