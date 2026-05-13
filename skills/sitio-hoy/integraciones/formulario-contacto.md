---
skill: formulario-contacto
descripcion: Formulario de contacto con Server Action, validación Zod, honeypot antispam y Resend opcional
tipo: integración — todos los planes (si activado en briefing pregunta 21)
---

# Formulario de Contacto

Implementación estándar para la página `/contacto`. Funciona en los 3 planes.
Si Resend está configurado en el tenant → envía email al negocio.
Siempre guardar el lead en `contact_messages` para no perder consultas si Resend falla o no está configurado.

---

## Instalación

```bash
npm install zod react-hook-form @hookform/resolvers
# react-hook-form y zod ya están si el plan tiene checkout — verificar antes de instalar
```

---

## Schema de validación

```typescript
// lib/validations/contact.ts
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre').max(100),
  email: z.string().email('Ingresá un email válido'),
  phone: z.string().optional(),
  message: z.string().min(10, 'El mensaje es muy corto').max(1000),
  honeypot: z.string().max(0, 'Bot detected'),   // campo oculto — si tiene valor es spam
})

export type ContactFormData = z.infer<typeof contactSchema>
```

---

## Server Action

```typescript
// app/(public)/contacto/actions.ts
'use server'
import { z } from 'zod'
import { contactSchema } from '@/lib/validations/contact'
import { getResendClient } from '@/lib/resend/client'   // null si no está configurado
import { createServiceClient } from '@/lib/supabase/server'

// Rate limiting simple por IP — sin paquetes externos
// ⚠️ ADVERTENCIA VERCEL: Este Map vive en memoria del proceso. En Vercel (serverless),
// cada invocación puede ser una instancia diferente — el Map NO persiste entre requests.
// El honeypot sigue siendo la protección principal. Para rate limiting real en producción,
// usar Upstash Redis (@upstash/ratelimit) o Vercel KV.
const attempts = new Map<string, { count: number; resetAt: number }>()

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const isRateLimited = (ip: string): boolean => {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 })  // ventana de 1 min
    return false
  }
  if (entry.count >= 3) return true   // máx 3 envíos por minuto por IP
  entry.count++
  return false
}

export const sendContactForm = async (
  formData: z.infer<typeof contactSchema>,
  ip: string = 'unknown',
): Promise<{ ok: boolean; error?: string }> => {
  // Honeypot — rechazar silenciosamente si el campo oculto tiene contenido
  if (formData.honeypot) return { ok: true }

  // Rate limit
  if (isRateLimited(ip)) {
    return { ok: false, error: 'Demasiados intentos. Esperá un momento.' }
  }

  // Validación
  const parsed = contactSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: 'Datos inválidos.' }
  }

  const { name, email, phone, message } = parsed.data
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safePhone = phone ? escapeHtml(phone) : null
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')
  const supabase = createServiceClient()

  await supabase.from('contact_messages').insert({
    tenant_id: process.env.NEXT_PUBLIC_TENANT_ID!,
    name,
    email,
    phone: phone ?? null,
    message,
    source: 'contact_form',
  })

  // Intentar enviar email si Resend está configurado
  const client = await getResendClient()
  if (client) {
    await client.resend.emails.send({
      from: client.from,
      to: client.from,   // se envía al mismo dominio del negocio
      replyTo: email,
      subject: `Nuevo mensaje de contacto — ${safeName}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${safeName}</p>
        <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        ${safePhone ? `<p><strong>Teléfono:</strong> ${safePhone}</p>` : ''}
        <p><strong>Mensaje:</strong></p>
        <blockquote style="border-left:3px solid #ccc;padding-left:1rem">${safeMessage}</blockquote>
      `,
    })
  }

  return { ok: true }
}
```

---

## Componente del formulario

```tsx
// app/(public)/contacto/ContactForm.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { contactSchema, type ContactFormData } from '@/lib/validations/contact'
import { sendContactForm } from './actions'

export const ContactForm = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading')
    const result = await sendContactForm(data)
    if (result.ok) {
      setStatus('ok')
      reset()
    } else {
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <div className="contact-success" role="alert">
        <p>¡Mensaje enviado! Te respondemos a la brevedad.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="contact-form" noValidate>
      {/* Honeypot — oculto para humanos, visible para bots */}
      <input
        {...register('honeypot')}
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px' }}
        autoComplete="off"
      />

      <div className="field">
        <label htmlFor="name">Nombre *</label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />
        {errors.name && <span id="name-error" className="field-error">{errors.name.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && <span id="email-error" className="field-error">{errors.email.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="phone">Teléfono <span className="optional">(opcional)</span></label>
        <input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
      </div>

      <div className="field">
        <label htmlFor="message">Mensaje *</label>
        <textarea
          id="message"
          rows={5}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          {...register('message')}
        />
        {errors.message && <span id="message-error" className="field-error">{errors.message.message}</span>}
      </div>

      {status === 'error' && (
        <p className="form-error" role="alert">
          Hubo un error al enviar. Intentá de nuevo o escribinos por WhatsApp.
        </p>
      )}

      <button type="submit" disabled={status === 'loading'} className="btn-primary">
        {status === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
```

---

## Página

```tsx
// app/(public)/contacto/page.tsx
import type { Metadata } from 'next'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escribinos para consultas, pedidos o información.',
}

export default function ContactoPage() {
  return (
    <main>
      <section className="contact-page">
        <h1>Contacto</h1>
        <p>Completá el formulario y te respondemos a la brevedad.</p>
        <ContactForm />
      </section>
    </main>
  )
}
```

---

## Obtener IP en el Server Action

Para pasar la IP real al rate limiter en producción:

```typescript
// En el Server Action, importar headers de Next.js
import { headers } from 'next/headers'

// Al inicio de sendContactForm:
const headersList = await headers()
const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
```

---

## Verificación ✅

- [ ] Formulario valida en cliente (mensajes de error en español)
- [ ] Honeypot presente y oculto (no visible en pantalla)
- [ ] Rate limit: más de 3 envíos en 1 min muestra error
- [ ] Si Resend configurado: email llega al negocio con reply-to del visitante
- [ ] Mensaje guardado en `contact_messages`
- [ ] Si Resend no configurado: formulario igual funciona sin error visible y el lead queda guardado
- [ ] Estado de éxito reemplaza el formulario (no toast — evita problemas de accesibilidad)
- [ ] Mensaje de error tiene `role="alert"` para lectores de pantalla
