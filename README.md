# TurnAR · prototipo interactivo

Prototipo de una app de turnos médicos para el celular: sacar turno, confirmar asistencia, ver estudios y pagar el coseguro.

**Probalo acá:** https://nicoapaz.github.io/turnar-prototipo/

> **Todo es ficticio.** Pacientes, profesionales, obras sociales, teléfonos, números de afiliado, DNI, estudios y precios son inventados. No se conecta con ningún servicio, no envía mensajes y no procesa pagos.

## Qué se puede hacer de verdad

- **Registrarse**: escribir celular, validar el código (de prueba: `123456`), cargar nombre, DNI, fecha de nacimiento y obra social, crear contraseña. Cada paso valida lo que escribís.
- **Sacar un turno** de consulta o de estudio por imágenes: elegir especialidad (con buscador), profesional o "el primero disponible", día en el calendario, horario, cobertura y confirmar. Lo elegido aparece en las pantallas siguientes y en el inicio.
- **Subir el pedido médico** para un estudio (se recuerda solo el nombre del archivo; no se guarda su contenido).
- **Confirmar, reprogramar o cancelar** un turno; los horarios ocupados desaparecen y los liberados vuelven.
- **Pagar el coseguro** (simulado) y ver el comprobante en el historial.
- **Ver estudios**, compartirlos (simulado) y pedir turno desde un resultado.
- **Grupo familiar**: cambiar de perfil, agregar personas, vincular otra obra social.
- **Ajustes**: recordatorios, tamaño del texto, descargar el turno como evento `.ics` para el calendario.

Hay tres puntos de entrada desde el panel izquierdo: paciente nuevo, paciente con turno y recordatorio 48 hs antes.

## Qué NO hace

- No hay servidor ni base de datos: todo queda **en tu navegador** (`localStorage`). "Reiniciar el recorrido" lo borra.
- No manda SMS, WhatsApp, correos ni notificaciones reales; el chat "Escribinos" es de ejemplo.
- La disponibilidad de turnos está calculada con una regla fija, no viene de una agenda real.
- No usa cámara ni Face ID.

## Cómo está hecho

HTML, CSS y JavaScript puros, sin dependencias ni compilación. Tipografías Barlow incluidas en `fonts/`.

```
index.html      pantalla y panel lateral
css/            estilos y tipografías
js/data.js      datos ficticios, fechas, disponibilidad e íconos
js/app.js       estado, pantallas, validaciones y acciones
```

Para probarlo en tu compu: abrí `index.html` con el navegador. En un celular, la app ocupa toda la pantalla.

El diseño original se hizo con IA (Claude Design) y esta versión interactiva se reconstruyó con Claude, tomando como base el recorrido, los textos y el logo del primer prototipo.
