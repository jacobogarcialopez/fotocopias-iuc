# Sistema Integral de Monedero Digital y Gestión de Fotocopias IUC

Este proyecto es una plataforma web institucional diseñada para administrar digitalmente los consumos y recargas de servicios de fotocopiado del **Instituto Universitario de Caldas (IUC)**, mitigando el uso de efectivo y proveyendo una total trazabilidad.

---

## 🚀 Requisitos Previos

1. **Node.js** (v16.0 o superior).
2. **XAMPP** (con los servicios de Apache y MySQL habilitados).

---

## 🛠️ Instalación y Configuración

### Paso 1: Configurar la Base de Datos en XAMPP

1. Inicie el panel de control de **XAMPP** y encienda el módulo **MySQL**.
2. Abra su consola de comandos o vaya a **phpMyAdmin** (`http://localhost/phpmyadmin`).
3. Cree una base de datos llamada `fotocopias_iuc`:
   ```sql
   CREATE DATABASE `fotocopias_iuc` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Importe las tablas utilizando el archivo de esquema:
   - Cargue o ejecute el contenido de: `/database/schema.sql`.
5. Inserte los datos de prueba y roles ejecutando:
   - Cargue o ejecute el contenido de: `/database/seeds.sql`.

### Paso 2: Configuración del Proyecto

1. Abra una terminal en el directorio del proyecto (`e:/programacion/fotocopias`).
2. Instale todas las dependencias del monedero digital:
   ```bash
   npm run install-all
   ```
3. Configure el archivo de variables de entorno en `/backend/.env` (puede copiarlo desde `.env.example`). Por defecto, está configurado para conectarse al puerto 3306 de MySQL con usuario `root` y sin contraseña de XAMPP.

### Paso 3: Despliegue del Frontend en XAMPP Apache

1. Copie el contenido de la carpeta `/frontend` a su directorio público de XAMPP, típicamente en `C:\xampp\htdocs\fotocopias\`.
2. Asegúrese de que el archivo `C:\xampp\htdocs\fotocopias\js\api.js` apunte correctamente al backend local:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/api';
   ```

### Paso 4: Iniciar el Servidor de Aplicaciones (Backend)

1. En la terminal del proyecto (`e:/programacion/fotocopias`), inicie el backend en modo desarrollo:
   ```bash
   npm run dev
   ```
2. Acceda a la aplicación web del frontend a través de su servidor Apache en:
   - **`http://localhost/fotocopias/pages/login.html`**
3. El frontend se comunicará automáticamente con la API REST que está escuchando en el puerto `3000`.

*Nota: Para más detalles de la arquitectura, configuración de CORS, base de datos y despliegue avanzado, consulte el archivo de [documentación técnica](file:///e:/programacion/fotocopias/docs/documento_tecnico.md).*

---

## 👥 Cuentas de Prueba Pre-configuradas

Todos los usuarios de prueba tienen configurada la contraseña **`123456`**.

| Rol | Correo Electrónico | Descripción de Acciones |
| :--- | :--- | :--- |
| **Rector** | `rector@iuc.edu.co` | Supervisa KPIs, activa modo emergencia, configura parámetros. |
| **Administrativo** | `admin@iuc.edu.co` | CRUD de usuarios, registra recargas de saldo, exporta reportes. |
| **Operador** | `operador@iuc.edu.co` | Escanea códigos QR, ingresa códigos, registra consumos de copias. |
| **Estudiante** | `estudiante@iuc.edu.co` | Consulta saldo, genera su QR temporal de 60s, descarga soportes. |
| **Acudiente** | `acudiente@iuc.edu.co` | Supervisa saldos de hijos asociados, recibe alertas de saldo bajo. |

---

## 📁 Estructura del Proyecto

* **`/backend`**: Servidor Node.js/Express.js.
  * **`/config`**: Conexiones de base de datos Sequelize.
  * **`/controllers`**: Controladores de endpoints REST.
  * **`/models`**: Definiciones y relaciones de tablas MySQL.
  * **`/middleware`**: Seguridad (JWT, Helmet, Rate Limit, Validación).
  * **`/services`**: Motores de QR (qrcode), PDF (pdfkit), Excel (exceljs) y Alertas de bajo saldo.
  * **`/tests`**: Pruebas automatizadas de compilación.
* **`/frontend`**: Interfaz de usuario HTML5, CSS3 (con estilo institucional) y JS ES6.
* **`/database`**: Scripts DDL de base de datos y cargador de semillas.
* **`/docs`**: Especificación de endpoints REST de la API.
