# 🧸 La lista del peque — Baby Shower

Lista de deseos dinámica para baby shower. Los invitados eligen un regalo y lo
reservan; el sistema lo marca como "ya elegido" en tiempo real para que no haya
regalos repetidos.

**Web:** GitHub Pages (estático) · **Datos:** Supabase (Postgres + RLS + Realtime)

## Cómo funciona

- `index.html` — la lista pública. Los invitados ven los regalos por categoría,
  filtran, y reservan con nombre y mensaje opcionales (anónimo para el resto).
- `admin.html` — panel privado con clave para añadir/editar/borrar regalos,
  ver las reservas y liberar regalos.
- La reserva es una función RPC atómica en Postgres (`claim_gift`): si dos
  personas pulsan a la vez, solo una se lo lleva y la otra recibe un aviso.
- Con Supabase Realtime la lista se actualiza en vivo sin recargar.

## Seguridad

- La clave publicable de Supabase (`assets/config.js`) está pensada para ser
  pública: el acceso lo controlan las políticas RLS.
- Los invitados solo pueden **leer** `gifts` y ejecutar `claim_gift`.
- Quién reservó qué (`claims`) no es accesible desde el cliente: solo vía
  RPCs de admin que exigen la clave (guardada únicamente en la base de datos).

## Desarrollo

Servir en local:

```bash
python3 -m http.server 8123
```

El schema está en `supabase/migrations/`.
