# Guia de Integração n8n com Dashboard FMP

## Visão Geral

O n8n é responsável por verificar periodicamente se os serviços estão online e enviar os resultados para o dashboard através de um webhook.

## Endpoint do Webhook

```
POST /api/webhook/n8n
```

### URL Completa (exemplo)
```
https://seu-dominio.vercel.app/api/webhook/n8n
```

## Autenticação

O webhook requer uma API Key para segurança.

### Header obrigatório:
```
x-api-key: sua-chave-secreta
```

### Configuração da API Key:
1. No Vercel, vá em Settings > Environment Variables
2. Adicione a variável: `N8N_API_KEY` com uma chave segura
3. Use a mesma chave no n8n como header `x-api-key`

## Payload do Webhook

### Campos Obrigatórios:
```json
{
  "id": "1",           // ID do serviço (string)
  "status": "operational"  // Status do serviço
}
```

### Campos Opcionais:
```json
{
  "id": "1",
  "status": "operational",
  "time": 145,              // Tempo de resposta em ms
  "serviceName": "Portal Principal"  // Nome do serviço
}
```

### Status Aceitos:
| Enviado pelo n8n | Convertido para |
|------------------|-----------------|
| `operational` | `operational` |
| `online` | `operational` |
| `up` | `operational` |
| `unavailable` | `unavailable` |
| `offline` | `unavailable` |
| `down` | `unavailable` |
| `unstable` | `unstable` |
| `degraded` | `unstable` |
| `slow` | `unstable` |
| `maintenance` | `maintenance` |

## IDs dos Serviços

| ID | Serviço |
|----|---------|
| 1 | Portal Principal (fmp.edu.br) |
| 2 | Moodle FMP |
| 3 | ESA Moodle |
| 4 | Pergamum FMP |
| 5 | Portal do Aluno |
| 6 | Meu RH - TOTVS RM |
| 7 | Portal do Professor |
| 8 | Pós-Graduação |
| 9 | CRM Rubeus |
| 10 | CallSys |
| 11 | Portal TCloud |
| 12 | Central do Cliente TOTVS |

## Configuração no n8n

### Fluxo Básico:

```
[Schedule Trigger] → [HTTP Request (verificar site)] → [IF (site ok?)] → [HTTP Request (webhook)]
```

### 1. Schedule Trigger
- Configurar para rodar a cada 1 minuto

### 2. HTTP Request (verificar site)
- Method: GET
- URL: URL do serviço a verificar
- Timeout: 15000ms (15 segundos)

### 3. IF (verificar resposta)
- Condition: `{{ $response.statusCode >= 200 && $response.statusCode < 400 }}`

### 4. HTTP Request (enviar para webhook)

**Se site está OK:**
```
Method: POST
URL: https://seu-dominio.vercel.app/api/webhook/n8n
Headers:
  - x-api-key: sua-chave-secreta
  - Content-Type: application/json
Body:
{
  "id": "1",
  "status": "online",
  "time": {{ $response.responseTime }},
  "serviceName": "Portal Principal"
}
```

**Se site está offline:**
```
Method: POST
URL: https://seu-dominio.vercel.app/api/webhook/n8n
Headers:
  - x-api-key: sua-chave-secreta
  - Content-Type: application/json
Body:
{
  "id": "1",
  "status": "offline",
  "time": 0,
  "serviceName": "Portal Principal"
}
```

## Exemplo de Workflow n8n Completo (JSON)

```json
{
  "name": "FMP - Monitor Portal Principal",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 1
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://fmp.edu.br",
        "options": {
          "timeout": 15000
        }
      },
      "name": "Verificar Site",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://seu-dominio.vercel.app/api/webhook/n8n",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-api-key",
              "value": "sua-chave-secreta"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "id",
              "value": "1"
            },
            {
              "name": "status",
              "value": "={{ $response.statusCode >= 200 && $response.statusCode < 400 ? 'online' : 'offline' }}"
            },
            {
              "name": "time",
              "value": "={{ $response.responseTime || 0 }}"
            },
            {
              "name": "serviceName",
              "value": "Portal Principal"
            }
          ]
        }
      },
      "name": "Enviar Status",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Verificar Site",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Verificar Site": {
      "main": [
        [
          {
            "node": "Enviar Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Testando o Webhook

### Via cURL:
```bash
curl -X POST https://seu-dominio.vercel.app/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: sua-chave-secreta" \
  -d '{"id": "1", "status": "online", "time": 150}'
```

### Verificar Status do Webhook:
```bash
curl https://seu-dominio.vercel.app/api/webhook/n8n
```

## Resposta de Sucesso

```json
{
  "success": true,
  "message": "Status update received and processed",
  "data": {
    "id": "1",
    "status": "operational",
    "time": 150,
    "serviceName": "Portal Principal",
    "processedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Códigos de Erro

| Código | Motivo |
|--------|--------|
| 401 | API Key inválida ou ausente |
| 400 | Campos obrigatórios faltando (id, status) |
| 500 | Erro interno do servidor |

## Dicas

1. **Crie um workflow separado para cada serviço** no n8n para facilitar a manutenção
2. **Use Error Handling** no n8n para capturar falhas na verificação
3. **Configure alertas** no n8n para notificar quando um serviço cair
4. **Ajuste o timeout** conforme a velocidade dos serviços verificados
