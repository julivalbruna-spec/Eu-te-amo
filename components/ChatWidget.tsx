
import React, { useState, useEffect, useRef } from 'react';
import { getCollectionRef, getDocRef } from '../firebase';
import firebase from 'firebase/compat/app';
import { SiteInfo, ChatMessage, Product, CategoryId, Action, Category } from '../types';
// FIX: Add AlertCircle for toast notifications
import { MessageSquare, X, Send, ShoppingCart, MessageCircle, Grid, Zap, Loader, AlertCircle } from 'react-feather';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface ChatWidgetProps {
    storeId: string;
    siteInfo: SiteInfo;
    allProducts: Product[];
    categories: Category[];
    onCategorySelect: (categoryId: CategoryId) => void;
    isCartOpen?: boolean;
}

const getSessionId = (storeId: string): string => {
    let sid = localStorage.getItem(`chatbot_session_id_${storeId}`);
    if (!sid) {
        sid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(`chatbot_session_id_${storeId}`, sid);
    }
    return sid;
};

// --- TOOLS DEFINITION ---
const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'showCategory',
        description: 'Mostra uma categoria de produtos específica na loja (filtra a lista). Use quando o cliente pedir para ver "iPhones", "Acessórios", "JBL", "Promoções", etc.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                categoryId: {
                    type: Type.STRING,
                    description: 'O ID da categoria (ex: "iphones_novos", "seminovos", "acessorios", "black_friday").'
                },
                buttonLabel: {
                    type: Type.STRING,
                    description: 'Texto do botão (ex: "Ver Todos os iPhones", "Ver Ofertas").'
                }
            },
            required: ['categoryId', 'buttonLabel']
        }
    },
    {
        name: 'redirectToWhatsApp',
        description: 'Gera um botão FINAL para levar o cliente ao WhatsApp. USE APENAS NO FINAL DA VENDA, após calcular e informar o valor final.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                message: {
                    type: Type.STRING,
                    description: 'A mensagem completa com o resumo do pedido (Produtos + Acessórios + Forma Pagamento + Total Parcelado).'
                },
                buttonLabel: {
                    type: Type.STRING,
                    description: 'Texto do botão (ex: "Finalizar Compra no WhatsApp").'
                }
            },
            required: ['message', 'buttonLabel']
        }
    }
];

