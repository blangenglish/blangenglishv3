-- ============================================================================
--  Pruebas de seguridad RLS — BLANG
--
--  Pegar tal cual en el SQL Editor de Supabase. No deja nada modificado: cada
--  prueba que escribe restaura el valor original al final.
--
--  Simula peticiones reales cambiando el rol de Postgres y las claims del JWT,
--  que es lo que hace PostgREST al atender al navegador:
--     anon          -> visitante sin sesion (tiene la anon key, que va en el bundle)
--     authenticated -> alumno con sesion iniciada
--     service_role  -> edge functions y panel de admin
--
--  La columna `resultado` debe decir OK en las 14 filas.
-- ============================================================================

do $$
declare
  alumno uuid; otro_alumno uuid; v_bool boolean; v_text text; v_int int;
  nombre_orig text; desc_orig boolean;
begin
  create temp table if not exists resultado_pruebas (
    n int, grupo text, prueba text, obtenido text, ok boolean) on commit drop;
  -- el rol cambia a authenticated/anon a mitad de la prueba y tiene que poder
  -- seguir escribiendo aqui sus resultados
  grant all on resultado_pruebas to authenticated, anon;
  delete from resultado_pruebas;

  select id into alumno from student_profiles
    where coalesce(is_admin_only,false)=false order by id limit 1;
  select id into otro_alumno from student_profiles
    where id<>alumno and coalesce(is_admin_only,false)=false order by id limit 1;
  select full_name, coalesce(first_month_discount_used,false)
    into nombre_orig, desc_orig from student_profiles where id=alumno;

  update student_profiles set first_month_discount_used = true where id = alumno;

  -- ── Como ALUMNO con sesion ────────────────────────────────────────────
  perform set_config('request.jwt.claims',
    json_build_object('role','authenticated','sub',alumno::text)::text, true);
  set local role authenticated;

  update student_profiles set is_admin_only = true where id = alumno;
  select coalesce(is_admin_only,false) into v_bool from student_profiles where id=alumno;
  insert into resultado_pruebas values (1,'escalada','alumno se pone is_admin_only',
    case when v_bool then 'LO CONSIGUIO' else 'bloqueado' end, not v_bool);

  update student_profiles set first_month_discount_used = false where id = alumno;
  select coalesce(first_month_discount_used,false) into v_bool from student_profiles where id=alumno;
  insert into resultado_pruebas values (2,'dinero','alumno recicla el descuento',
    case when v_bool then 'bloqueado' else 'LO CONSIGUIO' end, v_bool);

  update student_profiles set full_name = '___PRUEBA___' where id = alumno;
  select full_name into v_text from student_profiles where id=alumno;
  insert into resultado_pruebas values (3,'no romper','alumno edita su propio nombre',
    case when v_text='___PRUEBA___' then 'permitido' else 'BLOQUEADO' end, v_text='___PRUEBA___');

  begin update site_settings set value='___HACK___' where key='whatsapp_number';
        get diagnostics v_int = row_count;
  exception when others then v_int := -1; end;
  insert into resultado_pruebas values (4,'config','alumno modifica site_settings', v_int||' filas', v_int<=0);

  begin delete from site_settings where key='contact_email'; get diagnostics v_int = row_count;
  exception when others then v_int := -1; end;
  insert into resultado_pruebas values (5,'config','alumno borra site_settings', v_int||' filas', v_int<=0);

  select count(*) into v_int from site_settings;
  insert into resultado_pruebas values (6,'no romper','alumno lee site_settings', v_int||' filas', v_int>0);

  begin update courses set title='___HACK___'; get diagnostics v_int = row_count;
  exception when others then v_int := -1; end;
  insert into resultado_pruebas values (7,'contenido','alumno reescribe cursos', v_int||' filas', v_int<=0);

  begin update unit_stage_quizzes set questions='[]'::jsonb; get diagnostics v_int = row_count;
  exception when others then v_int := -1; end;
  insert into resultado_pruebas values (8,'contenido','alumno reescribe quizzes', v_int||' filas', v_int<=0);

  if otro_alumno is not null then
    begin select count(*) into v_int from student_progress where student_id = otro_alumno;
    exception when others then v_int := -1; end;
    insert into resultado_pruebas values (9,'privacidad','alumno lee progreso de otro', v_int||' filas', v_int=0);

    begin select count(*) into v_int from student_profiles where id = otro_alumno;
    exception when others then v_int := -1; end;
    insert into resultado_pruebas values (10,'privacidad','alumno lee perfil de otro', v_int||' filas', v_int=0);
  end if;

  -- ── Como VISITANTE sin sesion ─────────────────────────────────────────
  reset role;
  perform set_config('request.jwt.claims','{"role":"anon"}', true);
  set local role anon;

  begin update unit_stage_quizzes set questions='[]'::jsonb; get diagnostics v_int = row_count;
  exception when others then v_int := -1; end;
  insert into resultado_pruebas values (11,'anonimo','visitante reescribe quizzes', v_int||' filas', v_int<=0);

  begin update site_settings set value='x' where key='whatsapp_number'; get diagnostics v_int = row_count;
  exception when others then v_int := -1; end;
  insert into resultado_pruebas values (12,'anonimo','visitante modifica site_settings', v_int||' filas', v_int<=0);

  select count(*) into v_int from site_settings;
  insert into resultado_pruebas values (13,'no romper','visitante lee site_settings', v_int||' filas', v_int>0);

  -- ── Como SERVICE_ROLE ─────────────────────────────────────────────────
  reset role;
  perform set_config('request.jwt.claims','{"role":"service_role"}', true);

  update student_profiles set first_month_discount_used = false where id = alumno;
  select coalesce(first_month_discount_used,false) into v_bool from student_profiles where id=alumno;
  insert into resultado_pruebas values (14,'no romper','service_role devuelve el descuento',
    case when v_bool then 'BLOQUEADO' else 'permitido' end, not v_bool);

  -- ── Restaurar ─────────────────────────────────────────────────────────
  update student_profiles
     set full_name = nombre_orig,
         first_month_discount_used = desc_orig,
         is_admin_only = false
   where id = alumno;
end $$;

select n, grupo, prueba, obtenido,
       case when ok then 'OK' else '*** FALLO ***' end as resultado
from resultado_pruebas order by n;
