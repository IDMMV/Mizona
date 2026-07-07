# MiZona Enterprise V8 — Etapa 22

## Pagos configurables y simulación local

Versión acumulativa sobre las Etapas 1–21.

### Incluye
- Pago directo al vendedor.
- Pago contra entrega.
- Enlace o QR de pago.
- Checkout dentro de MiZona.
- Pago protegido.
- Pago dividido automático.
- Activación, publicación y selección del modelo predeterminado por el administrador.
- Comisión porcentual, cargo fijo, montos mínimos y máximos.
- Retención, devolución y liberación simulada.
- Cuenta receptora, billetera y proveedor configurables.
- Historial de pagos de prueba y exportación JSON.
- Restricción completa para cuentas estudiantiles.

### Importante
Esta etapa no mueve dinero real. Los modelos de checkout, pago protegido y pago dividido requieren una pasarela que soporte marketplaces, contratos comerciales, validación de vendedores y revisión legal/tributaria antes de producción.

### Ejecutar
```bash
npm install
npm run dev
npm run build
```