const ChatWidget: React.FC<ChatWidgetProps> = ({ storeId, siteInfo, allProducts, categories, onCategorySelect, isCartOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [sessionId] = useState(getSessionId(storeId));
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [baseSystemPrompt, setBaseSystemPrompt] = useState<string>('');
    const [customSystemPrompt, setCustomSystemPrompt] = useState<string>('');
    // FIX: Add state for a local notification system.
    const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);

    // FIX: Implement a local showToast function to display notifications.
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({message, type});
        setTimeout(() => setNotification(null), 3500);
    };

    // Force initialization timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isInitializing) {
                console.warn("Forcing ChatWidget initialization due to timeout.");
                if (!baseSystemPrompt) setBaseSystemPrompt("Você é um assistente útil da loja.");
                setIsInitializing(false);
            }
        }, 4000); // 4 seconds timeout
        return () => clearTimeout(timer);
    }, [isInitializing, baseSystemPrompt]);

    // Carregar prompt do admin ao iniciar (uma vez)
    useEffect(() => {
        if (!storeId) return;
        const fetchConfig = async () => {
            try {
                const doc = await getDocRef('chatbot_config', 'cliente_publico', storeId).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data && data.systemPrompt) {
                        setBaseSystemPrompt(String(data.systemPrompt));
                        return;
                    }
                }
                // Fallback se não houver config
                setBaseSystemPrompt("Você é um assistente útil da loja.");
            } catch (error) {
                console.error("Erro ao carregar config do chat:", error);
                setBaseSystemPrompt("Você é um assistente útil da loja.");
            }
        };
        fetchConfig();
    }, [storeId]);

    // Construir o prompt completo sempre que a base ou os produtos mudarem
    useEffect(() => {
        // Aguarda o baseSystemPrompt ser carregado (mesmo que seja o fallback)
        if (!baseSystemPrompt) {
            return;
        }

        let fullPrompt = baseSystemPrompt;

        if (allProducts.length > 0) {
            const productList = allProducts.map(p => {
                const specs = p.specifications ? Object.entries(p.specifications).map(([k,v]) => `${k}: ${v}`).join(', ') : '';
                return `- ${p.name} (${p.category}): R$ ${p.price.toFixed(2)} ${specs ? `[Specs: ${specs}]` : ''}`;
            }).join('\n');
            fullPrompt += `\n\n[REAL-TIME INVENTORY - TRUTH SOURCE]\n${productList}\n\nIMPORTANT: This inventory list overrides any previous knowledge. If a product is not here, it is out of stock.`;
        } else {
            fullPrompt += `\n\n[INVENTORY STATUS]\nNo products currently listed available. Assume out of stock for specific requests unless told otherwise.`;
        }
        
        setCustomSystemPrompt(fullPrompt);
        // Importante: Definir isInitializing como false aqui para liberar o chat
        setIsInitializing(false);

    }, [baseSystemPrompt, allProducts]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isInitializing]);

    const playSound = (url?: string) => {
        if (!url) return;
        try {
            const audio = new Audio(url);
            audio.play().catch(e => console.warn("Autoplay prevented:", e));
        } catch (e) {
            console.error("Error playing sound:", e);
        }
    };

    // Inicialização Inteligente
    useEffect(() => {
        if (isOpen && messages.length === 0 && !isInitializing) {
            handleInitialGreeting();
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, isInitializing, messages.length]);

    const handleInitialGreeting = async () => {
        // Evita chamar se já estiver processando ou inicializando
        if (isLoading) return;
        
        try {
            // Simula "digitando..."
            await new Promise(r => setTimeout(r, 600));
            
            const aiName = siteInfo.customTexts.aiAssistantName || 'Assistente';
            const storeName = siteInfo.storeName || 'Loja';
            const pronoun = siteInfo.customTexts.aiAssistantPronoun || 'sua';
            
            const defaultGreeting = `Olá! 👋 Bem-vindo à ${storeName}! <br/><br/>Sou ${aiName}, ${pronoun} assistente virtual.`;
            const finalGreeting = siteInfo.customTexts.aiInitialMessage || defaultGreeting;
            
            // MENSAGEM INICIAL
            const greeting: ChatMessage = {
                role: 'assistant',
                text: finalGreeting,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
             const greeting2: ChatMessage = {
                role: 'assistant',
                text: `Posso te ajudar a encontrar o produto ideal, calcular parcelas ou tirar dúvidas. O que você procura hoje?`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            
            playSound(siteInfo.chatWidget?.receiveSoundUrl);
            setMessages([greeting]);
            // Pequena pausa para a segunda mensagem
            setTimeout(() => {
                 setMessages(prev => [...prev, greeting2]);
                 playSound(siteInfo.chatWidget?.receiveSoundUrl);
            }, 800);

        } catch (e) {
            console.error("Erro na saudação inicial", e);
        }
    };

    const handleActionClick = (messageIndex: number, action: Action) => {
        // Executa a ação
        if (action.name === 'showCategory') {
            onCategorySelect(action.args.categoryId);
            // Opcional: fechar o chat em mobile para ver os produtos
            if (window.innerWidth < 768) setIsOpen(false);
        } else if (action.name === 'redirectToWhatsApp') {
            const text = encodeURIComponent(action.args.message || 'Olá!');
            const url = `https://wa.me/${siteInfo.links.whatsappSales}?text=${text}`;
            window.open(url, '_blank');
        }

        // Marca as ações dessa mensagem como usadas
        setMessages(prev => prev.map((msg, idx) => 
            idx === messageIndex ? { ...msg, actionsUsed: true } : msg
        ));
    };

    const createBubbles = (text: string): string[] => {
        const safeText = text.replace(/<br\s*\/?>/gi, '\n');
        
        // Divide por pontuação (., !, ?, :, \n) seguida de espaço ou fim de string.
        const parts = safeText.split(/([.!?:\n]+(?:\s+|$))/);
        
        const sentences: string[] = [];
        
        // Reconstrói as sentenças juntando o texto com seu delimitador
        for (let i = 0; i < parts.length; i += 2) {
            const content = parts[i];
            const delimiter = parts[i + 1] || "";
            if (content.trim() || delimiter.trim()) {
                sentences.push(content + delimiter);
            }
        }

        const bubbles: string[] = [];
        let currentBubble = "";
        // Limite suave para agrupar frases curtas
        const CHAR_LIMIT = 150; 

        for (const sentence of sentences) {
            if (!currentBubble) {
                currentBubble = sentence;
            } else {
                if (currentBubble.length + sentence.length <= CHAR_LIMIT) {
                     currentBubble += sentence;
                } else {
                    bubbles.push(currentBubble.trim().replace(/\n/g, '<br/>'));
                    currentBubble = sentence;
                }
            }
        }

        if (currentBubble.trim()) {
            bubbles.push(currentBubble.trim().replace(/\n/g, '<br/>'));
        }
        
        // Post-processing to merge emoji-only bubbles with their predecessor.
        const finalBubbles: string[] = [];
        const emojiOnlyRegex = /^(?:\s*|(?:\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Component}|\u200d)+)+$/u;
        
        for (const bubble of bubbles) {
            const cleanBubble = bubble.replace(/<br\s*\/?>/gi, '').trim();
            const isEmojiOnly = emojiOnlyRegex.test(cleanBubble);
            
            if (isEmojiOnly && finalBubbles.length > 0) {
                 finalBubbles[finalBubbles.length - 1] += ` ${bubble.trim()}`;
            } else {
                finalBubbles.push(bubble);
            }
        }
        
        // NEW MERGE LOGIC for fragmented list items
        const mergedBubbles: string[] = [];
        let i = 0;
        while (i < finalBubbles.length) {
            const current = finalBubbles[i];
            const next = finalBubbles[i + 1];
            
            // Check if the current bubble is ONLY a list marker, optionally with whitespace or <br>
            const cleanCurrent = current.replace(/<br\s*\/?>/gi, '').trim();
            // Matches "1.", "a)", "*", "-", "•" etc.
            const isListMarker = /^(\d+\.|[a-z][.)]|\*|-|•)$/i.test(cleanCurrent);

            if (isListMarker && next) {
                // Merge current marker with the next bubble
                // Remove any <br> from the marker and add a space before the next content
                mergedBubbles.push(current.replace(/<br\s*\/?>/gi, '').trim() + ' ' + next.trimStart());
                i += 2; // Move past the merged item
            } else {
                mergedBubbles.push(current);
                i++;
            }
        }

        return mergedBubbles.filter(b => b.trim().length > 0);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || isInitializing) {
            if (isInitializing) {
                // Se demorar muito, tenta forçar a liberação
                showToast('Conectando ao assistente...', 'success');
            }
            return;
        }

        const userText = input;
        setInput('');
        setIsLoading(true);
        
        playSound(siteInfo.chatWidget?.sendSoundUrl);

        // 1. Salva mensagem do usuário IMEDIATAMENTE
        const userMsg: ChatMessage = {
            role: 'user',
            text: userText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        setMessages(prev => [...prev, userMsg]);
        
        // Salva User Msg no Firestore
        try {
             const convoRef = getDocRef('conversas', sessionId, storeId);
             const messagesRef = getCollectionRef('messages', `${storeId}/conversas/${sessionId}`);
             await convoRef.set({ 
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                preview: userText.substring(0, 50)
            }, { merge: true });
            await messagesRef.add(userMsg);
        } catch(e) { console.error(e) }


        try {
            // 2. Prepara Contexto Dinâmico
            const accessoriesContext = allProducts
                .filter(p => p.category === 'acessorios' || p.category === 'jbl' || p.category === 'smartwatch')
                .map(p => `- ${p.name}: R$ ${p.price.toFixed(2)}`)
                .join('\n');

            const categoriesList = categories.map(c => `${c.name} (ID: ${c.id})`).join(', ');

            // Formata a tabela de juros de forma muito explicita para a IA
            const ratesList = Object.entries(siteInfo.rates.credit)
                .map(([p, rate]) => `Para ${p} parcelas, multiplique o valor à vista por ${1 + Number(rate)}`)
                .join('\n');

            // Base prompt de segurança
            const safetyPrompt = `
                DIRETRIZES TÉCNICAS (IMPORTANTE):
                1. NUNCA escreva representações de botões como '[BUTTON...]' ou json no texto.
                2. PARA CRIAR BOTÕES: Use EXCLUSIVAMENTE as ferramentas (function calling) 'showCategory' ou 'redirectToWhatsApp'.
                3. Se você chamar uma função, NÃO precisa descrever o botão no texto. O sistema renderizará o botão automaticamente.
                4. Seja conciso e direto.
                5. PROIBIDO MARKDOWN: NUNCA use '**' para negrito, nem '*' ou '-' para listas (bullets). O chat não renderiza markdown e mostra os caracteres.
                6. FORMATAÇÃO: Use texto puro. Para quebras de linha, use a tag HTML <br/>. Evite <br/><br/> para não criar espaços grandes.
                7. EMOJIS: Use no máximo 1 ou 2 por resposta. Emojis devem estar no final das frases, NUNCA sozinhos em uma mensagem.
            `;

            // PROTOCOLO DE VENDAS (FUNIL)
            const salesProtocol = `
                **VOCÊ É UM VENDEDOR EXPERIENTE. SIGA ESTE FUNIL:**

                FASE 0: COMBO / MÚLTIPLOS ITENS (ALTA PRIORIDADE)
                - Se o cliente pedir múltiplos itens (ex: "Quero um Redmi 13 e película"):
                  1. Identifique todos os itens no estoque/acessórios.
                  2. NÃO use 'showCategory' se identificar os produtos.
                  3. Liste os itens e preços individuais.
                  4. Informe o VALOR TOTAL da soma.
                  5. Vá direto para FASE 3 (Pagamento).

                FASE 1: OFERTA INICIAL
                - Ao identificar o produto que o cliente quer, você DEVE responder com o preço à vista E o valor da parcela em 12x.
                - **CÁLCULO OBRIGATÓRIO (12x):** Use a 'TABELA DE JUROS' para 12 parcelas. Valor da Parcela = (Preço à Vista * Multiplicador de 12x) / 12.
                - **MODELO DE RESPOSTA:** "Custa R$ [Preço à Vista] à vista, ou fica em 12x de R$ [Valor Parcela] no cartão."
                - Logo após, pergunte: "Como você prefere pagar?"

                FASE 2: UPSELL
                - Se fizer sentido, ofereça acessórios (Película, Capa, Fonte) da lista 'ACESSÓRIOS DISPONÍVEIS'. Se o cliente aceitar, recalcule o valor total e o valor da parcela de 12x antes de ir para a próxima fase.

                FASE 3: PAGAMENTO
                - Espere a resposta do cliente sobre a forma de pagamento.
                - Se for "à vista", "pix" ou "dinheiro", vá para a FASE 5 (Finalização).
                - Se for "cartão" ou "parcelado", pergunte: "Em quantas vezes no cartão?"

                FASE 4: CÁLCULO FINAL (CRÍTICO)
                - Após o cliente informar o número de parcelas:
                - **REGRA DE OURO:** Se o cliente responder APENAS UM NÚMERO (ex: "10", "6x"), ENTENDA QUE SÃO AS PARCELAS.
                - **CÁLCULO OBRIGATÓRIO:**
                   1. Pegue o Valor Total (Produto + Acessórios).
                   2. Pegue o multiplicador correspondente na 'TABELA DE JUROS'.
                   3. Valor Final = Valor Total * Multiplicador.
                   4. Valor Parcela = Valor Final / Numero Parcelas.
                - RESPONDA: "Perfeito, fica [N]x de R$ [Valor Parcela], totalizando R$ [Valor Final] no cartão."

                FASE 5: FINALIZAÇÃO (IMEDIATA)
                - LOGO APÓS informar o valor final (seja à vista ou o cálculo da FASE 4), GERE A FERRAMENTA 'redirectToWhatsApp'.
                - Não espere o cliente dizer "ok" ou "quero". Já mande o botão.
                - O argumento 'message' da ferramenta deve SEGUIR ESTRITAMENTE ESTE MODELO:
                   "Olá, conversei com ${siteInfo.customTexts.aiAssistantName || 'Assistente'}.
                    Gostaria de fechar o pedido:
                    - [Lista de Produtos e Acessórios]
                    - Total: R$ [Valor Total]
                    - Forma de Pagamento: [ESCREVA AQUI: 'À vista (Pix/Dinheiro)' OU 'Parcelado em Nx no Cartão' conforme a escolha do cliente]"
            `;
            
            const fallbackPrompt = `
                ${safetyPrompt}
                ${salesProtocol}

                **DADOS DA LOJA:**
                Nome: ${siteInfo.storeName}
                Taxa Débito: +${(siteInfo.rates.debit * 100)}%.
                
                **TABELA DE JUROS (CRÉDITO) - USE PARA CALCULAR:**
                ${ratesList}
                
                **ESTOQUE DE PRODUTOS:**
                (Inventário fornecido separadamente)

                **ACESSÓRIOS DISPONÍVEIS:**
                ${accessoriesContext}

                CATEGORIAS: ${categoriesList}
            `;

            const finalSystemPrompt = customSystemPrompt || fallbackPrompt;
            
            // Lógica extra para garantir o casamento de pedidos mesmo com prompt customizado
            const comboLogic = `
                [REGRA CRÍTICA DE CASAMENTO DE PEDIDOS]
                O cliente pode pedir múltiplos produtos na mesma frase (Ex: "Quero um Redmi e uma película").
                1. VERIFIQUE os dois itens no inventário.
                2. NÃO use 'showCategory'.
                3. APRESENTE a soma dos valores.
                4. INICIE o processo de pagamento.
            `;

            // Histórico Limitado
            const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'Cliente' : 'Você'}: ${m.text}`).join('\n');

            const prompt = `${finalSystemPrompt}\n${comboLogic}\n\n---\nHistórico Recente:\n${history}\n---\nCliente Agora: "${userText}"`;

            // 3. Chamada à API Gemini
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview', 
                contents: prompt,
                config: { 
                    temperature: 0.4, 
                    tools: [{ functionDeclarations }]
                },
            });

            let aiText = response.text || "";
            
            // 4. Processar Calls e Fallback Robusto
            const actions: Action[] = [];
            
            // A. Official Tool Calls
            if (response.functionCalls) {
                response.functionCalls.forEach(fc => {
                    actions.push({ name: fc.name, args: fc.args });
                });
            }

            // B. Fallback: Detect JSON Hallucinations in Text
            const possibleJsonBlocks = aiText.match(/\{[\s\S]*?\}/g);
            
            if (possibleJsonBlocks) {
                 possibleJsonBlocks.forEach(jsonStr => {
                     if (jsonStr.includes("showCategory") || jsonStr.includes("redirectToWhatsApp")) {
                        try {
                            const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                            const parsed = JSON.parse(cleanJson);
                            const args = parsed.parameters || parsed.args || {};
                            if (parsed.name) {
                                actions.push({ name: parsed.name, args: args });
                                aiText = aiText.replace(jsonStr, '').trim();
                            }
                        } catch (e) { 
                            console.debug("Ignored invalid JSON in text", e); 
                        }
                     }
                 });
            }

            // Tratamento para evitar respostas vazias
            if (!aiText && actions.length > 0) {
                 if (actions.some(a => a.name === 'showCategory')) {
                     aiText = "Aqui estão as opções:";
                 } else if (actions.some(a => a.name === 'redirectToWhatsApp')) {
                     aiText = "Prontinho! Clique abaixo para finalizar o pedido:";
                 }
            } else if (!aiText && actions.length === 0) {
                aiText = "Entendi. Poderia confirmar qual produto você deseja?";
            }
            
            // Limpeza Final
            aiText = aiText.replace(/\[BUTTON_PAYLOAD.*?\]/g, '').trim();
            aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            aiText = aiText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^-\s/gm, '• ');

            // 5. Ramificação e Envio Sequencial
            const bubbles = createBubbles(aiText);
            
            for (let i = 0; i < bubbles.length; i++) {
                const chunk = bubbles[i];
                const isLast = i === bubbles.length - 1;
                
                // Delay para simular leitura/digitação
                await new Promise(resolve => setTimeout(resolve, 800 + (chunk.length * 20)));

                const chunkMsg: ChatMessage = {
                    role: 'assistant',
                    text: chunk,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Adiciona botões SOMENTE no último balão e SE houver botões
                if (isLast && actions.length > 0) {
                    chunkMsg.actions = actions;
                }
                
                if (i === 0) {
                     playSound(siteInfo.chatWidget?.receiveSoundUrl);
                }

                setMessages(prev => [...prev, chunkMsg]);
                
                // Salva cada chunk no Firestore individualmente
                try {
                    const convoRef = getDocRef('conversas', sessionId, storeId);
                    const messagesRef = getCollectionRef('messages', `${storeId}/conversas/${sessionId}`);
                    await messagesRef.add(chunkMsg);
                } catch(e) { console.error(e) }
            }

        } catch (error) {
            console.error("Erro no chat:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: "Tive um pequeno problema técnico. Poderia repetir?",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Styles
    const settings = siteInfo.chatWidget || {};
    // Default Fallbacks
    const headerBg = settings.headerBackgroundColor || settings.bubbleColor || '#ffae00';
    const headerText = settings.headerTextColor || '#ffffff';
    
    const windowBg = settings.backgroundColor || '#121212';
    
    const userBubbleBg = settings.userBubbleColor || '#ffffff';
    const userBubbleText = settings.userTextColor || '#000000';
    
    const botBubbleBg = settings.botBubbleColor || '#27272a';
    const botBubbleText = settings.botTextColor || '#e5e5e5';
    
    const inputBg = settings.inputBackgroundColor || '#000000';
    const inputText = settings.inputTextColor || '#ffffff';
    const sendBtnColor = settings.sendButtonColor || '#ffffff';
    
    // Action Button Styles (with fallbacks to general theme)
    const actionBtnBg = settings.actionButtonBackground || 'transparent';
    const actionBtnText = settings.actionButtonTextColor || '#e5e5e5';
    const actionBtnBorder = settings.actionButtonBorderColor || '#3f3f46';

    const isDarkColor = (color: string) => {
        const c = color.substring(1); 
        const rgb = parseInt(c, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >>  8) & 0xff; 
        const b = (rgb >>  0) & 0xff; 
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; 
        return luma < 128;
    };
    const floatingBtnTextColor = isDarkColor(settings.bubbleColor || '#ffae00') ? 'white' : 'black';

    // Desktop Positioning Shift when Cart is Open
    const defaultRight = settings.positionRight || 24;
    const shiftAmount = isCartOpen && window.innerWidth > 768 ? 400 : 0; // 380px cart width + 20px gap
    const computedRight = defaultRight + shiftAmount;

    return (
        <>
            {/* Overlay - Desfoque intenso no PC, mais escuro para foco */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-lg z-[9990] transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Botão Flutuante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed z-[9991] rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
                    style={{
                        bottom: `${settings.positionBottom || 24}px`,
                        right: `${computedRight}px`,
                        width: `${settings.size || 60}px`,
                        height: `${settings.size || 60}px`,
                        backgroundColor: settings.bubbleColor || '#ffae00',
                        color: floatingBtnTextColor,
                        transformOrigin: 'right center'
                    }}
                >
                    {settings.iconUrl ? (
                        <img src={settings.iconUrl} className="w-full h-full rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <MessageSquare size={28} />
                    )}
                </button>
            )}

            {/* Janela do Chat */}
            <div 
                className={`fixed z-[9992] 
                w-full h-[100dvh] top-0 rounded-none
                md:w-[380px] md:h-[600px] md:max-h-[80vh] md:top-auto md:rounded-2xl 
                shadow-2xl border border-white/10 flex flex-col transition-all duration-300 origin-bottom-right overflow-hidden 
                ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'}`}
                style={{
                    bottom: window.innerWidth > 768 ? `${(settings.positionBottom || 24) + (settings.size || 60) + 16}px` : '0',
                    right: window.innerWidth > 768 ? `${computedRight}px` : '0',
                    backgroundColor: windowBg,
                }}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between shadow-md relative z-10" style={{ backgroundColor: headerBg, color: headerText }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md overflow-hidden flex-shrink-0">
                             {settings.iconUrl ? <img src={settings.iconUrl} className="w-full h-full object-cover"/> : <Zap size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm leading-tight">{siteInfo.customTexts.aiAssistantName || 'Assistente Virtual'}</h3>
                            <span className="flex items-center gap-1 text-[10px] opacity-80">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> Online
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Notification Toast */}
                {notification && (
                    <div className={`relative px-4 py-3 text-sm font-semibold text-white animate-fade-in z-20 ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{notification.message}</span>
                        </div>
                    </div>
                )}

                {/* Área de Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800" style={{ backgroundColor: windowBg }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                            <div 
                                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative ${
                                    msg.role === 'user' 
                                    ? 'rounded-tr-none' 
                                    : 'rounded-tl-none border border-white/5'
                                }`}
                                style={{
                                    backgroundColor: msg.role === 'user' ? userBubbleBg : botBubbleBg,
                                    color: msg.role === 'user' ? userBubbleText : botBubbleText,
                                }}
                            >
                                <p dangerouslySetInnerHTML={{ __html: msg.text }} />
                            </div>
                            
                            {/* Botões Minimalistas */}
                            {msg.role === 'assistant' && msg.actions && !msg.actionsUsed && (
                                <div className="mt-2 flex flex-wrap gap-2 max-w-[95%] animate-scale-in">
                                    {msg.actions.map((action, aIdx) => (
                                        <button
                                            key={aIdx}
                                            onClick={() => handleActionClick(idx, action)}
                                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-full transition-all active:scale-95"
                                            style={{
                                                backgroundColor: actionBtnBg,
                                                color: actionBtnText,
                                                border: `1px solid ${actionBtnBorder}`
                                            }}
                                        >
                                            <span className="flex-shrink-0">
                                                {action.name === 'redirectToWhatsApp' ? <MessageCircle size={14} className="text-green-400"/> : (action.name === 'showCategory' ? <Grid size={14}/> : <ShoppingCart size={14}/>)}
                                            </span>
                                            {action.args.buttonLabel || 'Clique aqui'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isLoading && (
                         <div className="flex justify-start animate-pulse">
                            <div className="px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center" style={{ backgroundColor: botBubbleBg }}>
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                                <div className="w-1.s h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10" style={{ backgroundColor: inputBg }}>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="w-full text-base rounded-full pl-4 pr-12 py-3 border border-white/10 focus:border-white/30 focus:outline-none focus:ring-0 transition-all placeholder-gray-500"
                            style={{ 
                                backgroundColor: inputBg, 
                                color: inputText,
                                // We use a slight brightness filter for the input field itself if it matches the container
                                filter: 'brightness(1.2)' 
                            }}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading || isInitializing}
                            className="absolute right-2 top-2 p-2 hover:opacity-80 disabled:opacity-30 transition-colors"
                            style={{ color: sendBtnColor }}
                        >
                            {isLoading || isInitializing ? <Loader size={18} className="animate-spin"/> : <Send size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ChatWidget;
