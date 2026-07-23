-- ============================================================================
-- 0014 — SEGURIDAD: cierra escalación de privilegios en `profiles`.
--
-- Supabase otorga UPDATE a nivel de TABLA a los roles anon/authenticated. Con la
-- policy `profiles_update_self` (permite editar la propia fila), cualquier usuario
-- registrado podía cambiar columnas privilegiadas de su fila vía la API REST con el
-- anon key: role→'admin' (acceso total al panel), is_vip, is_blocked (auto-desbloqueo).
--
-- Quitamos el UPDATE de tabla y re-otorgamos SOLO columnas de perfil no sensibles.
-- El service-role (servidor) conserva acceso total y sigue gestionando role/vip/bloqueo.
-- ============================================================================

REVOKE UPDATE ON public.profiles FROM anon, authenticated;

GRANT UPDATE (full_name, birth_year, country, city, accepted_terms_at, accepted_privacy_at)
  ON public.profiles TO authenticated;
