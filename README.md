# APP GANADERA - Sistema Integral de Gestión Ganadera Local-First & Mobile PWA

**APP GANADERA** es una solución tecnológica moderna de alta fidelidad para la administración de fincas ganaderas de carne, leche y doble propósito. 

Ha sido diseñada con arquitectura **Mobile-First y Local-First** para operar tanto en computadoras de escritorio en la oficina de la finca, como en **teléfonos móviles táctiles en pleno potrero**, preparada para su empaquetado y distribución en Google Play Store y Apple App Store.

---

## 📱 Capacidades Móviles & Preparación para Tiendas de Aplicaciones

| Capacidad | Implementación Móvil |
| :--- | :--- |
| **PWA Instalable (Standalone)** | Cumple con los estándares de Google y Apple (`manifest.json`, `sw.js` y Service Worker offline). Al abrirla en Chrome o Safari, se puede pulsar **"Instalar aplicación"** / **"Agregar a inicio"** y se comporta como una app nativa sin barras del navegador. |
| **Navegación Móvil Táctil (Tab Bar)** | Barra inferior táctil con accesos rápidos: **Ganado, Preñez, Botón Flotante Central (+), Ordeño y Menú**, con zonas de contacto de más de 48px y soporte para la muesca (*notch*) y barra de inicio de iPhone y Android (`safe-area-inset`). |
| **Acciones Rápidas en Manga / Potrero** | Menú emergente inferior tipo hoja (*bottom sheet*) con un toque: **Búsqueda por Foto con cámara**, **Registrar Ordeño AM/PM**, **Capturar Pesaje de Báscula** y **Nuevo Animal**. |
| **Simulador de Teléfonos en Pantalla** | Módulo de pruebas que permite a los evaluadores en PC ver la aplicación dentro del marco físico de un **iPhone 15 Pro, Samsung Galaxy S24, Google Pixel 8 o Tablet**, alternando entre vista de teléfono y pantalla completa. |
| **Simulador de Hardware Ganadero** | Simulador integrado de **Bastón Lector de Aretes RFID** (emite sonido de lectura y copia el código ISO) y **Báscula Bluetooth Ganadera** (simula estabilización de peso con animal en movimiento). |
| **Simulador de Señal Rural** | Permite forzar el estado **Offline / Sin Cobertura** con un clic para probar cómo la app almacena en la cola local de Dexie IndexedDB y sincroniza al volver a tener señal. |
| **Pruebas de Carga y Diagnóstico** | Botón para inyectar conjuntos masivos de +25 cabezas de ganado para evaluar fluidez de scroll (*60 FPS*), visor de cuota de memoria y exportación de informe QA en `.json`. |
| **Configuración para Capacitor / APK** | Archivo `capacitor.config.json` preconfigurado (`com.appganadera.pro`) listo para compilar a APK/AAB con Android Studio o proyecto iOS con Xcode. |

---

## 🚀 Principales Características de la Plataforma

| Característica | Prioridad | Solución Implementada |
| :--- | :---: | :--- |
| **Multi-Hacienda y Visión Global** | **Alta** | Selector para alternar entre fincas individuales (*Hacienda La Pradera*, *Rancho El Porvenir*, *Finca Santa Inés*) o ver el **Consolidado Global** de todo el hato. Registro de nuevas fincas con moneda, área y propósito. |
| **Fotografía y Búsqueda Visual** | **Alta** | Carga y compresión fotográfica por animal en brete/potrero. Motor de **Búsqueda Visual (`VisualSearchService`)** que analiza histogramas de color y patrones de pelaje para identificar reses por foto tomada con cámara. |
| **Asistente IA Dual (Local + Externo)** | **Diferenciadora** | Selector de modo: **Mi Finca (RAG Local)** para consultar métricas del hato y **Consultor Global (Conocimiento Externo)** para resolver dudas abiertas sobre farmacología, dosis, protocolos IATF, pasturas y nutrición. |
| **Sincronización entre Dispositivos** | **Muy Alta** | Motor `SyncEngine` con cola de outbox transaccional, resolución de conflictos campo a campo (LWW) y prevención de aretes duplicados. |
| **Modo Offline Confiable** | **Muy Alta** | Persistencia inmediata en IndexedDB (Dexie). Permite operar semanas sin cobertura celular y sincronizar en segundo plano al reconectar. |
| **Guardado Automático y Respaldos** | **Muy Alta** | Copias de seguridad automáticas y exportación de archivos estructurados `.ganado.backup` con restauración atómica. |
| **Gestión Masiva de Animales** | **Alta** | Módulo de importación y exportación de Excel/CSV (`.xlsx`), con validación de filas en memoria y asignación por lotes. |
| **Control Reproductivo Avanzado** | **Alta** | Cálculo de gestación por subespecie (*Bos taurus* 283d vs *Bos indicus* 292d), alertas de secado a 60 días preparto y ventanas de celo (18-24d). |
| **Reportes Financieros y Unit Economics** | **Diferenciadora** | Cálculo en tiempo real de Costo por Litro de Leche, Margen por Litro, Costo por Kg de Ganancia en Ceba, Punto de Equilibrio y P&L. |
| **Sanidad y Períodos de Retiro** | **Crítica** | Registro de dosis aplicadas (mL), vías de administración y alertas visuales de tiempo de retiro en leche y carne para inocuidad alimentaria. |

