
# Visual Oscart - Marketing Flow v3.5 🚀

Una plataforma de alta fidelidad para la gestión de agencias de marketing, diseñada para optimizar el flujo de trabajo creativo, la validación estratégica y el control administrativo, potenciada por Google Gemini AI.

## 🛠️ Tech Stack
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS (Dark Mode Aesthetic)
- **AI Engine**: Google GenAI (Gemini 3 Flash & 2.5 Flash Image)
- **Routing**: React Router Dom v7
- **PDF Gen**: html2pdf.js
- **Icons**: Material Symbols Outlined

## ✨ Características Principales
- **Dashboard Estratégico**: Visualización de métricas clave y consejos diarios generados por IA.
- **Estudio Creativo (Ideation)**: Generación de Copys, Guiones y Arte visual mediante modelos avanzados de IA.
- **Control Maestro (Admin)**: Gestión de nómina, bonos por rendimiento (Ninja, Master, King) y rentabilidad por marca.
- **Calendario de Operaciones**: Gestión de tareas con adjuntos multimedia y sistema de estados.
- **Bóveda de Activos**: Repositorio global de textos y archivos multimedia de todos los proyectos.
- **Validación de Marca**: Flujo paso a paso para el registro de nuevos clientes y su brief psicológico.

## 📦 Instalación
1. Clona el repositorio.
2. Asegúrate de tener configurada tu `API_KEY` de Google Gemini en las variables de entorno.
3. Abre `index.html` en un servidor local o despliega en servicios como Vercel/Netlify.

## 🔒 Seguridad de Persistencia
El sistema utiliza `localStorage` con un driver de seguridad implementado en `ProjectContext.tsx` que previene el colapso de la aplicación si se excede la cuota de almacenamiento del navegador por el uso de archivos base64.

---
Desarrollado por el equipo senior de Visual Oscart.
