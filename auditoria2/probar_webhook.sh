#!/bin/bash

# ============================================
# Script para Probar Webhook de Notificaciones
# ============================================

# URL del webhook (TEST)
WEBHOOK_URL="http://localhost:5678/webhook-test/notificar-auditados"

# ID de auditoría de prueba
AUDITORIA_ID="bb000000-0000-0000-0000-000000000001"

# Payload
PAYLOAD='{"auditoria_id": "'$AUDITORIA_ID'"}'

echo "🚀 Probando webhook de notificaciones..."
echo ""
echo "📋 Datos:"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Auditoría ID: $AUDITORIA_ID"
echo ""
echo "📤 Enviando request..."
echo ""

# Llamar al webhook
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\n\n📊 Status Code: %{http_code}\n"

echo ""
echo "✅ Request enviado!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Ve a N8N → Executions para ver la ejecución"
echo "   2. Verifica que todos los nodos tengan ✅ verde"
echo "   3. Revisa los correos de los auditados"
echo "   4. Verifica en la DB que se crearon las solicitudes"
echo ""

