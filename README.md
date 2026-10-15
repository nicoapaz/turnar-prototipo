# TurnAR · Prototipo navegable

Una maqueta de la app para pacientes de **TurnAR**: sacar turno, confirmar asistencia, ver estudios y pagar el coseguro desde el teléfono, sin llamar a la clínica.

> 🧪 **Es un prototipo.** Todos los datos son ficticios: pacientes, profesionales, matrículas y contraseñas de ejemplo. No hay backend ni datos reales.

## Probalo

**https://nicoapaz.github.io/turnar-prototipo/** *(se activa con GitHub Pages, ver abajo)*

Se toca como si fuera el teléfono, con marco de iPhone. Podés arrancar desde dos puntos: **paciente nuevo** (registro) o **paciente con turno** (inicio). Abierto desde el celular se ve mejor.

## Qué se puede recorrer

| Recorrido | Qué muestra |
|---|---|
| Registro sin contraseña | Se entra con celular o mail y un código. Se cargan nombre, fecha de nacimiento y obra social (esta última se puede dejar para después) |
| Ingreso con la cara | Contraseña como respaldo y reconocimiento facial que guarda el teléfono, no la clínica |
| Sacar turno en 5 pasos | Especialidad, profesional o "el primero disponible", pedido médico con foto cuando el estudio lo exige, día y horario, y cobertura o pago |
| Confirmar asistencia | Recordatorio 48 hs antes con tres salidas: confirmar, reprogramar o avisar que no se puede ir |
| Estudios y pagos | Resultados nuevos y coseguro pendiente |
| Grupo familiar | Gestionar los turnos de otra persona desde la misma cuenta |

## Cómo se hizo

Lo diseñamos conversando con una IA (Claude): partimos de cómo usa un paciente la clínica y fuimos probando pantallas hasta tener un recorrido que se pueda tocar de punta a punta. Nos gusta **documentar todo lo que hacemos** y **experimentar con IA** para ver hasta dónde llega; este repo es parte de ese experimento.

El prototipo es un solo archivo (`index.html`). Necesita internet para cargar React y Babel; las tipografías y el logo van incluidos.

## Cómo mantenerlo actualizado

1. Reemplazar `index.html` con la versión nueva.
2. Anotar acá qué recorridos cambiaron.
3. Hacer un commit con un mensaje claro, por ejemplo: `Prototipo: agrega la pantalla de pagos`.

## Publicarlo como página web (GitHub Pages)

1. **Settings → Pages**.
2. En *Build and deployment*, elegí **Deploy from a branch**, rama **main** y carpeta **/ (root)**.
3. **Save**. En un par de minutos queda en `https://nicoapaz.github.io/turnar-prototipo/`.
