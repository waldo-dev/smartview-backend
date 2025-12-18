# Diagnósticos de Base de Datos

## Problema: Datos que se eliminan automáticamente

### Posibles causas identificadas:

1. **CASCADE DELETE en relaciones:**
   - Si una `Company` se elimina, se eliminan automáticamente todos los `User` y `Dashboard` relacionados
   - Las relaciones están configuradas con `onDelete: 'CASCADE'`

2. **Proceso externo:**
   - La base de datos remota (72.60.52.166) podría tener scripts o procesos que eliminan datos
   - Verificar logs del servidor de base de datos

3. **Reinicio de contenedores Docker:**
   - Si se usa `docker-compose down -v`, se eliminan los volúmenes y todos los datos

### Soluciones propuestas:

#### Opción 1: Cambiar CASCADE a RESTRICT (Recomendado)
Esto previene eliminar una Company si tiene Users o Dashboards relacionados:

```javascript
// En User.js y Dashboard.js, cambiar:
onDelete: 'CASCADE'  // → onDelete: 'RESTRICT'
```

#### Opción 2: Cambiar CASCADE a SET NULL
Esto mantiene los registros pero deja company_id en NULL:

```javascript
// En User.js:
onDelete: 'SET NULL'  // Solo si allowNull: true
```

#### Opción 3: Mantener CASCADE pero mejorar protección
- Solo permitir soft delete (is_active = false)
- Agregar validaciones antes de eliminar
- Mejorar logging

### Logging implementado:

El sistema ahora loggea todas las operaciones DELETE. Revisa los logs para identificar:
- Qué tabla se está eliminando
- Cuándo ocurre
- Desde dónde se origina

### Comandos útiles para diagnóstico:

```sql
-- Ver todas las foreign keys y sus CASCADE rules
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Ver historial de cambios recientes (si tienes triggers o auditoría)
SELECT * FROM pg_stat_activity WHERE datname = 'smartview_db';

-- Ver tamaño de tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```


