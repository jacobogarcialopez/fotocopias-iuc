# Documentación de APIs REST - Monedero Digital IUC

Todas las peticiones a la API REST deben realizarse con el prefijo `/api`.
Los endpoints protegidos requieren el encabezado:
`Authorization: Bearer <JWT_TOKEN>`

---

## 🔑 Autenticación (`/api/auth`)

### 1. Iniciar Sesión
* **Ruta**: `POST /api/auth/login`
* **Acceso**: Público
* **Cuerpo (JSON)**:
  ```json
  {
    "correo": "estudiante@iuc.edu.co",
    "contrasena": "123456"
  }
  ```
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": 4,
      "nombre": "Mateo",
      "apellido": "Garcia Lopez",
      "correo": "estudiante@iuc.edu.co",
      "rolId": 1,
      "rolNombre": "Estudiante",
      "studentId": 1,
      "codigo": "20261001",
      "saldo": "15000.00"
    }
  }
  ```

### 2. Recuperación de Contraseña
* **Ruta**: `POST /api/auth/forgot-password`
* **Acceso**: Público
* **Cuerpo (JSON)**:
  ```json
  {
    "correo": "estudiante@iuc.edu.co"
  }
  ```
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Si el correo está registrado, se enviará un enlace de recuperación."
  }
  ```

---

## 🎓 Estudiantes (`/api/estudiantes`)

### 1. Obtener Perfil
* **Ruta**: `GET /api/estudiantes/perfil`
* **Acceso**: Protegido (Rol: Estudiante)
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "codigo": "20261001",
      "saldo": "15000.00",
      "nombre": "Mateo",
      "apellido": "Garcia Lopez",
      "correo": "estudiante@iuc.edu.co"
    }
  }
  ```

### 2. Generar QR Temporal
* **Ruta**: `GET /api/estudiantes/qr`
* **Acceso**: Protegido (Rol: Estudiante)
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "2c94ca0e-436f-402a-9e19-1e3dcfcbb5be",
      "expiresAt": "2026-06-09T14:45:00.000Z",
      "qrImage": "data:image/png;base64,iVBORw0KG..."
    }
  }
  ```

### 3. Consultar Historial de Movimientos
* **Ruta**: `GET /api/estudiantes/movimientos`
* **Acceso**: Protegido (Estudiante dueño, Acudiente, Administrativo, Rector)
* **Parámetros Query**:
  * `studentUserId`: ID del usuario estudiante (opcional para el propio estudiante).
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "tipo": "recarga",
        "valor": 15000,
        "cantidad": 0,
        "fecha": "2026-06-09T14:20:00.000Z",
        "pdf": "comprobante_1.pdf",
        "registradoPor": "Ana Administradora"
      },
      {
        "id": 3,
        "tipo": "consumo",
        "valor": 450,
        "cantidad": 3,
        "fecha": "2026-06-09T14:25:00.000Z",
        "pdf": null,
        "registradoPor": "Juan Operador"
      }
    ]
  }
  ```

---

## 💵 Recargas (`/api/recargas`)

### 1. Registrar Recarga
* **Ruta**: `POST /api/recargas`
* **Acceso**: Protegido (Rol: Administrativo)
* **Cuerpo (JSON)**:
  ```json
  {
    "codigo_estudiante": "20261001",
    "valor": 5000
  }
  ```
* **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Recarga registrada exitosamente.",
    "data": {
      "id": 3,
      "valor": 5000,
      "fecha": "2026-06-09T14:48:00.000Z",
      "comprobante": "comprobante_3_1730000.pdf",
      "nuevoSaldo": 19550
    }
  }
  ```

---

## 🖨️ Consumos (`/api/consumos`)

### 1. Registrar Consumo
* **Ruta**: `POST /api/consumos`
* **Acceso**: Protegido (Rol: Operador)
* **Cuerpo (JSON)**:
  - Vía QR:
    ```json
    {
      "token": "2c94ca0e-436f-402a-9e19-1e3dcfcbb5be",
      "cantidad_copias": 3
    }
    ```
  - Vía Código manual:
    ```json
    {
      "codigo_estudiante": "20261001",
      "cantidad_copias": 3
    }
    ```
* **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Consumo registrado y descontado exitosamente.",
    "data": {
      "id": 4,
      "estudianteCodigo": "20261001",
      "nombreCompleto": "Mateo Garcia Lopez",
      "cantidadCopias": 3,
      "costoTotal": 450,
      "nuevoSaldo": 19100,
      "modoEmergenciaAplicado": false
    }
  }
  ```

---

## 📊 Reportes (`/api/reportes`)

* **Rutas**:
  * `GET /api/reportes/consumos`
  * `GET /api/reportes/recargas`
  * `GET /api/reportes/saldos`
* **Acceso**: Protegido (Rol: Administrativo, Rector)
* **Parámetros Query**:
  * `format`: `'pdf'` o `'excel'` (Obligatorio)
  * `fecha_inicio`: `'YYYY-MM-DD'` (Opcional, para filtros de fecha)
  * `fecha_fin`: `'YYYY-MM-DD'` (Opcional)
* **Respuesta**: Archivo binario adjunto para descarga directa.
