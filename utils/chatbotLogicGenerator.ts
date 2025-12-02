
import { db, getCollectionRef, getDocRef } from '../firebase';
import firebase from 'firebase/compat/app';
import { GoogleGenAI, Type } from '@google/genai';
import { Product, Category, SiteInfo, FAQ_Oficial, KB_Item, UpsellMatrixItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export type LogicGenerationMode = 'generate' | 'update' | 'improve' | 'diagnose';

interface GenerationResult {
    success: boolean;
    message: string;
    auditReport?: string;
}

interface StoreChangesResult {
    hasChanges: boolean;
    message: string;
    changeCount: number;
}

// --- MÓDULOS DE ANÁLISE INTERNA ---

const analyzeFirestore = async (storeId: string): Promise<string> => {
    const collections = ['products', 'categories', 'sales', 'clientes', 'serviceOrders', 'settings', 'kb_chatbot', 'faq_oficial', 'conversas', 'audit_logs'];
    let report = "### 1. Mapeamento do Firestore (Banco de Dados)\n";

    for (const col of collections) {
        try {
            // FIX: Use getCollectionRef with storeId
            const colRef = getCollectionRef(col, storeId);
            const countSnap = await colRef.get(); 
            const totalDocs = countSnap.size;
            
            const snap = await colRef.limit(1).get();
            
            report += `- **Coleção: /${col}** (${totalDocs} documentos)\n`;
            
            if (!snap.empty) {
                const sampleDoc = snap.docs[0].data();
                const fields = Object.keys(sampleDoc).map(key => {
                    const val = sampleDoc[key];
                    let type: string = typeof val;
                    if (val && typeof val === 'object' && 'seconds' in val) type = 'Timestamp'; 
                    if (Array.isArray(val)) type = `Array<${val.length > 0 ? typeof val[0] : 'any'}>`;
                    if (val === null) type = 'null';
                    return `${key}: ${type}`;
                }).join(', ');
                report += `  - Schema Detectado: { ${fields} }\n`;
                
                if (col === 'conversas') {
                    report += `  - Subcoleções: /messages (Logs do chat)\n`;
                }
            } else {
                report += `  - (Coleção Vazia)\n`;
            }
        } catch (e) {
            report += `  - [ERRO DE LEITURA]: ${(e as Error).message}\n`;
        }
    }
    
    report += "\n**Relacionamentos Detectados (Categorias -> Produtos):**\n";
    try {
        const catSnap = await getCollectionRef('categories', storeId).get();
        const categories = catSnap.docs.map(d => d.data() as Category);
        for (const cat of categories) {
            const prodCount = (await getCollectionRef('products', storeId).where('category', '==', cat.id).get()).size;
            report += `- Categoria '${cat.name}' (ID: ${cat.id}) possui ${prodCount} produtos ativos.\n`;
        }
    } catch (e) {
        report += "  - Erro ao mapear relacionamentos.\n";
    }

    return report;
};

const analyzeStorage = (): string => {
    return `
### 2. Mapeamento do Firebase Storage
- **Estrutura de Pastas Identificada:**
  - \`/products\`: Imagens de produtos referenciadas nos documentos.
  - \`/uploads\`: Uploads gerais do painel administrativo (logos, assets).
  - \`/profile\`: Fotos de perfil de usuários/funcionários.
  - \`/banners\`: Imagens utilizadas nos banners promocionais.
  - \`/chat\`: Mídia enviada durante interações no chat.
  - \`/conversas\`: Logs ou anexos gerados nas conversas.
- **Tipos de Arquivo Suportados:** Imagens (JPG, PNG, WEBP).
- **Acesso:** Público via URLs geradas (tokens de download), gerenciado pela aplicação.
`;
};

const analyzeFrontend = (): string => {
    return `
### 3. Mapeamento do Front-End (ChatWidget.tsx e Tipos)
**Interfaces TypeScript (Estruturas de Dados):**
- \`Product\`: { id: string, name: string, price: number, details: string, category: string, variants: Array, ... }
- \`Category\`: { id: string, name: string, specTemplates: string[] }
- \`SiteInfo\`: { storeName, rates: { debit: number, credit: Record<number, number> }, customTexts: {...}, links: {...} }
- \`ChatMessage\`: { role: 'user'|'assistant', text: string, actions?: Action[] }
- \`Action\`: { name: string, args: any }

**Contextos de Execução:**
- \`onCategorySelect\`: Função callback que altera a visualização da loja para uma categoria específica.
- \`siteInfo\`: Objeto global injetado contendo configurações, taxas e textos.

**Function Declarations (Ferramentas Nativas Disponíveis para a IA):**
1. **\`showCategory(categoryId: string, buttonLabel: string)\`**
   - *Função:* Renderiza um botão interativo. Ao clicar, o front-end filtra a lista de produtos.
   - *Uso:* Quando o cliente pede para ver "iPhones", "Acessórios", etc.
2. **\`redirectToWhatsApp(message: string, buttonLabel: string)\`**
   - *Função:* Renderiza um botão finalizador que abre o WhatsApp de Vendas.
   - *Uso:* Fechamento de venda. O argumento \`message\` deve conter o resumo completo do pedido.

**Renderização de UI:**
- **Mensagens:** Suportam HTML seguro básico (\`<br/>\`, \`<b>\`, \`<i>\`). Markdown **NÃO** é suportado.
- **Botões de Ação:** Renderizados separadamente abaixo do balão de texto.
- **Estilo:** Balões flutuantes, cores configuráveis via \`siteInfo.chatWidget\`.
`;
};

const analyzeLogic = (siteInfo: SiteInfo): string => {
    const creditTable = Object.entries(siteInfo.rates.credit)
        .map(([p, r]) => `${p}x: +${(Number(r) * 100).toFixed(2)}%`)
        .join('; ');

    return `
### 4. Mapeamento Lógico e Regras de Negócio
**Precificação Dinâmica:**
- **Preço Base:** Armazenado no campo \`price\` do produto.
- **Preço "À Vista":** É o Preço Base (ou com desconto se configurado).
- **Preço no Débito:** Preço Base * (1 + ${siteInfo.rates.debit}).
- **Preço no Crédito:** Preço Base * (1 + Taxa da Parcela).
  - Tabela de Juros do Lojista: ${creditTable}

**Funil de Vendas (Protocolo de Atendimento):**
1. **Recepção:** Saudação amigável usando o nome do assistente (${siteInfo.customTexts.aiAssistantName}).
2. **Qualificação:** Identificar necessidade (Modelo, Cor, Capacidade).
3. **Oferta:** Apresentar opções disponíveis no catálogo (usando dados reais).
4. **Upsell:** Oferecer acessórios ou serviços (ex: garantia, película).
5. **Fechamento:** Calcular valores finais (parcelas) e gerar link do WhatsApp.

**Integrações e Persistência:**
- **WhatsApp:** Acionado via URL scheme (\`wa.me\`) com texto codificado.
- **Histórico:** Conversas são salvas na coleção \`conversas\` com timestamp e preview.
`;
};


export const generateChatbotLogic = async (storeId: string, mode: LogicGenerationMode = 'generate'): Promise<GenerationResult> => {
    try {
        // --- FASE 1: COLETA DE DADOS E MAPEAMENTO (SCAN) ---
        const [
            firestoreMap,
            siteInfoSnap,
            productsSnap,
            categoriesSnap,
            kbSnap,
            faqSnap,
            currentConfigSnap
        ] = await Promise.all([
            analyzeFirestore(storeId),
            getDocRef('settings', 'siteInfo', storeId).get(),
            getCollectionRef('products', storeId).where('price', '>', 0).limit(150).get(),
            getCollectionRef('categories', storeId).orderBy('order').get(),
            getCollectionRef('kb_chatbot', storeId).get(),
            getCollectionRef('faq_oficial', storeId).get(),
            getDocRef('chatbot_config', 'cliente_publico', storeId).get()
        ]);

        const siteInfo = siteInfoSnap.data() as SiteInfo;
        const currentPrompt = currentConfigSnap.exists ? currentConfigSnap.data()?.systemPrompt : '';
        
        const storageMap = analyzeStorage();
        const frontendMap = analyzeFrontend();
        const logicMap = analyzeLogic(siteInfo);

        // Prepara amostras de dados para o prompt do Arquiteto
        const productsSample = productsSnap.docs.map(d => {
            const p = d.data() as Product;
            const hasStock = !p.name.toLowerCase().includes('esgotado');
            return `- ${p.name} (${p.category}) ${hasStock ? '[DISPONÍVEL]' : '[ESGOTADO]'}: R$ ${p.price.toFixed(2)} | Detalhes: ${p.details || 'N/A'}`;
        }).join('\n');

        const categoriesList = categoriesSnap.docs.map(d => {
            const c = d.data() as Category;
            return `ID: "${c.id}" -> Nome: "${c.name}"`;
        }).join('\n');

        const kbContent = kbSnap.docs.map(d => `[${d.data().categoria.toUpperCase()}] ${d.data().titulo}: ${d.data().conteudo}`).join('\n');
        const faqContent = faqSnap.docs.map(d => `P: ${d.data().pergunta} | R: ${d.data().resposta}`).join('\n');

        // --- FASE 2: DEFINIÇÃO DE ESTRATÉGIA ---
        let strategicDirective = "";
        if (mode === 'generate') {
            strategicDirective = "Crie um Prompt Mestre NOVO e COMPLETO. Ignore versões anteriores. Defina personalidade, regras de segurança, fluxo de vendas e uso de ferramentas do zero, estritamente baseado nos mapas fornecidos.";
        } else if (mode === 'update') {
            strategicDirective = "Atualize os dados do Prompt Mestre existente (lista de produtos, taxas, categorias) mantendo a estrutura lógica e personalidade atuais. Apenas reflita as mudanças do banco de dados.";
        } else if (mode === 'improve') {
            strategicDirective = "Otimize o Prompt Mestre para maior conversão. Melhore a persuasão, torne o texto mais natural, elimine loops lógicos e refine os gatilhos de ferramentas para serem mais precisos.";
        } else if (mode === 'diagnose') {
            strategicDirective = "Execute apenas a AUDITORIA. Não gere um novo prompt. Analise inconsistências entre produtos e categorias, falhas nas taxas, produtos sem categoria ou lacunas de conhecimento na KB.";
        }

        // --- FASE 3: EXECUÇÃO DO ARQUITETO (GEMINI 3 PRO) ---
        const architectPrompt = `
            Você é o **ARQUITETO DE SISTEMAS DE IA** (Gemini 3 Pro).
            Sua função é analisar a estrutura completa de um E-commerce e gerar o "Cérebro" (System Prompt) do chatbot de vendas.
            
            **MODO DE OPERAÇÃO:** ${mode.toUpperCase()}
            **DIRETRIZ:** ${strategicDirective}

            --- 1. MAPEAMENTO TÉCNICO (ESTRUTURA) ---
            ${firestoreMap}
            ${storageMap}
            ${frontendMap}
            
            --- 2. MAPEAMENTO DE NEGÓCIO (LÓGICA) ---
            ${logicMap}

            --- 3. DADOS REAIS (SNAPSHOT DO BANCO) ---
            **Categorias Válidas:**
            ${categoriesList}

            **Amostra de Produtos (Contexto de Venda):**
            ${productsSample}

            **Base de Conhecimento (RAG & FAQ):**
            ${kbContent}
            ${faqContent}

            **Prompt Atual (Referência para Update/Improve):**
            ${currentPrompt ? currentPrompt.substring(0, 3000) + "..." : "(Nenhum prompt anterior)"}

            --- INSTRUÇÕES DE SAÍDA OBRIGATÓRIAS ---
            O Prompt Mestre gerado DEVE conter explicitamente:
            1.  **Identidade:** Nome (${siteInfo.customTexts.aiAssistantName}), tom (${siteInfo.customTexts.brandVoice}).
            2.  **Fluxo de Vendas (NOVO PROTOCOLO OBRIGATÓRIO):**
                - **Fase 1 (Oferta Inicial):** Ao ser perguntado o preço de um produto, o bot DEVE responder com o preço à vista E o valor da parcela em 12x. O cálculo da parcela de 12x deve ser feito usando a Tabela de Juros. Exemplo: "O iPhone 15 está R$ 5.000,00 à vista, ou em 12x de R$ 512,50 no cartão.". Logo após, deve perguntar a forma de pagamento preferida.
                - **Fase 2 (Upsell):** Opcionalmente, oferecer acessórios. Se o cliente aceitar, o valor total deve ser recalculado.
                - **Fase 3 (Detalhes do Pagamento):** Se o cliente escolher "cartão" ou "parcelado", o bot DEVE perguntar o número exato de parcelas. NÃO assuma 12x.
                - **Fase 4 (Cálculo Final):** Após o cliente informar as parcelas, o bot DEVE confirmar o valor final e da parcela e, em seguida, ir para a finalização.
                - **Fase 5 (Finalização):** Usar a ferramenta 'redirectToWhatsApp' com o resumo completo.
            3.  **Lógica Financeira:** A tabela de juros exata extraída dos dados.
            4.  **Function Calling:** Regras estritas para usar \`showCategory\` e \`redirectToWhatsApp\`.
            5.  **Catálogo:** A lista de produtos e categorias.
            6.  **Formatação:** Uso obrigatório de HTML (<br/>) e proibição de Markdown.
            7.  **Comportamento:** Vendedor proativo e "agressivo" (no bom sentido) para fechar venda.

            Retorne um objeto JSON estritamente válido:
            {
              "masterPrompt": "STRING_COM_O_PROMPT_COMPLETO",
              "auditReport": "STRING_COM_RELATORIO_TECNICO_MARKDOWN"
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: architectPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        masterPrompt: { type: Type.STRING },
                        auditReport: { type: Type.STRING }
                    },
                    required: ['masterPrompt', 'auditReport']
                },
                thinkingConfig: { thinkingBudget: 4096 } // Orçamento alto para raciocínio arquitetural
            }
        });

        const result = JSON.parse(response.text);

        // --- FASE 4: PERSISTÊNCIA ---
        if (mode !== 'diagnose' && result.masterPrompt) {
            const batch = db.batch();
            
            // Create Version History before updating
            if (currentPrompt) {
                const historyRef = db.collection('stores').doc(storeId).collection('chatbot_config').doc('cliente_publico').collection('versions').doc();
                batch.set(historyRef, {
                    configId: 'cliente_publico',
                    systemPrompt: currentPrompt,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    author: 'AI Architect (Auto-Version)',
                    changeNote: `Versão anterior antes de: ${mode}`
                });
            }

            // Atualiza a configuração do chatbot com o novo Prompt Mestre
            const configRef = getDocRef('chatbot_config', 'cliente_publico', storeId);
            batch.set(configRef, {
                systemPrompt: result.masterPrompt,
                lastAutoGenerated: firebase.firestore.FieldValue.serverTimestamp(),
                generationMode: mode,
                modelUsed: 'gemini-3-pro-preview'
            }, { merge: true });

            // Registra o log de auditoria
            const logRef = getCollectionRef('audit_logs', storeId).doc();
            batch.set(logRef, {
                action: `chatbot_logic_${mode}`,
                user: 'AI Architect (System)',
                details: { report: result.auditReport },
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                isOutsideBusinessHours: false
            });

            await batch.commit();
        }

        return {
            success: true,
            message: mode === 'diagnose' ? "Diagnóstico concluído. Veja o relatório." : `Lógica gerada e aplicada com sucesso (Modo: ${mode}).`,
            auditReport: result.auditReport
        };

    } catch (error: any) {
        console.error(`Falha no Arquiteto de IA (${mode}):`, error);
        return {
            success: false,
            message: `Erro crítico ao gerar lógica: ${error.message}`,
            auditReport: "Falha na execução da análise interna."
        };
    }
};


// --- NOVAS FUNÇÕES DE SUPORTE ---

export const regenerateUpsellMatrix = async (storeId: string): Promise<{ success: boolean, message: string, count: number }> => {
    try {
        const productsSnap = await getCollectionRef('products', storeId).where('price', '>', 0).get();
        const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

        if (products.length === 0) return { success: false, message: "Nenhum produto encontrado.", count: 0 };

        const productListText = products.map(p => `ID: ${p.id}, NOME: ${p.name}, CAT: ${p.category}`).join('\n');

        const prompt = `
            Você é um estrategista de vendas. Analise a lista de produtos abaixo e crie uma "Matriz de Upsell Inteligente".
            
            Para cada produto principal (como iPhones, Consoles, Caixas de Som), identifique quais acessórios (Capas, Películas, Jogos, Cabos) são compatíveis e complementares.
            
            LISTA DE PRODUTOS:
            ${productListText}
            
            Retorne um ARRAY JSON de objetos. Cada objeto deve ter:
            - "triggerProductKeyword": Palavra-chave do produto principal (ex: "iPhone 13", "PS5").
            - "suggestedProductIds": Array com os IDs exatos dos acessórios compatíveis.
            - "reason": Curta explicação de venda (ex: "Proteção essencial para a tela").
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            triggerProductKeyword: { type: Type.STRING },
                            suggestedProductIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                            reason: { type: Type.STRING }
                        },
                        required: ['triggerProductKeyword', 'suggestedProductIds', 'reason']
                    }
                }
            }
        });

        const matrix = JSON.parse(response.text) as UpsellMatrixItem[];
        
        // Save to Firestore
        await getDocRef('chatbot_config', 'cliente_publico', storeId).set({ upsellMatrix: matrix }, { merge: true });
        
        return { success: true, message: "Matriz de Upsell gerada com sucesso.", count: matrix.length };

    } catch (error: any) {
        console.error("Upsell Gen Error:", error);
        return { success: false, message: `Erro: ${error.message}`, count: 0 };
    }
};

export const detectStoreChanges = async (storeId: string): Promise<StoreChangesResult> => {
    try {
        const configDoc = await getDocRef('chatbot_config', 'cliente_publico', storeId).get();
        const lastGenerated = configDoc.data()?.lastAutoGenerated;

        if (!lastGenerated) {
            return { hasChanges: true, message: "Lógica nunca foi gerada.", changeCount: 999 };
        }

        // Check audit logs for changes after the last generation
        const changesSnap = await getCollectionRef('audit_logs', storeId)
            .where('timestamp', '>', lastGenerated)
            .where('action', 'in', ['product_created', 'product_updated', 'product_deleted', 'config_alterada'])
            .get();
        
        const count = changesSnap.size;
        
        if (count > 0) {
            return { hasChanges: true, message: `${count} alterações detectadas na loja desde o último treino.`, changeCount: count };
        }
        
        return { hasChanges: false, message: "Lógica está sincronizada com a loja.", changeCount: 0 };

    } catch (error) {
        return { hasChanges: false, message: "Erro ao verificar mudanças.", changeCount: 0 };
    }
};
