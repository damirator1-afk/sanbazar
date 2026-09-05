// Клиент для отдельного Python-сервиса AI-консультанта (shopping-agent),
// см. соседний репозиторий sanbazar-shopping-agent. Не часть этого сайта —
// просто HTTP-вызовы к внешнему API. Если NEXT_PUBLIC_SHOPPING_AGENT_URL не
// задан (сервис ещё не задеплоен), виджет на сайте просто не показывается —
// см. ShoppingAssistant.tsx.

export const SHOPPING_AGENT_URL = process.env.NEXT_PUBLIC_SHOPPING_AGENT_URL || "";

export interface AgentProduct {
  product_id: string;
  title: string;
  brand: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  in_stock: boolean;
  short_description: string | null;
}

export interface ProductsUiPayload {
  title: string;
  items: { product: AgentProduct; reason?: string }[];
}

export interface SuggestionsUiPayload {
  suggestions: string[];
}

export type AgentEvent =
  | { type: "text_delta"; data: { text: string } }
  | { type: "ui"; data: { component: "products"; payload: ProductsUiPayload } }
  | { type: "ui"; data: { component: "suggestions"; payload: SuggestionsUiPayload } }
  | { type: "ui"; data: { component: string; payload: unknown } }
  | { type: "turn_complete"; data: Record<string, unknown> }
  | { type: "error"; data: { message: string } }
  | { type: string; data: Record<string, unknown> };

export async function startSession(): Promise<string> {
  const res = await fetch(`${SHOPPING_AGENT_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Не удалось начать сессию с ассистентом");
  const data = await res.json();
  return data.session_id as string;
}

// Разбирает SSE-поток (event: TYPE\ndata: JSON\n\n) и зовёт onEvent на
// каждый кадр — простой парсер под конкретный формат commerce_common.streaming.
export async function streamChat(
  sessionId: string,
  message: string,
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  const res = await fetch(`${SHOPPING_AGENT_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
    body: JSON.stringify({ message }),
  });
  if (!res.ok || !res.body) throw new Error("Ассистент сейчас недоступен");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const eventLine = frame.split("\n").find((l) => l.startsWith("event: "));
      const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!eventLine || !dataLine) continue;
      const type = eventLine.slice("event: ".length).trim();
      try {
        const data = JSON.parse(dataLine.slice("data: ".length));
        onEvent({ type, data } as AgentEvent);
      } catch {
        // повреждённый кадр — пропускаем, не роняем весь чат
      }
    }
  }
}
