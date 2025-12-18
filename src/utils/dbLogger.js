/**
 * Utilidad para logging de operaciones de base de datos
 * Útil para diagnosticar eliminaciones inesperadas
 */

export const logDatabaseOperation = (operation, table, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    table,
    details,
    stackTrace: new Error().stack
  };
  
  console.log(`[DB OPERATION] ${timestamp} - ${operation} on ${table}:`, JSON.stringify(logEntry, null, 2));
  
  // En producción, podrías enviar esto a un servicio de logging
  // o escribirlo en un archivo
};

export const logDelete = (table, id, userId = null) => {
  logDatabaseOperation('DELETE', table, { id, userId });
};

export const logBulkDelete = (table, count, where) => {
  logDatabaseOperation('BULK_DELETE', table, { count, where });
};

export const logCascadeDelete = (parentTable, parentId, affectedTables) => {
  logDatabaseOperation('CASCADE_DELETE', parentTable, { 
    parentId, 
    affectedTables,
    warning: 'CASCADE delete triggered - multiple tables affected'
  });
};

