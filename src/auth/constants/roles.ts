export const Rol = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  RECEPCIONISTA: 'recepcionista',
  CAFETERIA: 'cafeteria',
  LAVANDERIA: 'lavanderia',
  SPA: 'spa',
  ROOM_SERVICE: 'room_service',
  CLIENTE: 'cliente',
} as const;

export type TipoRol = typeof Rol[keyof typeof Rol];

export const RolGrupos = {
  EMPLEADOS_AREA: ['cafeteria', 'lavanderia', 'spa', 'room_service'],
  RECEPCION: ['recepcionista', 'admin', 'superadmin'],
  GESTION: ['admin', 'superadmin'],
  TODOS_EMPLEADOS: [
    'superadmin',
    'admin',
    'recepcionista',
    'cafeteria',
    'lavanderia',
    'spa',
    'room_service',
  ],
} as const;