---

## 🛠️ Stack Tecnológico

- **Frontend & UI Móvil:** React 18, TypeScript, Tailwind CSS, Lucide React Icons.
- **PWA & Offline:** Service Worker con caché de shell, Web App Manifest, IndexedDB (Dexie.js).
- **Simulador Móvil & Audio:** Web Audio API (pitido de lector RFID), Web Storage API.
- **Gráficos & Visualizaciones:** Recharts (curvas de lactancia, distribución de ingresos y gastos).
- **Procesamiento de Archivos e Imágenes:** SheetJS (XLSX) para hojas de cálculo; HTML5 Canvas para compresión y extracción de histogramas cromáticos.
- **Empaquetado Móvil:** Capacitor Config (`capacitor.config.json`) preparado para tiendas de aplicaciones.

---

## 📂 Estructura del Proyecto

```
APP GANADERA/
├── public/
│   ├── favicon.svg           # Favicon vectorial
│   ├── manifest.json         # PWA Manifest (pantalla completa, tema e iconos)
│   ├── sw.js                 # Service worker para caché y modo offline
│   └── icons/                # Iconos PWA (96x96, 192x192, 512x512 y SVG)
├── src/
│   ├── components/
│   │   ├── ai/               # Asistente IA (Modo Local + Consultor Global Externo)
│   │   ├── animals/          # Inventario, detalle de animal, fotos y búsqueda visual
│   │   ├── backup/           # Administrador de respaldos y restauración
│   │   ├── bulk/             # Importador masivo de Excel con vista previa
│   │   ├── farms/            # Registro y gestión de múltiples haciendas/fincas
│   │   ├── finance/          # Dashboard financiero y unit economics
│   │   ├── health/           # Sanidad, dosificación y alertas de retiro
│   │   ├── layout/           # Navbar responsivo, Sidebar de escritorio y MobileTabBar
│   │   ├── production/       # Control lechero (AM/PM) y pesajes de ceba (GDP)
│   │   ├── reproduction/     # Dashboard reproductivo, secados y partos
│   │   └── testing/          # Panel de Pruebas Móviles, Simulador de Señal y RFID
│   ├── db/
│   │   ├── index.ts          # Esquema relacional Dexie IndexedDB con Multi-Finca
│   │   ├── seed.ts           # Datos muestra de 3 haciendas (Leche, Ceba y Doble Propósito)
│   │   └── backup.ts         # Motor de serialización y restauración atómica
│   ├── services/
│   │   ├── aiAssistant.ts    # Motor híbrido local RAG + consultor zootécnico global
│   │   ├── excelService.ts   # Parser y exportador de Excel (.xlsx)
│   │   ├── financialEngine.ts# Fórmulas de rentabilidad y costo unitario
│   │   ├── reproductionEngine.ts # Fórmulas zootécnicas de gestación y secado
│   │   ├── visualSearchService.ts# Extracción de histogramas cromáticos y match visual
│   │   └── samplePhotos.ts   # Representaciones vectoriales offline de razas
│   ├── sync/
│   │   └── engine.ts         # Motor de sincronización local-first y LWW
│   ├── types/                # Definiciones de TypeScript
│   ├── pwa.ts                # Registro de Service Worker y captura de evento de instalación
│   ├── App.tsx               # Contenedor principal con simulador de dispositivos
│   ├── main.tsx              # Punto de entrada de la aplicación
│   └── index.css             # Tailwind y reglas de safe-area para muescas de celular
├── capacitor.config.json     # Configuración de Capacitor para Play Store / App Store
├── index.html                # Metatags móviles y PWA
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🏛️ Subdirectories & System Boundaries

- [`src/`](./src/README.md): Core application source code encompassing domain TypeScript models, IndexedDB client storage, synchronization engine, livestock domain services, and modular UI components.
- [`public/`](./public): Static web and PWA assets, including Web App Manifest, offline service worker, vector favicons, and touch icons.

---

## 🛡️ Global Invariants

- **Offline-First Persistence:** All operational and business transactions (animal registrations, weighings, milkings, health treatments, reproductive events) must commit locally to IndexedDB before any network synchronization is attempted.
- **Entity Identity & Monotonicity:** Every livestock record is identified by an immutable UUIDv7 string timestamped at creation. Ear tags (`earTag`) must remain unique within a given farm tenant.
- **Biosecurity & Food Safety Locks:** Animals under active veterinary drug withdrawal periods (`meatWithdrawalDate` or `milkWithdrawalDate` in the future) are flagged across all UI views and produce visual alerts preventing uninspected marketing or milking.
- **Deterministic Synchronization Order:** The outbox queue processes mutations in strict insertion order (`timestamp` ascending) with Last-Write-Wins (LWW) conflict resolution applied per entity field.

---

## ⚡ Global Side Effects

- **IndexedDB Storage:** Persistent client-side data allocation under database name `AppGanaderaDB`.
- **Hardware Integration:** Requests user permission for Web NFC (`NDEFReader`), HTML5 Camera capture (`getUserMedia`), and Web Audio API for sensory feedback (RFID beeps).
- **Service Worker Lifecycle:** Intercepts HTTP fetch events to cache application shell and static assets for seamless zero-connectivity operation.
- **Remote Synchronization:** Dispatches HTTP POST requests to configured remote sync endpoints (`/api/sync`) when network connectivity is established.

---

## 🧪 System Verification

To verify full TypeScript compilation and build the production bundle:

```bash
npm run build
```

To launch the local development server with network sharing:

```bash
npm run dev -- --host
```

---

## 🏃 Cómo Ejecutar y Probar la Versión Móvil

### 1. Iniciar el servidor local
```bash
npm run dev
```
Para probar directamente en tu teléfono conectado a la misma red Wi-Fi:
```bash
npm run dev -- --host
```
*Vite mostrará la URL de red (por ejemplo: `http://192.168.1.X:5173`). Ingrésala en el navegador de tu celular.*

