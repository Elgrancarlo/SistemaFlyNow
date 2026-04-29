// WhatsApp Business API — Meta Graph API

const GRAPH_API_VERSION = "v19.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface EnviarMensagemParams {
  telefone: string; // formato internacional sem +, ex: "5551981513887"
  nomeCliente: string;
  codigoRastreio: string;
}

interface MetaApiResponse {
  messages?: Array<{ id: string }>;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export async function enviarWhatsappAguardandoRetirada({
  telefone,
  nomeCliente,
  codigoRastreio,
}: EnviarMensagemParams): Promise<{ sucesso: boolean; messageId?: string; erro?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? "pedido_aguardando_retirada";
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "pt_BR";

  if (!phoneNumberId || !accessToken) {
    return { sucesso: false, erro: "Variáveis WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN não configuradas" };
  }

  // Garantir formato E.164 sem o +
  const telefoneFormatado = telefone.replace(/\D/g, "").replace(/^0+/, "");
  const telefoneE164 = telefoneFormatado.startsWith("55")
    ? telefoneFormatado
    : `55${telefoneFormatado}`;

  const payload = {
    messaging_product: "whatsapp",
    to: telefoneE164,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: nomeCliente },
            { type: "text", text: codigoRastreio },
          ],
        },
      ],
    },
  };

  const response = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: MetaApiResponse = await response.json();

  if (!response.ok || data.error) {
    const erro = data.error?.message ?? `HTTP ${response.status}`;
    return { sucesso: false, erro };
  }

  return { sucesso: true, messageId: data.messages?.[0]?.id };
}
