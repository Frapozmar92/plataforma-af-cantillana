# Configuracion Supabase (Punto 1 + Punto 2)

## 1. Crear proyecto
1. Entra en [https://supabase.com](https://supabase.com)
2. Crea un proyecto nuevo.

## 2. Crear tabla y permisos
1. Abre `SQL Editor`.
2. Pega y ejecuta el contenido de [supabase-setup.sql](/Users/franciscojosepozomartos/Documents/Codex/2026-04-28/tengo-varias-web-did-cticas-realizadas/supabase-setup.sql).

## 3. Crear usuarios de profesorado
1. Ve a `Authentication` -> `Users`.
2. Crea un usuario por profesor (`Create user`) con email y password.

## 4. Copiar credenciales a la web
1. Ve a `Project Settings` -> `API`.
2. Copia:
   - `Project URL`
   - `anon public key`
3. Pega esos valores en [app.js](/Users/franciscojosepozomartos/Documents/Codex/2026-04-28/tengo-varias-web-did-cticas-realizadas/app.js):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## 5. Publicar cambios
```bash
git add .
git commit -m "Integracion Supabase: nube + login profesorado"
git push
```

Con eso:
- alumnado ve los modulos sin login
- profesorado puede iniciar sesion y editar
- cambios sincronizados para todo el equipo
