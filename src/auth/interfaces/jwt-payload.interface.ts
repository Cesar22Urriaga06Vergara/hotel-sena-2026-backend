// Interfaz que define la estructura del payload del JWT
export interface JwtPayload {
  sub: number;         // ID del usuario (cliente o empleado)
  email: string;       // Email del usuario
  rol: string;         // Rol del usuario ('cliente', 'recepcionista', 'admin', etc.)
  idHotel?: number;    // ID del hotel (solo para empleados)
  idCliente?: number;  // ID de cliente (solo para clientes)
  idEmpleado?: number; // ID de empleado (solo para empleados)
}