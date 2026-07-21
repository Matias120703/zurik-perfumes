-- Seed de departamentos y ciudades de Paraguay (Sprint 6.2, módulo de
-- Logística). Archivo separado de supabase/seed.sql a propósito: ese
-- archivo existe para datos derivados de config/*.ts (Fase 8) -- esto es
-- un catálogo geográfico de referencia, sin relación con ningún config/,
-- así que no comparte su propósito documentado. Por el mismo motivo que
-- seed.sql, este archivo tampoco se aplica solo con `db push`/`db reset`:
-- se corre una única vez, a mano, contra el proyecto
-- (`supabase db query --linked -f supabase/seed_logistics.sql`).
--
-- Cobertura: los 17 departamentos oficiales de Paraguay + Asunción (Distrito
-- Capital, modelada como su propio "departamento" de una sola ciudad,
-- criterio práctico estándar para sistemas de direcciones paraguayos). Por
-- departamento se cargó la capital departamental más una selección extensa
-- de ciudades/distritos reales y reconocibles -- no es una lista exhaustiva
-- verificada contra el nomenclador oficial de la DGEEC (~260 distritos en
-- todo el país), priorizando exactitud sobre exhaustividad para evitar
-- inventar o mal-atribuir un distrito. Es contenido/datos, no arquitectura:
-- ampliarla más adelante es una migración de datos chica (más INSERTs en
-- `cities`), sin tocar el esquema.
--
-- Idempotente: puede correrse más de una vez sin duplicar filas (los
-- índices únicos departments.name / cities(department_id, name) hacen que
-- el "on conflict do nothing" sea seguro).

insert into public.departments (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Concepción'),
  ('00000000-0000-0000-0000-000000000002', 'San Pedro'),
  ('00000000-0000-0000-0000-000000000003', 'Cordillera'),
  ('00000000-0000-0000-0000-000000000004', 'Guairá'),
  ('00000000-0000-0000-0000-000000000005', 'Caaguazú'),
  ('00000000-0000-0000-0000-000000000006', 'Caazapá'),
  ('00000000-0000-0000-0000-000000000007', 'Itapúa'),
  ('00000000-0000-0000-0000-000000000008', 'Misiones'),
  ('00000000-0000-0000-0000-000000000009', 'Paraguarí'),
  ('00000000-0000-0000-0000-000000000010', 'Alto Paraná'),
  ('00000000-0000-0000-0000-000000000011', 'Central'),
  ('00000000-0000-0000-0000-000000000012', 'Ñeembucú'),
  ('00000000-0000-0000-0000-000000000013', 'Amambay'),
  ('00000000-0000-0000-0000-000000000014', 'Canindeyú'),
  ('00000000-0000-0000-0000-000000000015', 'Presidente Hayes'),
  ('00000000-0000-0000-0000-000000000016', 'Boquerón'),
  ('00000000-0000-0000-0000-000000000017', 'Alto Paraguay'),
  ('00000000-0000-0000-0000-000000000018', 'Asunción')
on conflict (name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000001', city_name from unnest(array[
  'Concepción','Belén','Horqueta','Loreto','San Carlos del Apa','San Lázaro',
  'Sargento José Félix López','Yby Yaú','Paso Barreto','Vallemí'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000002', city_name from unnest(array[
  'San Pedro del Ycuamandiyú','Antequera','Choré','General Elizardo Aquino',
  'General Isidoro Resquín','Guajayví','Itacurubí del Rosario','Lima',
  'Liberación','Nueva Germania','San Estanislao','San Pablo',
  'San Vicente Pancholo','Santa Rosa del Aguaray','Tacuatí','Unión',
  'Veinticinco de Diciembre','Villa del Rosario','Yataity del Norte','Capiibary'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000003', city_name from unnest(array[
  'Caacupé','Altos','Arroyos y Esteros','Atyrá','Caraguatay','Emboscada',
  'Eusebio Ayala','Isla Pucú','Itacurubí de la Cordillera','Juan de Mena',
  'Loma Grande','Mbocayaty del Yhaguy','Nueva Colombia','Piribebuy',
  'Primero de Marzo','San Bernardino','Santa Elena','Tobatí','Valenzuela'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000004', city_name from unnest(array[
  'Villarrica','Borja','Colonia Independencia','Mbocayaty','Fassardi',
  'Félix Pérez Cardozo','Itapé','Iturbe','José Fassardi','Natalicio Talavera',
  'Ñumí','Paso Yobái','San Salvador','Tebicuary','Yataity'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000005', city_name from unnest(array[
  'Coronel Oviedo','Caaguazú','Carayaó','Cecilio Báez','Doctor Juan Manuel Frutos',
  'José Domingo Ocampos','Juan Eulogio Estigarribia','La Pastora',
  'Mariscal Francisco Solano López','Nueva Londres','R.I. 3 Corrales',
  'Raúl Arsenio Oviedo','Repatriación','San Joaquín','San José de los Arroyos',
  'Santa Rosa del Mbutuy','Simón Bolívar','Tembiaporã','Yhú'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000006', city_name from unnest(array[
  'Caazapá','Abaí','Buena Vista','Doctor Moisés Bertoni',
  'General Higinio Morínigo','Maciel','San Juan Nepomuceno','Tavaí','Yegros','Yuty'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000007', city_name from unnest(array[
  'Encarnación','Bella Vista','Cambyretá','Capitán Meza','Capitán Miranda',
  'Carlos Antonio López','Carmen del Paraná','Coronel Bogado','Edelira','Fram',
  'General Artigas','General Delgado','Hohenau','Jesús','La Paz','Natalio',
  'Nueva Alborada','Obligado','Pirapó','San Cosme y Damián','San Juan del Paraná',
  'San Pedro del Paraná','San Rafael del Paraná','Trinidad','Yatytay','Alto Verá'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000008', city_name from unnest(array[
  'San Juan Bautista','Ayolas','San Ignacio','San Miguel','San Patricio',
  'Santa María','Santa Rosa','Santiago','Villa Florida'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000009', city_name from unnest(array[
  'Paraguarí','Acahay','Caapucú','Carapeguá','Escobar','General José Eduvigis Díaz',
  'La Colmena','Mbuyapey','Pirayú','Quiindy','Quyquyhó','Sapucai','Tebicuarymí',
  'Ybycuí','Ybytimí','Yaguarón'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000010', city_name from unnest(array[
  'Ciudad del Este','Domingo Martínez de Irala','Doctor Juan León Mallorquín',
  'Hernandarias','Iruña','Itakyry','Juan E. O''Leary','Los Cedrales','Mbaracayú',
  'Minga Guazú','Minga Porá','Naranjal','Ñacunday','Presidente Franco',
  'San Alberto','San Cristóbal','Santa Fe del Paraná','Santa Rita','Yguazú'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000011', city_name from unnest(array[
  'Areguá','Capiatá','Fernando de la Mora','Guarambaré','Itá','Itauguá',
  'J. Augusto Saldívar','Lambaré','Limpio','Luque','Mariano Roque Alonso',
  'Ñemby','Nueva Italia','San Antonio','San Lorenzo','Villa Elisa','Villeta',
  'Ypacaraí','Ypané'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000012', city_name from unnest(array[
  'Pilar','Alberdi','Cerrito','Desmochados','Guazú Cuá','Humaitá','Isla Umbú',
  'Laureles','Mayor José Martínez','Paso de Patria','San Juan Bautista de Ñeembucú',
  'Tacuaras','Villa Franca','Villa Oliva','Villalbín'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000013', city_name from unnest(array[
  'Pedro Juan Caballero','Bella Vista Norte','Capitán Bado','Zanja Pytã'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000014', city_name from unnest(array[
  'Salto del Guairá','Corpus Christi','Curuguaty','Francisco Caballero Álvarez',
  'Itanará','Katueté','La Paloma','Laurel','Nueva Esperanza','Ybyrarovaná',
  'Ygatimí','Yasy Cañy','Yby Pytã'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000015', city_name from unnest(array[
  'Villa Hayes','Benjamín Aceval','Nanawa','José Falcón','Tte. Esteban Martínez',
  'Puerto Pinasco'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000016', city_name from unnest(array[
  'Filadelfia','Mariscal José Félix Estigarribia','Loma Plata'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000017', city_name from unnest(array[
  'Fuerte Olimpo','Bahía Negra','Carmelo Peralta','Puerto Casado'
]) as city_name
on conflict (department_id, name) do nothing;

insert into public.cities (department_id, name)
select '00000000-0000-0000-0000-000000000018', city_name from unnest(array[
  'Asunción'
]) as city_name
on conflict (department_id, name) do nothing;
