
CREATE TABLE IF NOT EXISTS usertable(
    userCategoria BOOLEAN,
    userDni TEXT PRIMARY KEY,
    userEmail TEXT,
    userName TEXT,
    userTrabajo TEXT,
    userContrasenia TEXT
);

CREATE TABLE IF NOT EXISTS obrastable(
    obraLatitud NUMBER,
    obraLongitud NUMBER,
    obraName TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS trabajostable(
  identificadorTrabajo TEXT PRIMARY KEY ,
  nombreTrabajo TEXT
);

CREATE TABLE IF NOT EXISTS motivostable(
  identificadorMotivo TEXT PRIMARY KEY ,
  nombreMotivo TEXT
);

CREATE TABLE IF NOT EXISTS fichajestable(
  fichajeNombre TEXT,
  fichajeDni TEXT,
  fichajeTrabajo TEXT,
  fichajeObra TEXT,
  fichajeEstadoEntrada TEXT,
  fichajeEstadoSalida TEXT,
  fichajeMotivoEntrada TEXT,
  fichajeMotivoSalida TEXT,
  fichajeFechaDia TEXT,
  fichajeFechaMes TEXT,
  fichajeFechaAnio TEXT,
  fichajeHoraEntrada TEXT,
  fichajeHoraSalida TEXT,
  fichajeIdentificador TEXT PRIMARY KEY,
  CONSTRAINT `fk_cliente` FOREIGN KEY (`fichajeDni`) REFERENCES  `usertable` (`userDni`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_obra` FOREIGN KEY (`fichajeObra`) REFERENCES  `obrastable` (`obraName`) ON DELETE NO ACTION ON UPDATE NO ACTION
);