### 2. Pruebas en Teléfono Físico (PWA Nativa)
1. Abre la URL en **Chrome (Android)** o **Safari (iOS)**.
2. Pulsa en el menú del navegador: **"Instalar aplicación"** o **"Agregar a pantalla de inicio"**.
3. La aplicación se instalará con su icono oficial, abriéndose a pantalla completa sin barra de navegación del explorador y funcionando 100% offline en potreros.

### 3. Pruebas en Computadora con el Simulador Móvil Integrado
1. En la barra superior, haz clic en el botón **"Pruebas Móviles"**.
2. En la parte superior del panel, selecciona un dispositivo: **iPhone 15 Pro, Samsung Galaxy S24 o Google Pixel 8**.
3. Verás la aplicación enmarcada dentro del chasis del teléfono con su Dynamic Island o cámara punch-hole, barra de navegación táctil inferior y comportamiento idéntico al de un smartphone.
4. En las pestañas del panel puedes simular:
   - **Hardware de Campo:** Lectura de aretes con bastón RFID (con sonido de confirmación) y estabilización de pesaje en báscula Bluetooth.
   - **Señal Rural:** Alternar entre 4G óptimo y modo *Offline Total* en potrero.
   - **Carga Masiva:** Inyectar 25 animales aleatorios para medir rendimiento.
   - **Diagnóstico:** Ver cuota de almacenamiento IndexedDB y exportar el informe QA en `.json`.
