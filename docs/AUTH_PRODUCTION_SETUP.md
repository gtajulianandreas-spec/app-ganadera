# Guía de Configuración y Despliegue en Producción — Autenticación APP GANADERA

Este documento detalla todos los pasos requeridos para habilitar en producción el sistema de autenticación (Google OAuth 2.0/OIDC, correo y contraseña con Argon2id, sesiones `HttpOnly` y cumplimiento de privacidad).

---

## 1. Base de Datos PostgreSQL y Migración

1. Crea una base de datos PostgreSQL administrada (recomendado: **Neon** o **Supabase Postgres**).
2. Obtén la cadena de conexión con SSL obligatorio (`?sslmode=require`).
3. Ejecuta el script de esquema completo incluido en el repositorio:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
4. Verifica que todas las tablas (`users`, `user_identities`, `user_sessions`, `auth_tokens`, `oauth_states`, `privacy_consents`, `security_audit_logs`, `rate_limits`) y las políticas de **Row Level Security (RLS)** se hayan creado correctamente.

---

## 2. Configuración en Google Cloud Console (OAuth 2.0 / OIDC)

1. Ingresa a [Google Cloud Console](https://console.cloud.google.com/) y crea o selecciona tu proyecto.
2. Ve a **APIs y servicios → Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo**.
   - Completa nombre de la app (`APP GANADERA`), correo de soporte y enlaces públicos a tu **Política de Privacidad** y **Términos de Servicio**.
   - Alcances (*Scopes*): selecciona únicamente `openid`, `email` y `profile` (principio de minimización).
   - Agrega tu dominio de producción en **Dominios autorizados** (ej. `tu-dominio.com` o `tu-app.vercel.app`).
3. Ve a **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - **Orígenes de JavaScript autorizados:**
     - Desarrollo: `http://localhost:3000`
     - Producción: `https://tu-dominio.com`
   - **URI de redirección autorizados:**
     - Desarrollo: `http://localhost:3000/api/auth/google/callback`
     - Producción: `https://tu-dominio.com/api/auth/google/callback`
4. Copia el `Client ID` y `Client Secret` hacia las variables de entorno de Vercel (nunca los guardes en el código ni en Git).

---

## 3. Proveedor de Correo Transaccional (Resend)

1. Crea una cuenta en [Resend](https://resend.com/) y verifica tu dominio propio configurando los registros DNS **SPF**, **DKIM** y **DMARC**.
2. Genera una API Key con permisos de envío (`RESEND_API_KEY`).
3. Configura `EMAIL_FROM` usando el dominio verificado (ej. `APP GANADERA <no-reply@tu-dominio.com>`).

---

## 4. Variables de Entorno en Vercel y Secretos

Configura en **Vercel → Project Settings → Environment Variables** (solo para `Production` / `Preview`, nunca compartas secretos de desarrollo en producción):

| Variable | Descripción | Ejemplo / Generación |
| :--- | :--- | :--- |
| `DATABASE_URL` | Conexión PostgreSQL con SSL | `postgresql://...?sslmode=require` |
| `APP_BASE_URL` | URL pública exacta sin `/` final | `https://tu-dominio.com` |
| `AUTH_SERVER_PEPPER` | Secreto criptográfico de 64 hex chars | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GOOGLE_CLIENT_ID` | ID cliente OAuth de Google | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secreto cliente OAuth de Google | `GOCSPX-...` |
| `RESEND_API_KEY` | API Key de Resend | `re_...` |
| `EMAIL_FROM` | Remitente verificado | `APP GANADERA <no-reply@tu-dominio.com>` |
| `PRIVACY_POLICY_VERSION` | Versión vigente de política de datos | `2026-11-v1` |

---

## 5. Seguridad HTTP, Cookies y HTTPS

- **HTTPS:** Vercel provee TLS/HTTPS automático. Las cookies `ag_session` (`HttpOnly; SameSite=Lax`) y `ag_csrf` (`SameSite=Lax`) activan automáticamente el atributo `Secure` cuando `NODE_ENV=production` o `VERCEL_ENV=production`.
- **Rotación y Mantenimiento:**
  - Programa una tarea periódica (Vercel Cron o pg_cron) para depurar registros expirados en `oauth_states`, `auth_tokens` (>7 días) y `user_sessions` expiradas/revocadas (>30 días).
  - Si sospechas compromiso de `AUTH_SERVER_PEPPER` o credenciales OAuth, rota primero los secretos en Vercel/Google y revoca sesiones activas en `user_sessions`.

---

## 6. Lista de Verificación Legal (Colombia — Ley 1581 de 2012 / Decreto 1074 de 2015)

Antes de abrir el registro público a usuarios reales, valida con asesoría jurídica:
- [ ] Completar en `src/components/legal/PrivacyPolicyModal.tsx` la **razón social / nombre del responsable**, **NIT/documento**, **ciudad/dirección** y **correo oficial de Habeas Data / PQR**.
- [ ] Verificar la publicación del **Aviso de Privacidad** y la **Política de Tratamiento de Datos Personales** en URL pública accesible para la pantalla de consentimiento de Google Cloud Console.
- [ ] Confirmar los términos de transmisión internacional de datos con los encargados (Vercel, Neon/Supabase, Google, Resend) y, de aplicar por volumen de activos/patrimonio, validar el registro ante el **RNBD** de la Superintendencia de Industria y Comercio (SIC).
