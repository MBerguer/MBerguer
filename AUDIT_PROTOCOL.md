# PROTOCOLO DE AUDITORÍA EXTERNA // GRAND PRIX TELEMETRY (v2.0)

> **Documento Oficial de Certificación de Arquitectura e Integridad de Ejecución**  
> **Repositorio:** `MBerguer/MBerguer` (Perfil) y `MBerguer/mberguer.github.io` (Portfolio Web)

---

## 1. Principios de la Arquitectura Auditada

A diferencia de sistemas estáticos con "teatro de checkboxes", este motor de telemetría implementa:

1. **Git como Única Fuente de la Verdad:**
   El estado `DONE` no existe en ningún JSON. Se deriva en tiempo de ejecución inspeccionando `git log`. Una tarea está certificada como `DONE` si y solo si:
   - Existe un commit en `git log` con el identificador formal `TASK-XXX`.
   - El commit modificó efectivamente los archivos declarados para ese hito.
   - Todas sus dependencias en el Grafo Acíclico Dirigido (DAG) están previamente certificadas.
   - Su comando de verificación determinista (`python3 scripts/verify_task.py TASK-XXX`) retorna `exit code 0`.
2. **Desacoplamiento Total de Estado y Catálogo:**
   `TASKS.json` es un manifiesto **estático e inmutable** (24 hitos de ingeniería sustantivos). Múltiples agentes o desarrolladores pueden trabajar en ramas o turnos sin generar conflictos de merge en el JSON.
3. **Validación Semántica Real:**
   Se eliminaron los falsos positivos basados en simples `grep` o `test -f`. Las verificaciones comprueban árboles XML válidos, sintaxis real con `node --check`, llamadas no vacías y APIs declaradas.
4. **Consolidación Modular (24 Hitos):**
   Sin micro-fragmentación burocrática de reglas CSS individuales. Cada hito representa una entrega de software coherente, integrable y auditable.

---

## 2. Comandos para el Agente Auditor

Para auditar el estado del repositorio en cualquier momento:

```bash
# 1. Telemetría general, resolución del DAG y detección de incoherencias
python3 scripts/progress.py

# 2. Salida estructurada JSON para parsers automatizados
python3 scripts/progress.py --json

# 3. Probar verificación semántica de una tarea específica
python3 scripts/verify_task.py TASK-001
```

---

## 3. Matriz de Control del Auditor

| Pilar | Criterio Requerido | Modo de Verificación |
| :--- | :--- | :--- |
| **1. Integridad Git** | Todo hito terminado debe tener commit formal que toque sus archivos. | `python3 scripts/progress.py` valida commit, hash y diff. |
| **2. Determinismo** | Cero regresiones; los tests no pasan con comentarios ni archivos vacíos. | `scripts/verify_task.py` inspecciona AST/XML y sintaxis. |
| **3. Coherencia DAG** | Ninguna tarea puede comitearse antes que sus prerrequisitos. | `progress.py` detecta y marca alertas `OUT_OF_ORDER_COMMIT`. |
| **4. Compatibilidad Web** | El código corre nativamente en browser vanilla sin asumir bundlers Node. | Zero `require` en módulos cliente de producción. |
| **5. Nivel Awwwards** | 60/120 FPS, CLS = 0, Kinetic scrolling con Lenis y audio Web Audio procedural. | Auditoría técnica de los 24 hitos completados. |

---

## 4. Salida Esperada del Dictamen

```markdown
### 📋 DICTAMEN DE AUDITORÍA // GRAND PRIX TELEMETRY
- **Estado General:** [APROBADO PARA EJECUCIÓN / REQUIERE AJUSTES]
- **Consistencia del DAG:** [Válido (24 hitos analizados)]
- **Puntuación de Arquitectura:** [X/10]
- **Veredicto Final:** [AUTORIZADO / NO AUTORIZADO]
```
