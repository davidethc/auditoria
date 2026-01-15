#!/bin/bash

# ============================================
# Script para Probar Webhook de Generar Word
# ============================================

# URL del webhook (ajusta según tu configuración)
WEBHOOK_URL="http://localhost:5678/webhook/generar-word-informe"

# ID de informe de prueba (reemplaza con un ID real)
# Si no lo especificas, el script te pedirá uno
INFORME_ID="${1:-}"

# Si no se proporciona el ID, pedirlo
if [ -z "$INFORME_ID" ]; then
  echo "❌ Error: Debes proporcionar un informe_id"
  echo ""
  echo "Uso:"
  echo "  ./probar_generar_word.sh <informe_id>"
  echo ""
  echo "Ejemplo:"
  echo "  ./probar_generar_word.sh 40ae1fa5-6f17-4fd0-9f87-47a445e52d05"
  echo ""
  echo "💡 Para obtener un informe_id, ejecuta en Supabase:"
  echo "   SELECT id, encabezado, estado FROM auditoria_informe WHERE es_version_actual = true LIMIT 5;"
  exit 1
fi

# Payload
PAYLOAD='{"informe_id": "'$INFORME_ID'"}'

echo "🚀 Probando webhook de generar Word..."
echo ""
echo "📋 Datos:"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Informe ID: $INFORME_ID"
echo ""
echo "📤 Enviando request..."
echo ""

# Llamar al webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Separar respuesta y código de estado
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Respuesta:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""
echo "📊 Status Code: $HTTP_CODE"
echo ""

# Verificar resultado
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Request exitoso!"
  echo ""
  echo "📝 Próximos pasos:"
  echo "   1. Ve a N8N → Executions para ver la ejecución"
  echo "   2. Verifica que todos los nodos tengan ✅ verde"
  echo "   3. Revisa Google Drive para ver el documento generado:"
  echo "      https://drive.google.com/drive/folders/1QHoiXg2FMGy36OS3tfstLllhWDLvWbSL"
  echo "   4. Verifica en Supabase que documento_word_url se actualizó:"
  echo "      SELECT id, encabezado, documento_word_url FROM auditoria_informe WHERE id = '$INFORME_ID'::uuid;"
else
  echo "❌ Error en la petición (HTTP $HTTP_CODE)"
  echo ""
  echo "💡 Posibles soluciones:"
  echo "   - Verifica que el workflow esté activo en N8N"
  echo "   - Verifica que la URL del webhook sea correcta"
  echo "   - Verifica que el informe_id exista en Supabase"
  echo "   - Revisa los logs de ejecución en N8N para más detalles"
fi

echo ""
