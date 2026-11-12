# PROTOCOLO DE AUDITORÍA EXTERNA // GRAND PRIX TELEMETRY

> **Documento de Instrucciones para el Agente Auditor Externo**  
> **Repositorio:** `MBerguer/MBerguer` (Perfil) y `MBerguer/mberguer.github.io` (Portfolio Web)

Bienvenido, Agente Auditor. Este documento detalla cómo debes evaluar y certificar el plan y la ejecución del sistema *Grand Prix Telemetry*.

---

## 1. Comandos de Diagnóstico Rápido

Para obtener el estado objetivo del sistema en cualquier momento:

```bash
# 1. Telemetría general y verificación de dependencias del DAG
python3 scripts/progress.py

# 2. Ejecutar la suite completa de pruebas deterministas de tareas completadas
python3 scripts/progress.py --verify-done

# 3. Exportar métricas en JSON para análisis automatizado
python3 scripts/progress.py --json
```

---

## 2. Puntos Críticos de Control (Checklist del Auditor)

Debes verificar y calificar los siguientes 5 pilares:

### Pilar 1: Coherencia del Grafo de Dependencias (DAG)
- [ ] Comprobar que en `TASKS.json` no existan ciclos infinitos o referencias a IDs inexistentes.
- [ ] Verificar que ninguna tarea con estado `READY_FOR_EXECUTION` tenga dependencias sin completar.
- [ ] Validar que las tareas dependientes se desbloqueen únicamente cuando todos sus prerrequisitos pasen a `DONE`.

### Pilar 2: Trazabilidad y Disciplina Git
- [ ] Cada tarea completada (`status == "DONE"`) debe corresponder a un commit real en el historial de Git cuyo mensaje comience con el ID de la tarea (`TASK-XXX`).
- [ ] Ningún commit debe mezclar dos tareas distintas.
- [ ] No debe haber archivos temporales (`.aux`, `.log`, `.DS_Store`) en el repositorio.

### Pilar 3: Verificación Técnica Determinista
- [ ] Cada tarea en `TASKS.json` cuenta con un campo `verification_cmd` no vacío y ejecutable desde la raíz del repo.
- [ ] Todas las pruebas de las tareas completadas deben retornar `exit code 0`. Si una falla, se considera regresión bloqueante.

### Pilar 4: Arquitectura Gráfica y de Rendimiento (Criterios Awwwards)
- [ ] **Kinetic Scrolling:** Lenis + GSAP ScrollTrigger deben compartir un ticker unificado con `lagSmoothing(0)` para eliminar micro-stuttering.
- [ ] **Canvas High-DPI:** Renderizado adaptativo al `devicePixelRatio` del dispositivo sin fuga de memoria ni degradación de FPS.
- [ ] **Dual Mode:** La transición entre el modo de lectura/scrollytelling y el modo de conducción libre (*Take The Wheel*) debe ser continua mediante interpolación de cámara, sin recargar la página.
- [ ] **Web Audio API:** Síntesis 100% procedural sin depender de archivos de audio pesados en red.
- [ ] **Accesibilidad:** Soporte estricto de `@media (prefers-reduced-motion)`.

### Pilar 5: Identidad Profesional de Martín Berguer
- [ ] El enfoque central debe destacar:
  1. Concurrencia de alto rendimiento y modelo de actores en **Rust** (`tsp-light-panel`, `alloy-zksync`).
  2. Motor gráfico C++20 y trazado de rayos 2D (`Abuse 2026`).
  3. Maestría en Machine Learning y predicción probabilística bajo incertidumbre (`tesis-futbol`).
  4. Suite tipográfica institucional (`UdelaRTeX`).
- [ ] Estilo visual: 16-bit retro-futurista, sobrio, sin clichés de plantillas genéricas de IA.

---

## 3. Salida de Auditoría Esperada

El agente auditor debe emitir su dictamen en el siguiente formato:

```markdown
### 📋 DICTAMEN DE AUDITORÍA // GRAND PRIX TELEMETRY
- **Estado General:** [APROBADO PARA EJECUCIÓN / REQUIERE AJUSTES]
- **Consistencia del DAG:** [Válido (X tareas analizadas)]
- **Puntuación de Arquitectura:** [X/10]
- **Observaciones o Hallazgos:**
  - 1. ...
  - 2. ...
- **Veredicto Final:** [AUTORIZADO / NO AUTORIZADO]
```
